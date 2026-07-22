# Implementation Plan: Portal del Profesional + OAuth Google Calendar

## Overview

Implementación incremental del portal del profesional para conAlma. Se organiza en fases: primero los cambios de base de datos y utilidades core, luego la capa de autenticación y middleware, seguido de cada módulo funcional (perfil, disponibilidad, OAuth, calendario, pacientes, ingresos), y finalmente la integración con el webhook de Wompi existente.

Stack: Next.js 16 App Router, TypeScript strict, Prisma 7, Neon PostgreSQL, NextAuth v5 JWT, shadcn/ui v4, Tailwind v4.

## Tasks

- [x] 1. Schema de base de datos y utilidades core
  - [x] 1.1 Migración de Prisma: campos OAuth en Professional, mustChangePassword en User, authorId en ProgressNote
    - Modificar `prisma/schema.prisma`:
      - User: agregar `mustChangePassword Boolean @default(false)`, relación `professional Professional?`
      - Professional: agregar `userId String? @unique`, `googleRefreshToken String?`, `googleEmail String?`, `googleTokenExpiresAt DateTime?`, `googleCalendarConnected Boolean @default(false)`, relación `user User? @relation(fields: [userId], references: [id])`
      - ProgressNote: agregar `authorId String?`
    - Ejecutar `npx prisma migrate dev --name add-professional-portal-fields`
    - _Requirements: 1.4, 4.3, 8.3_

  - [x] 1.2 Crear `src/lib/encryption.ts` — utilidad de encriptación AES-256-GCM
    - Implementar `encrypt(plaintext: string): string` y `decrypt(ciphertext: string): string`
    - Usar `OAUTH_ENCRYPTION_KEY` (32 bytes base64) del env
    - IV aleatorio por cada encriptación, concatenado al ciphertext
    - _Requirements: 4.3_

  - [x] 1.3 Crear `src/lib/password-generator.ts` — generación de contraseña temporal
    - Implementar `generateTempPassword(): string` usando `crypto.randomBytes(12).toString('base64url')`
    - Resultado: mínimo 16 caracteres alfanuméricos
    - _Requirements: 1.4, 10.3_

  - [x]* 1.4 Write property test: generación de contraseña temporal
    - **Property 1: Generación de contraseña temporal cumple criterios de seguridad**
    - Test con fast-check: verificar longitud ≥ 16 y unicidad en 1000 generaciones
    - **Validates: Requirements 1.4, 10.3**

  - [x] 1.5 Crear `src/lib/google-oauth.ts` — helpers OAuth 2.0
    - `buildGoogleOAuthUrl(professionalId: string): string` — construye URL de consent con state firmado
    - `exchangeCodeForTokens(code: string): Promise<{accessToken, refreshToken, expiresAt}>` — intercambia code
    - `refreshAccessToken(refreshToken: string): Promise<{accessToken, expiresAt}>` — renueva token
    - `revokeToken(token: string): Promise<void>` — revoca en Google
    - `createCalendarEvent(params: CreateEventParams): Promise<{eventId, meetLink} | null>` — crea evento con Meet
    - Usar `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET` del env
    - _Requirements: 4.2, 4.3, 6.1, 6.3_

  - [x] 1.6 Crear `src/lib/validations/professional-profile.ts` — Zod schemas
    - Schema para update de perfil (specialty, description, traits, photoUrl)
    - Schema para creación de disponibilidad (dayOfWeek 0-6, startTime HH:mm, endTime HH:mm)
    - Schema para notas de progreso (content min 1 max 5000, appointmentId opcional)
    - Schema para cambio de contraseña (currentPassword, newPassword min 8, confirmPassword)
    - _Requirements: 3.1, 5.1, 8.3_

