interface AppointmentConfirmationProps {
  patientName: string;
  professionalName: string;
  serviceName: string;
  date: string;
  time: string;
  duration: number;
  meetLink?: string | null;
}

export function appointmentConfirmationHtml({
  patientName,
  professionalName,
  serviceName,
  date,
  time,
  duration,
  meetLink,
}: AppointmentConfirmationProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cita confirmada — conAlma</title>
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
              <div style="width: 56px; height: 56px; background: #D2AAF0; border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 24px;">✓</span>
              </div>
              <h2 style="color: #3C1955; font-size: 22px; margin: 0 0 8px;">¡Tu cita está confirmada!</h2>
              <p style="color: #6B4D7A; font-size: 14px; margin: 0;">
                Hola <strong>${patientName}</strong>, tu sesión ha sido agendada exitosamente.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #F3E8FC; border-radius: 12px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px; font-size: 13px; color: #6B4D7A;">📅 <strong>Fecha:</strong> ${date}</p>
                    <p style="margin: 0 0 12px; font-size: 13px; color: #6B4D7A;">🕐 <strong>Hora:</strong> ${time} hrs (${duration} min)</p>
                    <p style="margin: 0 0 12px; font-size: 13px; color: #6B4D7A;">👩‍⚕️ <strong>Profesional:</strong> ${professionalName}</p>
                    <p style="margin: 0; font-size: 13px; color: #6B4D7A;">💜 <strong>Servicio:</strong> ${serviceName}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          ${
            meetLink
              ? `
          <tr>
            <td style="padding: 0 24px 24px; text-align: center;">
              <a href="${meetLink}" style="display: inline-block; background: #3C1955; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-size: 14px; font-weight: 600;">
                🎥 Unirse a Google Meet
              </a>
              <p style="margin: 12px 0 0; font-size: 12px; color: #6B4D7A;">
                El enlace también se agregó a tu calendario de Google.
              </p>
            </td>
          </tr>
          `
              : ''
          }
          <tr>
            <td style="padding: 0 24px 32px;">
              <p style="font-size: 12px; color: #6B4D7A; text-align: center; margin: 0; line-height: 1.6;">
                Si necesitas cancelar o reprogramar, hazlo con al menos 8 horas de anticipación.<br/>
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
