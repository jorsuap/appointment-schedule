# Implementation Plan: Session Packages (Paquetes de Sesiones)

## Overview

Implementación de la funcionalidad de venta de paquetes de sesiones desde el portal del profesional. Se organiza en fases: primero los cambios de base de datos y funciones de dominio puras, luego las APIs del admin (configuración de descuentos y datos bancarios), seguido del wizard de creación de paquetes en el portal profesional, la integración con Wompi Payment Links API, la extensión del webhook existente para confirmar paquetes, y finalmente las vistas de gestión y listado.

Stack: Next.js 16 App Router, TypeScript strict, Prisma 7, Neon PostgreSQL, NextAuth v5 JWT, shadcn/ui v4, Tailwind v4.

## Tasks

- [x] 1. Schema de base de datos y funciones de dominio puras
  - [x] 1.1 Migración Prisma: nuevos modelos SessionPackage, DiscountTier, BankDetails + enums
    - Modificar `prisma/schema.prisma`:
      - Agregar enums: `PackageStatus` (PENDING_PAYMENT, CONFIRMED, CANCELLED), `PackagePaymentMethod` (WOMPI, BANK_TRANSFER), `Frequency` (WEEKLY, BIWEEKLY, MONTHLY)
      - Agregar modelo `SessionPackage` con todos los campos del diseño (pricing snapshot, payment fields, relaciones)
      - Agregar modelo `DiscountTier` (minSessions, maxSessions, discountPerSession, isActive)
      - Agregar modelo `BankDetails` (bankName, accountType, accountNumber, accountHolder, alias, isActive)
      - Agregar `sessionPackageId String?` y relación `sessionPackage` al modelo `Appointment`
      - Agregar relación `sessionPackages SessionPackage[]` a `Professional` y `Patient`
    - Ejecutar `npx prisma migrate dev --name add_session_packages`
    - _Requirements: 1.1, 1.5, 2.1, 3.1, 4.4, 5.2, 6.1_

  - [x] 1.2 Crear `src/lib/packages/discount-engine.ts` — cálculo de precio con descuento
    - Implementar `calculatePackagePrice(pricePerSession, sessionCount, tiers)`:
      - Si `sessionCount === 1`: retornar `{ totalPrice: pricePerSession, discountPerSession: 0, totalDiscount: 0 }`
      - Si `sessionCount >= 2`: buscar tier donde `minSessions <= sessionCount <= maxSessions`
      - Si hay tier: `totalPrice = (pricePerSession - tier.discountPerSession) * sessionCount`
      - Si no hay tier: `totalPrice = pricePerSession * sessionCount`
      - Validar que `discountPerSession < pricePerSession` (si no, aplicar 0)
    - Exportar interfaz `DiscountTier` y tipo de retorno `PackagePriceResult`
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [x]* 1.3 Write property test for discount engine — Price calculation invariant
    - **Property 1: Price calculation invariant**
    - Generadores: `sessionCount` (1-100), `pricePerSession` (10000-500000), tiers array aleatorio
    - Verificar: totalPrice > 0, discountPerSession nunca excede pricePerSession, fórmula correcta según caso
    - **Validates: Requirements 1.2, 2.2, 2.3, 2.4, 2.5**

  - [x] 1.4 Crear `src/lib/packages/session-scheduler.ts` — cálculo de fechas de sesiones
    - Implementar `calculateSessionDates(startDate, startTime, endTime, sessionCount, frequency)`:
      - Retornar array de `ScheduledSession` con exactamente `sessionCount` elementos
      - Primera fecha = `startDate`
      - Cada fecha siguiente: +7 días (WEEKLY), +15 días (BIWEEKLY), +30 días (MONTHLY)
      - Todas las sesiones mantienen mismo `startTime` y `endTime`
    - Exportar tipos `Frequency`, `ScheduledSession`
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

  - [x]* 1.5 Write property test for session scheduler — Session scheduling interval invariant
    - **Property 3: Session scheduling interval invariant**
    - Generadores: startDate arbitrario, sessionCount (1-52), frequency enum
    - Verificar: exactamente N fechas, intervalos correctos, primera fecha = startDate, mismo startTime/endTime
    - **Validates: Requirements 3.2, 3.3, 3.4, 3.5**

  - [x] 1.6 Crear `src/lib/validations/packages.ts` — Zod schemas
    - `createPackageSchema`: patientId, serviceId, sessionCount (min 1), frequency enum, startDate, startTime, paymentMethod enum
    - `discountTierSchema`: minSessions (min 2), maxSessions (min 2), discountPerSession (min 0)
    - `bankDetailsSchema`: bankName, accountType, accountNumber, accountHolder, alias?, isActive
    - `calculatePriceSchema`: sessionCount, serviceId (para preview)
    - _Requirements: 1.4, 2.1, 3.1, 6.1_

  - [x] 1.7 Crear `src/lib/packages/payment-link-generator.ts` — integración Wompi Payment Links API
    - Implementar `createWompiPaymentLink({ packageId, amountInCents, customerName, customerEmail, description })`:
      - POST a `https://production.wompi.co/v1/payment_links` con Bearer token (`WOMPI_PRIVATE_KEY`)
      - Body: `name`, `description`, `single_use: true`, `collect_shipping: false`, amount en centavos, `currency: COP`
      - Reference: `PKG-{packageId}`
      - Customer: nombre y email
      - Retry con exponential backoff (max 3 intentos)
    - Retornar `{ linkId, linkUrl }` o throw error si falla después de retries
    - _Requirements: 4.1, 4.2, 8.1, 8.2, 8.3_

  - [x]* 1.8 Write property test for payment link reference — Reference format and amount conversion
    - **Property 5: Payment link reference format and amount conversion**
    - Generadores: packageId (cuid arbitrario), totalPrice (1000-10000000)
    - Verificar: reference === `PKG-{packageId}`, amount === totalPrice * 100
    - **Validates: Requirements 8.2, 8.3**

