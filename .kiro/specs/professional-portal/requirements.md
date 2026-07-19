# Documento de Requisitos — Portal del Profesional + OAuth Google Calendar

## Introducción

Crear un portal exclusivo para profesionales con acceso independiente al panel de administración. Cada profesional podrá gestionar su perfil, disponibilidad horaria, conectar su Google Calendar (OAuth 2.0) para generar eventos con Google Meet automáticamente, ver su calendario de citas, gestionar fichas de sus pacientes y consultar sus ingresos con detalle de comisiones.

## Glosario

- **Profesional**: Psicóloga registrada en la plataforma que ofrece acompañamiento
- **Admin**: Propietario/a de conAlma que gestiona la plataforma globalmente
- **OAuth**: Protocolo de autorización que permite al profesional dar acceso a su Google Calendar sin compartir su contraseña
- **Refresh Token**: Token almacenado que permite renovar el acceso a Google Calendar sin que el profesional vuelva a iniciar sesión
- **Meet Link**: URL de videollamada de Google Meet generada automáticamente al crear un evento

## Estructura del Portal del Profesional

| #   | Módulo         | Función                                                                     |
| --- | -------------- | --------------------------------------------------------------------------- |
| 1   | Dashboard      | Stats personales (citas hoy, próximas, ingresos del mes)                    |
| 2   | Perfil         | Editar datos (descripción, traits, foto) — nombre/email/tarifa solo lectura |
| 3   | Disponibilidad | Bloques horarios + fechas bloqueadas + conectar Google Calendar             |
| 4   | Calendario     | Citas agendadas (solo las suyas) + detalle + marcar completada              |
| 5   | Pacientes      | Fichas de sus pacientes + notas de progreso                                 |
| 6   | Ingresos       | Métricas, filtros por fecha, comisión, neto a recibir                       |

## Requisitos

### Requisito 1: Login y autenticación por rol

**Historia de usuario:** Como profesional, quiero iniciar sesión en la plataforma con mis credenciales, para acceder a mi panel personalizado.

#### Criterios de Aceptación

1. THE Sistema SHALL permitir login con email + contraseña tanto para rol ADMIN como para rol PROFESSIONAL
2. WHEN un usuario con rol PROFESSIONAL inicia sesión, THE Sistema SHALL redirigir a `/profesional` (portal del profesional)
3. WHEN un usuario con rol ADMIN inicia sesión, THE Sistema SHALL redirigir a `/admin` (panel de administración)
4. WHEN el admin crea un nuevo profesional, THE Sistema SHALL generar una contraseña temporal automáticamente y mostrarla una sola vez para compartir con el profesional
5. WHEN el profesional inicia sesión por primera vez, THE Sistema SHALL sugerir cambiar la contraseña temporal
6. THE Sistema SHALL impedir que un profesional acceda a rutas de `/admin` y viceversa

---

### Requisito 2: Dashboard del profesional

**Historia de usuario:** Como profesional, quiero ver un resumen de mi actividad al iniciar sesión, para tener visibilidad rápida de mis citas y estado.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar las citas del día actual del profesional logueado
2. THE Sistema SHALL mostrar las próximas citas programadas (máximo 5)
3. THE Sistema SHALL mostrar un resumen de ingresos del mes actual (total facturado, comisión, neto)
4. THE Sistema SHALL mostrar únicamente datos pertenecientes al profesional logueado

---

### Requisito 3: Gestión de perfil del profesional

**Historia de usuario:** Como profesional, quiero editar mi perfil desde mi portal, para mantener actualizada la información que ven los pacientes.

#### Criterios de Aceptación

1. THE Sistema SHALL permitir al profesional editar: especialidad, descripción, características de estilo (traits) y foto de perfil
2. THE Sistema SHALL mostrar como solo lectura (no editables): nombre, email, tarifa por sesión y porcentaje de comisión
3. WHEN el profesional guarda cambios en su perfil, THE Sistema SHALL reflejar los cambios inmediatamente en la vista pública de agendamiento
4. THE Sistema SHALL mostrar una vista previa de cómo se verá el perfil para los pacientes

---

### Requisito 4: Conexión con Google Calendar (OAuth 2.0)

**Historia de usuario:** Como profesional, quiero conectar mi Google Calendar a la plataforma, para que las citas se creen automáticamente en mi calendario con link de Google Meet.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar un botón "Conectar Google Calendar" en el módulo de disponibilidad del profesional
2. WHEN el profesional hace click en "Conectar Google Calendar", THE Sistema SHALL redirigir al flujo de OAuth de Google solicitando permisos de calendario
3. WHEN el profesional autoriza los permisos, THE Sistema SHALL almacenar el refresh token de forma segura en la base de datos
4. THE Sistema SHALL mostrar estado "Conectado" con el email de Google vinculado después de una conexión exitosa
5. THE Sistema SHALL permitir al profesional desconectar su Google Calendar y revocar los permisos
6. IF el refresh token expira o es revocado, THEN THE Sistema SHALL mostrar un aviso solicitando reconectar

---

### Requisito 5: Gestión de disponibilidad horaria

