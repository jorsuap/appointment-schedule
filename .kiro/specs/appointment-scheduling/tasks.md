# Tareas de Implementación — Infraestructura Técnica

## Tarea 1: Scaffolding del proyecto Next.js 15

**Requisito**: Requisito 1 (Scaffolding del proyecto Next.js)

### Subtareas

1. [x] Inicializar proyecto Next.js 15 con `create-next-app` usando App Router, TypeScript y Tailwind CSS
2. [x] Crear estructura de carpetas: `src/app/`, `src/components/`, `src/lib/`, `src/server/`, `src/stores/`, `src/types/`
3. [x] Configurar ESLint con reglas de Next.js y Prettier para formateo
4. [x] Crear `.env.example` con todas las variables de entorno documentadas (sin valores reales)
5. [x] Configurar path aliases en `tsconfig.json` (`@/` apuntando a `src/`)
6. [x] Verificar que `npm run build` compila sin errores
7. [ ] Crear commit inicial con la estructura base

---

## Tarea 2: Configuración de shadcn/ui y layouts base

**Requisito**: Requisito 2 (Integración de shadcn/ui y sistema de diseño base)

### Subtareas

1. [ ] Inicializar shadcn/ui con `npx shadcn@latest init` (estilo default, Tailwind CSS)
2. [ ] Instalar componentes base: Button, Card, Input, Label, Dialog, Dropdown Menu, Table, Toast, Form, Calendar, Select
3. [ ] Crear layout público en `src/app/(public)/layout.tsx` con Header y Footer
4. [ ] Crear layout admin en `src/app/(admin)/admin/layout.tsx` con Sidebar y navegación
5. [ ] Crear página de inicio (`/`) con contenido placeholder usando componentes shadcn/ui
6. [ ] Crear página de dashboard admin (`/admin`) con contenido placeholder
7. [ ] Verificar que ambos layouts renderizan correctamente en desarrollo

---

## Tarea 3: Conexión a Neon PostgreSQL con Prisma

**Requisito**: Requisito 3 (Conexión a base de datos con Prisma y Neon)

### Subtareas

1. [ ] Instalar Prisma (`prisma` y `@prisma/client`) como dependencias
2. [ ] Inicializar Prisma con `npx prisma init` y configurar provider postgresql
3. [ ] Definir el esquema completo en `prisma/schema.prisma` (User, Professional, ConsultationType, Availability, Appointment, Payment)
4. [ ] Crear el archivo singleton `src/lib/prisma.ts` para Prisma Client
5. [ ] Configurar `DATABASE_URL` en `.env.local` apuntando a Neon
6. [ ] Ejecutar `npx prisma migrate dev --name init` para crear las tablas
7. [ ] Crear archivo seed `prisma/seed.ts` con datos de prueba (1 admin, 2 profesionales, 2 tipos de consulta)
8. [ ] Configurar script `prisma:seed` en `package.json` y verificar que el seed se ejecuta sin errores

---

## Tarea 4: Autenticación con NextAuth.js v5

**Requisito**: Requisito 4 (Autenticación con NextAuth.js v5)

### Subtareas

1. [ ] Instalar `next-auth@beta` (v5) y `@auth/prisma-adapter`
2. [ ] Crear configuración de NextAuth en `src/lib/auth.ts` con Credentials provider y Prisma Adapter
3. [ ] Crear route handler en `src/app/api/auth/[...nextauth]/route.ts`
4. [ ] Instalar `bcrypt` (o `bcryptjs`) para hash de contraseñas
5. [ ] Crear middleware en `src/middleware.ts` que proteja rutas `/admin/*`
6. [ ] Crear página de login en `src/app/auth/login/page.tsx` con formulario de email + password
7. [ ] Incluir usuario admin en el seed con contraseña hasheada para testing
8. [ ] Verificar flujo completo: login → redirect a /admin → logout → redirect a /auth/login

---

## Tarea 5: Integración con Resend

**Requisito**: Requisito 5 (Integración con Resend para envío de emails)

### Subtareas

