// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import fc from 'fast-check';
import { StepSessionsConfig } from '../step-sessions-config';

/**
 * Exploratory Bug Condition test — Property 1: Bug Condition.
 *
 * Validates: Requirements 1.1, 1.2, 2.1, 2.2
 *
 * CRÍTICO: Este test DEBE FALLAR sobre el código SIN corregir. La falla
 * confirma que el bug existe (el componente renderiza
 * `pricePerSession + discountPerSession` en lugar de `pricePerSession`).
 * Tras el fix (tarea 3) este mismo test debe PASAR.
 */

interface PricePreview {
  pricePerSession: number;
  discountPerSession: number;
  totalPrice: number;
  totalDiscount: number;
}

const formatCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
});

const fetchMock = vi.fn();
global.fetch = fetchMock as unknown as typeof fetch;

/**
 * Normaliza espacios (incluido el espacio duro U+00A0 que usa Intl para COP)
 * a un espacio simple. Testing Library colapsa el NBSP del DOM a un espacio
 * normal al matchear, pero `formatCOP.format()` conserva el NBSP; sin esta
 * normalización un `getByText(formatCOP.format(...))` nunca coincide.
 */
function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/**
 * Matcher de texto flexible al espacio duro: compara el contenido renderizado
 * (ya normalizado por Testing Library) contra el valor esperado tras
 * normalizar también sus espacios.
 */
function byMoney(expected: string) {
  const target = normalizeSpaces(expected);
  return (content: string) => normalizeSpaces(content) === target;
}

/**
 * Mockea global.fetch para que el endpoint calculate resuelva el preview dado.
 */
function mockPreview(preview: PricePreview) {
  fetchMock.mockImplementation(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(preview),
    } as Response),
  );
}

/**
 * Renderiza StepSessionsConfig, espera el debounce (~500ms) + la resolución del
 * fetch, y devuelve la fila "Precio por sesión" ya resuelta.
 */
