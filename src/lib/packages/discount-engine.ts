/**
 * Discount Engine — Cálculo de precio con descuento para paquetes de sesiones.
 *
 * Función pura sin side effects. Determina el precio total de un paquete
 * según la cantidad de sesiones y los tramos de descuento configurados.
 */

export interface DiscountTier {
  minSessions: number;
  maxSessions: number;
  discountPerSession: number; // COP
}

export interface PackagePriceResult {
  totalPrice: number;
  discountPerSession: number;
  totalDiscount: number;
}

/**
 * Calcula el precio total de un paquete de sesiones aplicando descuento escalonado.
 *
 * Reglas:
 * - Si sessionCount === 1: precio completo sin descuento.
 * - Si sessionCount >= 2: busca el tier donde minSessions <= sessionCount <= maxSessions.
 *   - Si hay tier: totalPrice = (pricePerSession - tier.discountPerSession) * sessionCount
 *   - Si no hay tier: totalPrice = pricePerSession * sessionCount (sin descuento)
 * - Validación: si discountPerSession >= pricePerSession, se aplica descuento 0 (fallback seguro).
 */
export function calculatePackagePrice(
  pricePerSession: number,
  sessionCount: number,
  tiers: DiscountTier[],
): PackagePriceResult {
  // Caso base: 1 sesión nunca tiene descuento
  if (sessionCount === 1) {
    return {
      totalPrice: pricePerSession,
      discountPerSession: 0,
      totalDiscount: 0,
    };
  }

  // Buscar tier aplicable para sessionCount >= 2
  const matchingTier = tiers.find(
    (tier) => sessionCount >= tier.minSessions && sessionCount <= tier.maxSessions,
  );

  if (!matchingTier) {
    // Sin tier aplicable: precio completo sin descuento
    return {
      totalPrice: pricePerSession * sessionCount,
      discountPerSession: 0,
      totalDiscount: 0,
    };
  }

  // Validar que el descuento no exceda el precio por sesión
  const safeDiscount =
    matchingTier.discountPerSession < pricePerSession
      ? matchingTier.discountPerSession
      : 0;

  const totalPrice = (pricePerSession - safeDiscount) * sessionCount;
  const totalDiscount = safeDiscount * sessionCount;

  return {
    totalPrice,
    discountPerSession: safeDiscount,
    totalDiscount,
  };
}
