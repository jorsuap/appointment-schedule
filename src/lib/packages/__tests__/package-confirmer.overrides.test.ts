import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests de confirmPackage — aplicación de overrides de fecha y hora por sesión.
 * Feature: package-session-datetime-override.
 *
 * Verifica que al confirmar un paquete, las citas (Appointment) se crean con:
 * - la fecha override si existe para ese índice, si no la fecha base por frecuencia
 * - la hora override si existe, si no la hora base
 * y que una edición en una sesión NO afecta las demás (sin cascada).
 */

// --- Mocks ---

const mockPackageFindUnique = vi.fn();
const mockPackageUpdate = vi.fn();
const mockAppointmentCreate = vi.fn();
const mockAppointmentUpdate = vi.fn();
const mockAppointmentFindMany = vi.fn();
const mockServiceFindUnique = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/lib/prisma', () => ({
  prisma: {
    sessionPackage: {
      findUnique: (...a: unknown[]) => mockPackageFindUnique(...a),
      update: (...a: unknown[]) => mockPackageUpdate(...a),
    },
    appointment: {
      create: (...a: unknown[]) => mockAppointmentCreate(...a),
      update: (...a: unknown[]) => mockAppointmentUpdate(...a),
      findMany: (...a: unknown[]) => mockAppointmentFindMany(...a),
    },
    service: { findUnique: (...a: unknown[]) => mockServiceFindUnique(...a) },
    $transaction: (fn: (tx: unknown) => Promise<unknown>) => mockTransaction(fn),
  },
}));

// Side effects que no queremos ejecutar en el test.
vi.mock('@/lib/encryption', () => ({ decrypt: (s: string) => s }));
vi.mock('@/lib/google-oauth', () => ({
  refreshAccessToken: vi.fn(),
  createCalendarEvent: vi.fn(),
}));
vi.mock('@/lib/emails/send-package-confirmation', () => ({
  sendPackageConfirmation: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('@/lib/emails/send-package-professional-notification', () => ({
  sendPackageProfessionalNotification: vi.fn().mockResolvedValue(undefined),
}));

const PKG_ID = 'pkg-1';

/** Construye un SessionPackage base: weekly, 3 sesiones desde 2026-11-05 10:00. */
function basePackage(overrides: Record<string, unknown> = {}) {
  return {
    id: PKG_ID,
    professionalId: 'prof-1',
    patientId: 'pat-1',
    serviceId: 'svc-1',
    sessionCount: 3,
    frequency: 'WEEKLY',
    startDate: new Date('2026-11-05T12:00:00'),
    startTime: '10:00',
    endTime: '11:00',
    sessionTimeOverrides: null,
    sessionDateOverrides: null,
    // Sin Google conectado → se salta todo el bloque de calendar.
    professional: { googleCalendarConnected: false, googleRefreshToken: null },
    patient: { fullName: 'Ana', preferredName: null, email: 'ana@x.com' },
    ...overrides,
  };
}

/** Captura los `data` con los que se crearon las citas dentro de la transacción. */
function wireTransaction() {
  const created: Array<Record<string, unknown>> = [];
  mockAppointmentCreate.mockImplementation(({ data }: { data: Record<string, unknown> }) => {
    created.push(data);
    return Promise.resolve({ id: `appt-${created.length}`, ...data });
  });
  mockPackageUpdate.mockResolvedValue({});
  mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
    const tx = {
      sessionPackage: { update: mockPackageUpdate },
      appointment: { create: mockAppointmentCreate },
    };
    return fn(tx);
  });
  mockAppointmentFindMany.mockResolvedValue([]);
  return created;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockServiceFindUnique.mockResolvedValue({ id: 'svc-1', durationMin: 60 });
});

describe('confirmPackage — overrides de fecha y hora', () => {
  it('sin overrides: crea las citas con las fechas base por frecuencia (weekly)', async () => {
    mockPackageFindUnique.mockResolvedValue(basePackage());
    const created = wireTransaction();

    const { confirmPackage } = await import('../package-confirmer');
    await confirmPackage(PKG_ID);

    const dates = created.map((d) => (d.date as Date).toISOString().slice(0, 10));
    expect(dates).toEqual(['2026-11-05', '2026-11-12', '2026-11-19']);
    expect(created.every((d) => d.startTime === '10:00')).toBe(true);
  });

  it('con date override en la sesión 2: solo esa fecha cambia, las demás intactas', async () => {
    mockPackageFindUnique.mockResolvedValue(
      basePackage({ sessionDateOverrides: { '1': '2026-11-26' } }),
    );
    const created = wireTransaction();

    const { confirmPackage } = await import('../package-confirmer');
    await confirmPackage(PKG_ID);

    const dates = created.map((d) => (d.date as Date).toISOString().slice(0, 10));
    // Índice 1 movido a 2026-11-26; 0 y 2 permanecen en sus fechas base.
    expect(dates).toEqual(['2026-11-05', '2026-11-26', '2026-11-19']);
  });

  it('con date + time override en la misma sesión: aplica ambos y recalcula endTime', async () => {
    mockPackageFindUnique.mockResolvedValue(
      basePackage({
        sessionDateOverrides: { '2': '2026-12-01' },
        sessionTimeOverrides: { '2': '15:00' },
      }),
    );
    const created = wireTransaction();

    const { confirmPackage } = await import('../package-confirmer');
    await confirmPackage(PKG_ID);

    const s3 = created[2];
    expect((s3.date as Date).toISOString().slice(0, 10)).toBe('2026-12-01');
    expect(s3.startTime).toBe('15:00');
    expect(s3.endTime).toBe('16:00'); // 15:00 + 60min
  });

  it('time override sin date override: cambia solo la hora, fecha base intacta', async () => {
    mockPackageFindUnique.mockResolvedValue(
      basePackage({ sessionTimeOverrides: { '0': '14:00' } }),
    );
    const created = wireTransaction();

    const { confirmPackage } = await import('../package-confirmer');
    await confirmPackage(PKG_ID);

    expect((created[0].date as Date).toISOString().slice(0, 10)).toBe('2026-11-05');
    expect(created[0].startTime).toBe('14:00');
    expect(created[0].endTime).toBe('15:00');
  });
});