- [x] 2. Autenticación y middleware
  - [x] 2.1 Actualizar `src/middleware.ts` — proteger rutas `/profesional/*`
    - Extender matcher: `['/admin/:path*', '/profesional/:path*']`
    - Mantener la lógica actual de verificación de cookie intacta
    - NO verificar rol en middleware (limitación Edge runtime)
    - _Requirements: 1.6_

  - [x] 2.2 Actualizar `src/lib/auth.ts` — agregar professionalId al JWT y session
    - En el callback `jwt`: si el usuario tiene rol PROFESSIONAL, buscar su Professional y agregar `professionalId` al token
    - En el callback `session`: exponer `professionalId` y `mustChangePassword` en session
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 2.3 Actualizar `src/types/next-auth.d.ts` — extender tipos de session
    - Agregar `professionalId?: string` y `mustChangePassword?: boolean` a la interfaz Session
    - _Requirements: 1.1_

  - [x] 2.4 Actualizar componente de login para redirección por rol
    - Modificar `src/app/auth/login/page.tsx` o su lógica de callback
    - Si rol ADMIN → redirect `/admin`
    - Si rol PROFESSIONAL → redirect `/profesional`
    - _Requirements: 1.2, 1.3_

  - [x]* 2.5 Write property test: protección de rutas por rol
    - **Property 2: Protección de rutas por rol**
    - Test con fast-check: para cualquier combinación (role, path), verificar acceso correcto/denegado
    - **Validates: Requirements 1.6**

  - [x] 2.6 Crear helper `src/lib/get-professional-session.ts` — extraer session del profesional
    - Función reutilizable para API routes: verifica sesión, verifica rol PROFESSIONAL, retorna professionalId
    - Retorna 401 si no hay sesión, 403 si no es PROFESSIONAL
    - _Requirements: 1.6, 2.4_

- [x] 3. Checkpoint — Schema, auth y utilidades base
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Layout y estructura del portal profesional
  - [x] 4.1 Crear `src/app/(professional)/layout.tsx` — root layout del route group
    - Layout mínimo que envuelve el route group
    - _Requirements: 1.2_

  - [x] 4.2 Crear `src/app/(professional)/profesional/layout.tsx` — layout con sidebar
    - Server component que verifica sesión con `auth()` y rol PROFESSIONAL
    - Si `mustChangePassword === true`, renderiza `ChangePasswordModal` antes del contenido
    - Incluye `ProfessionalSidebar` + area de contenido principal
    - _Requirements: 1.5, 1.6_

  - [x] 4.3 Crear `src/components/layouts/professional-sidebar.tsx`
    - Client component con navegación: Dashboard, Perfil, Disponibilidad, Calendario, Pacientes, Ingresos
    - Mobile hamburger menu (misma estructura que AdminSidebar)
    - Links activos destacados, iconos de Lucide React
    - _Requirements: 1.2_

  - [x] 4.4 Crear `src/components/professional/change-password-modal.tsx`
    - Modal con React Hook Form + Zod: currentPassword, newPassword, confirmPassword
    - POST a `/api/professional/change-password`
    - Al éxito: cierra modal, actualiza sesión
    - _Requirements: 1.5_

  - [x] 4.5 Crear `POST /api/professional/change-password/route.ts`
    - Verificar sesión y rol PROFESSIONAL
    - Validar currentPassword con bcrypt compare
    - Hash newPassword y actualizar User
    - Set `mustChangePassword = false`
    - _Requirements: 1.5_

- [x] 5. Módulo Dashboard
  - [x] 5.1 Crear `GET /api/professional/dashboard/route.ts`
    - Usar `getProfessionalSession()` para obtener professionalId
    - Query citas de hoy, próximas 5 (futuras, ordenadas ASC), ingresos del mes
    - Filtrar por `professionalId` en TODAS las queries
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x]* 5.2 Write property test: aislamiento de datos por profesional
    - **Property 3: Aislamiento de datos por profesional**
    - Test con fast-check: verificar que filterByProfessional SIEMPRE retorna solo datos del profId dado
    - **Validates: Requirements 2.4, 7.5, 8.4, 9.5**

  - [x]* 5.3 Write property test: límite y orden de citas próximas
    - **Property 4: Límite y orden de citas próximas**
    - Test con fast-check: verificar max 5 resultados, orden cronológico ASC
    - **Validates: Requirements 2.2**

  - [x] 5.4 Crear `src/components/professional/dashboard-stats.tsx`
    - Cards con: citas de hoy (count + lista), próximas citas (max 5), ingresos del mes (total, comisión, neto)
    - Fetch a `/api/professional/dashboard`
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 5.5 Crear `src/app/(professional)/profesional/page.tsx` — página Dashboard
    - Server component que renderiza DashboardStats
    - _Requirements: 2.1_