- [x] 2. Checkpoint — Schema y funciones puras implementadas
  - Ensure all tests pass, ask the user if questions arise.

- [x] 3. APIs de administración (Discount Tiers + Bank Details)
  - [x] 3.1 Crear `src/app/api/admin/discount-tiers/route.ts` — GET + POST
    - GET: Retornar todos los DiscountTier (ordenados por minSessions ASC)
    - POST: Validar con `discountTierSchema`, crear DiscountTier
    - Verificar sesión admin en ambos
    - _Requirements: 2.1_

  - [x] 3.2 Crear `src/app/api/admin/discount-tiers/[id]/route.ts` — PUT + DELETE
    - PUT: Validar con `discountTierSchema`, actualizar DiscountTier
    - DELETE: Eliminar DiscountTier por ID
    - Cambios solo afectan paquetes futuros (no retroactivo — snapshot en SessionPackage)
    - _Requirements: 2.1, 2.6_

  - [x] 3.3 Crear `src/app/api/admin/bank-details/route.ts` — GET + POST
    - GET: Retornar todos los BankDetails (activos e inactivos para admin)
    - POST: Validar con `bankDetailsSchema`, crear BankDetails
    - _Requirements: 6.1, 6.2_

  - [x] 3.4 Crear `src/app/api/admin/bank-details/[id]/route.ts` — PUT + DELETE
    - PUT: Validar con `bankDetailsSchema`, actualizar BankDetails (incluido toggle isActive)
    - DELETE: Eliminar BankDetails por ID
    - _Requirements: 6.1, 6.3_

  - [x] 3.5 Crear `src/app/api/admin/packages/route.ts` — GET (admin view todos los paquetes)
    - Retornar todos los SessionPackage con filtros opcionales: `status`, `professionalId`, `patientId`
    - Include: professional.name, patient.fullName, servicio
    - _Requirements: 9.2_

  - [x] 3.6 Crear `src/app/api/admin/packages/[id]/confirm/route.ts` — POST (confirmar pago bancario)
    - Verificar que el paquete está en PENDING_PAYMENT y paymentMethod = BANK_TRANSFER
    - Ejecutar flujo de confirmación (delegar a Package Confirmer)
    - _Requirements: 5.3, 7.1_

  - [x] 3.7 Crear `src/app/api/admin/packages/[id]/reject/route.ts` — POST (rechazar pago)
    - Verificar que el paquete está en PENDING_PAYMENT
    - Cambiar estado a CANCELLED
    - _Requirements: 5.5_

  - [x] 3.8 Crear `src/app/api/admin/packages/[id]/status/route.ts` — PUT (corrección admin)
    - Permitir cambiar estado a CONFIRMED, CANCELLED o PENDING_PAYMENT
    - Solo admin puede hacer esto (corrección de errores)
    - _Requirements: 9.5_

