# Diseño Técnico — Infraestructura Técnica

## Resumen

Este documento define la arquitectura técnica y decisiones de diseño para la fase de infraestructura del sistema de agendamiento de citas. Cubre la estructura del proyecto, configuración de servicios externos, esquema de base de datos base, autenticación y patrones de integración.

## Arquitectura General

```
┌─────────────────────────────────────────────────────┐
│                    Vercel (Hosting)                   │
├─────────────────────────────────────────────────────┤
│                  Next.js 15 (App Router)              │
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
│  Neon  │  │ Resend  │  │  Wompi  │  │NextAuth  │
│PostgreSQL│ │ (Email) │  │ (Pagos) │  │  (Auth)  │
└────────┘  └─────────┘  └─────────┘  └──────────┘
```

## Estructura de Carpetas del Proyecto

```
appointment-schedule/
├── src/
│   ├── app/                          # App Router (rutas)
│   │   ├── (public)/                 # Grupo de rutas públicas
│   │   │   ├── layout.tsx            # Layout público (header + footer)
│   │   │   ├── page.tsx              # Landing de conAlma (administrable)
│   │   │   └── agendar/
│   │   │       ├── page.tsx          # Paso 1: Selección de servicio
│   │   │       ├── datos/
│   │   │       │   └── page.tsx      # Paso 2: Formulario datos personales
│   │   │       ├── evaluacion/
│   │   │       │   └── page.tsx      # Paso 2b: Evaluación emocional
│   │   │       ├── emergencia/
│   │   │       │   └── page.tsx      # Paso 3: Contacto de emergencia
│   │   │       ├── profesional/
│   │   │       │   └── page.tsx      # Paso 4: Ver profesional + botón agendar
│   │   │       ├── horario/
│   │   │       │   └── page.tsx      # Paso 5: Calendario + selección hora
│   │   │       ├── confirmar/
│   │   │       │   └── page.tsx      # Paso 6: Resumen + consentimientos + pagar
│   │   │       └── confirmacion/
│   │   │           └── page.tsx      # Éxito: confirmación de pago y cita
│   │   ├── (admin)/                  # Grupo de rutas admin
│   │   │   ├── admin/
│   │   │   │   ├── layout.tsx        # Layout admin (sidebar)
│   │   │   │   ├── page.tsx          # Dashboard resumen
│   │   │   │   ├── pacientes/
│   │   │   │   │   ├── page.tsx      # Lista de pacientes
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx  # Ficha del paciente + notas
│   │   │   │   ├── citas/
│   │   │   │   │   └── page.tsx      # Calendario de citas
│   │   │   │   ├── profesionales/
│   │   │   │   │   └── page.tsx      # Gestión de profesionales
│   │   │   │   ├── servicios/
│   │   │   │   │   └── page.tsx      # Gestión de servicios
│   │   │   │   ├── disponibilidad/
│   │   │   │   │   └── page.tsx      # Horarios y fechas bloqueadas
│   │   │   │   └── contenido/
│   │   │   │       └── page.tsx      # Editar textos de la landing
│   │   │   └── layout.tsx            # Layout wrapper con auth check
│   │   ├── auth/
│   │   │   ├── login/page.tsx        # Login admin
│   │   │   └── layout.tsx
│   │   ├── api/
│   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   ├── health/route.ts
│   │   │   ├── payments/
│   │   │   │   ├── create/route.ts
│   │   │   │   └── webhook/route.ts
│   │   │   ├── calendar/
│   │   │   │   └── create-event/route.ts  # Crear evento Google Calendar
│   │   │   └── test/
│   │   │       └── email/route.ts
│   │   ├── layout.tsx                # Root layout
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                       # Componentes shadcn/ui
│   │   ├── layouts/                  # Header, Footer, Sidebar
│   │   ├── booking/                  # Componentes del flujo de agendamiento
│   │   ├── landing/                  # Secciones de la landing
│   │   └── shared/                   # Componentes compartidos
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── resend.ts
│   │   ├── wompi.ts
│   │   ├── google-calendar.ts        # Integración Google Calendar API
│   │   ├── validations/
│   │   │   ├── patient.ts            # Schema del formulario paciente
│   │   │   ├── booking.ts            # Schema de agendamiento
│   │   │   └── payment.ts            # Schema de pago
│   │   └── utils.ts
│   ├── server/
│   │   ├── db/
│   │   └── services/
│   ├── stores/
│   │   └── booking-store.ts          # Estado del wizard de agendamiento
│   └── types/
│       └── index.ts
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   └── migrations/
├── public/
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── .gitignore
```

## Esquema de Base de Datos (Prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// ENUMS
// ============================================

enum UserRole {
  ADMIN
  PROFESSIONAL
}

enum AppointmentStatus {
  PENDING_PAYMENT
  CONFIRMED
  CANCELLED
  COMPLETED
  EXPIRED
}

enum PaymentStatus {
  PENDING
  APPROVED
  DECLINED
  VOIDED
  ERROR
}