- [x] 6. Módulo Perfil
  - [x] 6.1 Crear `GET /api/professional/profile/route.ts`
    - Retorna perfil completo incluyendo tarifa y estado OAuth
    - Solo datos del profesional autenticado
    - _Requirements: 3.1, 3.2_

  - [x] 6.2 Crear `PUT /api/professional/profile/route.ts`
    - Validar body con Zod schema
    - Ignorar campos readonly (name, email) si vienen en el payload
    - Actualizar solo: specialty, description, traits, photoUrl
    - _Requirements: 3.1, 3.2, 3.3_

  - [x]* 6.3 Write property test: rechazo de campos de solo lectura
    - **Property 6: Rechazo de campos de solo lectura**
    - Test con fast-check: payloads con campos readonly nunca modifican esos campos en DB
    - **Validates: Requirements 3.2**

  - [x] 6.4 Crear `src/components/professional/profile-form.tsx`
    - React Hook Form con campos editables (specialty, description, traits, photoUrl)
    - Campos readonly mostrados como texto plano (name, email, tarifa, comisión)
    - Submit PUT a `/api/professional/profile`
    - _Requirements: 3.1, 3.2_

  - [x] 6.5 Crear `src/components/professional/profile-preview.tsx`
    - Preview de cómo se ve la card del profesional en la landing pública
    - _Requirements: 3.4_

  - [x] 6.6 Crear `src/app/(professional)/profesional/perfil/page.tsx`
    - Renderiza ProfileForm + ProfilePreview
    - _Requirements: 3.1_

- [x] 7. Módulo Disponibilidad + OAuth Google Calendar
  - [x] 7.1 Crear `GET /api/professional/availability/route.ts`
    - Retorna bloques horarios + fechas bloqueadas del profesional autenticado
    - _Requirements: 5.1, 5.2_

  - [x] 7.2 Crear `POST /api/professional/availability/route.ts`
    - Validar con Zod (dayOfWeek, startTime, endTime)
    - Verificar no-overlap con bloques existentes del mismo día
    - Crear bloque en DB
    - _Requirements: 5.1_

  - [x]* 7.3 Write property test: no superposición de bloques horarios
    - **Property 7: No superposición de bloques horarios**
    - Test con fast-check: generando bloques aleatorios, verificar que overlaps son siempre rechazados
    - **Validates: Requirements 5.1**

  - [x] 7.4 Crear `DELETE /api/professional/availability/route.ts`
    - Eliminar bloque por ID, verificando que pertenece al profesional autenticado
    - _Requirements: 5.2_

  - [x] 7.5 Crear `GET/POST/DELETE /api/professional/blocked-dates/route.ts`
    - CRUD de fechas bloqueadas del profesional
    - _Requirements: 5.3_

  - [x]* 7.6 Write property test: admin no puede modificar disponibilidad
    - **Property 8: Admin no puede modificar disponibilidad**
    - Test con fast-check: cualquier request de mutación con rol ADMIN retorna 403
    - **Validates: Requirements 5.5, 10.2**

  - [x] 7.7 Crear `GET /api/professional/google-calendar/connect/route.ts`
    - Construir URL de OAuth con state firmado (professionalId)
    - Redirect 302 a Google consent screen
    - _Requirements: 4.1, 4.2_

  - [x] 7.8 Crear `GET /api/professional/google-calendar/callback/route.ts`
    - Recibir `code` y `state` de Google
    - Verificar state, exchange code por tokens
    - Encriptar refresh_token con AES-256-GCM
    - Guardar en Professional: googleRefreshToken, googleEmail, googleCalendarConnected=true
    - Redirect a `/profesional/disponibilidad?connected=true`
    - _Requirements: 4.2, 4.3_

  - [x] 7.9 Crear `POST /api/professional/google-calendar/disconnect/route.ts`
    - Leer refresh_token, revocar en Google, limpiar campos OAuth en Professional
    - _Requirements: 4.5_

  - [x] 7.10 Crear `GET /api/professional/google-calendar/status/route.ts`
    - Retorna estado de conexión OAuth (connected, email, expiresAt)
    - _Requirements: 4.4, 4.6_

  - [x] 7.11 Crear `src/components/professional/availability-manager.tsx`
    - CRUD visual de bloques horarios por día de la semana
    - Lista de fechas bloqueadas con formulario de agregar
    - _Requirements: 5.1, 5.2, 5.3_

  - [x] 7.12 Crear `src/components/professional/google-calendar-connect.tsx`
    - Botón "Conectar Google Calendar" / estado "Conectado (email)"
    - Botón "Desconectar" con confirmación
    - Banner de reconexión si token revocado
    - _Requirements: 4.1, 4.4, 4.5, 4.6_

  - [x] 7.13 Crear `src/app/(professional)/profesional/disponibilidad/page.tsx`
    - Renderiza AvailabilityManager + GoogleCalendarConnect
    - _Requirements: 5.1, 4.1_