- [x] 4. Checkpoint — APIs admin completas
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Package Confirmer y extensión del webhook Wompi
  - [~] 5.1 Crear `src/lib/packages/package-confirmer.ts` — lógica de confirmación de paquete
    - Implementar `confirmPackage(packageId)`:
      - Transacción Prisma: actualizar SessionPackage → CONFIRMED + crear N Appointments (CONFIRMED)
      - Usar Session Scheduler para obtener fechas
      - Cada Appointment: patientId, professionalId, serviceId, date, startTime, endTime, status CONFIRMED, sessionPackageId
      - Fuera de transacción: crear eventos Google Calendar + Meet (fire-and-forget)
      - Si Calendar falla: log error, Appointment se mantiene sin googleEventId/meetLink
      - Rate limit Calendar: 1 request/segundo (Promise secuencial con delay 1s)
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [ ]* 5.2 Write property test for package confirmer — Appointment creation
    - **Property 4: Package confirmation appointment creation**
    - Generadores: sessionCount (1-20), scheduled dates array
    - Verificar: exactamente N appointments creadas, cada una con datos correctos del paquete
    - **Validates: Requirements 7.1, 7.2**

  - [~] 5.3 Extender `src/app/api/payments/webhook/route.ts` — routing PKG- references
    - Después de verificar firma WOMPI_EVENTS_SECRET:
      - Si reference empieza con `PKG-`: extraer packageId, delegar a `confirmPackage()`
      - Si reference NO empieza con `PKG-`: procesar como pago individual (lógica actual)
    - Si status !== APPROVED: mantener SessionPackage en PENDING_PAYMENT
    - Si PKG- reference no encontrada en DB: responder 200 (idempotencia) + log warning
    - _Requirements: 8.4, 8.5, 8.6_

  - [ ]* 5.4 Write property test for webhook routing — PKG- prefix routing
    - **Property 6: Webhook PKG- routing**
    - Generadores: reference strings arbitrarias (con y sin prefijo PKG-)
    - Verificar: solo PKG- references se rutean a package processing
    - **Validates: Requirements 8.4**

  - [ ]* 5.5 Write property test for webhook state preservation — Non-APPROVED preserves pending
    - **Property 7: Non-APPROVED webhook preserves pending state**
    - Generadores: transaction statuses (DECLINED, VOIDED, ERROR)
    - Verificar: SessionPackage permanece en PENDING_PAYMENT
    - **Validates: Requirements 8.6**

