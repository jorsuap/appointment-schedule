import { resend, FROM_EMAIL } from '@/lib/resend';
import { appointmentConfirmationHtml } from './appointment-confirmation';

interface SendConfirmationParams {
  to: string;
  patientName: string;
  professionalName: string;
  serviceName: string;
  date: string;
  time: string;
  duration: number;
  meetLink?: string | null;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 30000;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sendAppointmentConfirmation(params: SendConfirmationParams) {
  const html = appointmentConfirmationHtml(params);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: params.to,
        subject: `✓ Cita confirmada — ${params.date} a las ${params.time}`,
        html,
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log(`[Email] Confirmation sent to ${params.to} (attempt ${attempt}):`, data?.id);
      return { success: true, id: data?.id };
    } catch (err) {
      console.error(`[Email] Attempt ${attempt}/${MAX_RETRIES} failed:`, err);

      if (attempt < MAX_RETRIES) {
        await delay(RETRY_DELAY_MS);
      }
    }
  }

  console.error(`[Email] All ${MAX_RETRIES} attempts failed for ${params.to}`);
  return { success: false, id: null };
}