- [x] 8. Checkpoint — Perfil, disponibilidad y OAuth configurados
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Módulo Calendario de citas
  - [x] 9.1 Crear `GET /api/professional/appointments/route.ts`
    - Retorna citas del profesional autenticado con datos de paciente y servicio
    - Filtro por mes (query param `month=YYYY-MM`)
    - _Requirements: 7.1, 7.5_

  - [x] 9.2 Crear `PATCH /api/professional/appointments/route.ts`
    - Marcar cita como COMPLETED (solo desde CONFIRMED)
    - Verificar que la cita pertenece al profesional autenticado
    - _Requirements: 7.3_

  - [x]* 9.3 Write property test: transición de estado de cita válida
    - **Property 10: Transición de estado de cita válida**
    - Test con fast-check: solo CONFIRMED → COMPLETED es válido, cualquier otro estado es rechazado
    - **Validates: Requirements 7.3**

  - [x] 9.4 Crear `src/components/professional/calendar-view.tsx`
    - Calendario mensual con citas, diferenciadas por estado (colores)
    - Click en cita abre modal de detalle
    - _Requirements: 7.1, 7.4_

  - [x] 9.5 Crear `src/components/professional/appointment-detail-modal.tsx`
    - Modal con: paciente, servicio, fecha/hora, link Meet, estado
    - Botón "Marcar completada" (solo si estado CONFIRMED)
    - _Requirements: 7.2, 7.3_

  - [x] 9.6 Crear `src/app/(professional)/profesional/calendario/page.tsx`
    - Renderiza CalendarView
    - _Requirements: 7.1_

