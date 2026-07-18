# Appointment Schedule

Sistema de agendamiento de citas de psicología y talleres.

## Stack Técnico

- **Framework**: Next.js 15 (App Router)
- **Lenguaje**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + shadcn/ui
- **Base de datos**: PostgreSQL (Neon) + Prisma ORM
- **Autenticación**: NextAuth.js v5
- **Pagos**: Wompi (PSE + tarjetas)
- **Emails**: Resend
- **Hosting**: Vercel
- **State**: TanStack Query + Zustand

## Requisitos

- Node.js 20+
- npm 10+

## Instalación

```bash
npm install
cp .env.example .env.local
# Llena las variables en .env.local
```

## Desarrollo

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Scripts disponibles

| Comando                | Descripción                |
| ---------------------- | -------------------------- |
| `npm run dev`          | Servidor de desarrollo     |
| `npm run build`        | Build de producción        |
| `npm run start`        | Servir build de producción |
| `npm run lint`         | ESLint                     |
| `npm run format`       | Formatear con Prettier     |
| `npm run format:check` | Verificar formato          |