- [~] 6. Checkpoint — Confirmer y webhook funcionando
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. APIs del portal profesional (Packages)
  - [~] 7.1 Crear `src/app/api/professional/packages/route.ts` — GET + POST
    - GET: Listar SessionPackage del profesional autenticado, con búsqueda por nombre de paciente
    - POST: Flujo completo de creación:
      1. Validar con `createPackageSchema`
      2. Verificar paciente elegible (al menos 1 cita CONFIRMED/COMPLETED con este profesional)
      3. Obtener ProfessionalTariff para calcular precio
      4. Consultar DiscountTiers activos y calcular precio con `calculatePackagePrice()`
      5. Calcular fechas con `calculateSessionDates()`
      6. Crear SessionPackage en DB (PENDING_PAYMENT)
      7. Si paymentMethod = WOMPI: generar Payment Link via `createWompiPaymentLink()`
      8. Si paymentMethod = BANK_TRANSFER: consultar BankDetails activos
      9. Retornar paquete creado + link de pago o datos bancarios
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 3.1, 4.1, 4.3, 5.1_

  - [ ]* 7.2 Write property test for patient eligibility — Patient eligibility filter
    - **Property 2: Patient eligibility filter**
    - Generadores: patients con appointment histories aleatorias (diferentes status)
    - Verificar: solo pacientes con al menos 1 cita CONFIRMED/COMPLETED aparecen
    - **Validates: Requirements 1.3**

  - [~] 7.3 Crear `src/app/api/professional/packages/[id]/route.ts` — GET (detalle)
    - Retornar SessionPackage completo con: paciente, sesiones, descuento, citas programadas, estado
    - Verificar que el paquete pertenece al profesional autenticado
    - _Requirements: 9.3_

  - [~] 7.4 Crear `src/app/api/professional/packages/[id]/cancel/route.ts` — POST (cancelar)
    - Solo permitir si estado = PENDING_PAYMENT
    - Cambiar estado a CANCELLED
    - _Requirements: 9.6, 9.7_

  - [~] 7.5 Crear `src/app/api/professional/packages/calculate/route.ts` — POST (preview precio)
    - Recibir sessionCount + serviceId
    - Consultar ProfessionalTariff y DiscountTiers activos
    - Retornar preview: pricePerSession, discountPerSession, totalPrice, totalDiscount
    - _Requirements: 1.2, 2.3, 2.4_

- [~] 8. Checkpoint — APIs profesional packages completas
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 9. UI Admin — Configuración de descuentos y datos bancarios
  - [~] 9.1 Crear `src/components/admin/packages/discount-tier-form.tsx`
    - React Hook Form + Zod: minSessions, maxSessions, discountPerSession (en COP)
    - Modo crear y editar (recibe tier opcional como prop)
    - _Requirements: 2.1_

  - [~] 9.2 Crear `src/components/admin/packages/discount-tier-list.tsx`
    - Tabla con tramos: rango de sesiones, descuento por sesión, acciones (editar, eliminar)
    - Ordenado por minSessions ASC
    - _Requirements: 2.1_

  - [~] 9.3 Crear `src/app/(admin)/admin/configuracion/descuentos/page.tsx`
    - Renderiza DiscountTierList + DiscountTierForm (modal o inline)
    - _Requirements: 2.1_

  - [~] 9.4 Crear `src/components/admin/packages/bank-details-form.tsx`
    - React Hook Form + Zod: bankName, accountType, accountNumber, accountHolder, alias, isActive toggle
    - _Requirements: 6.1_

  - [~] 9.5 Crear `src/components/admin/packages/bank-details-list.tsx`
    - Tabla con datos bancarios: banco, tipo, número, titular, alias, estado (activo/inactivo), acciones
    - _Requirements: 6.1, 6.3_

  - [~] 9.6 Crear `src/app/(admin)/admin/configuracion/datos-bancarios/page.tsx`
    - Renderiza BankDetailsList + BankDetailsForm
    - _Requirements: 6.1_

- [ ] 10. UI Admin — Gestión de paquetes
  - [~] 10.1 Crear `src/components/admin/packages/admin-package-list.tsx`
    - Tabla con todos los paquetes: profesional, paciente, sesiones, precio, estado, método de pago
    - Filtros: por estado, profesional, paciente
    - _Requirements: 9.2_

  - [~] 10.2 Crear `src/components/admin/packages/package-status-actions.tsx`
    - Botones contextuales: Confirmar pago (solo PENDING_PAYMENT + BANK_TRANSFER), Rechazar, Cambiar estado
    - Dialog de confirmación para cada acción
    - _Requirements: 5.3, 5.4, 5.5, 9.5_

  - [~] 10.3 Crear `src/app/(admin)/admin/paquetes/page.tsx`
    - Renderiza AdminPackageList + PackageStatusActions
    - _Requirements: 9.2, 5.4_

  - [~] 10.4 Crear `src/app/(admin)/admin/paquetes/pendientes/page.tsx`
    - Vista filtrada: solo paquetes PENDING_PAYMENT con paymentMethod BANK_TRANSFER
    - _Requirements: 5.4_

