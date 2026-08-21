import { z } from 'zod';

/**
 * Regex para validar formato HH:mm (00:00 - 23:59)
 */
const TIME_FORMAT_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Schema para creación de un paquete de sesiones.
 * El profesional selecciona paciente, servicio, cantidad de sesiones,
 * frecuencia, fecha/hora de inicio y método de pago.
 *
 * Validates: Requirements 1.4, 3.1
 */
export const createPackageSchema = z.object({
  patientId: z.string().min(1),
  serviceId: z.string().min(1),
  sessionCount: z.number().int().min(1, 'Mínimo 1 sesión'),
  frequency: z.enum(['weekly', 'biweekly', 'monthly']),
  startDate: z.string().date(),
  startTime: z.string().regex(TIME_FORMAT_REGEX, 'Formato inválido. Usa HH:mm'),
  paymentMethod: z.enum(['wompi', 'bank_transfer']),
});

export type CreatePackageInput = z.infer<typeof createPackageSchema>;

/**
 * Schema para configuración de tramos de descuento.
 * Cada tramo define un rango de sesiones (min-max) y el descuento
 * en COP por sesión que se aplica cuando la cantidad cae en el rango.
 *
 * Validates: Requirements 2.1
 */
export const discountTierSchema = z.object({
  minSessions: z.number().int().min(2, 'Mínimo 2 sesiones'),
  maxSessions: z.number().int().min(2, 'Mínimo 2 sesiones'),
  discountPerSession: z.number().int().min(0, 'El descuento no puede ser negativo'),
});

export type DiscountTierInput = z.infer<typeof discountTierSchema>;

/**
 * Schema para datos bancarios de la organización.
 * Configurado por admin para mostrar a profesionales/pacientes
 * cuando el método de pago es transferencia bancaria.
 *
 * Validates: Requirements 6.1
 */
export const bankDetailsSchema = z.object({
  bankName: z.string().min(1, 'El nombre del banco es requerido').max(100),
  accountType: z.string().min(1, 'El tipo de cuenta es requerido').max(50),
  accountNumber: z.string().min(1, 'El número de cuenta es requerido').max(50),
  accountHolder: z.string().min(1, 'El titular es requerido').max(200),
  alias: z.string().max(50).optional(),
  isActive: z.boolean().default(true),
});

export type BankDetailsInput = z.infer<typeof bankDetailsSchema>;

/**
 * Schema para cálculo de precio (preview).
 * Se usa en el wizard para mostrar desglose de precio en tiempo real
 * antes de confirmar la creación del paquete.
 *
 * Validates: Requirements 1.4
 */
export const calculatePriceSchema = z.object({
  sessionCount: z.number().int().min(1, 'Mínimo 1 sesión'),
  serviceId: z.string(),
});

export type CalculatePriceInput = z.infer<typeof calculatePriceSchema>;
