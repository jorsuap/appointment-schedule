import type { Metadata } from 'next';
import { PatientForm } from '@/components/professional/patient-form';

export const metadata: Metadata = {
  title: 'Nuevo Paciente',
};

/**
 * Server page for manual patient creation.
 *
 * Validates: Requirements 1.2, 1.3
 */
export default function NuevoPacientePage() {
  return <PatientForm />;
}