// ============================================
// AUTENTICACIÓN Y ADMIN
// ============================================

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  passwordHash  String?
  role          UserRole  @default(ADMIN)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@map("users")
}

// ============================================
// LANDING ADMINISTRABLE
// ============================================

model SiteContent {
  id        String   @id @default(cuid())
  section   String   @unique  // "hero", "about", "services_intro", "cta"
  title     String?
  subtitle  String?
  body      String?  // Texto largo / párrafos
  imageUrl  String?
  ctaText   String?
  ctaUrl    String?
  sortOrder Int      @default(0)
  isActive  Boolean  @default(true)
  updatedAt DateTime @updatedAt

  @@map("site_content")
}

// ============================================
// SERVICIOS / TIPOS DE CONSULTA
// ============================================

model Service {
  id            String    @id @default(cuid())
  name          String    // "Acompañamiento emocional"
  description   String?
  durationMin   Int       @default(60)
  price         Int       @default(0)  // COP sin decimales
  isActive      Boolean   @default(true)
  sortOrder     Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  professionals ProfessionalService[]
  appointments  Appointment[]

  @@map("services")
}

// ============================================
// PROFESIONALES
// ============================================

model Professional {
  id            String    @id @default(cuid())
  name          String
  email         String    @unique
  specialty     String
  description   String?   // Lo que atiende, enfoque
  photoUrl      String?
  isActive      Boolean   @default(true)
  calendarId    String?   // Google Calendar ID para integración
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  services        ProfessionalService[]
  availabilities  Availability[]
  blockedDates    BlockedDate[]
  appointments    Appointment[]

  @@map("professionals")
}

model ProfessionalService {
  professionalId String
  serviceId      String

  professional   Professional @relation(fields: [professionalId], references: [id])
  service        Service      @relation(fields: [serviceId], references: [id])

  @@id([professionalId, serviceId])
  @@map("professional_services")
}

// ============================================
// DISPONIBILIDAD
// ============================================

model Availability {
  id              String    @id @default(cuid())
  professionalId  String
  dayOfWeek       Int       // 0=Domingo, 1=Lunes, ..., 6=Sábado
  startTime       String    // "HH:mm"
  endTime         String    // "HH:mm"
  isActive        Boolean   @default(true)

  professional    Professional @relation(fields: [professionalId], references: [id])

  @@map("availabilities")
}

model BlockedDate {
  id              String    @id @default(cuid())
  professionalId  String
  date            DateTime  // Día específico bloqueado
  reason          String?

  professional    Professional @relation(fields: [professionalId], references: [id])

  @@map("blocked_dates")
}

// ============================================
// PACIENTES (ficha completa)
// ============================================

model Patient {
  id                  String    @id @default(cuid())
  fullName            String
  preferredName       String?   // "Como te gusta que te llamen"
  email               String
  dateOfBirth         DateTime
  country             String
  isAdult             Boolean   @default(true)  // ¿Mayor de 18?

  // Evaluación emocional (paso 2 del formulario)
  reasonForVisit      String?   // "¿Qué te trae por aquí?"
  recentFeelings      String?   // "¿Cómo te has sentido últimas semanas?"
  selfHarmRisk        Boolean   @default(false)  // Informativo para profesional
  currentTreatment    Boolean   @default(false)
  previousDiagnosis   String?
  desiredOutcome      String?   // "¿Qué te gustaría encontrar?"
  additionalNotes     String?   // "Algo que tu especialista sepa"
  informedConsent     Boolean   @default(false)

  // Contacto de emergencia (paso 3)
  emergencyName       String?
  emergencyRelation   String?
  emergencyPhone      String?
  emergencyCountry    String?

  // Consentimientos
  dataPrivacyConsent  Boolean   @default(false)
  commsConsent        Boolean   @default(false)

  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  appointments        Appointment[]
  progressNotes       ProgressNote[]

  @@map("patients")
}

// ============================================
// CITAS
// ============================================

model Appointment {
  id                  String            @id @default(cuid())
  patientId           String
  professionalId      String
  serviceId           String
  date                DateTime
  startTime           String            // "HH:mm"
  endTime             String            // "HH:mm"
  status              AppointmentStatus @default(PENDING_PAYMENT)
  reservedUntil       DateTime?         // 15 min para pagar
  googleEventId       String?           // ID del evento en Google Calendar
  meetLink            String?           // Link de Google Meet generado automáticamente
  createdAt           DateTime          @default(now())
  updatedAt           DateTime          @updatedAt

  patient             Patient           @relation(fields: [patientId], references: [id])
  professional        Professional      @relation(fields: [professionalId], references: [id])
  service             Service           @relation(fields: [serviceId], references: [id])
  payment             Payment?
  progressNotes       ProgressNote[]

  @@map("appointments")
}

// ============================================
// PAGOS
// ============================================

model Payment {
  id              String        @id @default(cuid())
  appointmentId   String        @unique
  wompiReference  String?       @unique
  amount          Int           // COP
  status          PaymentStatus @default(PENDING)
  method          String?       // "CARD", "PSE", "NEQUI"
  payerName       String?
  payerEmail      String?
  rawResponse     Json?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  appointment     Appointment   @relation(fields: [appointmentId], references: [id])

  @@map("payments")
}