- [~] 11. Checkpoint — UI admin completa
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. UI Professional — Wizard de creación de paquetes
  - [~] 12.1 Crear `src/components/professional/packages/package-wizard.tsx`
    - Wizard container multi-step (5 pasos) con estado controlado
    - Navegación entre pasos (anterior/siguiente), validación por paso
    - _Requirements: 1.1, 3.6_

  - [~] 12.2 Crear `src/components/professional/packages/step-patient-select.tsx`
    - Paso 1: Selector de paciente elegible (búsqueda por nombre)
    - Fetch pacientes con al menos 1 cita CONFIRMED/COMPLETED con este profesional
    - _Requirements: 1.1, 1.3_

  - [~] 12.3 Crear `src/components/professional/packages/step-sessions-config.tsx`
    - Paso 2: Input de cantidad de sesiones (min 1) + preview de precio en tiempo real
    - Fetch a `/api/professional/packages/calculate` al cambiar sessionCount
    - Mostrar: precio por sesión, descuento aplicado, total
    - _Requirements: 1.2, 1.4, 2.3_

  - [~] 12.4 Crear `src/components/professional/packages/step-schedule.tsx`
    - Paso 3: DatePicker para fecha de inicio, TimePicker para hora, selector de frecuencia
    - Preview de todas las fechas calculadas (client-side con misma lógica del scheduler)
    - _Requirements: 3.1, 3.6_

  - [~] 12.5 Crear `src/components/professional/packages/step-payment-method.tsx`
    - Paso 4: Radio buttons — Wompi Payment Link / Transferencia bancaria
    - Descripción breve de cada método
    - _Requirements: 4.1, 5.1_

  - [~] 12.6 Crear `src/components/professional/packages/step-summary.tsx`
    - Paso 5: Resumen completo — paciente, sesiones, fechas, precio, método de pago
    - Botón "Crear Paquete" que hace POST a `/api/professional/packages`
    - _Requirements: 3.6, 4.3, 5.1_

  - [~] 12.7 Crear `src/components/professional/packages/payment-link-display.tsx`
    - Componente post-creación: muestra link de Wompi para copiar/compartir
    - Botón "Copiar link" + botón "Abrir en nueva pestaña"
    - _Requirements: 4.3_

  - [~] 12.8 Crear `src/app/(professional)/profesional/paquetes/nuevo/page.tsx`
    - Server component que renderiza PackageWizard
    - _Requirements: 1.1_

- [ ] 13. UI Professional — Lista y detalle de paquetes
  - [~] 13.1 Crear `src/components/professional/packages/package-list.tsx`
    - Tabla de paquetes del profesional: paciente, sesiones, precio, estado, fecha creación
    - Búsqueda por nombre de paciente
    - Badge de estado con colores (PENDING_PAYMENT amarillo, CONFIRMED verde, CANCELLED rojo)
    - _Requirements: 9.1_

  - [~] 13.2 Crear `src/components/professional/packages/package-detail.tsx`
    - Vista completa del paquete: datos del paciente, sesiones, precio con desglose de descuento, frecuencia, método de pago
    - Lista de citas programadas con fecha, hora y link Meet (si existe)
    - Botón "Cancelar paquete" (solo si PENDING_PAYMENT)
    - Re-mostrar link de Wompi si paymentMethod = WOMPI y status = PENDING_PAYMENT
    - _Requirements: 9.3, 9.4, 9.6_

  - [~] 13.3 Crear `src/app/(professional)/profesional/paquetes/page.tsx`
    - Renderiza PackageList + botón "Nuevo Paquete" (link a /paquetes/nuevo)
    - _Requirements: 9.1_

  - [~] 13.4 Crear `src/app/(professional)/profesional/paquetes/[id]/page.tsx`
    - Server component que renderiza PackageDetail
    - _Requirements: 9.3_

