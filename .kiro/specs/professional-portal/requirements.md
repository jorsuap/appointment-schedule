# Documento de Requisitos — Portal del Profesional + OAuth Google Calendar

## Introducción

Crear un portal exclusivo para profesionales con acceso independiente al panel de administración. Cada profesional podrá gestionar su perfil, disponibilidad horaria, conectar su Google Calendar (OAuth 2.0) para generar eventos con Google Meet automáticamente, y consultar sus ingresos con detalle de comisiones.

## Glosario

- **Profesional**: Psicóloga registrada en la plataforma que ofrece acompañamiento
- **Admin**: Propietario/a de conAlma que gestiona la plataforma globalmente
- **OAuth**: Protocolo de autorización que permite al profesional dar acceso a su Google Calendar sin compartir su contraseña
- **Refresh Token**: Token almacenado que permite renovar el acceso a Google Calendar sin que el profesional vuelva a iniciar sesión
- **Meet Link**: URL de videollamada de Google Meet generada automáticamente al crear un evento

## Requisitos

### Requisito 1: Login y autenticación por rol

**Historia de usuario:** Como profesional, quiero iniciar sesión en la plataforma con mis credenciales, para acceder a mi panel personalizado.

#### Criterios de Aceptación

1. THE Sistema SHALL permitir login con email + contraseña tanto para rol ADMIN como para rol PROFESSIONAL
2. WHEN un usuario con rol PROFESSIONAL inicia sesión, THE Sistema SHALL redirigir a `/profesional` (portal del profesional)
3. WHEN un usuario con rol ADMIN inicia sesión, THE Sistema SHALL redirigir a `/admin` (panel de administración)
4. THE Sistema SHALL crear automáticamente credenciales de acceso (contraseña temporal) cuando el admin registra un nuevo profesional
5. WHEN el profesional inicia sesión por primera vez, THE Sistema SHALL sugerir cambiar la contraseña temporal

---

### Requisito 2: Gestión de perfil del profesional

**Historia de usuario:** Como profesional, quiero editar mi perfil desde mi portal, para mantener actualizada la información que ven los pacientes.

#### Criterios de Aceptación

1. THE Sistema SHALL permitir al profesional editar: nombre, especialidad, descripción, características de estilo (traits) y foto de perfil
2. WHEN el profesional guarda cambios en su perfil, THE Sistema SHALL reflejar los cambios inmediatamente en la vista pública de agendamiento
3. THE Sistema SHALL mostrar una vista previa de cómo se verá el perfil para los pacientes
4. THE Sistema SHALL NOT permitir al profesional editar su email ni su tarifa (solo el admin puede modificar tarifas)

---

### Requisito 3: Conexión con Google Calendar (OAuth 2.0)

**Historia de usuario:** Como profesional, quiero conectar mi Google Calendar a la plataforma, para que las citas se creen automáticamente en mi calendario con link de Google Meet.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar un botón "Conectar Google Calendar" en el módulo de disponibilidad del profesional
2. WHEN el profesional hace click en "Conectar Google Calendar", THE Sistema SHALL redirigir al flujo de OAuth de Google solicitando permisos de calendario
3. WHEN el profesional autoriza los permisos, THE Sistema SHALL almacenar el refresh token de forma segura en la base de datos
4. THE Sistema SHALL mostrar estado "Conectado" con el email de Google vinculado después de una conexión exitosa
5. THE Sistema SHALL permitir al profesional desconectar su Google Calendar y revocar los permisos
6. IF el refresh token expira o es revocado, THEN THE Sistema SHALL mostrar un aviso solicitando reconectar

---

### Requisito 4: Gestión de disponibilidad horaria

**Historia de usuario:** Como profesional, quiero configurar mis horarios disponibles para atención, para que los pacientes solo vean las horas en las que puedo atender.

#### Criterios de Aceptación