**Historia de usuario:** Como profesional, quiero configurar mis horarios disponibles para atención, para que los pacientes solo vean las horas en las que puedo atender.

#### Criterios de Aceptación

1. THE Sistema SHALL permitir al profesional agregar bloques horarios recurrentes (día de la semana + hora inicio + hora fin)
2. THE Sistema SHALL permitir al profesional eliminar bloques horarios existentes
3. THE Sistema SHALL permitir al profesional bloquear fechas específicas (vacaciones, feriados, etc.) con motivo opcional
4. WHEN el profesional modifica su disponibilidad, THE Sistema SHALL reflejar los cambios inmediatamente en el flujo público de agendamiento
5. THE Sistema SHALL NOT permitir al admin modificar la disponibilidad del profesional (solo lectura desde admin)

---

### Requisito 6: Creación automática de eventos con Google Meet

**Historia de usuario:** Como profesional, quiero que cuando un paciente confirme una cita, se cree automáticamente un evento en mi Google Calendar con link de Meet, para no tener que crear la reunión manualmente.

#### Criterios de Aceptación

1. WHEN un pago es confirmado y el profesional tiene Google Calendar conectado, THE Sistema SHALL crear un evento en el calendario del profesional usando su OAuth token
2. THE Sistema SHALL incluir en el evento: título con nombre del servicio, descripción con datos del paciente, fecha/hora, y el email del paciente como asistente
3. THE Sistema SHALL generar automáticamente un link de Google Meet adjunto al evento
4. THE Sistema SHALL enviar invitación de calendario al email del paciente (Google envía automáticamente al tener asistentes)
5. THE Sistema SHALL almacenar el link de Meet en la base de datos y enviarlo al paciente en el email de confirmación
6. IF la creación del evento falla, THEN THE Sistema SHALL confirmar la cita igualmente y registrar el error en logs
7. IF el profesional NO tiene Google Calendar conectado, THEN THE Sistema SHALL crear la cita sin evento de calendario y sin link de Meet

---

### Requisito 7: Calendario de citas del profesional

**Historia de usuario:** Como profesional, quiero ver mi calendario con todas mis citas agendadas, para tener visibilidad de mi agenda completa.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar un calendario mensual con todas las citas del profesional logueado
2. WHEN el profesional hace click en una cita, THE Sistema SHALL mostrar un modal con los detalles completos (paciente, servicio, fecha, hora, link de Meet, estado)
3. THE Sistema SHALL permitir al profesional marcar una cita como "Completada" desde el calendario
4. THE Sistema SHALL diferenciar visualmente las citas por estado (confirmada, completada, cancelada)
5. THE Sistema SHALL mostrar solo las citas del profesional logueado, nunca las de otros profesionales

---

### Requisito 8: Vista de pacientes del profesional

**Historia de usuario:** Como profesional, quiero ver la ficha de mis pacientes y agregar notas de progreso, para llevar un seguimiento de su proceso terapéutico.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar al profesional únicamente los pacientes que tienen citas agendadas con él/ella
2. THE Sistema SHALL permitir al profesional ver la ficha completa del paciente (datos personales, evaluación emocional, contacto de emergencia)
3. THE Sistema SHALL permitir al profesional agregar notas de progreso ilimitadas a la ficha del paciente
4. THE Sistema SHALL NOT permitir al profesional ver pacientes de otros profesionales
5. THE Sistema SHALL NOT permitir al profesional eliminar o modificar datos del paciente (solo agregar notas)

---

### Requisito 9: Vista de ingresos del profesional

**Historia de usuario:** Como profesional, quiero ver un resumen de mis ingresos con el detalle de comisiones descontadas, para saber cuánto voy a recibir.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar al profesional un resumen mensual con: total facturado, comisión descontada (%) y neto a recibir
2. THE Sistema SHALL permitir al profesional filtrar por rango de fechas personalizado con selector de calendario
3. THE Sistema SHALL mostrar un listado detallado de cada sesión realizada con: fecha, nombre del paciente, servicio, monto cobrado, comisión y neto
4. THE Sistema SHALL mostrar solo las citas con estado "CONFIRMED" o "COMPLETED" (no las canceladas ni pendientes)
5. THE Sistema SHALL NOT permitir al profesional ver ingresos de otros profesionales

---

### Requisito 10: Ajustes al rol Admin

**Historia de usuario:** Como admin, quiero que la disponibilidad de cada profesional sea gestionada por ellos mismos, y poder ver el estado de su conexión con Google Calendar.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar al admin la disponibilidad de cada profesional en modo solo lectura
2. THE Sistema SHALL NOT permitir al admin agregar, editar o eliminar bloques horarios de un profesional
3. WHEN el admin crea un nuevo profesional, THE Sistema SHALL generar una contraseña temporal y mostrarla una sola vez para que sea compartida con el profesional
4. THE Sistema SHALL mostrar al admin el estado de conexión de Google Calendar de cada profesional (conectado/desconectado)
5. THE Sistema SHALL mantener todas las funcionalidades actuales del admin intactas (pacientes, calendario global, métricas, contenido)
