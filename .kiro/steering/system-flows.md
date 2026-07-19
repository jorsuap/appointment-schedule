---
inclusion: auto
---

# Flujos del Sistema — conAlma

## Flujo de Agendamiento (Paciente → Pago → Confirmación)

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Paciente │───▶│  Landing  │───▶│ Selección│───▶│Formulario│
│ (mobile) │    │  (SSR)    │    │ Servicio │    │  Datos   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                       │
                     ┌─────────────────────────────────┘
                     ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│Evaluación│───▶│Emergencia│───▶│Profesional│───▶│ Horario  │
│ Emocional│    │ Contacto │    │ Selección │    │(Calendar)│
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                                                       │
                     ┌─────────────────────────────────┘
                     ▼
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Confirmar│───▶│  Wompi   │───▶│ Webhook  │───▶│Confirmac.│
│ + Pagar  │    │ Checkout │    │ Callback │    │  Página  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### Detalle del flujo post-pago (Webhook)

```
Wompi (transaction.updated: APPROVED)
         │
         ▼
/api/payments/webhook
         │
         ├── 1. Verificar firma del webhook
         ├── 2. Verificar transacción con Wompi API
         ├── 3. Actualizar Payment (status: APPROVED)
         ├── 4. Actualizar Appointment (status: CONFIRMED)
         ├── 5. Crear evento en Google Calendar (si OAuth conectado)
         │       └── Generar Meet link + invitar asistente
         ├── 6. Guardar meetLink en Appointment
         └── 7. Enviar email de confirmación (Resend)
                 └── Incluir: fecha, hora, profesional, link Meet
```

## Flujo de Disponibilidad (Cómo se calculan los slots)

```
GET /api/availability?professionalId=X&serviceId=Y

1. Obtener duración del servicio (Service.durationMin)
2. Obtener horarios recurrentes del profesional (Availability[])
3. Obtener fechas bloqueadas (BlockedDate[])
4. Obtener citas existentes CONFIRMED/PENDING_PAYMENT (Appointment[])
5. Para cada día de los próximos 30 días:
   a. ¿Es un día bloqueado? → Skip
   b. ¿Tiene horario para este día de la semana? → Generar slots
   c. Para cada slot generado: ¿ya tiene cita existente? → Excluir
6. Retornar: { slots: { "2026-07-21": ["09:00", "10:00", ...] } }
```

## Flujo de Autenticación

```
┌──────────────┐
│ /auth/login  │ (Client Component)
│              │
│ signIn() de  │──── POST /api/auth/callback/credentials
│ next-auth/   │           │
│ react        │           ▼
└──────────────┘    ┌──────────────┐
                    │ src/lib/auth │
                    │              │
                    │ 1. Find user │──── Prisma → Neon DB
                    │ 2. Compare   │──── bcrypt
                    │    password  │
                    │ 3. Return    │
                    │    JWT token │
                    └──────┬───────┘
                           │
                           ▼
                    Cookie set: authjs.session-token
                           │
                           ▼
                    router.push('/admin' o '/profesional')
                           │
                           ▼
                    ┌──────────────┐
                    │  Middleware  │ Verifica cookie existe
                    │              │ Si no → redirect /auth/login
                    └──────────────┘
```

## Conexión entre Servicios Externos

```
┌─────────────────────────────────────────────────────────┐
│                    VERCEL (Next.js)                       │
│                                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Pages/     │  │  API Routes │  │  Middleware  │    │
│  │  Components │  │  /api/*     │  │  (Edge)     │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         │                │                  │           │
└─────────┼────────────────┼──────────────────┼───────────┘
          │                │                  │
          │                │                  │ Lee cookie
          │                │                  │
          │    ┌───────────┼──────────────────┘
          │    │           │
          ▼    ▼           ▼
┌──────────────────┐  ┌─────────────┐
│ NEON PostgreSQL  │  │   RESEND    │
│                  │  │             │
│ • users          │  │ Envía email │
│ • professionals  │  │ confirmación│
│ • patients       │  │             │
│ • appointments   │  │ From:       │
│ • payments       │  │ citas@      │
│ • site_content   │  │ conalma.care│
│ • availabilities │  └─────────────┘
│ • progress_notes │
│ • blocked_dates  │  ┌─────────────┐
│ • professional_  │  │   WOMPI     │
│   tariffs        │  │             │
└──────────────────┘  │ 1. Crear    │
                      │    payment  │
                      │ 2. Redirect │
┌──────────────────┐  │    checkout │
│ GOOGLE CALENDAR  │  │ 3. Webhook  │
│                  │  │    confirm  │
│ • Crear eventos  │  └─────────────┘
│ • Meet link (*)  │
│ • Invitaciones(*)│
│                  │
│ (*) Requiere     │
│ OAuth 2.0 del    │
│ profesional      │
└──────────────────┘
```

## Modelo de Datos (Relaciones principales)

```
User (ADMIN/PROFESSIONAL)
  │
Professional ──┬── ProfessionalService ── Service
               ├── ProfessionalTariff
               ├── Availability (horarios recurrentes)
               ├── BlockedDate (fechas no disponibles)
               └── Appointment ──┬── Patient
                                 ├── Payment
                                 └── ProgressNote

SiteContent (landing administrable)
```

## Variables de Entorno (servicios conectados)

| Variable                     | Servicio | Propósito                           |
| ---------------------------- | -------- | ----------------------------------- |
| DATABASE_URL                 | Neon     | Conexión PostgreSQL                 |
| NEXTAUTH_SECRET              | NextAuth | Firma de JWT                        |
| NEXTAUTH_URL                 | NextAuth | URL base para callbacks             |
| RESEND_API_KEY               | Resend   | Envío de emails                     |
| WOMPI_PUBLIC_KEY             | Wompi    | Widget de checkout                  |
| WOMPI_PRIVATE_KEY            | Wompi    | Verificar transacciones             |
| WOMPI_EVENTS_SECRET          | Wompi    | Validar webhooks                    |
| WOMPI_INTEGRITY_SECRET       | Wompi    | Firma de integridad                 |
| WOMPI_API_URL                | Wompi    | URL base API                        |
| GOOGLE_SERVICE_ACCOUNT_EMAIL | Google   | Service Account (eventos sin OAuth) |
| GOOGLE_PRIVATE_KEY           | Google   | Key del Service Account             |
| NEXT_PUBLIC_APP_URL          | App      | URL pública de la app               |
