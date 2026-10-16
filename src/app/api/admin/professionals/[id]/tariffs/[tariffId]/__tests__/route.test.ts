import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Tests for PUT /api/admin/professionals/[id]/tariffs/[tariffId]
 * Feature: admin-edit-professional-tariffs
 *
 * Cubre:
 *  - Autorización: solo ADMIN puede modificar tarifas (Property 1).
 *  - Validación de rangos del payload (Property 2).
 *  - Aislamiento / propiedad de la tarifa respecto al profesional del path (Property 3).
 *  - Persistencia con los valores correctos (Property 5).
 */

// --- Mocks ---

const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({
  auth: () => mockAuth(),
}));

const mockTariffFindUnique = vi.fn();
const mockTariffUpdate = vi.fn();
vi.mock('@/lib/prisma', () => ({
  prisma: {
    professionalTariff: {
      findUnique: (...args: unknown[]) => mockTariffFindUnique(...args),
      update: (...args: unknown[]) => mockTariffUpdate(...args),
    },
  },
}));

// --- Helpers ---

const PROFESSIONAL_ID = 'prof-123';
const TARIFF_ID = 'tariff-abc';

function createRequest(body: unknown): Request {
  return new Request(
    `http://localhost:3000/api/admin/professionals/${PROFESSIONAL_ID}/tariffs/${TARIFF_ID}`,
    {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    },
  );
}

function createParams(
  overrides: { id?: string; tariffId?: string } = {},
): Promise<{ id: string; tariffId: string }> {
  return Promise.resolve({
    id: overrides.id ?? PROFESSIONAL_ID,
    tariffId: overrides.tariffId ?? TARIFF_ID,
  });
}

function setAdminSession() {
  mockAuth.mockResolvedValue({ user: { role: 'ADMIN', id: 'admin-1' } });
}

function setNoSession() {
  mockAuth.mockResolvedValue(null);
}

function existingTariff(overrides: Record<string, unknown> = {}) {
  return {
    id: TARIFF_ID,
    professionalId: PROFESSIONAL_ID,
    serviceId: 'service-1',
    price: 50000,
    commission: 10,
    ...overrides,
  };
}

// --- Case 1: Authorization ---

describe('PUT tariffs — autorización (Property 1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('responde 403 FORBIDDEN y NO llama update cuando no hay sesión', async () => {
    const { PUT } = await import('../route');
    setNoSession();

    const response = await PUT(createRequest({ price: 60000, commission: 15 }), {
      params: createParams(),
    });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json).toEqual({ error: 'FORBIDDEN' });
    expect(mockTariffUpdate).not.toHaveBeenCalled();
  });

  it('responde 403 FORBIDDEN y NO llama update cuando el rol no es ADMIN', async () => {
    const { PUT } = await import('../route');
    mockAuth.mockResolvedValue({ user: { role: 'PROFESSIONAL', id: 'prof-x' } });

    const response = await PUT(createRequest({ price: 60000, commission: 15 }), {
      params: createParams(),
    });
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json).toEqual({ error: 'FORBIDDEN' });
    expect(mockTariffUpdate).not.toHaveBeenCalled();
  });
});

// --- Case 2: Valid update ---

describe('PUT tariffs — update válido (Property 3, Property 5)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('responde 200 y llama update con where { id: tariffId } y data { price, commission } correctos', async () => {
    const { PUT } = await import('../route');
    setAdminSession();
    mockTariffFindUnique.mockResolvedValue(existingTariff());

    const updatedRow = existingTariff({ price: 75000, commission: 20 });
    mockTariffUpdate.mockResolvedValue(updatedRow);

    const response = await PUT(createRequest({ price: 75000, commission: 20 }), {
      params: createParams(),
    });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(updatedRow);

    expect(mockTariffUpdate).toHaveBeenCalledTimes(1);
    expect(mockTariffUpdate).toHaveBeenCalledWith({
      where: { id: TARIFF_ID },
      data: { price: 75000, commission: 20 },
    });
  });

  it('acepta valores límite (price 0, commission 0 y 100)', async () => {
    const { PUT } = await import('../route');

    for (const [price, commission] of [
      [0, 0],
      [0, 100],
      [100000, 100],
    ] as const) {
      vi.clearAllMocks();
      setAdminSession();
      mockTariffFindUnique.mockResolvedValue(existingTariff());
      mockTariffUpdate.mockResolvedValue(existingTariff({ price, commission }));

      const response = await PUT(createRequest({ price, commission }), {
        params: createParams(),
      });

      expect(response.status).toBe(200);
      expect(mockTariffUpdate).toHaveBeenCalledWith({
        where: { id: TARIFF_ID },
        data: { price, commission },
      });
    }
  });
});

