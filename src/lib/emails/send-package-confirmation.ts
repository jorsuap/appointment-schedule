import { resend, FROM_EMAIL } from '@/lib/resend';
import { packageConfirmationHtml } from './package-confirmation';

interface PackageConfirmationSession {
  date: string;
  startTime: string;
  meetLink?: string | null;
}

interface SendPackageConfirmationParams {
  to: string;
  patientName: string;
  professionalName: string;
  sessionCount: number;
  frequency: string;
  totalPrice: number;
  sessions: PackageConfirmationSession[];
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 30000;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendPackageConfirmation(params: SendPackageConfirmationParams) {
  const html = packageConfirmationHtml(params);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: params.to,
        subject: `✓ Paquete confirmado — ${params.sessionCount} sesiones con ${params.professionalName}`,
        html,
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log(
        `[Email] Package confirmation sent to ${params.to} (attempt ${attempt}):`,
        data?.id,
      );
      return { success: true, id: data?.id };
    } catch (err) {
      console.error(`[Email] Package confirmation attempt ${attempt}/${MAX_RETRIES} failed:`, err);

      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY_MS);
      }
    }
  }

  console.error(`[Email] All ${MAX_RETRIES} attempts failed for ${params.to}`);
  return { success: false, id: null };
}
