import { z } from 'zod';

/**
 * Schema para la edición de la tarifa de un profesional por servicio.
 * El admin edita el precio (COP) y la comisión (%) de una tarifa existente.
 *
 * Reutilizado en cliente (parse para habilitar/deshabilitar el submit) y
 * en servidor (safeParse como defensa en el endpoint).
 *
 * Validates: Requirements 3.2, 3.3, 3.6
 */
export const updateTariffSchema = z.object({
  price: z.number().int().min(0, 'El precio no puede ser negativo'),
  commission: z
    .number()
    .int()
    .min(0, 'La comisión debe estar entre 0 y 100')
    .max(100, 'La comisión debe estar entre 0 y 100'),
});

export type UpdateTariffInput = z.infer<typeof updateTariffSchema>;