// ============================================
// NOTAS DE PROGRESO (por sesión)
// ============================================

model ProgressNote {
  id              String      @id @default(cuid())
  appointmentId   String
  patientId       String
  content         String      // Nota libre del profesional
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  appointment     Appointment @relation(fields: [appointmentId], references: [id])
  patient         Patient     @relation(fields: [patientId], references: [id])

  @@map("progress_notes")
}
```

## Decisiones de Diseño

### 1. Autenticación (NextAuth.js v5)

- **Provider**: Credentials (email + password) para administradores
- **Adapter**: Prisma Adapter conectado a la tabla `User`
- **Estrategia de sesión**: JWT (no database sessions — reduce queries a Neon)
- **Protección de rutas**: Middleware de Next.js en `middleware.ts` que intercepta `/admin/*`
- **Flujo público sin auth**: Los usuarios finales agendan como invitados (sin necesidad de registro)

### 2. Integración Wompi (Pagos)

- **Modo**: Sandbox durante desarrollo, producción con switch de variables de entorno
- **Flujo**: Widget de checkout de Wompi embebido (redirect-based)
- **Webhook**: API Route `/api/payments/webhook` recibe eventos POST de Wompi
- **Validación**: Verificación de firma SHA256 con `WOMPI_EVENTS_SECRET`
- **Idempotencia**: Se verifica `wompiReference` única antes de procesar

### 3. Envío de Emails (Resend)

- **SDK**: `resend` package oficial
- **Templates**: Componentes React renderizados server-side con `@react-email/components`
- **Reintentos**: Lógica custom con 3 intentos y backoff de 30s
- **Rate limit**: Respetar 100 emails/día del free tier

### 4. State Management

- **TanStack Query**: Para toda data que viene del servidor (queries a API Routes). Maneja cache, refetch, loading/error states.
- **Zustand**: Solo para estado puramente de cliente (UI state: sidebar abierto/cerrado, modales, wizard steps). NO para datos del servidor.

### 5. Formularios

- **React Hook Form**: Controlador de formularios (uncontrolled por defecto, mejor performance)
- **Zod**: Schemas de validación reutilizables entre frontend (formularios) y backend (API Routes)
- **shadcn/ui Form**: Componente `<Form>` que integra RHF con los inputs de shadcn/ui

### 6. Singleton de Prisma Client

Para evitar múltiples conexiones en development (hot reload):

```typescript
// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### 7. Variables de Entorno

```env
# Database
DATABASE_URL="postgresql://..."

# Auth
NEXTAUTH_SECRET="random-secret-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# Resend
RESEND_API_KEY="re_..."

# Wompi
WOMPI_PUBLIC_KEY="pub_test_..."
WOMPI_PRIVATE_KEY="prv_test_..."
WOMPI_EVENTS_SECRET="test_events_..."
WOMPI_API_URL="https://sandbox.wompi.co/v1"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## Endpoints API Routes

| Método | Ruta                         | Propósito                    | Auth     |
| ------ | ---------------------------- | ---------------------------- | -------- |
| GET    | `/api/health`                | Healthcheck de servicios     | No       |
| POST   | `/api/auth/[...nextauth]`    | NextAuth handlers            | No       |
| POST   | `/api/test/email`            | Enviar email de prueba       | Admin    |
| POST   | `/api/payments/create`       | Generar sesión de pago Wompi | No       |
| POST   | `/api/payments/webhook`      | Recibir eventos de Wompi     | Firma    |
| POST   | `/api/calendar/create-event` | Crear evento Google Calendar | Internal |

## Dashboard Admin — Pantallas

| Ruta                    | Propósito                                                            |
| ----------------------- | -------------------------------------------------------------------- |
| `/admin`                | Dashboard resumen (citas del día, próximas, estadísticas)            |
| `/admin/pacientes`      | Lista de pacientes con búsqueda                                      |
| `/admin/pacientes/[id]` | Ficha completa del paciente + historial de citas + notas de progreso |
| `/admin/citas`          | Calendario visual con todas las citas                                |
| `/admin/profesionales`  | CRUD de profesionales (nombre, foto, especialidad, servicios)        |
| `/admin/servicios`      | CRUD de servicios (nombre, descripción, duración, precio)            |
| `/admin/disponibilidad` | Gestión de horarios y fechas bloqueadas por profesional              |
| `/admin/contenido`      | Editor de textos de la landing (secciones fijas)                     |

## Patrones de Seguridad

1. **Validación de webhook**: Verificar firma HMAC SHA256 de Wompi antes de procesar cualquier evento
2. **Rate limiting**: Confiar en Vercel's built-in rate limiting para el free tier
3. **Input sanitization**: Zod valida y sanitiza toda entrada en API Routes
4. **Environment secrets**: Nunca exponer claves privadas al cliente (solo `NEXT_PUBLIC_*` es público)
5. **Password hashing**: bcrypt para hash de contraseñas de admin
