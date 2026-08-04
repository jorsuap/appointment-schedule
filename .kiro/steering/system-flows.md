---
inclusion: auto
---

# Flujos del Sistema — conAlma

## Flujo de Agendamiento (Paciente → Pago → Confirmación)

```
Landing → Selección Servicio → Datos Personales → Evaluación Emocional
→ Contacto Emergencia → Selección Profesional → Horario (Calendar)
→ Confirmar + Pagar → Wompi Checkout → Webhook → Confirmación
```

### Post-pago (Webhook Wompi)

1. Wompi envía `transaction.updated: APPROVED`
2. Verificar firma + confirmar con Wompi API
3. Actualizar Payment → APPROVED
4. Actualizar Appointment → CONFIRMED
5. Si profesional tiene OAuth conectado:
   - Decrypt refresh token → refresh access token
   - Crear evento en Google Calendar con Meet link
   - Guardar meetLink + googleEventId en Appointment
6. Si NO tiene OAuth: confirmar cita sin evento (sin Meet)
7. Enviar email confirmación al paciente (con Meet link si existe)
8. Enviar email notificación al profesional

### Cálculo de Disponibilidad

```
GET /api/availability?professionalId=X&serviceId=Y

1. Duración del servicio (durationMin)
2. Horarios recurrentes del profesional (Availability[])
3. Fechas bloqueadas (BlockedDate[])
4. Citas existentes CONFIRMED/PENDING_PAYMENT
5. Generar slots libres para próximos 30 días
```

## Flujo de Autenticación

```
/auth/login (ambos roles)
  │
  ├── signIn('credentials', { email, password, redirect: false })
  │
  ├── JWT callback: role, professionalId, mustChangePassword
  │
  ├── Si ADMIN → redirect /admin
  └── Si PROFESSIONAL → redirect /profesional
       │
       └── Si mustChangePassword → Modal obligatorio → POST /api/professional/change-password
            └── DB: mustChangePassword = false → reload → modal no aparece
```

## Flujo de Creación de Profesional

```
Admin crea profesional (/admin/profesionales)
  │
  ├── Genera contraseña temporal (crypto.randomBytes)
  ├── Crea User (PROFESSIONAL, mustChangePassword=true, hash)
  ├── Crea Professional (userId linked)
  ├── Crea tariffs + services
  └── Muestra contraseña UNA VEZ en modal
       │
       └── Admin comparte por canal seguro (WhatsApp/llamada)
```

## Flujo OAuth Google Calendar

```
Profesional (/profesional/disponibilidad)
  │
  ├── Click "Conectar Google Calendar"
  ├── GET /api/professional/google-calendar/connect → Redirect Google consent
  ├── Profesional autoriza permisos (calendar.events)
  ├── Google redirect → GET /callback?code=XXX&state=YYY
  ├── Verify state (HMAC) → Exchange code → Get tokens
  ├── Encrypt refresh_token (AES-256-GCM) → Save in DB
  └── Redirect /profesional/disponibilidad?connected=true
```

## Flujo de Ingresos (Profesional)

```
Monto cobrado (tarifa del servicio)
  - Comisión plataforma = monto × commissionRate / 100
  - Neto profesional = monto - comisión

Solo cuenta citas con status CONFIRMED o COMPLETED.
Filtrable por rango de fechas.
```

## Modelo de Datos (Relaciones)

```
User (ADMIN/PROFESSIONAL)
  │
Professional ──┬── ProfessionalService ── Service
               ├── ProfessionalTariff (price + commission %)
               ├── Availability (horarios recurrentes)
               ├── BlockedDate (fechas no disponibles)
               └── Appointment ──┬── Patient (unique por email)
                                 ├── Payment (Wompi)
                                 └── ProgressNote (authorId = professionalId)

SiteContent (landing administrable)
```