1. [ ] Instalar `resend` y `@react-email/components` como dependencias
2. [ ] Crear cliente de Resend en `src/lib/resend.ts` configurado con API key
3. [ ] Crear template de email de prueba en `src/lib/emails/test-email.tsx` usando React Email components
4. [ ] Crear API Route `/api/test/email` que reciba un email y envíe el template de prueba
5. [ ] Proteger la API Route de test para que solo sea accesible en desarrollo o por admin autenticado
6. [ ] Verificar envío exitoso a un email real desde desarrollo local

---

## Tarea 6: Integración con Wompi (sandbox)

**Requisito**: Requisito 6 (Integración con Wompi modo sandbox)

### Subtareas

1. [ ] Crear cuenta en Wompi sandbox y obtener claves de prueba
2. [ ] Crear utilidades de Wompi en `src/lib/wompi.ts` (validación de firma, helpers)
3. [ ] Crear API Route `/api/payments/create` que genere un link/sesión de pago con monto de prueba
4. [ ] Crear API Route `/api/payments/webhook` que reciba eventos POST de Wompi
5. [ ] Implementar validación de firma SHA256 del webhook con `WOMPI_EVENTS_SECRET`
6. [ ] Crear una página de test `/test/payment` (solo en desarrollo) que muestre el widget de Wompi
7. [ ] Verificar flujo completo en sandbox: crear pago → pagar con tarjeta test → recibir webhook

---

## Tarea 7: Deploy en Vercel

**Requisito**: Requisito 7 (Deploy automático en Vercel)

### Subtareas

1. [ ] Conectar repositorio de GitHub con Vercel (import project)
2. [ ] Configurar variables de entorno en Vercel (DATABASE_URL, NEXTAUTH_SECRET, RESEND_API_KEY, claves Wompi, NEXTAUTH_URL)
3. [ ] Verificar que el build se ejecuta correctamente en Vercel
4. [ ] Verificar que la URL de producción responde sin errores 500
5. [ ] Verificar que un push a una rama genera un preview deployment
6. [ ] Verificar que un push a `main` genera un deployment de producción

---

## Tarea 8: Configuración de React Hook Form + Zod

**Requisito**: Requisito 8 (Configuración de React Hook Form + Zod)

### Subtareas

1. [ ] Instalar `react-hook-form`, `@hookform/resolvers` y `zod`
2. [ ] Crear schema de validación de ejemplo en `src/lib/validations/example.ts`
3. [ ] Crear formulario de ejemplo en el dashboard admin usando Form de shadcn/ui + React Hook Form + Zod
4. [ ] Verificar validación inline: errores se muestran al enviar con datos inválidos
5. [ ] Verificar submit exitoso: toast de confirmación al enviar datos válidos

---

## Tarea 9: Configuración de TanStack Query + Zustand

**Requisito**: Requisito 9 (Configuración de TanStack Query + Zustand)

### Subtareas

1. [ ] Instalar `@tanstack/react-query` y `@tanstack/react-query-devtools`
2. [ ] Crear QueryClientProvider en un componente `src/components/providers.tsx` y wrappear el root layout
3. [ ] Instalar `zustand`
4. [ ] Crear store de ejemplo en `src/stores/example-store.ts` (ej: sidebar open/close state)
5. [ ] Crear un componente de ejemplo que use TanStack Query para consultar `/api/health` y muestre loading/error/success
6. [ ] Verificar que React Query Devtools se muestra en desarrollo

---

## Tarea 10: Healthcheck endpoint

**Requisito**: Requisito 10 (Healthcheck y verificación end-to-end)

### Subtareas

1. [ ] Crear API Route `/api/health` que verifique conectividad a Neon (SELECT 1)
2. [ ] Agregar verificación de configuración de Resend (API key presente y válida)
3. [ ] Agregar verificación de configuración de Wompi (claves presentes)
4. [ ] Retornar JSON con estado de cada servicio y status 200 (todo OK) o 503 (fallo parcial)
5. [ ] Verificar que el healthcheck responde correctamente en Vercel producción
