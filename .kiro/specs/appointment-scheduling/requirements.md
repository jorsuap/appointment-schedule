# Documento de Requisitos — Infraestructura Técnica

## Introducción

Fase técnica inicial del sistema de agendamiento de citas de psicología. Este spec cubre EXCLUSIVAMENTE la configuración de infraestructura, integración de servicios externos y scaffolding del proyecto. No incluye lógica de negocio — solo asegura que toda la base técnica funcione end-to-end antes de desarrollar features.

Stack: Next.js 15 (App Router) monolito full-stack, Vercel Free, Neon PostgreSQL, Prisma ORM, NextAuth.js v5, shadcn/ui + Tailwind, React Hook Form + Zod, TanStack Query, Zustand, Resend, Wompi.

## Glosario

- **Sistema**: La aplicación Next.js 15 en su totalidad (App Router + API Routes)
- **Proyecto**: Repositorio monorepo en GitHub con front y back unificados
- **Deploy**: Despliegue automático desde GitHub a Vercel
- **Esquema_DB**: Definición de tablas y relaciones en Prisma Schema
- **Migración**: Archivo de Prisma Migrate que aplica cambios al esquema de Neon PostgreSQL
- **Sesión**: Token JWT generado por NextAuth.js que identifica a un usuario autenticado
- **Webhook_Wompi**: Endpoint que recibe notificaciones de eventos de pago desde Wompi
- **Template_Email**: Plantilla React renderizada por Resend para enviar correos transaccionales

## Requisitos

### Requisito 1: Scaffolding del proyecto Next.js

**Historia de usuario:** Como desarrollador, quiero tener el proyecto Next.js 15 configurado con App Router, Tailwind CSS, TypeScript y la estructura de carpetas definida, para comenzar el desarrollo sobre una base sólida.

#### Criterios de Aceptación

1. THE Proyecto SHALL usar Next.js 15 con App Router, TypeScript strict mode y Tailwind CSS configurados
2. THE Proyecto SHALL tener la siguiente estructura de carpetas: `src/app/` (rutas), `src/components/` (componentes), `src/lib/` (utilidades y configuración), `src/server/` (lógica de servidor y API)
3. THE Proyecto SHALL tener configurado ESLint con las reglas de Next.js y Prettier para formateo de código
4. THE Proyecto SHALL incluir un archivo `.env.example` documentando todas las variables de entorno requeridas sin valores reales
5. THE Proyecto SHALL compilar sin errores ejecutando `npm run build`

---

### Requisito 2: Integración de shadcn/ui y sistema de diseño base

**Historia de usuario:** Como desarrollador, quiero tener shadcn/ui instalado con los componentes base configurados, para no crear componentes UI desde cero.

#### Criterios de Aceptación

1. THE Proyecto SHALL tener shadcn/ui inicializado con Tailwind CSS y la configuración de tema base (colores, tipografía, espaciado)
2. THE Proyecto SHALL incluir los componentes base instalados: Button, Card, Input, Label, Dialog, Dropdown Menu, Table, Toast, Form, Calendar, Select
3. THE Sistema SHALL renderizar una página de inicio (`/`) con un layout base que incluya header y footer usando componentes de shadcn/ui
4. THE Sistema SHALL tener configurado un layout de administración (`/admin`) separado del layout público con navegación lateral

---

### Requisito 3: Conexión a base de datos con Prisma y Neon

**Historia de usuario:** Como desarrollador, quiero tener Prisma ORM conectado a Neon PostgreSQL con el esquema base definido, para poder operar contra la base de datos desde las API Routes.

#### Criterios de Aceptación

1. THE Proyecto SHALL tener Prisma ORM configurado con el provider `postgresql` apuntando a Neon mediante la variable de entorno `DATABASE_URL`
2. THE Esquema_DB SHALL incluir las tablas base del dominio: `User`, `Professional`, `ConsultationType`, `Availability`, `Appointment`, `Payment`
3. THE Proyecto SHALL ejecutar `npx prisma migrate dev` sin errores creando todas las tablas en Neon
4. THE Proyecto SHALL incluir un archivo seed (`prisma/seed.ts`) que inserte datos de prueba mínimos para verificar la conexión
5. WHEN se ejecuta `npx prisma db seed`, THE Sistema SHALL insertar los datos de prueba sin errores y estos SHALL ser consultables vía Prisma Client

---

### Requisito 4: Autenticación con NextAuth.js v5

**Historia de usuario:** Como desarrollador, quiero tener NextAuth.js v5 configurado con provider de credenciales y protección de rutas admin, para asegurar el acceso al panel de administración.

#### Criterios de Aceptación

1. THE Sistema SHALL tener NextAuth.js v5 (Auth.js) configurado con Prisma Adapter y proveedor de credenciales (email + password)
2. THE Sistema SHALL exponer las rutas de autenticación en `/api/auth/*` funcionando correctamente (sign-in, sign-out, session)
3. WHEN un usuario no autenticado accede a cualquier ruta bajo `/admin/*`, THE Sistema SHALL redirigir automáticamente a `/auth/login`
4. WHEN un usuario se autentica exitosamente, THE Sistema SHALL generar un JWT con el rol del usuario y redirigir al dashboard de admin
5. THE Sistema SHALL incluir un middleware de Next.js que proteja todas las rutas `/admin/*` verificando la sesión válida

---

### Requisito 5: Integración con Resend para envío de emails

