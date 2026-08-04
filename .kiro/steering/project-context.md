---
inclusion: auto
---

# Contexto del Proyecto — conAlma

## ¿Qué es conAlma?

Plataforma de agendamiento de citas de acompañamiento psicológico y emocional online. Los pacientes llegan desde redes sociales (Instagram/TikTok), agendan una sesión, pagan, y reciben confirmación con link de videollamada automáticamente.

## Estado actual del proyecto

- **URL producción**: https://conalma.care
- **Repo**: github.com/jorsuap/appointment-schedule (rama `main`)
- **Deploy**: Vercel auto-deploy al hacer push a `main`
- **DB**: Neon PostgreSQL (producción, datos reales)
- **Pagos**: Wompi producción (keys `pub_prod_*` / `prv_prod_*`)
- **Emails**: Resend con dominio verificado `conalma.care`
- **Google Calendar**: OAuth 2.0 por profesional (Meet + invitaciones automáticas)
- **Imágenes**: Cloudinary (fotos de perfil de profesionales)
- **Admin login**: `yennymarceladm` (usuario sin @)
- **App OAuth publicada**: Google Auth Platform verificada

## Qué funciona end-to-end

1. ✅ Landing pública con datos de DB (administrable desde admin)
2. ✅ Flujo de agendamiento completo (6 pasos wizard)
3. ✅ Pago con Wompi producción → webhook confirma → email se envía a paciente Y profesional
4. ✅ Evento Google Calendar + Meet link automático (via OAuth del profesional)
5. ✅ Admin: dashboard real, pacientes, calendario, profesionales, métricas reales, contenido
6. ✅ Portal Profesional: dashboard, perfil (con upload foto), disponibilidad, OAuth Calendar, calendario, pacientes con notas, ingresos
7. ✅ Deduplicación de pacientes por email (upsert)
8. ✅ Crear profesionales desde admin con contraseña temporal + cambio obligatorio al primer login
9. ✅ Eliminar profesionales desde admin (cascade limpio)

## Servicios Externos

| Servicio            | Propósito              | Estado                 |
| ------------------- | ---------------------- | ---------------------- |
| Neon PostgreSQL     | Base de datos          | Producción             |
| Vercel              | Hosting + Serverless   | Producción             |
| Wompi               | Pagos (PSE + tarjetas) | Producción             |
| Resend              | Emails transaccionales | Producción             |
| Google Calendar API | Eventos + Meet         | Producción (OAuth)     |
| Cloudinary          | Fotos de perfil        | Producción (free tier) |

## Variables de Entorno (Vercel)

| Variable                     | Servicio                         |
| ---------------------------- | -------------------------------- |
| `DATABASE_URL`               | Neon                             |
| `NEXTAUTH_SECRET`            | NextAuth JWT                     |
| `NEXT_PUBLIC_APP_URL`        | `https://conalma.care`           |
| `RESEND_API_KEY`             | Resend                           |
| `WOMPI_PUBLIC_KEY`           | Wompi prod                       |
| `WOMPI_PRIVATE_KEY`          | Wompi prod                       |
| `WOMPI_EVENTS_SECRET`        | Wompi prod                       |
| `WOMPI_INTEGRITY_SECRET`     | Wompi prod                       |
| `WOMPI_API_URL`              | `https://production.wompi.co/v1` |
| `GOOGLE_OAUTH_CLIENT_ID`     | Google OAuth                     |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Google OAuth                     |
| `OAUTH_ENCRYPTION_KEY`       | Encriptación tokens              |
| `CLOUDINARY_CLOUD_NAME`      | Cloudinary                       |
| `CLOUDINARY_API_KEY`         | Cloudinary                       |
| `CLOUDINARY_API_SECRET`      | Cloudinary                       |

## Comandos útiles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build (incluye prisma generate)
npm run lint         # ESLint
npm run format       # Prettier
npx prisma studio    # GUI de la base de datos
npx prisma generate  # Regenerar Prisma Client
```
