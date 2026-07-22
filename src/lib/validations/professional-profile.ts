import { z } from 'zod';

/**
 * Regex para validar formato HH:mm (00:00 - 23:59)
 */
const TIME_FORMAT_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Schema para actualización de perfil del profesional.
 * Solo campos editables: specialty, description, traits, photoUrl.
 * Campos readonly (name, email, tarifa) se ignoran en la API.
 *
 * Validates: Requirement 3.1
 */
export const updateProfileSchema = z.object({
  specialty: z.string().min(1, 'La especialidad es requerida').optional(),
  description: z.string().nullable().optional(),
  traits: z.array(z.string()).optional(),
  photoUrl: z.string().url('URL de foto inválida').nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/**
 * Schema para creación de bloque de disponibilidad horaria.
 * dayOfWeek: 0 (domingo) a 6 (sábado)
 * startTime/endTime: formato HH:mm
 *
 * Validates: Requirement 5.1
 */
export const createAvailabilitySchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(TIME_FORMAT_REGEX, 'Formato inválido. Usa HH:mm'),
    endTime: z.string().regex(TIME_FORMAT_REGEX, 'Formato inválido. Usa HH:mm'),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: 'La hora de fin debe ser posterior a la hora de inicio',
    path: ['endTime'],
  });

export type CreateAvailabilityInput = z.infer<typeof createAvailabilitySchema>;

/**
 * Schema para creación de notas de progreso de un paciente.
 * content: mínimo 1 carácter, máximo 5000.
 * appointmentId: opcional, para vincular la nota a una cita específica.
 *
 * Validates: Requirement 8.3
 */
export const createProgressNoteSchema = z.object({
  content: z
    .string()
    .min(1, 'El contenido es requerido')
    .max(5000, 'El contenido no puede exceder 5000 caracteres'),
  appointmentId: z.string().optional(),
});

export type CreateProgressNoteInput = z.infer<typeof createProgressNoteSchema>;

/**
 * Schema para cambio de contraseña del profesional.
 * currentPassword: contraseña actual.
 * newPassword: mínimo 8 caracteres.
 * confirmPassword: debe coincidir con newPassword.
 *
 * Validates: Requirement 1.5
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
    newPassword: z
      .string()
      .min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
    confirmPassword: z.string().min(1, 'Confirma tu nueva contraseña'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
