---
inclusion: auto
---

# Arquitectura del Proyecto — conAlma

## Descripción

conAlma es una plataforma de agendamiento de citas de psicología y talleres de bienestar emocional. Permite a pacientes agendar sesiones online con profesionales, pagar, y recibir confirmación con link de videollamada.

## Stack Tecnológico

| Capa           | Tecnología                        | Versión           |
| -------------- | --------------------------------- | ----------------- |
| Framework      | Next.js (App Router)              | 16.x              |
| Lenguaje       | TypeScript                        | 5.x (strict mode) |
| UI Components  | shadcn/ui (Base UI + Radix)       | v4                |
| Styling        | Tailwind CSS                      | v4                |
| Base de datos  | PostgreSQL (Neon serverless)      | 18                |
| ORM            | Prisma                            | 7.x               |
| DB Adapter     | @prisma/adapter-neon              | —                 |
| Autenticación  | NextAuth.js (Auth.js)             | v5 beta           |
| State (server) | TanStack Query                    | —                 |
| State (client) | Zustand                           | —                 |
| Forms          | React Hook Form + Zod             | —                 |
| Emails         | Resend                            | —                 |
| Pagos          | Wompi (PSE + tarjetas)            | Sandbox/Prod      |
| Calendar       | Google Calendar API + OAuth 2.0   | v3                |
| Hosting        | Vercel                            | Free tier         |
| Dominio        | conalma.care                      | Vercel DNS        |
| CI/CD          | Vercel auto-deploy (push to main) | —                 |
| Icons          | Lucide React                      | —                 |

## Arquitectura

```
┌─────────────────────────────────────────────────────┐
│                    Vercel (Hosting)                   │
├─────────────────────────────────────────────────────┤
│                  Next.js 16 (App Router)             │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │  App Routes  │  │  API Routes  │                 │
│  │  (Frontend)  │  │  (Backend)   │                 │
│  └──────┬───────┘  └──────┬───────┘                 │
│         │                  │                         │
│  ┌──────┴──────────────────┴───────┐                │
│  │         Shared Libraries         │                │
│  │  (Prisma, Auth, Validations)     │                │
│  └──────────────┬───────────────────┘                │
└─────────────────┼───────────────────────────────────┘
                  │
    ┌─────────────┼─────────────┬──────────────┐
    │             │             │              │
    ▼             ▼             ▼              ▼
┌────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐
│  Neon  │  │ Resend  │  │  Wompi  │  │ Google   │
│PostgreSQL│ │ (Email) │  │ (Pagos) │  │ Calendar │
└────────┘  └─────────┘  └─────────┘  └──────────┘
```

## Estructura de Carpetas

```
src/
├── app/                          # App Router
│   ├── (public)/                 # Rutas públicas (landing, agendamiento)
│   ├── (admin)/admin/            # Panel de administración
│   ├── (professional)/profesional/  # Portal del profesional (futuro)
│   ├── auth/                     # Login
│   ├── api/                      # API Routes (backend)
│   └── layout.tsx                # Root layout
├── components/
│   ├── ui/                       # Componentes shadcn/ui
│   ├── layouts/                  # Header, Footer, Sidebars
│   ├── booking/                  # Componentes del flujo de agendamiento
│   ├── landing/                  # Secciones de la landing
│   └── shared/                   # Componentes reutilizables (CountrySelect, DatePicker)
├── lib/
│   ├── prisma.ts                 # Singleton Prisma Client con Neon adapter
│   ├── auth.ts                   # Configuración NextAuth.js v5
│   ├── resend.ts                 # Cliente Resend
│   ├── wompi.ts                  # Utilidades Wompi (firma, verificación)
│   ├── google-calendar.ts        # Google Calendar API
│   ├── validations/              # Schemas de Zod
│   ├── emails/                   # Templates HTML de emails
│   └── utils.ts                  # cn() y utilidades
├── stores/
│   └── booking-store.ts          # Zustand store (wizard de agendamiento)
├── types/
│   └── next-auth.d.ts            # Type extensions
└── middleware.ts                  # Protección de rutas por cookie
```

## Roles del Sistema

| Rol          | Acceso            | Descripción                                               |
| ------------ | ----------------- | --------------------------------------------------------- |
| ADMIN        | `/admin/*`        | Propietaria de conAlma. Gestión global.                   |
| PROFESSIONAL | `/profesional/*`  | Psicóloga. Gestiona su perfil, disponibilidad, pacientes. |
| (Sin rol)    | `/`, `/agendar/*` | Paciente público. Agendamiento sin login.                 |

## Base de Datos

- **Provider**: Neon PostgreSQL serverless (us-east-1)
- **ORM**: Prisma 7 con `@prisma/adapter-neon`
- **Config**: `prisma.config.ts` (datasource URL) + `prisma/schema.prisma` (modelos)
- **Migrations**: `npx prisma migrate dev`
- **Seed**: `npx tsx prisma/seed.ts`
- **Client import**: `import { PrismaClient } from '@prisma/client'`

## Autenticación

- **NextAuth v5** con Credentials provider (email + password)
- **Estrategia**: JWT (no database sessions)
- **Cookie name**: `authjs.session-token` (HTTP) / `__Secure-authjs.session-token` (HTTPS)
- **Middleware**: Verifica existencia de cookie (no decodifica JWT en Edge por límite de 1MB)
- **Login**: Client-side `signIn()` de `next-auth/react` (no server action)

## Pagos (Wompi)

- **Modo**: Sandbox (claves `pub_test_*`, `prv_test_*`)
- **Flujo**: Crear cita → crear payment → redirect a Wompi checkout → webhook confirma
- **Webhook**: `/api/payments/webhook` recibe `transaction.updated`
- **Integridad**: SHA256 con `WOMPI_INTEGRITY_SECRET`
- **Tarjeta test**: `4242 4242 4242 4242`, cualquier fecha futura, CVV `123`

## Emails (Resend)

- **Dominio**: `conalma.care` (verificado)
- **From**: `citas@conalma.care`
- **Free tier**: 100 emails/día
- **Templates**: HTML inline en `src/lib/emails/`

## Google Calendar

- **Service Account**: `conalma-calendar@conalma-502822.iam.gserviceaccount.com`
- **Limitación actual**: Gmail gratuito no permite Meet ni asistentes vía Service Account
- **Solución en progreso**: OAuth 2.0 por profesional (spec `professional-portal`)
- **Evento sin Meet funciona**: Se crea el evento en el calendario del profesional

## Convenciones de Código

- **Idioma UI**: Español (textos visibles al usuario)
- **Idioma código**: Inglés (variables, funciones, tipos, comentarios)
- **Mobile-first**: Diseñar para 375px primero, escalar con `sm:`, `md:`, `lg:`
- **Componentes server por defecto**: Usar `'use client'` solo cuando necesario
- **API Routes**: Una por archivo, verbos HTTP como funciones exportadas (GET, POST, PUT)
- **Forms**: React Hook Form + Zod schema + shadcn Form components
- **Imports**: Absolute con `@/` (apunta a `src/`)
