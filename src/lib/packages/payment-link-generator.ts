/**
 * Payment Link Generator — Integración con Wompi Payment Links API.
 *
 * Genera links de pago programáticamente para paquetes de sesiones.
 * Usa exponential backoff para reintentos ante fallos transitorios.
 */

const WOMPI_API_URL = process.env.WOMPI_API_URL || 'https://sandbox.wompi.co/v1';
const WOMPI_PRIVATE_KEY = process.env.WOMPI_PRIVATE_KEY || '';

const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000;

export interface CreatePaymentLinkParams {
  packageId: string;
  amountInCents: number;
  customerName: string;
  customerEmail: string;
  description: string;
}

export interface PaymentLinkResult {
  linkId: string;
  linkUrl: string;
}

/**
 * Pausa la ejecución por un número de milisegundos.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Crea un Payment Link en Wompi para un paquete de sesiones.
 *
 * - POST a ${WOMPI_API_URL}/payment_links con Bearer token
 * - Reference: PKG-{packageId} (identifica el paquete en el webhook)
 * - Retry con exponential backoff: 1s → 2s → 4s (max 3 intentos)
 *
 * @throws Error si todos los reintentos fallan
 */
export async function createWompiPaymentLink(
  params: CreatePaymentLinkParams,
): Promise<PaymentLinkResult> {
  const { packageId, amountInCents, customerName, customerEmail, description } = params;

  const body = {
    name: description,
    description,
    single_use: true,
    collect_shipping: false,
    amount_in_cents: amountInCents,
    currency: 'COP',
    sku: `PKG-${packageId}`,
    customer_data: {
      full_name: customerName,
      email: customerEmail,
    },
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${WOMPI_API_URL}/payment_links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${WOMPI_PRIVATE_KEY}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(
          `Wompi API error: ${response.status} - ${errorBody}`,
        );
      }

      const data = await response.json();

      const linkId = data.data.id;
      // Wompi may not return url directly in sandbox — construct it from linkId
      const linkUrl = data.data.url || `https://checkout.wompi.co/l/${linkId}`;

      return {
        linkId,
        linkUrl,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Si no es el último intento, esperar con exponential backoff
      if (attempt < MAX_RETRIES - 1) {
        const delayMs = INITIAL_DELAY_MS * Math.pow(2, attempt);
        await sleep(delayMs);
      }
    }
  }

  throw new Error(
    `Failed to create Wompi payment link after ${MAX_RETRIES} attempts: ${lastError?.message}`,
  );
}
