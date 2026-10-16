import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { updateTariffSchema } from '../tariffs';

/**
 * Tests for updateTariffSchema
 * Feature: admin-edit-professional-tariffs
 *
 * Combina ejemplos específicos (límites y casos típicos) con una prueba
 * basada en propiedades que verifica la validación de rangos de forma
 * universal sobre el espacio de entradas.
 */

// --- Unit tests: valid examples (boundaries + typical) ---

describe('updateTariffSchema - entradas válidas', () => {
  it('acepta price = 0 (límite inferior)', () => {
    const result = updateTariffSchema.safeParse({ price: 0, commission: 40 });
    expect(result.success).toBe(true);
  });

  it('acepta commission = 0 (límite inferior)', () => {
    const result = updateTariffSchema.safeParse({ price: 90000, commission: 0 });
    expect(result.success).toBe(true);
  });

  it('acepta commission = 100 (límite superior)', () => {
    const result = updateTariffSchema.safeParse({ price: 90000, commission: 100 });
    expect(result.success).toBe(true);
  });

  it('acepta valores típicos (price = 90000, commission = 40)', () => {
    const result = updateTariffSchema.safeParse({ price: 90000, commission: 40 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ price: 90000, commission: 40 });
    }
  });
});

// --- Unit tests: invalid examples ---

describe('updateTariffSchema - entradas inválidas', () => {
  it('rechaza price = -1 con mensaje en español', () => {
    const result = updateTariffSchema.safeParse({ price: -1, commission: 40 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const { fieldErrors } = result.error.flatten();
      expect(fieldErrors.price).toContain('El precio no puede ser negativo');
    }
  });

  it('rechaza commission = 101 con mensaje en español', () => {
    const result = updateTariffSchema.safeParse({ price: 90000, commission: 101 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const { fieldErrors } = result.error.flatten();
      expect(fieldErrors.commission).toContain('La comisión debe estar entre 0 y 100');
    }
  });

  it('rechaza commission = -1 con mensaje en español', () => {
    const result = updateTariffSchema.safeParse({ price: 90000, commission: -1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const { fieldErrors } = result.error.flatten();
      expect(fieldErrors.commission).toContain('La comisión debe estar entre 0 y 100');
    }
  });

  it('rechaza price no entero (90000.5)', () => {
    const result = updateTariffSchema.safeParse({ price: 90000.5, commission: 40 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errorFields = Object.keys(result.error.flatten().fieldErrors);
      expect(errorFields).toContain('price');
    }
  });

  it('rechaza commission no entero (40.5)', () => {
    const result = updateTariffSchema.safeParse({ price: 90000, commission: 40.5 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const errorFields = Object.keys(result.error.flatten().fieldErrors);
      expect(errorFields).toContain('commission');
    }
  });
});

// --- Property 2: Validación de rangos ---

describe('Feature: admin-edit-professional-tariffs, Property 2: Validación de rangos', () => {
  /**
   * **Validates: Requirements 3.2, 3.3, 3.6**
   *
   * Property: Para cualquier payload donde `price` no sea un entero >= 0 O
   * `commission` no sea un entero en [0, 100], el schema SHALL rechazar la
   * entrada; y a la inversa, cualquier combinación de enteros con price >= 0 y
   * commission en [0, 100] (incluyendo los límites 0 y 100) SHALL ser aceptada.
   */

  it('acepta cualquier price entero >= 0 y commission entero en [0, 100]', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000_000 }),
        fc.integer({ min: 0, max: 100 }),
        (price, commission) => {
          const result = updateTariffSchema.safeParse({ price, commission });
          expect(result.success).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('rechaza cualquier price entero negativo', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100_000_000, max: -1 }),
        fc.integer({ min: 0, max: 100 }),
        (price, commission) => {
          const result = updateTariffSchema.safeParse({ price, commission });
          expect(result.success).toBe(false);
          if (!result.success) {
            const errorFields = Object.keys(result.error.flatten().fieldErrors);
            expect(errorFields).toContain('price');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('rechaza cualquier commission entero fuera de [0, 100]', () => {
    const outOfRangeCommission: fc.Arbitrary<number> = fc.oneof(
      fc.integer({ min: -100_000, max: -1 }),
      fc.integer({ min: 101, max: 100_000 }),
    );

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100_000_000 }),
        outOfRangeCommission,
        (price, commission) => {
          const result = updateTariffSchema.safeParse({ price, commission });
          expect(result.success).toBe(false);
          if (!result.success) {
            const errorFields = Object.keys(result.error.flatten().fieldErrors);
            expect(errorFields).toContain('commission');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('rechaza price o commission no enteros', () => {
    // Parte entera base + parte fraccionaria estricta en (0, 1), de modo que
    // la suma nunca pueda redondear a un entero por aritmética de punto flotante.
    const nonIntegerArbitrary: fc.Arbitrary<number> = fc
      .tuple(
        fc.integer({ min: 0, max: 100 }),
        fc.integer({ min: 1, max: 99 }).map((n) => n / 100),
      )
      .map(([whole, frac]) => whole + frac)
      .filter((n) => !Number.isInteger(n));

    fc.assert(
      fc.property(nonIntegerArbitrary, (value) => {
        const resultPrice = updateTariffSchema.safeParse({
          price: value,
          commission: 40,
        });
        expect(resultPrice.success).toBe(false);
        if (!resultPrice.success) {
          const errorFields = Object.keys(resultPrice.error.flatten().fieldErrors);
          expect(errorFields).toContain('price');
        }

        const resultCommission = updateTariffSchema.safeParse({
          price: 90000,
          commission: value,
        });
        expect(resultCommission.success).toBe(false);
        if (!resultCommission.success) {
          const errorFields = Object.keys(resultCommission.error.flatten().fieldErrors);
          expect(errorFields).toContain('commission');
        }
      }),
      { numRuns: 100 },
    );
  });
});
