import { z } from 'zod';

/**
 * Schema para creación manual de paciente desde el portal profesional.
 * Incluye datos personales requeridos, evaluación emocional opcional,
 * contacto de emergencia opcional y consentimientos.
 *
 * El profesional usa este formulario para registrar pacientes que llegan
 * por canales externos (WhatsApp, llamada, presencial).
 *
 * Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3
 */
export const createPatientSchema = z.object({
  // Required personal
  fullName: z.string().min(1, 'El nombre completo es requerido').max(200),
  email: z.string().email('Ingresa un email válido'),
  dateOfBirth: z
    .string()
    .date()
    .refine(
      (val) => new Date(val) < new Date(),
      'La fecha de nacimiento debe ser en el pasado',
    ),
  country: z.string().min(1, 'El país es requerido'),
  isAdult: z.boolean(),

  // Optional personal
  preferredName: z.string().max(100).optional().or(z.literal('')),

  // Optional emotional evaluation
  reasonForVisit: z.string().max(2000).optional().or(z.literal('')),
  recentFeelings: z.string().max(2000).optional().or(z.literal('')),
  selfHarmRisk: z.boolean().optional(),
  currentTreatment: z.boolean().optional(),
  previousDiagnosis: z.string().max(2000).optional().or(z.literal('')),
  desiredOutcome: z.string().max(2000).optional().or(z.literal('')),
  additionalNotes: z.string().max(2000).optional().or(z.literal('')),

  // Optional emergency contact
  emergencyName: z.string().max(200).optional().or(z.literal('')),
  emergencyRelation: z.string().max(100).optional().or(z.literal('')),
  emergencyPhone: z.string().max(30).optional().or(z.literal('')),
  emergencyCountry: z.string().max(100).optional().or(z.literal('')),

  // Consent
  dataPrivacyConsent: z.boolean().optional(),
  commsConsent: z.boolean().optional(),
  informedConsent: z.boolean().optional(),
});

export type CreatePatientInput = z.infer<typeof createPatientSchema>;
