# Configuración Google Calendar — conAlma

## Compartir Google Calendar con la Service Account

Cada profesional necesita hacer esto desde su Gmail/Google Calendar personal:

1. Abre [calendar.google.com](https://calendar.google.com)
2. En el panel izquierdo, busca el calendario principal (su nombre)
3. Click en los **3 puntos** al lado del nombre del calendario → **"Configuración y compartir"**
4. Scroll hasta la sección **"Compartir con personas o grupos específicos"**
5. Click **"Agregar personas y grupos"**
6. Pega el email: `conalma-calendar@conalma-502822.iam.gserviceaccount.com`
7. Permisos: selecciona **"Hacer cambios en eventos"**
8. Click **"Enviar"**

Repite esto con el correo de cada profesional.

## Importante

El `calendarId` de cada profesional en la base de datos es su email de Google Calendar (normalmente su Gmail). Si usan `alejandra@conalma.co` como calendario, ese es el calendarId. Si no, usa su Gmail personal.

## Qué hace la integración

Cuando un pago es confirmado:

1. Se crea un evento en el Google Calendar del profesional
2. Se genera automáticamente un link de Google Meet
3. Se envía invitación al paciente (se agrega a su Google Calendar)
4. El link de Meet se guarda en la base de datos y se incluye en el email de confirmación
