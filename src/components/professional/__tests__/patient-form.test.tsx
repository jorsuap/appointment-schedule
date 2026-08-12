// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { PatientForm } from '../patient-form';

// --- Mocks ---

const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/components/shared/country-select', () => ({
  CountrySelect: ({
    value,
    onChange,
    placeholder,
  }: {
    value?: string;
    onChange: (v: string) => void;
    placeholder?: string;
  }) => (
    <select
      data-testid={`country-select-${placeholder}`}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      aria-label={placeholder || 'Selecciona un país'}
    >
      <option value="">Selecciona un país</option>
      <option value="Colombia">Colombia</option>
      <option value="México">México</option>
    </select>
  ),
}));

vi.mock('@/components/shared/date-picker', () => ({
  DatePicker: ({
    value,
    onChange,
    placeholder,
  }: {
    value?: string;
    onChange: (v: string) => void;
    placeholder?: string;
  }) => (
    <input
      data-testid="date-picker"
      type="date"
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      aria-label={placeholder || 'Selecciona una fecha'}
    />
  ),
}));

// Mock global fetch
const fetchMock = vi.fn();
global.fetch = fetchMock;

beforeEach(() => {
  vi.clearAllMocks();
  fetchMock.mockReset();
});

// --- Tests ---

describe('PatientForm', () => {
  /**
   * Test 1: Renders all 4 sections
   * Validates: Requirement 2.6
   */
  it('renders all 4 sections (Datos Personales, Evaluación Emocional, Contacto de Emergencia, Consentimientos)', () => {
    render(<PatientForm />);

    expect(screen.getByText('Datos Personales')).toBeInTheDocument();
    expect(screen.getByText('Evaluación Emocional')).toBeInTheDocument();
    expect(screen.getByText('Contacto de Emergencia')).toBeInTheDocument();
    expect(screen.getByText('Consentimientos')).toBeInTheDocument();
  });

  /**
   * Test 2: Renders all required fields
   * Validates: Requirement 2.1
   */
  it('renders all required fields (fullName, email, dateOfBirth, country, isAdult)', () => {
    render(<PatientForm />);

    // fullName - has label with asterisk
    expect(screen.getByText('Nombre completo *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Nombre completo del paciente')).toBeInTheDocument();
    // email - has label with asterisk
    expect(screen.getByText('Correo electrónico *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('paciente@correo.com')).toBeInTheDocument();
    // dateOfBirth - has label with asterisk
    expect(screen.getByText('Fecha de nacimiento *')).toBeInTheDocument();
    // country - has label with asterisk and renders our mocked select
    expect(screen.getByText('País de residencia *')).toBeInTheDocument();
    // isAdult - has label with asterisk
    expect(screen.getByText('¿Es mayor de edad? *')).toBeInTheDocument();
  });

  /**
   * Test 3: Submit button disabled during loading
   * Validates: Requirement 6.5
   */
  it('submit button is disabled and shows spinner during form submission', async () => {
    // Make fetch hang to simulate loading state
    fetchMock.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 5000)),
    );

    render(<PatientForm />);

    // Fill required fields to pass client-side validation
    fireEvent.change(screen.getByPlaceholderText('Nombre completo del paciente'), {
      target: { value: 'Test Patient' },
    });
    fireEvent.change(screen.getByPlaceholderText('paciente@correo.com'), {
      target: { value: 'test@email.com' },
    });
    fireEvent.change(screen.getByTestId('date-picker'), {
      target: { value: '1990-05-15' },
    });
    // Select country using the first native select (country field, not emergencyCountry)
    const nativeSelects = screen.getAllByRole('combobox');
    fireEvent.change(nativeSelects[0], { target: { value: 'Colombia' } });

    // Submit the form
    const submitButton = screen.getByRole('button', {
      name: /registrar paciente/i,
    });
    fireEvent.click(submitButton);

    // Wait for the button to become disabled (async state change)
    await waitFor(() => {
      const button = screen.getByRole('button', {
        name: /registrando paciente/i,
      });
      expect(button).toBeDisabled();
    });
  });

  /**
   * Test 4: Shows inline validation errors for empty required fields
   * Validates: Requirement 3.1
   */
  it('shows inline validation errors when submitting empty required fields', async () => {
    render(<PatientForm />);

    // Submit without filling any fields
    const submitButton = screen.getByRole('button', {
      name: /registrar paciente/i,
    });
    fireEvent.click(submitButton);

    // Wait for validation errors to appear
    await waitFor(() => {
      expect(
        screen.getByText('El nombre completo es requerido'),
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Ingresa un email válido')).toBeInTheDocument();
    });
  });
});
