// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';

import { TariffEditModal } from '../tariff-edit-modal';

/**
 * Tests unitarios de TariffEditModal.
 *
 * Validates: Requirements 3.4, 3.5, 4.1, 5.2, 5.3
 * Properties: Property 2 (Validación de rangos), Property 4 (Coherencia del neto).
 */

// --- Mocks de módulos externos ---

const refreshMock = vi.fn();
const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock, push: pushMock }),
}));

const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

const fetchMock = vi.fn();
global.fetch = fetchMock as unknown as typeof fetch;

// --- Helpers ---

const baseTariff = {
  id: 't1',
  serviceName: 'Acompañamiento emocional',
  price: 90000,
  commission: 40,
};

/**
 * Normaliza espacios (incluido el espacio duro U+00A0 que Intl usa en montos)
 * a un espacio simple para comparaciones robustas de texto monetario.
 */
function normalizeSpaces(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function renderModal(overrides: Partial<React.ComponentProps<typeof TariffEditModal>> = {}) {
  const onOpenChange = overrides.onOpenChange ?? vi.fn();
  const utils = render(
    <TariffEditModal
      professionalId="prof-1"
      tariff={baseTariff}
      open
      onOpenChange={onOpenChange}
      {...overrides}
    />,
  );
  return { ...utils, onOpenChange };
}

/** Lee el bloque de "Neto profesional" y devuelve su texto normalizado. */
function getNetText(): string {
  const label = screen.getByText('Neto profesional');
  const container = label.closest('div') as HTMLElement;
  // El valor vive en el <p> hermano dentro del mismo contenedor.
  const value = within(container).getByText(
    (content) => content.includes('COP') || content.trim() === '—',
  );
  return normalizeSpaces(value.textContent ?? '');
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('TariffEditModal', () => {
  // Property 4: Coherencia del neto profesional.
  it('Caso 1: muestra el neto en vivo y lo recalcula al cambiar la comisión', async () => {
    const user = userEvent.setup();
    renderModal();

    // 90000 - 90000*40/100 = 54000
    expect(getNetText()).toBe('$54.000 COP');

    // Cambiar comisión a 0 → neto = 90000.
    const commissionInput = screen.getByLabelText('Comisión (%)');
    await user.clear(commissionInput);
    await user.type(commissionInput, '0');

    await waitFor(() => {
      expect(getNetText()).toBe('$90.000 COP');
    });
  });

  // Property 2: Validación de rangos.
  it('Caso 2: con comisión inválida (101) deshabilita Guardar y no llama fetch', async () => {
    const user = userEvent.setup();
    renderModal();

    const commissionInput = screen.getByLabelText('Comisión (%)');
    await user.clear(commissionInput);
    await user.type(commissionInput, '101');

    const saveButton = screen.getByRole('button', { name: 'Guardar' });

    await waitFor(() => {
      expect(saveButton).toBeDisabled();
    });

    // Intentar guardar no debe disparar la petición.
    await user.click(saveButton);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  // Caso de éxito.
  it('Caso 3: en respuesta OK dispara toast.success y onOpenChange(false)', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ id: 't1', price: 90000, commission: 40 }),
    } as Response);

    const { onOpenChange } = renderModal();

    const saveButton = screen.getByRole('button', { name: 'Guardar' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith('Tarifa actualizada');
    });
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/professionals/prof-1/tariffs/t1',
      expect.objectContaining({ method: 'PUT' }),
    );
  });

  // Caso de error: el modal permanece abierto.
  it('Caso 4: en respuesta de error dispara toast.error y NO cierra el modal', async () => {
    const user = userEvent.setup();
    fetchMock.mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'X' }),
    } as Response);

    const { onOpenChange } = renderModal();

    const saveButton = screen.getByRole('button', { name: 'Guardar' });
    await user.click(saveButton);

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalled();
    });
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