// --- Case 3: Invalid payload ---

describe('PUT tariffs — payload inválido (Property 2)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('responde 422 y NO llama update cuando price es negativo', async () => {
    const { PUT } = await import('../route');
    setAdminSession();
    mockTariffFindUnique.mockResolvedValue(existingTariff());

    const response = await PUT(createRequest({ price: -1, commission: 10 }), {
      params: createParams(),
    });

    expect(response.status).toBe(422);
    expect(mockTariffUpdate).not.toHaveBeenCalled();
  });

  it('responde 422 y NO llama update cuando commission excede 100', async () => {
    const { PUT } = await import('../route');
    setAdminSession();
    mockTariffFindUnique.mockResolvedValue(existingTariff());

    const response = await PUT(createRequest({ price: 50000, commission: 101 }), {
      params: createParams(),
    });

    expect(response.status).toBe(422);
    expect(mockTariffUpdate).not.toHaveBeenCalled();
  });

  it('Property 2: cualquier price<0 o commission fuera de [0,100] o no entero → 422 sin persistir', async () => {
    const { PUT } = await import('../route');

    const invalidPayloadArbitrary = fc.oneof(
      // price negativo
      fc.record({
        price: fc.integer({ min: -100000, max: -1 }),
        commission: fc.integer({ min: 0, max: 100 }),
      }),
      // commission fuera de rango
      fc.record({
        price: fc.integer({ min: 0, max: 100000 }),
        commission: fc.oneof(
          fc.integer({ min: 101, max: 1000 }),
          fc.integer({ min: -1000, max: -1 }),
        ),
      }),
      // valores no enteros
      fc.record({
        price: fc.double({ min: 0.1, max: 999.9, noInteger: true, noNaN: true }),
        commission: fc.integer({ min: 0, max: 100 }),
      }),
    );

    await fc.assert(
      fc.asyncProperty(invalidPayloadArbitrary, async (payload) => {
        vi.clearAllMocks();
        setAdminSession();
        mockTariffFindUnique.mockResolvedValue(existingTariff());

        const response = await PUT(createRequest(payload), { params: createParams() });

        expect(response.status).toBe(422);
        expect(mockTariffUpdate).not.toHaveBeenCalled();
      }),
      { numRuns: 100 },
    );
  });
});

// --- Case 4: Not found / wrong professional ---

describe('PUT tariffs — tarifa inexistente o de otro profesional (Property 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('responde 404 TARIFF_NOT_FOUND y NO llama update cuando la tarifa no existe', async () => {
    const { PUT } = await import('../route');
    setAdminSession();
    mockTariffFindUnique.mockResolvedValue(null);

    const response = await PUT(createRequest({ price: 60000, commission: 15 }), {
      params: createParams(),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({ error: 'TARIFF_NOT_FOUND' });
    expect(mockTariffUpdate).not.toHaveBeenCalled();
  });

  it('responde 404 TARIFF_NOT_FOUND y NO llama update cuando la tarifa pertenece a otro profesional', async () => {
    const { PUT } = await import('../route');
    setAdminSession();
    mockTariffFindUnique.mockResolvedValue(
      existingTariff({ professionalId: 'otro-profesional-999' }),
    );

    const response = await PUT(createRequest({ price: 60000, commission: 15 }), {
      params: createParams(),
    });
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({ error: 'TARIFF_NOT_FOUND' });
    expect(mockTariffUpdate).not.toHaveBeenCalled();
  });
});
