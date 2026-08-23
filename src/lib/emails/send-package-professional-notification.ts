import { resend, FROM_EMAIL } from '@/lib/resend';

interface PackageSession {
  date: string;
  startTime: string;
}

interface SendPackageProfessionalNotificationParams {
  to: string;
  professionalName: string;
  patientName: string;
  sessionCount: number;
  frequency: string;
  totalPrice: number;
  sessions: PackageSession[];
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 30000;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const formatCOP = (amount: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(amount);

function buildHtml(params: SendPackageProfessionalNotificationParams): string {
  const sessionsRows = params.sessions
    .map(
      (s, i) =>
        `<tr><td style="padding:8px 12px;border-bottom:1px solid #f0e8f5;">${i + 1}</td><td style="padding:8px 12px;border-bottom:1px solid #f0e8f5;">${s.date}</td><td style="padding:8px 12px;border-bottom:1px solid #f0e8f5;">${s.startTime}</td></tr>`,
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;margin:0;padding:0;background-color:#FAF5FA;">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
    <div style="background:#3C1955;padding:20px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:20px;">📦 Nuevo paquete confirmado</h1>
    </div>
    <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #e8d5f5;border-top:0;">
      <p style="margin:0 0 16px;color:#333;">Hola <strong>${params.professionalName}</strong>,</p>
      <p style="margin:0 0 16px;color:#333;">Se ha confirmado un nuevo paquete de sesiones:</p>
      
      <div style="background:#f8f5fa;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:0 0 8px;"><strong>Paciente:</strong> ${params.patientName}</p>
        <p style="margin:0 0 8px;"><strong>Sesiones:</strong> ${params.sessionCount}</p>
        <p style="margin:0 0 8px;"><strong>Frecuencia:</strong> ${params.frequency}</p>
        <p style="margin:0;"><strong>Total pagado:</strong> ${formatCOP(params.totalPrice)}</p>
      </div>

      <h3 style="color:#3C1955;margin:20px 0 12px;">Sesiones programadas</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#f8f5fa;">
            <th style="padding:8px 12px;text-align:left;">#</th>
            <th style="padding:8px 12px;text-align:left;">Fecha</th>
            <th style="padding:8px 12px;text-align:left;">Hora</th>
          </tr>
        </thead>
        <tbody>${sessionsRows}</tbody>
      </table>

      <p style="margin:20px 0 0;color:#666;font-size:13px;">Las sesiones ya están en tu calendario. Puedes verlas en tu portal profesional.</p>
    </div>
    <p style="text-align:center;color:#999;font-size:12px;margin-top:16px;">conAlma — Psicología online</p>
  </div>
</body>
</html>`;
}

export async function sendPackageProfessionalNotification(params: SendPackageProfessionalNotificationParams) {
  const html = buildHtml(params);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const { data, error } = await resend.emails.send({
        from: FROM_EMAIL,
        to: params.to,
        subject: `📦 Paquete confirmado — ${params.patientName} (${params.sessionCount} sesiones)`,
        html,
      });

      if (error) throw new Error(error.message);

      console.log(`[Email] Package professional notification sent to ${params.to} (attempt ${attempt}):`, data?.id);
      return { success: true, id: data?.id };
    } catch (err) {
      console.error(`[Email] Package professional notification attempt ${attempt}/${MAX_RETRIES} failed:`, err);
      if (attempt < MAX_RETRIES) await delay(RETRY_DELAY_MS);
    }
  }

  console.error(`[Email] All ${MAX_RETRIES} attempts failed for professional ${params.to}`);
  return { success: false, id: null };
}