- [x] 10. Módulo Pacientes
  - [x] 10.1 Crear `GET /api/professional/patients/route.ts`
    - Retorna pacientes que tienen al menos una cita con el profesional autenticado
    - Include: fullName, preferredName, email, lastAppointmentDate, totalAppointments
    - _Requirements: 8.1, 8.4_

  - [x]* 10.2 Write property test: lista de pacientes filtrada por relación de citas
    - **Property 11: Lista de pacientes filtrada por relación de citas**
    - Test con fast-check: solo pacientes con citas del profesional aparecen en la lista
    - **Validates: Requirements 8.1**

  - [x] 10.3 Crear `GET /api/professional/patients/[id]/route.ts`
    - Retorna ficha completa del paciente + historial de citas + notas de progreso
    - Verificar que el paciente tiene citas con este profesional (403 si no)
    - _Requirements: 8.2, 8.4_

  - [x] 10.4 Crear `GET/POST /api/professional/patients/[id]/notes/route.ts`
    - GET: retorna notas de progreso del paciente (filtradas por authorId del profesional)
    - POST: crear nueva nota con validación Zod (content, appointmentId?)
    - Guardar authorId = professionalId del autenticado
    - _Requirements: 8.3, 8.5_

  - [x]* 10.5 Write property test: profesional no puede modificar datos del paciente
    - **Property 12: Profesional no puede modificar datos del paciente**
    - Test con fast-check: PUT/PATCH/DELETE con rol PROFESSIONAL siempre retorna 403
    - **Validates: Requirements 8.5**

  - [x] 10.6 Crear `src/components/professional/patient-list.tsx`
    - Tabla con lista de pacientes, búsqueda, link a ficha individual
    - _Requirements: 8.1_

  - [x] 10.7 Crear `src/components/professional/patient-detail.tsx`
    - Ficha completa del paciente (readonly): datos personales, evaluación, emergencia
    - Historial de citas con este profesional
    - _Requirements: 8.2_

  - [x] 10.8 Crear `src/components/professional/progress-note-form.tsx`
    - Textarea + submit para agregar notas
    - Selector opcional de cita asociada
    - _Requirements: 8.3_

  - [x] 10.9 Crear `src/app/(professional)/profesional/pacientes/page.tsx`
    - Renderiza PatientList
    - _Requirements: 8.1_

  - [x] 10.10 Crear `src/app/(professional)/profesional/pacientes/[id]/page.tsx`
    - Renderiza PatientDetail + ProgressNoteForm + lista de notas
    - _Requirements: 8.2, 8.3_

- [x] 11. Módulo Ingresos
  - [x] 11.1 Crear `GET /api/professional/income/route.ts`
    - Query params: startDate, endDate (default: mes actual)
    - Filtrar citas con status CONFIRMED o COMPLETED del profesional autenticado
    - Calcular: totalBilled, totalCommission (usando ProfessionalTariff.commission), netIncome
    - Retornar resumen + detalle por sesión
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x]* 11.2 Write property test: invariante de cálculo de ingresos
    - **Property 5: Invariante de cálculo de ingresos**
    - Test con fast-check: neto = monto - (monto * tasa / 100) para cada sesión, totalNeto = suma(netos)
    - **Validates: Requirements 2.3, 9.1, 9.3**

  - [x]* 11.3 Write property test: filtro de rango de fechas correcto
    - **Property 13: Filtro de rango de fechas correcto**
    - Test con fast-check: todos los registros retornados tienen fecha dentro del rango [start, end]
    - **Validates: Requirements 9.2**

  - [x]* 11.4 Write property test: filtro de estado para ingresos
    - **Property 14: Filtro de estado para ingresos**
    - Test con fast-check: solo registros CONFIRMED/COMPLETED aparecen, nunca PENDING/CANCELLED/EXPIRED
    - **Validates: Requirements 9.4**

  - [x] 11.5 Crear `src/components/professional/income-summary.tsx`
    - Cards: total facturado, comisión descontada, neto a recibir
    - _Requirements: 9.1_

  - [x] 11.6 Crear `src/components/professional/income-filters.tsx`
    - DateRangePicker con presets (este mes, mes anterior, personalizado)
    - _Requirements: 9.2_

  - [x] 11.7 Crear `src/components/professional/income-table.tsx`
    - Tabla detallada: fecha, paciente, servicio, monto, comisión %, comisión $, neto
    - _Requirements: 9.3_

  - [x] 11.8 Crear `src/app/(professional)/profesional/ingresos/page.tsx`
    - Renderiza IncomeSummary + IncomeFilters + IncomeTable
    - _Requirements: 9.1, 9.2, 9.3_

- [x] 12. Checkpoint — Todos los módulos del portal implementados
  - Ensure all tests pass, ask the user if questions arise.