1. THE Sistema SHALL permitir al profesional agregar bloques horarios recurrentes (día de la semana + hora inicio + hora fin)
2. THE Sistema SHALL permitir al profesional eliminar bloques horarios existentes
3. THE Sistema SHALL permitir al profesional bloquear fechas específicas (vacaciones, feriados, etc.) con motivo opcional
4. WHEN el profesional modifica su disponibilidad, THE Sistema SHALL reflejar los cambios inmediatamente en el flujo público de agendamiento
5. THE Sistema SHALL NOT permitir al admin modificar la disponibilidad del profesional (solo lectura)

---

### Requisito 5: Creación automática de eventos con Google Meet

**Historia de usuario:** Como profesional, quiero que cuando un paciente confirme una cita, se cree automáticamente un evento en mi Google Calendar con link de Meet, para no tener que crear la reunión manualmente.

#### Criterios de Aceptación

1. WHEN un pago es confirmado y el profesional tiene Google Calendar conectado, THE Sistema SHALL crear un evento en el calendario del profesional
2. THE Sistema SHALL incluir en el evento: título con nombre del servicio, descripción con datos del paciente, fecha/hora, y el email del paciente como asistente
3. THE Sistema SHALL generar automáticamente un link de Google Meet adjunto al evento
4. THE Sistema SHALL almacenar el link de Meet en la base de datos y enviarlo al paciente en el email de confirmación
5. IF la creación del evento falla, THEN THE Sistema SHALL confirmar la cita igualmente y registrar el error en logs
6. IF el profesional NO tiene Google Calendar conectado, THEN THE Sistema SHALL crear la cita sin evento de calendario y sin link de Meet

---

### Requisito 6: Vista de ingresos del profesional

**Historia de usuario:** Como profesional, quiero ver un resumen de mis ingresos con el detalle de comisiones descontadas, para saber cuánto voy a recibir.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar al profesional un resumen mensual con: total facturado, comisión descontada (%) y neto a recibir
2. THE Sistema SHALL permitir al profesional filtrar por rango de fechas personalizado
3. THE Sistema SHALL mostrar un listado detallado de cada sesión realizada con: fecha, nombre del paciente, servicio, monto cobrado, comisión y neto
4. THE Sistema SHALL mostrar solo las citas con estado "CONFIRMED" o "COMPLETED" (no las canceladas ni pendientes)
5. THE Sistema SHALL NOT permitir al profesional ver ingresos de otros profesionales

---

### Requisito 7: Vista de pacientes del profesional

**Historia de usuario:** Como profesional, quiero ver la ficha de mis pacientes y agregar notas de progreso, para llevar un seguimiento de su proceso.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar al profesional únicamente los pacientes que tienen citas agendadas con él/ella
2. THE Sistema SHALL permitir al profesional ver la ficha completa del paciente (datos personales, evaluación emocional, contacto de emergencia)
3. THE Sistema SHALL permitir al profesional agregar notas de progreso a la ficha del paciente
4. THE Sistema SHALL NOT permitir al profesional ver pacientes de otros profesionales
5. THE Sistema SHALL NOT permitir al profesional eliminar o modificar datos del paciente (solo agregar notas)

---

### Requisito 8: Ajustes al rol Admin

**Historia de usuario:** Como admin, quiero que la disponibilidad de cada profesional sea gestionada por ellos mismos, para no tener que coordinar horarios manualmente.

#### Criterios de Aceptación

1. THE Sistema SHALL mostrar al admin la disponibilidad de cada profesional en modo solo lectura
2. THE Sistema SHALL NOT permitir al admin agregar, editar o eliminar bloques horarios de un profesional
3. WHEN el admin crea un nuevo profesional, THE Sistema SHALL generar una contraseña temporal y mostrarla una sola vez para que sea compartida con el profesional
4. THE Sistema SHALL permitir al admin ver el estado de conexión de Google Calendar de cada profesional (conectado/desconectado)
