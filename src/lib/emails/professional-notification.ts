interface ProfessionalNotificationProps {
  professionalName: string;
  patientName: string;
  serviceName: string;
  date: string;
  time: string;
  duration: number;
  meetLink?: string | null;
}

export function professionalNotificationHtml({
  professionalName,
  patientName,
  serviceName,
  date,
  time,
  duration,
  meetLink,
}: ProfessionalNotificationProps): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Nueva cita agendada — conAlma</title>
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
                <span style="font-size: 24px; vertical-align: middle;">📅</span>
              </div>
              <h2 style="color: #3C1955; font-size: 22px; margin: 0 0 8px;">Nueva cita agendada</h2>
              <p style="color: #6B4D7A; font-size: 14px; margin: 0;">
                Hola <strong>${professionalName}</strong>, un paciente ha confirmado una sesión contigo.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 0 24px 24px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background: #F3E8FC; border-radius: 12px;">
                <tr>
                  <td style="padding: 20px;">
                    <p style="margin: 0 0 12px; font-size: 13px; color: #6B4D7A;">👤 <strong>Paciente:</strong> ${patientName}</p>
                    <p style="margin: 0 0 12px; font-size: 13px; color: #6B4D7A;">📅 <strong>Fecha:</strong> ${date}</p>
                    <p style="margin: 0 0 12px; font-size: 13px; color: #6B4D7A;">🕐 <strong>Hora:</strong> ${time} hrs (${duration} min)</p>
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
                🎥 Link de Google Meet
              </a>
              <p style="margin: 12px 0 0; font-size: 12px; color: #6B4D7A;">
                El evento también se creó en tu Google Calendar.
              </p>
            </td>
          </tr>
          `
              : ''
          }
          <tr>
            <td style="padding: 0 24px 32px;">
              <p style="font-size: 12px; color: #6B4D7A; text-align: center; margin: 0; line-height: 1.6;">
                Puedes ver los detalles completos en tu portal de profesional.<br/>
                <a href="https://conalma.care/profesional/calendario" style="color: #3C1955; font-weight: 600;">Ver mi calendario →</a>
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
