# Requirements Document

## Introduction

En el wizard de creación de paquetes de sesiones (paso 3, "Programar Fechas"), hoy las fechas de las sesiones se calculan automáticamente a partir de la fecha de inicio y la frecuencia, y solo se puede editar la HORA de una sesión cuando hay conflicto de horario. No existe forma de cambiar la FECHA de una sesión individual.

Esto deja al profesional sin salida cuando una sesión cae en una fecha que no sirve: un día festivo bloqueado, un día sin disponibilidad, o simplemente una fecha que no le conviene al paciente o al profesional. El botón "Siguiente" se bloquea (correcto) pero no hay manera de resolver el conflicto.

Esta funcionalidad convierte el lápiz de cada sesión en un editor completo de FECHA + HORA, disponible en TODAS las sesiones (haya o no conflicto), permitiendo mover una sesión a cualquier fecha/hora con disponibilidad real dentro de la ventana del calendario. Cada edición es independiente (sin recálculo en cascada de las demás sesiones) y se persiste para que, al confirmarse el paquete, las citas se creen en las fechas/horas editadas.

## Glossary

- **Package_Wizard**: Asistente multipaso de creación de paquetes en el portal profesional (`PackageWizard`).
- **Schedule_Step**: Paso 3 del wizard (`StepSchedule`), donde se eligen fecha de inicio, hora, frecuencia y se previsualizan las sesiones.
- **Session_Row**: Cada fila de la lista "Sesiones programadas" del Schedule_Step, correspondiente a una sesión del paquete (índice 0-based).
- **Session_Editor**: El panel inline que se abre al pulsar el lápiz de una Session_Row; permite cambiar fecha y hora de esa sesión.
- **Available_Slots**: Mapa fecha→horas devuelto por `GET /api/professional/availability/slots`, con las fechas/horas con disponibilidad real dentro de la ventana (180 días, sin fechas bloqueadas, respetando el horario del profesional y citas existentes).
- **Time_Override**: Hora personalizada para una sesión específica, indexada por posición (ya existe: `sessionTimeOverrides`).
- **Date_Override**: Fecha personalizada para una sesión específica, indexada por posición (nuevo: `sessionDateOverrides`).
- **Session_Scheduler**: Función pura `calculateSessionDates` que calcula las fechas base por frecuencia.
- **Package_Confirmer**: Proceso (`package-confirmer.ts`) que, al confirmarse el pago, materializa las sesiones del paquete en registros Appointment.
- **Professional_Session**: Sesión autenticada con rol PROFESSIONAL.

## Requirements

### Requirement 1: Editar fecha y hora de cualquier sesión

**User Story:** Como profesional, quiero poder cambiar la fecha y la hora de cualquier sesión del paquete, incluso si no tiene conflicto, para ajustar el calendario a lo que le sirve al paciente y a mí.

#### Acceptance Criteria

1. THE Schedule_Step SHALL display an edit action (lápiz) on EVERY Session_Row, regardless of whether the session has an availability conflict.
2. WHEN the Professional activates the edit action on a Session_Row, THE Schedule_Step SHALL open the Session_Editor for that session showing a date selector and a time selector.
3. THE Session_Editor SHALL allow selecting both a new date and a new time for that single session.
4. WHEN the Professional confirms a new date and/or time in the Session_Editor, THE Schedule_Step SHALL update only that session, leaving all other sessions unchanged (no cascade recalculation).

### Requirement 2: Fechas y horas elegibles

**User Story:** Como profesional, quiero que el editor solo me ofrezca fechas y horas con disponibilidad real, para no agendar en días bloqueados o sin horario.

#### Acceptance Criteria

1. THE Session_Editor SHALL offer as selectable dates only those present in Available_Slots (same logic as the main calendar: within the 180-day window, excluding blocked dates, respecting the professional weekly schedule and existing appointments).
2. WHEN a date is selected in the Session_Editor, THE Session_Editor SHALL offer as selectable times only the Available_Slots for that date.
3. THE Session_Editor SHALL NOT allow selecting a date without availability nor a time outside that date's Available_Slots.

### Requirement 3: Independencia entre sesiones (sin cascada)

**User Story:** Como profesional, quiero que al mover una sesión las demás permanezcan exactamente igual, para no reorganizar todo el paquete por un solo cambio.

#### Acceptance Criteria

1. WHEN the Professional edits the date and/or time of a session, THE Schedule_Step SHALL NOT recalculate or shift any other session's date or time.
2. THE system SHALL allow a moved session to fall on a date earlier or later than adjacent sessions (no chronological-order enforcement).
3. THE system SHALL allow two sessions of the same package to share the same date and/or time (it is the professional's responsibility; the system does not prevent it).

### Requirement 4: Persistencia de los overrides

**User Story:** Como profesional, quiero que las ediciones de fecha y hora se guarden, para que las citas del paquete se creen exactamente en las fechas y horas que definí.

#### Acceptance Criteria

1. THE system SHALL persist per-session date overrides in a `sessionDateOverrides` structure on the SessionPackage, indexed by session position (analogous to the existing `sessionTimeOverrides`).
2. WHEN a package is created, THE creation endpoint SHALL store both `sessionTimeOverrides` and `sessionDateOverrides` when present.
3. WHEN the package is confirmed and its appointments are created, THE Package_Confirmer SHALL apply, for each session index: the Date_Override if present (otherwise the scheduler-calculated date), and the Time_Override if present (otherwise the base/calculated time), recalculating endTime from the effective startTime and the service duration.
4. THE Session_Scheduler and the base frequency calculation SHALL remain unchanged for sessions without overrides.

### Requirement 5: Reflejo en la previsualización y continuación

**User Story:** Como profesional, quiero ver las fechas/horas editadas reflejadas en la lista y poder continuar cuando todo esté disponible.

#### Acceptance Criteria

1. WHEN a session date and/or time is edited, THE Session_Row SHALL display the new date and/or time, visually indicating it was customized.
2. THE Schedule_Step SHALL re-evaluate availability using the effective date/time of each session (overrides included) to compute conflicts.
3. WHEN all sessions (with their overrides applied) have availability, THE Package_Wizard SHALL enable the "Siguiente" button; otherwise it SHALL keep it disabled.
