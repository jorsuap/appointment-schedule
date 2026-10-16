// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { StepSummary } from '../step-summary';
import type { WizardData } from '../package-wizard';

/**
 * Tests de StepSummary — "Precio por sesión" muestra la tarifa base.
 *
 * Mismo defecto de presentación ya corregido en step-sessions-config.tsx:
 * la línea sumaba el descuento a la tarifa base, inflando el valor mostrado.
 * El fix muestra `pricePerSession` directamente.
 */

const formatCOP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
});

function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

/** Matcher tolerante al espacio duro (U+00A0) que inserta Intl para COP. */
function byMoney(expected: string) {
  const target = normalizeSpaces(expected);
  return (content: string) => normalizeSpaces(content) === target;
}

const baseWizardData: WizardData = {
  patientId: 'p1',
  serviceId: 's1',
  sessionCount: 6,
  frequency: 'weekly',
  startDate: '2026-10-23',
  startTime: '15:00',
  paymentMethod: 'bank_transfer',
  sessionTimeOverrides: {},
};

function renderSummary(overrides: Partial<React.ComponentProps<typeof StepSummary>> = {}) {
  return render(
    <StepSummary
      wizardData={baseWizardData}
      patientName="Leidy Jhoanna Ortiz Hernandez"
      pricePerSession={100000}
      discountPerSession={10000}
      totalPrice={540000}
      onConfirm={vi.fn()}
      isSubmitting={false}
      {...overrides}
    />,
  );
}

/** Devuelve la fila "Precio por sesión". */
function getPricePerSessionRow(): HTMLElement {
  const label = screen.getByText('Precio por sesión');
  const row = label.closest('div');
  if (!row) throw new Error('No se encontró la fila de "Precio por sesión"');
  return row as HTMLElement;
}

describe('StepSummary — "Precio por sesión" muestra la tarifa base', () => {
  it('con descuento (base 100.000): muestra $100.000, no $110.000', () => {
    renderSummary();

    const row = getPricePerSessionRow();
    const base = formatCOP.format(100000); // $100.000
    const inflated = formatCOP.format(110000); // $110.000 (defectuoso)

    expect(within(row).getByText(byMoney(base))).toBeInTheDocument();
    expect(within(row).queryByText(byMoney(inflated))).not.toBeInTheDocument();

    // El total y el descuento se mantienen.
    const totalRow = screen.getByText('Total del paquete').closest('div') as HTMLElement;
    expect(within(totalRow).getByText(byMoney(formatCOP.format(540000)))).toBeInTheDocument();
    const discountRow = screen.getByText('Descuento por sesión').closest('div') as HTMLElement;
    expect(
      within(discountRow).getByText(byMoney(`-${formatCOP.format(10000)}`)),
    ).toBeInTheDocument();
  });

  it('con descuento (base 90.000): muestra $90.000, no $100.000', () => {
    renderSummary({ pricePerSession: 90000, discountPerSession: 10000, totalPrice: 480000 });

    const row = getPricePerSessionRow();
    expect(within(row).getByText(byMoney(formatCOP.format(90000)))).toBeInTheDocument();
    expect(within(row).queryByText(byMoney(formatCOP.format(100000)))).not.toBeInTheDocument();
  });

  it('sin descuento: muestra la base y NO renderiza la fila de descuento', () => {
    renderSummary({
      wizardData: { ...baseWizardData, sessionCount: 1 },
      pricePerSession: 80000,
      discountPerSession: 0,
      totalPrice: 80000,
    });

    const row = getPricePerSessionRow();
    expect(within(row).getByText(byMoney(formatCOP.format(80000)))).toBeInTheDocument();
    expect(screen.queryByText('Descuento por sesión')).not.toBeInTheDocument();
  });
});