async function renderAndGetPricePerSessionRow(
  preview: PricePreview,
  sessionCount: number,
): Promise<HTMLElement> {
  mockPreview(preview);

  render(
    <StepSessionsConfig
      sessionCount={sessionCount}
      serviceId="svc-1"
      onCountChange={() => {}}
      onServiceChange={() => {}}
    />,
  );

  // El resumen de precio solo aparece tras el debounce (500ms) y la resolución
  // del fetch. Esperamos a que exista el bloque "Resumen de precio".
  await waitFor(
    () => {
      expect(screen.getByText('Resumen de precio')).toBeInTheDocument();
    },
    { timeout: 2000 },
  );

  // La fila de "Precio por sesión": subimos al contenedor flex que la agrupa
  // con su valor para poder leer el monto renderizado.
  const label = screen.getByText('Precio por sesión');
  const row = label.closest('div');
  if (!row) throw new Error('No se encontró la fila de "Precio por sesión"');
  return row as HTMLElement;
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('StepSessionsConfig — exploración de la condición del bug (Property 1)', () => {
  /**
   * Caso 1: tarifa base $90.000, descuento $10.000/sesión, 6 sesiones.
   * Esperado: "Precio por sesión" = $90.000.
   * Código sin corregir muestra $100.000 (90.000 + 10.000) → FALLA.
   */
  it('Caso 1: muestra $90.000 como precio por sesión (base, sin sumar descuento)', async () => {
    const preview: PricePreview = {
      pricePerSession: 90000,
      discountPerSession: 10000,
      totalPrice: 480000,
      totalDiscount: 60000,
    };

    const row = await renderAndGetPricePerSessionRow(preview, 6);

    const expected = formatCOP.format(preview.pricePerSession); // $90.000
    const inflated = formatCOP.format(preview.pricePerSession + preview.discountPerSession); // $100.000 (valor defectuoso)

    expect(within(row).getByText(byMoney(expected))).toBeInTheDocument();
    expect(within(row).queryByText(byMoney(inflated))).not.toBeInTheDocument();
  });

  /**
   * Caso 2: tarifa base $120.000, descuento $25.000/sesión, 4 sesiones.
   * Esperado: "Precio por sesión" = $120.000.
   * Código sin corregir muestra $145.000 (120.000 + 25.000) → FALLA.
   */
  it('Caso 2: muestra $120.000 como precio por sesión (base, sin sumar descuento)', async () => {
    const preview: PricePreview = {
      pricePerSession: 120000,
      discountPerSession: 25000,
      totalPrice: 380000,
      totalDiscount: 100000,
    };

    const row = await renderAndGetPricePerSessionRow(preview, 4);

    const expected = formatCOP.format(preview.pricePerSession); // $120.000
    const inflated = formatCOP.format(preview.pricePerSession + preview.discountPerSession); // $145.000 (valor defectuoso)

    expect(within(row).getByText(byMoney(expected))).toBeInTheDocument();
    expect(within(row).queryByText(byMoney(inflated))).not.toBeInTheDocument();
  });

  /**
   * Caso 3 (coherencia de pantalla): el valor de "Precio por sesión" debe
   * coincidir con el valor por sesión del subtítulo "N sesiones × $X c/u",
   * y (pricePerSession − discountPerSession) × sessionCount === totalPrice.
   */
  it('Caso 3: el precio por sesión coincide con el subtítulo y la aritmética del total es coherente', async () => {
    const preview: PricePreview = {
      pricePerSession: 90000,
      discountPerSession: 10000,
      totalPrice: 480000,
      totalDiscount: 60000,
    };
    const sessionCount = 6;

    const row = await renderAndGetPricePerSessionRow(preview, sessionCount);

    const perSessionText = formatCOP.format(preview.pricePerSession); // $90.000

    // "Precio por sesión" muestra la tarifa base.
    expect(within(row).getByText(byMoney(perSessionText))).toBeInTheDocument();

    // El subtítulo "N sesiones × $X c/u" usa la tarifa base como valor por sesión.
    expect(
      screen.getByText(
        (_, node) =>
          normalizeSpaces(node?.textContent ?? '') ===
          normalizeSpaces(`${sessionCount} sesiones × ${perSessionText} c/u`),
      ),
    ).toBeInTheDocument();

    // Coherencia aritmética del total del paquete.
    expect((preview.pricePerSession - preview.discountPerSession) * sessionCount).toBe(
      preview.totalPrice,
    );
  });

  /**
   * Enfoque PBT acotado a casos CON descuento (discountPerSession > 0) para
   * reproducibilidad. Para todo preview con descuento, "Precio por sesión"
   * SHALL mostrar la tarifa base (pricePerSession), nunca base + descuento.
   *
   * Validates: Requirements 2.1, 2.2
   */
  it('PBT acotado (descuento > 0): precio por sesión siempre muestra la tarifa base, no base + descuento', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 50000, max: 300000 }), // pricePerSession (base real)
        fc.integer({ min: 1000, max: 40000 }), // discountPerSession (> 0)
        fc.integer({ min: 2, max: 12 }), // sessionCount (>= 2)
        async (pricePerSession, discountPerSession, sessionCount) => {
          const totalPrice = (pricePerSession - discountPerSession) * sessionCount;
          const preview: PricePreview = {
            pricePerSession,
            discountPerSession,
            totalPrice,
            totalDiscount: discountPerSession * sessionCount,
          };

          mockPreview(preview);

          const { unmount } = render(
            <StepSessionsConfig
              sessionCount={sessionCount}
              serviceId="svc-pbt"
              onCountChange={() => {}}
              onServiceChange={() => {}}
            />,
          );

          try {
            await waitFor(
              () => {
                expect(screen.getByText('Resumen de precio')).toBeInTheDocument();
              },
              { timeout: 2000 },
            );

            const label = screen.getByText('Precio por sesión');
            const row = label.closest('div') as HTMLElement;

            const expected = formatCOP.format(pricePerSession);
            const inflated = formatCOP.format(pricePerSession + discountPerSession);

            expect(within(row).getByText(byMoney(expected))).toBeInTheDocument();
            expect(within(row).queryByText(byMoney(inflated))).not.toBeInTheDocument();
          } finally {
            unmount();
          }
        },
      ),
      { numRuns: 15 },
    );
    // Cada corrida renderiza el componente y espera el debounce (~500ms) + el
    // fetch; con 15 corridas el timeout por defecto (5s) no alcanza. Ampliamos
    // el timeout de este test (no cambia lo que se asevera).
  }, 30000);
});