- [~] 14. Checkpoint — UI profesional completa
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Email de confirmación y navegación
  - [~] 15.1 Crear `src/lib/emails/package-confirmation.ts` — template email confirmación de paquete
    - Template con Resend: resumen del paquete, lista de sesiones con fecha/hora, links Meet
    - Función `sendPackageConfirmationEmail(packageData)` que envía al email del paciente
    - _Requirements: 7.6_

  - [~] 15.2 Integrar envío de email en Package Confirmer
    - Después de crear todas las citas exitosamente, llamar `sendPackageConfirmationEmail()`
    - Si falla email: log error, no bloquear confirmación (fire-and-forget)
    - _Requirements: 7.6_

  - [~] 15.3 Actualizar sidebar profesional — agregar link a Paquetes
    - Modificar `src/components/layouts/professional-sidebar.tsx`:
      - Agregar item "Paquetes" con icono `Package` de Lucide, link a `/profesional/paquetes`
    - _Requirements: 1.1_

  - [~] 15.4 Actualizar sidebar admin — agregar links a configuración de paquetes
    - Modificar `src/app/(admin)/admin/layout.tsx` o sidebar:
      - Agregar sub-items: "Paquetes" → `/admin/paquetes`, "Descuentos" → `/admin/configuracion/descuentos`, "Datos bancarios" → `/admin/configuracion/datos-bancarios`
    - _Requirements: 2.1, 5.4, 6.1_

- [~] 16. Checkpoint final — Feature completo end-to-end
  - Ensure all tests pass, ask the user if questions arise.
  - Verificar flujo completo: profesional crea paquete → paciente paga → webhook confirma → citas creadas
  - Verificar flujo bancario: profesional crea paquete → admin confirma → citas creadas
  - Verificar que webhook Wompi sigue funcionando para pagos individuales (no regresión)
  - Verificar que admin puede gestionar descuentos y datos bancarios
  - Verificar cancelación de paquetes pendientes por el profesional

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document (7 properties)
- Unit tests validate specific examples and edge cases
- El webhook existente se EXTIENDE (no se reemplaza) — detectar prefijo `PKG-` para rutear a package confirmer
- Variables de entorno requeridas (ya existentes): `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET`
- fast-check es la librería PBT elegida (TypeScript, shrinking automático, min 100 iteraciones)
- Pricing se guarda como snapshot en SessionPackage — cambios futuros en DiscountTier no afectan paquetes existentes
- Google Calendar events se crean fuera de transacción (fire-and-forget) con rate limit 1 req/s
- Resend se usa para email de confirmación al paciente (consistente con infraestructura existente)

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.4", "1.6"] },
    { "id": 2, "tasks": ["1.3", "1.5", "1.7"] },
    { "id": 3, "tasks": ["1.8", "3.1", "3.3"] },
    { "id": 4, "tasks": ["3.2", "3.4", "3.5"] },
    { "id": 5, "tasks": ["3.6", "3.7", "3.8"] },
    { "id": 6, "tasks": ["5.1", "7.5"] },
    { "id": 7, "tasks": ["5.2", "5.3"] },
    { "id": 8, "tasks": ["5.4", "5.5", "7.1"] },
    { "id": 9, "tasks": ["7.2", "7.3", "7.4"] },
    { "id": 10, "tasks": ["9.1", "9.4", "12.1"] },
    { "id": 11, "tasks": ["9.2", "9.5", "12.2", "12.5"] },
    { "id": 12, "tasks": ["9.3", "9.6", "12.3", "12.4"] },
    { "id": 13, "tasks": ["10.1", "10.2", "12.6", "12.7"] },
    { "id": 14, "tasks": ["10.3", "10.4", "12.8"] },
    { "id": 15, "tasks": ["13.1", "13.2"] },
    { "id": 16, "tasks": ["13.3", "13.4"] },
    { "id": 17, "tasks": ["15.1", "15.3", "15.4"] },
    { "id": 18, "tasks": ["15.2"] }
  ]
}
```