**Historia de usuario:** Como desarrollador, quiero tener Resend configurado y verificado con un template de prueba, para confirmar que el envío de correos funciona end-to-end.

#### Criterios de Aceptación

1. THE Proyecto SHALL tener el SDK de Resend instalado y configurado con la API key en variable de entorno `RESEND_API_KEY`
2. THE Sistema SHALL exponer una API Route de prueba (`/api/test/email`) que envíe un correo de prueba a una dirección proporcionada
3. WHEN se invoca la API Route de prueba con un email válido, THE Sistema SHALL enviar un correo usando un template React básico y retornar status 200 con el ID del mensaje
4. IF la API key de Resend es inválida o el envío falla, THEN THE Sistema SHALL retornar status 500 con un mensaje de error descriptivo

---

### Requisito 6: Integración con Wompi (modo sandbox)

**Historia de usuario:** Como desarrollador, quiero tener Wompi integrado en modo sandbox con un endpoint de webhook funcional, para verificar que el flujo de pagos funciona end-to-end.

#### Criterios de Aceptación

1. THE Proyecto SHALL tener configuradas las variables de entorno de Wompi sandbox: `WOMPI_PUBLIC_KEY`, `WOMPI_PRIVATE_KEY`, `WOMPI_EVENTS_SECRET`, `WOMPI_API_URL`
2. THE Sistema SHALL exponer una API Route (`/api/payments/webhook`) que reciba y valide eventos de Wompi verificando la firma del webhook
3. THE Sistema SHALL exponer una API Route (`/api/payments/create`) que genere un link de pago o una sesión de checkout de Wompi con un monto de prueba
4. WHEN Wompi envía un evento de pago aprobado al webhook, THE Sistema SHALL registrar el evento en logs y retornar status 200
5. IF la firma del webhook no es válida, THEN THE Sistema SHALL rechazar la request con status 401 y registrar el intento en logs

---

### Requisito 7: Deploy automático en Vercel

**Historia de usuario:** Como desarrollador, quiero que cada push a la rama `main` se despliegue automáticamente en Vercel, para tener un flujo de CI/CD sin configuración manual.

#### Criterios de Aceptación

1. THE Proyecto SHALL estar conectado a Vercel vinculado al repositorio de GitHub
2. WHEN se hace push a la rama `main`, Vercel SHALL ejecutar build y deploy automáticamente
3. WHEN se hace push a cualquier rama que no sea `main`, Vercel SHALL generar un preview deployment con URL única
4. THE Proyecto SHALL tener todas las variables de entorno configuradas en Vercel (DATABASE_URL, NEXTAUTH_SECRET, RESEND_API_KEY, claves de Wompi)
5. THE Sistema desplegado en Vercel SHALL responder correctamente en la URL de producción sin errores 500 en la página de inicio

---

### Requisito 8: Configuración de React Hook Form + Zod

**Historia de usuario:** Como desarrollador, quiero tener React Hook Form con Zod configurados y un formulario de ejemplo funcional, para validar que la integración de formularios funciona correctamente.

#### Criterios de Aceptación

1. THE Proyecto SHALL tener instalados `react-hook-form`, `@hookform/resolvers` y `zod` como dependencias
2. THE Proyecto SHALL incluir un directorio `src/lib/validations/` con al menos un schema de Zod de ejemplo
3. THE Sistema SHALL renderizar un formulario de ejemplo en `/admin` que use React Hook Form con resolver de Zod y componentes Form de shadcn/ui
4. WHEN el usuario envía el formulario con datos inválidos, THE Sistema SHALL mostrar mensajes de error inline sin recargar la página
5. WHEN el usuario envía el formulario con datos válidos, THE Sistema SHALL procesar el envío y mostrar un toast de confirmación

---

### Requisito 9: Configuración de TanStack Query + Zustand

**Historia de usuario:** Como desarrollador, quiero tener TanStack Query para server state y Zustand para client state configurados con un ejemplo funcional, para validar el patrón de manejo de estado.

#### Criterios de Aceptación

1. THE Proyecto SHALL tener instalados `@tanstack/react-query` y `zustand` como dependencias
2. THE Sistema SHALL incluir un QueryClientProvider en el layout raíz que envuelva toda la aplicación
3. THE Proyecto SHALL incluir un ejemplo funcional de query con TanStack Query que consulte una API Route y muestre datos en un componente
4. THE Proyecto SHALL incluir un store de Zustand de ejemplo en `src/stores/` con al menos un estado y una acción
5. THE Sistema SHALL renderizar datos obtenidos vía TanStack Query mostrando estados de loading, error y success correctamente

---

### Requisito 10: Healthcheck y verificación end-to-end

**Historia de usuario:** Como desarrollador, quiero un endpoint de healthcheck que verifique la conexión a todos los servicios externos, para confirmar que toda la infraestructura está operativa.

#### Criterios de Aceptación

1. THE Sistema SHALL exponer una API Route (`/api/health`) que verifique la conectividad con: Neon PostgreSQL (query simple), Resend (validación de API key) y configuración de Wompi (claves presentes)
2. WHEN todos los servicios responden correctamente, THE API Route SHALL retornar status 200 con un JSON indicando el estado de cada servicio como "ok"
3. IF algún servicio no responde o falla la verificación, THEN THE API Route SHALL retornar status 503 con el detalle del servicio que falló
4. THE Sistema desplegado en Vercel SHALL responder status 200 en `/api/health` confirmando que todos los servicios están conectados en producción
