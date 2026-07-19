# Próxima Feature: Portal del Profesional + OAuth Google Calendar

## Resumen

Crear un portal separado para profesionales con login propio, gestión de perfil,
disponibilidad con integración OAuth de Google Calendar, y vista de ingresos.

## Roles

### ADMIN (existente)

- Dashboard general
- Gestionar pacientes
- Calendario global (solo lectura)
- Profesionales (crear, ver perfil, ver disponibilidad — solo lectura)
- Métricas generales
- Contenido landing
- Servicios CRUD

### PROFESSIONAL (nuevo)

- Mi perfil (editar datos personales, especialidad, traits, foto)
- Mi calendario (conectar Google Calendar vía OAuth + gestionar disponibilidad)
- Mis ingresos (resumen mensual, filtros, comisión, neto)
- Mis pacientes (fichas de sus pacientes, notas de progreso)

## Implementación Técnica

### 1. OAuth Google Calendar

- Crear credenciales OAuth 2.0 en Google Cloud (tipo "Aplicación web")
- Agregar campo `googleRefreshToken` al modelo Professional
- Flow: Profesional click "Conectar Google Calendar" → OAuth consent → guardar refresh token
- Con el refresh token: crear eventos con asistentes + Meet automáticamente

### 2. Login del Profesional

- Al crear profesional desde admin, se genera una contraseña temporal
- El profesional se logea en `/auth/login` con su Gmail + contraseña
- Middleware redirige según rol: ADMIN → /admin, PROFESSIONAL → /profesional

### 3. Rutas del Portal Profesional

```
/profesional                    → Dashboard del profesional
/profesional/perfil             → Editar perfil
/profesional/calendario         → Disponibilidad + conectar Google
/profesional/ingresos           → Métricas de ingresos
/profesional/pacientes          → Lista de sus pacientes
/profesional/pacientes/[id]     → Ficha del paciente
```

### 4. Schema Changes

- Agregar `googleRefreshToken` a Professional
- Agregar `password` o vincular con tabla User para login
- Agregar relación User ↔ Professional

## Prioridad

Alta — necesario para que el flujo de Google Meet funcione end-to-end.