- [x] 13. Integración con webhook Wompi y flujo de creación de profesional
  - [x] 13.1 Modificar webhook Wompi para usar OAuth del profesional
    - En `src/app/api/payments/webhook/route.ts`:
      - Después de confirmar pago, verificar `professional.googleCalendarConnected`
      - Si conectado: decrypt refreshToken, crear evento con `createCalendarEvent()` de `google-oauth.ts`
      - Si no conectado: continuar sin evento (comportamiento actual)
      - Si falla creación de evento: log error, continuar con confirmación
    - Guardar meetLink en Appointment si evento creado exitosamente
    - _Requirements: 6.1, 6.2, 6.3, 6.5, 6.6, 6.7_

  - [x]* 13.2 Write property test: payload de evento Google Calendar completo
    - **Property 9: Payload de evento Google Calendar completo**
    - Test con fast-check: para cualquier cita válida, el payload incluye título, descripción, fecha/hora, attendee
    - **Validates: Requirements 6.2**

  - [x] 13.3 Modificar creación de profesional desde Admin
    - En la API de creación de profesional (existente en admin):
      - Generar contraseña temporal con `generateTempPassword()`
      - Crear User con `role: PROFESSIONAL`, `mustChangePassword: true`, `passwordHash: bcrypt(temp)`
      - Crear Professional con `userId: user.id`
      - Retornar contraseña temporal en response (mostrar una sola vez)
    - Actualizar UI admin para mostrar contraseña temporal al crear profesional
    - _Requirements: 1.4, 10.3_

  - [x] 13.4 Actualizar vista admin de profesional — disponibilidad readonly + estado OAuth
    - En `src/app/(admin)/admin/profesionales/[id]/page.tsx`:
      - Mostrar disponibilidad como solo lectura (remover botones de edición)
      - Mostrar estado de conexión Google Calendar (badge conectado/desconectado)
    - _Requirements: 10.1, 10.2, 10.4_

- [x] 14. Checkpoint final — Integración completa y regresión
  - Ensure all tests pass, ask the user if questions arise.
  - Verificar que todas las rutas admin siguen funcionando (no regresión).
  - Verificar que el flujo público de agendamiento sigue intacto.
  - Verificar login para ambos roles (ADMIN y PROFESSIONAL).

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document (14 properties)
- Unit tests validate specific examples and edge cases
- El middleware NO verifica rol (Edge limit) — la verificación se hace en API routes y layouts server-side
- Variables de entorno nuevas requeridas: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `OAUTH_ENCRYPTION_KEY`
- fast-check es la librería PBT elegida (TypeScript, shrinking automático, min 100 iteraciones)
- La landing y admin panel existentes NO se modifican excepto: disponibilidad readonly en vista profesional admin

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.6"] },
    { "id": 2, "tasks": ["1.4", "1.5", "2.1", "2.3"] },
    { "id": 3, "tasks": ["2.2", "2.6"] },
    { "id": 4, "tasks": ["2.4", "2.5", "4.1"] },
    { "id": 5, "tasks": ["4.2", "4.3"] },
    { "id": 6, "tasks": ["4.4", "4.5", "5.1"] },
    { "id": 7, "tasks": ["5.2", "5.3", "5.4", "6.1"] },
    { "id": 8, "tasks": ["5.5", "6.2", "6.4"] },
    { "id": 9, "tasks": ["6.3", "6.5", "6.6", "7.1"] },
    { "id": 10, "tasks": ["7.2", "7.4", "7.5", "7.7"] },
    { "id": 11, "tasks": ["7.3", "7.6", "7.8", "7.9", "7.10"] },
    { "id": 12, "tasks": ["7.11", "7.12"] },
    { "id": 13, "tasks": ["7.13", "9.1", "9.2"] },
    { "id": 14, "tasks": ["9.3", "9.4", "9.5"] },
    { "id": 15, "tasks": ["9.6", "10.1"] },
    { "id": 16, "tasks": ["10.2", "10.3", "10.4"] },
    { "id": 17, "tasks": ["10.5", "10.6", "10.7", "10.8"] },
    { "id": 18, "tasks": ["10.9", "10.10", "11.1"] },
    { "id": 19, "tasks": ["11.2", "11.3", "11.4", "11.5", "11.6", "11.7"] },
    { "id": 20, "tasks": ["11.8", "13.1"] },
    { "id": 21, "tasks": ["13.2", "13.3"] },
    { "id": 22, "tasks": ["13.4"] }
  ]
}
```
