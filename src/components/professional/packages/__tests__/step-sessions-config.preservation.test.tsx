// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import fc from 'fast-check';
import { StepSessionsConfig } from '../step-sessions-config';

/**
 * Preservation tests — Property 2: Preservation.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4
 *
 * Metodología observation-first: estos tests observan y aseguran el
 * comportamiento base que debe PRESERVARSE. DEBEN PASAR sobre el código SIN
 * corregir (confirman la línea base) y seguir pasando tras el fix (tarea 3),
 * demostrando que la corrección no introduce regresiones.
 *
 * Para el caso sin descuento (`discountPerSession === 0`) se cumple la
 * equivalencia F(X) = F'(X), ya que la expresión defectuosa
 * `pricePerSession + discountPerSession` colapsa a `pricePerSession + 0 = base`.
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

/**
 * Normaliza whitespace (incluido el espacio duro `\u00A0` que `Intl` inserta
 * tras el símbolo de moneda) a un espacio simple, para comparar montos que el
 * DOM puede repartir en varios nodos de texto.
 */
function norm(text: string | null | undefined): string {
  return (text ?? '').replace(/\s+/g, ' ').trim();
}

/**
 * Devuelve true si el `textContent` normalizado del contenedor contiene el
 * monto esperado (también normalizado).
 */
function containerHasAmount(el: HTMLElement, expected: string): boolean {
  return norm(el.textContent).includes(norm(expected));
}

const fetchMock = vi.fn();
global.fetch = fetchMock as unknown as typeof fetch;

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
 * Renderiza StepSessionsConfig y espera el debounce (~500ms) + la resolución
 * del fetch, confirmando que el bloque "Resumen de precio" ya está presente.
 */
async function renderPreview(preview: PricePreview, sessionCount: number) {
  mockPreview(preview);

  const utils = render(
    <StepSessionsConfig
      sessionCount={sessionCount}
      serviceId="svc-pres"
      onCountChange={() => {}}
      onServiceChange={() => {}}
    />,
  );

  await waitFor(
    () => {
      expect(screen.getByText('Resumen de precio')).toBeInTheDocument();
    },
    { timeout: 2000 },
  );

  return utils;
}

/** Devuelve la fila "Precio por sesión" (contenedor flex con su valor). */
function getPricePerSessionRow(): HTMLElement {
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
  cleanup();
  vi.restoreAllMocks();
});

describe('StepSessionsConfig — preservación (Property 2)', () => {
  /**
   * Preservación del caso sin descuento (Req 3.1).
   * Con `discountPerSession === 0`, "Precio por sesión" muestra la tarifa base,
   * ya que base + 0 = base. Debe cumplirse para CUALQUIER base generada.
   *
   * Validates: Requirements 3.1
   */
  it('PBT: sin descuento (discountPerSession = 0), "Precio por sesión" muestra siempre la tarifa base', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 1_000_000 }), // pricePerSession (base real, entero positivo)
        fc.integer({ min: 1, max: 12 }), // sessionCount
        async (pricePerSession, sessionCount) => {
          const preview: PricePreview = {
            pricePerSession,
            discountPerSession: 0,
            totalPrice: pricePerSession * sessionCount,
            totalDiscount: 0,
          };

          mockPreview(preview);

          const { unmount } = render(
            <StepSessionsConfig
              sessionCount={sessionCount}
              serviceId="svc-pbt-pres"
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

            const row = getPricePerSessionRow();
            // F(X) = F'(X): base + 0 = base, para cualquier base generada.
            const base = formatCOP.format(pricePerSession);
            expect(containerHasAmount(row, base)).toBe(true);
          } finally {
            unmount();
          }
        },
      ),
      { numRuns: 15 },
    );
  }, 30000);

  /**
   * Preservación de descuento / ahorro / total (Req 3.2).
   * Para una entrada CON descuento, "Descuento por sesión", "Ahorro total" y
   * "Total del paquete" muestran los valores derivados del preview sin cambios.
   *
   * Validates: Requirements 3.2
   */
  it('con descuento: "Descuento por sesión", "Ahorro total" y "Total del paquete" muestran los valores del preview', async () => {
    const preview: PricePreview = {
      pricePerSession: 90000,
      discountPerSession: 10000,
      totalPrice: 480000,
      totalDiscount: 60000,
    };

    await renderPreview(preview, 6);

    // "Descuento por sesión" → -{discountPerSession}
    const discountRow = screen.getByText('Descuento por sesión').closest('div') as HTMLElement;
    expect(
      containerHasAmount(discountRow, `-${formatCOP.format(preview.discountPerSession)}`),
    ).toBe(true);

    // "Ahorro total" → -{totalDiscount}
    const savingsRow = screen.getByText('Ahorro total').closest('div') as HTMLElement;
    expect(containerHasAmount(savingsRow, `-${formatCOP.format(preview.totalDiscount)}`)).toBe(
      true,
    );

    // "Total del paquete" → {totalPrice}
    const totalRow = screen.getByText('Total del paquete').closest('div') as HTMLElement;
    expect(containerHasAmount(totalRow, formatCOP.format(preview.totalPrice))).toBe(true);
  });

  /**
   * Preservación del "Total del paquete" también en el caso sin descuento (Req 3.2).
   */
  it('sin descuento: "Total del paquete" muestra el total del preview', async () => {
    const preview: PricePreview = {
      pricePerSession: 90000,
      discountPerSession: 0,
      totalPrice: 90000,
      totalDiscount: 0,
    };

    await renderPreview(preview, 1);

    const totalRow = screen.getByText('Total del paquete').closest('div') as HTMLElement;
    expect(containerHasAmount(totalRow, formatCOP.format(preview.totalPrice))).toBe(true);
  });

  /**
   * Preservación del subtítulo "N sesiones × $X c/u" (Req 3.3).
   * El subtítulo sigue usando `preview.pricePerSession` como valor por sesión.
   *
   * Validates: Requirements 3.3
   */
  it('el subtítulo "N sesiones × $X c/u" usa preview.pricePerSession como valor por sesión', async () => {
    const preview: PricePreview = {
      pricePerSession: 120000,
      discountPerSession: 25000,
      totalPrice: 380000,
      totalDiscount: 100000,
    };
    const sessionCount = 4;

    await renderPreview(preview, sessionCount);

    const perSession = formatCOP.format(preview.pricePerSession); // $120.000
    // El subtítulo se reparte en varios nodos de texto; comparamos el
    // textContent normalizado del párrafo que lo contiene.
    expect(
      screen.getByText(
        (_, node) =>
          norm(node?.textContent) === norm(`${sessionCount} sesiones × ${perSession} c/u`),
      ),
    ).toBeInTheDocument();
  });

  /**
   * Preservación del caso sin descuento: NO se renderizan las filas de
   * "Descuento por sesión" ni "Ahorro total" (Req 3.4).
   *
   * Validates: Requirements 3.4
   */
  it('sin descuento: NO se renderizan las filas de "Descuento por sesión" ni "Ahorro total"', async () => {
    const preview: PricePreview = {
      pricePerSession: 90000,
      discountPerSession: 0,
      totalPrice: 90000,
      totalDiscount: 0,
    };

    await renderPreview(preview, 1);

    expect(screen.queryByText('Descuento por sesión')).not.toBeInTheDocument();
    expect(screen.queryByText('Ahorro total')).not.toBeInTheDocument();

    // "Precio por sesión" sí se muestra, con la tarifa base.
    const row = getPricePerSessionRow();
    expect(containerHasAmount(row, formatCOP.format(preview.pricePerSession))).toBe(true);
  });
});
