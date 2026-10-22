// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

import { StepSchedule } from '../step-schedule';

/**
 * Tests de StepSchedule — reporte de disponibilidad al padre.
 * Bugfix: el wizard bloquea "Siguiente" cuando alguna sesión del paquete no
 * tiene disponibilidad. StepSchedule reporta ese estado vía onAvailabilityChange.
 */

const fetchMock = vi.fn();
global.fetch = fetchMock as unknown as typeof fetch;

/** Mockea el endpoint de slots con el mapa dado. */
function mockSlots(slots: Record<string, string[]>) {
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ slots }),
  } as Response);
}

const baseProps = {
  startTime: '10:00',
  frequency: 'weekly' as const,
  sessionCount: 2,
  serviceId: 'svc-1',
  sessionTimeOverrides: {},
  sessionDateOverrides: {},
  onDateChange: () => {},
  onTimeChange: () => {},
  onFrequencyChange: () => {},
  onSessionTimeOverride: () => {},
  onSessionDateOverride: () => {},
};

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('StepSchedule — onAvailabilityChange', () => {
  it('reporta true cuando TODAS las sesiones tienen disponibilidad', async () => {
    // weekly, 2 sesiones desde 2026-11-05 → 2026-11-05 y 2026-11-12.
    mockSlots({
      '2026-11-05': ['10:00'],
      '2026-11-12': ['10:00'],
    });
    const onAvailabilityChange = vi.fn();

    render(
      <StepSchedule
        {...baseProps}
        startDate="2026-11-05"
        onAvailabilityChange={onAvailabilityChange}
      />,
    );

    await waitFor(() => {
      expect(onAvailabilityChange).toHaveBeenLastCalledWith(true);
    });
  });

  it('reporta false cuando una sesión cae en fecha sin disponibilidad', async () => {
    // Solo la primera fecha tiene slots; la segunda (2026-11-12) no existe.
    mockSlots({
      '2026-11-05': ['10:00'],
    });
    const onAvailabilityChange = vi.fn();

    render(
      <StepSchedule
        {...baseProps}
        startDate="2026-11-05"
        onAvailabilityChange={onAvailabilityChange}
      />,
    );

    await waitFor(() => {
      expect(onAvailabilityChange).toHaveBeenLastCalledWith(false);
    });
  });

  it('reporta false cuando la hora elegida está ocupada ese día', async () => {
    // Ambas fechas existen pero NO ofrecen las 10:00 (hora ocupada).
    mockSlots({
      '2026-11-05': ['09:00'],
      '2026-11-12': ['09:00'],
    });
    const onAvailabilityChange = vi.fn();

    render(
      <StepSchedule
        {...baseProps}
        startDate="2026-11-05"
        onAvailabilityChange={onAvailabilityChange}
      />,
    );

    await waitFor(() => {
      expect(onAvailabilityChange).toHaveBeenLastCalledWith(false);
    });
  });

  it('un date override mueve la sesión a una fecha con disponibilidad → reporta true', async () => {
    // weekly, 2 sesiones desde 2026-11-05 → base: 2026-11-05 y 2026-11-12.
    // La fecha base de la sesión 2 (2026-11-12) NO tiene slots, pero la movemos
    // (override) a 2026-11-13 que SÍ tiene → todas disponibles.
    mockSlots({
      '2026-11-05': ['10:00'],
      '2026-11-13': ['10:00'],
    });
    const onAvailabilityChange = vi.fn();

    render(
      <StepSchedule
        {...baseProps}
        startDate="2026-11-05"
        sessionDateOverrides={{ 1: '2026-11-13' }}
        onAvailabilityChange={onAvailabilityChange}
      />,
    );

    await waitFor(() => {
      expect(onAvailabilityChange).toHaveBeenLastCalledWith(true);
    });
  });

  it('sin override la sesión 2 cae en fecha sin slots → reporta false (contraste del caso anterior)', async () => {
    // Misma data que el test anterior pero SIN override: la sesión 2 (2026-11-12)
    // no tiene slots, así que queda sin disponibilidad.
    mockSlots({
      '2026-11-05': ['10:00'],
      '2026-11-13': ['10:00'],
    });
    const onAvailabilityChange = vi.fn();

    render(
      <StepSchedule
        {...baseProps}
        startDate="2026-11-05"
        sessionDateOverrides={{}}
        onAvailabilityChange={onAvailabilityChange}
      />,
    );

    await waitFor(() => {
      expect(onAvailabilityChange).toHaveBeenLastCalledWith(false);
    });
  });
});
