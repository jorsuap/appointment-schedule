interface PackageConfirmationSession {
  date: string;
  startTime: string;
  meetLink?: string | null;
}

interface PackageConfirmationParams {
  patientName: string;
  professionalName: string;
  sessionCount: number;
  frequency: string;
  totalPrice: number;
  sessions: PackageConfirmationSession[];
}

const formatCOP = (amount: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount);

export function packageConfirmationHtml({
  patientName,
  professionalName,
  sessionCount,
  frequency,
  totalPrice,
  sessions,
}: PackageConfirmationParams): string {
  const sessionsHtml = sessions
    .map(
      (session, idx) => `
        <tr>
          <td style="padding: 10px 16px; border-bottom: 1px solid #F3E8FC;">
            <p style="margin: 0; font-size: 13px; color: #3C1955; font-weight: 600;">Sesión ${idx + 1}</p>
            <p style="margin: 4px 0 0; font-size: 13px; color: #6B4D7A;">📅 ${session.date} — 🕐 ${session.startTime} hrs</p>
            ${
              session.meetLink
                ? `<a href="${session.meetLink}" style="display: inline-block; margin-top: 6px; font-size: 12px; color: #3C1955; text-decoration: underline;">🎥 Link Meet</a>`
                : ''
            }
          </td>
        </tr>`,
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Paquete confirmado — conAlma</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Montserrat', -apple-system, sans-serif; background-color: #FAF5FA;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Header -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align: center; padding-bottom: 30px;">
              <h1 style="color: #3C1955; font-size: 28px; margin: 0;">conAlma</h1>
            </td>
          </tr>
        </table>

        <!-- Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(60, 25, 85, 0.08);">
          <tr>
            <td style="padding: 32px 24px; text-align: center;">
              <div style="width: 56px; height: 56px; background: #D2AAF0; border-radius: 50%; margin: 0 auto 16px; line-height: 56px; text-align: center;">
                <span style="font-size: 24px; vertical-align: middle;">✓</span>
              </div>
              <h2 style="color: #3C1955; font-size: 22px; margin: 0 0 8px;">Tu paquete de sesiones ha sido confirmado</h2>
              <p style="color: #6B4D7A; font-size: 14px; margin: 0;">
                Hola <strong>${patientName}</strong>, tu paquete de <strong>${sessionCount} sesiones</strong> con <strong>${professionalName}</strong> está listo.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px 16px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #F3E8FC; border-radius: 12px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 8px; font-size: 13px; color: #6B4D7A;">📦 <strong>Sesiones:</strong> ${sessionCount}</p>
                    <p style="margin: 0 0 8px; font-size: 13px; color: #6B4D7A;">🔄 <strong>Frecuencia:</strong> ${frequency}</p>
                    <p style="margin: 0; font-size: 13px; color: #6B4D7A;">💰 <strong>Total:</strong> ${formatCOP(totalPrice)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px 24px;">
              <p style="font-size: 14px; font-weight: 600; color: #3C1955; margin: 0 0 12px;">Tus sesiones programadas:</p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #FAFAFA; border-radius: 10px; overflow: hidden;">
                ${sessionsHtml}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px 32px;">
              <p style="font-size: 12px; color: #6B4D7A; text-align: center; margin: 0; line-height: 1.6;">
                Si necesitas cancelar o reprogramar alguna sesión, contacta a tu profesional con anticipación.<br/>
                ¿Dudas? Responde a este correo y te ayudamos.
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align: center; padding-top: 24px;">
              <p style="font-size: 11px; color: #6B4D7A; margin: 0;">
                © ${new Date().getFullYear()} conAlma — Tu refugio seguro para el bienestar emocional
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
