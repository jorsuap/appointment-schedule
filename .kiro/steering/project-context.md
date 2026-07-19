---
inclusion: auto
---

# Contexto del Proyecto — conAlma

## ¿Qué es conAlma?

Plataforma de agendamiento de citas de acompañamiento psicológico y emocional online. Los pacientes llegan desde redes sociales (Instagram/TikTok), agendan una sesión, pagan, y reciben confirmación con link de videollamada.

## Estado actual del proyecto

- **URL producción**: https://conalma.care
- **Repo**: github.com/jorsuap/appointment-schedule (rama `main`)
- **Deploy**: Vercel auto-deploy al hacer push a `main`
- **DB**: Neon PostgreSQL con datos reales (pacientes, citas, pagos)
- **Pagos**: Wompi sandbox funcional (transacciones de prueba exitosas)
- **Emails**: Resend con dominio verificado `conalma.care` (funcional)
- **Google Calendar**: Service Account creada. Eventos se crean sin Meet. OAuth por profesional pendiente.
- **Admin**: Login funcional (`yennymarceladm@gmail.com`)

## Qué funciona end-to-end

1. ✅ Landing pública con datos de DB
2. ✅ Flujo de agendamiento completo (6 pasos)
3. ✅ Pago con Wompi sandbox → webhook confirma → email se envía
4. ✅ Admin: dashboard, pacientes con ficha completa, calendario, profesionales, contenido editable
5. ✅ Crear profesionales desde admin con servicios y tarifas
6. ✅ Disponibilidad configurable por profesional
7. ✅ Notas de progreso en ficha del paciente

## Qué está pendiente (próxima feature)

- **Portal del Profesional** (spec en `.kiro/specs/professional-portal/`)
  - Login con rol PROFESSIONAL
  - OAuth Google Calendar (genera Meet + invita asistentes)
  - Gestión de disponibilidad propia
  - Vista de ingresos/comisiones
  - Pacientes propios con notas

## Decisiones técnicas importantes

### Prisma 7

- NO usa `url` en schema.prisma (Prisma 7 lo removió)
- Usa `prisma.config.ts` con `datasource.url`
- Import: `from '@prisma/client'` (NO `.prisma/client`)
- Client: `new PrismaClient({ adapter })` con `PrismaNeon`
- Build script: `"prisma generate && next build"`

### NextAuth v5 (Auth.js)

- Cookie name: `authjs.session-token` (no `next-auth.session-token`)
- Login: usar `signIn()` de `next-auth/react` (client-side, NO server action)
- Middleware: solo verifica existencia de cookie (no decodifica JWT)
- No usar `auth()` wrapper en middleware (excede 1MB Edge limit)

### Shadcn/ui v4 (Base UI)

- Button NO tiene `asChild` — usar `<LinkButton>` component para links con estilo de botón
- Select usa `@base-ui/react` — `onValueChange` puede ser `null`, usar `(v) => v && setter(v)`
- Form: componente custom en `src/components/ui/form.tsx` (wrapper de react-hook-form)

### NPM Registry

- El PC de desarrollo tiene registry corporativo (JFrog) configurado globalmente
- El proyecto tiene `.npmrc` con `registry=https://registry.npmjs.org/` para forzar público
- Si `npm install` falla con E403, usar `--registry https://registry.npmjs.org`

### Vercel Deploy

- Variables de entorno: configurar en Vercel dashboard (Settings → Environment Variables)
- Ambiente: "Production and Preview" para todas las variables
- Después de cambiar env vars: hacer Redeploy manual
- NEXTAUTH_URL debe coincidir con el dominio (`https://conalma.care`)

### Google Calendar Limitaciones

- Service Account + Gmail gratuito: NO puede agregar asistentes ni generar Meet
- Service Account + Gmail gratuito: SÍ puede crear eventos simples
- Para Meet + asistentes: necesita OAuth 2.0 del profesional (implementación pendiente)

## Credenciales (NO commitear, solo en env vars)

- **Admin login**: yennymarceladm@gmail.com
- **Neon DB**: ep-floral-bread-atcpli2s.c-9.us-east-1.aws.neon.tech
- **Service Account**: conalma-calendar@conalma-502822.iam.gserviceaccount.com
- **Resend domain**: conalma.care (verificado)
- **Wompi**: sandbox mode activo

## Comandos útiles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build (incluye prisma generate)
npm run lint         # ESLint
npm run format       # Prettier
npm run db:seed      # Seed de datos (requiere DATABASE_URL en env)
npx prisma studio    # GUI de la base de datos
npx prisma migrate dev --name nombre  # Nueva migración
```
