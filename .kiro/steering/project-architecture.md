---
inclusion: auto
---

# Arquitectura del Proyecto — conAlma

## Stack Tecnológico

| Capa           | Tecnología                      | Versión           |
| -------------- | ------------------------------- | ----------------- |
| Framework      | Next.js (App Router)            | 16.x              |
| Lenguaje       | TypeScript                      | 5.x (strict mode) |
| UI Components  | shadcn/ui (Base UI)             | v4                |
| Styling        | Tailwind CSS                    | v4                |
| Base de datos  | PostgreSQL (Neon serverless)    | 18                |
| ORM            | Prisma                          | 7.x               |
| DB Adapter     | @prisma/adapter-neon            | —                 |
| Autenticación  | NextAuth.js (Auth.js)           | v5                |
| State (client) | Zustand                         | —                 |
| Forms          | React Hook Form + Zod           | —                 |
| Emails         | Resend                          | —                 |
| Pagos          | Wompi (PSE + tarjetas)          | Producción        |
| Calendar       | Google Calendar API + OAuth 2.0 | v3                |
| Imágenes       | Cloudinary                      | Free tier         |
| Hosting        | Vercel                          | —                 |
| Icons          | Lucide React                    | —                 |
| Toasts         | Sonner                          | —                 |

## Arquitectura Fullstack (Monolito Next.js)

```
┌─────────────────────────────────────────────────────┐
│                    Vercel (Hosting)                   │
├─────────────────────────────────────────────────────┤
│                  Next.js 16 (App Router)             │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │  Pages/UI    │  │  API Routes  │                 │
│  │  (Frontend)  │  │  (Backend)   │                 │
│  └──────┬───────┘  └──────┬───────┘                 │
│         │                  │                         │
│  ┌──────┴──────────────────┴───────┐                │
│  │         Shared Libraries         │                │
│  │  (Prisma, Auth, Validations)     │                │
│  └──────────────┬───────────────────┘                │
└─────────────────┼───────────────────────────────────┘
                  │
    ┌─────────────┼──────────────┬──────────────┬──────────┐
    ▼             ▼              ▼              ▼          ▼
┌────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌──────────┐
│  Neon  │  │ Resend  │  │  Wompi  │  │ Google   │  │Cloudinary│
│PostgreSQL│ │ (Email) │  │ (Pagos) │  │ Calendar │  │(Imágenes)│
└────────┘  └─────────┘  └─────────┘  └──────────┘  └──────────┘
```

## Estructura de Carpetas

```
src/
├── app/
│   ├── (public)/                 # Landing + flujo agendamiento (sin auth)
│   ├── (admin)/admin/            # Panel de administración (rol ADMIN)
│   ├── (professional)/profesional/ # Portal del profesional (rol PROFESSIONAL)
│   ├── auth/login/               # Login compartido
│   └── api/
│       ├── admin/                # APIs solo para admin (métricas)
│       ├── appointments/         # Crear cita (público)
│       ├── availability/         # Consultar disponibilidad (público)
│       ├── payments/webhook/     # Webhook Wompi
│       ├── professional/         # APIs del portal profesional (autenticadas)
│       ├── professionals/        # CRUD profesionales (admin)
│       ├── patients/             # Pacientes (admin)
│       └── services/             # Servicios (público)
├── components/
│   ├── ui/                       # shadcn/ui base components
│   ├── layouts/                  # Sidebars, Header, Footer
│   ├── landing/                  # Secciones de la landing
│   ├── professional/             # Componentes del portal profesional
│   └── shared/                   # DatePicker, CountrySelect, etc.
├── lib/
│   ├── prisma.ts                 # Singleton Prisma Client
│   ├── auth.ts                   # NextAuth config
│   ├── cloudinary.ts             # Upload de imágenes
│   ├── encryption.ts             # AES-256-GCM para OAuth tokens
│   ├── google-oauth.ts           # OAuth 2.0 helpers
│   ├── password-generator.ts     # Contraseñas temporales
│   ├── get-professional-session.ts # Auth helper para API routes profesional
│   ├── validations/              # Zod schemas
│   └── emails/                   # Templates + send functions
├── stores/
│   └── booking-store.ts          # Zustand (wizard agendamiento)
└── middleware.ts                  # Protección rutas /admin/* y /profesional/*
```

## Roles del Sistema

| Rol          | Acceso            | Descripción                                                         |
| ------------ | ----------------- | ------------------------------------------------------------------- |
| ADMIN        | `/admin/*`        | Propietaria. Gestión global, métricas, profesionales.               |
| PROFESSIONAL | `/profesional/*`  | Psicóloga. Perfil, disponibilidad, calendario, pacientes, ingresos. |
| (Público)    | `/`, `/agendar/*` | Paciente. Agendamiento sin login.                                   |

## Decisiones Técnicas Clave

### Prisma 7

- Config en `prisma.config.ts` (NO `url` en schema)
- Adapter: `@prisma/adapter-neon` con `PrismaNeon`
- Import: `from '@prisma/client'`

### NextAuth v5

- Cookie: `authjs.session-token` (HTTP) / `__Secure-authjs.session-token` (HTTPS)
- JWT strategy, 24h expiry
- Middleware solo verifica cookie (no decodifica en Edge)
- `trigger === 'update'` en JWT callback para refrescar datos post-cambio de contraseña

### shadcn/ui v4 (Base UI)

- NO tiene `asChild` — usar `render` prop o `<LinkButton>` component
- Select: `@base-ui/react` — `onValueChange` puede ser null
- Global styles en base components: Input h-10 bg-white, SelectTrigger h-10 bg-white

### Pacientes

- Email es `@unique` en Patient model
- Creación usa `upsert` por email (no duplica si mismo paciente agenda otra vez)

### OAuth Google Calendar

- Tokens encriptados con AES-256-GCM en DB
- State parameter firmado con HMAC-SHA256
- Fire-and-forget: si falla crear evento, la cita se confirma igual
