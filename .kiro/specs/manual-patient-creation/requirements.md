# Requirements Document

## Introduction

Creación manual de pacientes desde el portal profesional (`/profesional/pacientes`). Permite al profesional registrar pacientes que llegan por canales externos (WhatsApp, llamada, presencial) sin depender del flujo público de agendamiento. El paciente creado queda disponible inmediatamente en la lista del profesional para gestión y venta de paquetes de sesiones.

## Glossary

- **Professional_Portal**: Área autenticada del sistema accesible en `/profesional/*` exclusivamente para usuarios con rol PROFESSIONAL.
- **Patient_Form**: Formulario de creación/edición de datos de paciente dentro del Professional_Portal.
- **Patient_List**: Listado de pacientes del profesional en `/profesional/pacientes`, filtrado por pacientes con al menos un Appointment vinculado al profesional autenticado.
- **Registration_Appointment**: Appointment con estado CONFIRMED creada automáticamente al registrar un paciente manualmente, cuyo propósito es vincular al paciente con el profesional en el sistema.
- **Upsert_Operation**: Operación de base de datos que crea un registro si no existe o actualiza uno existente, utilizando el campo email como identificador único.
- **Professional_Session**: Sesión autenticada del usuario con rol PROFESSIONAL, validada mediante `getProfessionalSession()`.

## Requirements

### Requirement 1: Acceso al formulario de creación manual

**User Story:** Como profesional, quiero acceder a un formulario de creación de pacientes desde mi lista de pacientes, para poder registrar pacientes que llegan por canales externos.

#### Acceptance Criteria

1. WHEN the Professional navigates to `/profesional/pacientes`, THE Patient_List SHALL display an "Agregar Paciente" button visible above the patient list.
2. WHEN the Professional clicks the "Agregar Paciente" button, THE Professional_Portal SHALL navigate to `/profesional/pacientes/nuevo` displaying the Patient_Form.
3. THE Patient_Form SHALL be accessible only to authenticated users with an active Professional_Session.
4. IF an unauthenticated user attempts to access `/profesional/pacientes/nuevo`, THEN THE Professional_Portal SHALL redirect the user to the login page.

### Requirement 2: Campos del formulario de paciente

**User Story:** Como profesional, quiero que el formulario recoja la misma información que el flujo público de agendamiento, para mantener consistencia en los datos del paciente.

#### Acceptance Criteria

1. THE Patient_Form SHALL include the following required fields: fullName (text), email (email), dateOfBirth (date), country (select), isAdult (yes/no select).
2. THE Patient_Form SHALL include the following optional personal field: preferredName (text).
3. THE Patient_Form SHALL include the following optional emotional evaluation fields: reasonForVisit (textarea), recentFeelings (textarea), selfHarmRisk (yes/no select), currentTreatment (yes/no select), previousDiagnosis (textarea), desiredOutcome (textarea), additionalNotes (textarea).
4. THE Patient_Form SHALL include the following optional emergency contact fields: emergencyName (text), emergencyRelation (text), emergencyPhone (text), emergencyCountry (select).
5. THE Patient_Form SHALL include the following consent checkboxes: dataPrivacyConsent, commsConsent, informedConsent.
6. THE Patient_Form SHALL organize fields into clearly labeled sections: Datos Personales, Evaluación Emocional, Contacto de Emergencia, Consentimientos.

### Requirement 3: Validación del formulario

**User Story:** Como profesional, quiero que el formulario valide los datos antes de enviarlos, para evitar errores en el registro de pacientes.

#### Acceptance Criteria

1. WHEN the Professional submits the Patient_Form with empty required fields, THE Patient_Form SHALL display inline validation errors indicating which fields are required.
2. WHEN the Professional enters an invalid email format in the email field, THE Patient_Form SHALL display a validation error for the email field.
3. WHEN the Professional enters a future date in dateOfBirth, THE Patient_Form SHALL display a validation error indicating the date must be in the past.
4. THE Patient_Form SHALL validate all fields on the client side before submitting the request to the server.
5. IF the server returns a validation error, THEN THE Patient_Form SHALL display the server error message to the Professional.

### Requirement 4: Creación del paciente con upsert por email

**User Story:** Como profesional, quiero que el sistema use upsert por email al crear pacientes, para no duplicar registros de pacientes que ya existen en el sistema.

#### Acceptance Criteria

1. WHEN the Professional submits a valid Patient_Form with an email that does not exist in the database, THE Professional_Portal SHALL create a new Patient record with all provided data.
2. WHEN the Professional submits a valid Patient_Form with an email that already exists in the database, THE Professional_Portal SHALL update the existing Patient record with the new data provided.
3. THE Upsert_Operation SHALL use the email field as the unique identifier for determining create or update behavior.
4. THE Upsert_Operation SHALL execute within a database transaction together with the Registration_Appointment creation.

### Requirement 5: Vinculación paciente-profesional mediante cita de registro

**User Story:** Como profesional, quiero que el paciente creado manualmente aparezca en mi lista de pacientes inmediatamente, para poder gestionarlo y venderle paquetes de sesiones.

#### Acceptance Criteria

1. WHEN a Patient is created or updated via the Patient_Form, THE Professional_Portal SHALL create a Registration_Appointment linking the Patient to the authenticated Professional.
2. THE Registration_Appointment SHALL have status CONFIRMED.
3. THE Registration_Appointment SHALL reference a valid serviceId from the Professional's configured services.
4. THE Registration_Appointment SHALL use the current date as the appointment date.
5. WHEN the patient already has a CONFIRMED or COMPLETED Appointment with the Professional, THE Professional_Portal SHALL skip creation of the Registration_Appointment.
6. WHEN the Registration_Appointment is created successfully, THE Patient SHALL appear in the Professional's Patient_List.

### Requirement 6: Feedback y navegación post-creación

**User Story:** Como profesional, quiero recibir confirmación visual al crear un paciente y volver a la lista actualizada, para saber que la operación fue exitosa.

#### Acceptance Criteria

1. WHEN the Patient is created or updated successfully, THE Professional_Portal SHALL display a success toast notification with the patient's name.
2. WHEN the Patient is created or updated successfully, THE Professional_Portal SHALL navigate the Professional back to `/profesional/pacientes`.
3. WHEN the Professional navigates back to the Patient_List after creation, THE Patient_List SHALL include the newly created patient without requiring a page refresh.
4. IF an unexpected server error occurs during patient creation, THEN THE Patient_Form SHALL display an error toast notification with a descriptive message.
5. WHILE the Patient_Form is submitting, THE Patient_Form SHALL disable the submit button and display a loading indicator to prevent duplicate submissions.

### Requirement 7: Seguridad y autorización

**User Story:** Como administrador del sistema, quiero que solo profesionales autenticados puedan crear pacientes desde el portal, para proteger los datos sensibles de los pacientes.

#### Acceptance Criteria

1. THE Professional_Portal SHALL validate the Professional_Session before processing any patient creation request.
2. IF the Professional_Session is invalid or expired, THEN THE Professional_Portal SHALL return an HTTP 401 response and redirect to login.
3. THE Patient creation API endpoint SHALL associate the created Registration_Appointment exclusively with the professionalId from the authenticated session.
4. THE Patient creation API endpoint SHALL reject requests that do not include a valid Professional_Session.

### Requirement 8: Compatibilidad con funcionalidad existente

**User Story:** Como usuario del sistema, quiero que la creación manual de pacientes no afecte el flujo público de agendamiento ni la gestión existente de pacientes, para mantener la estabilidad del sistema.

#### Acceptance Criteria

1. THE Upsert_Operation in the Patient_Form SHALL follow the same data mapping pattern as the existing public appointment creation endpoint (`POST /api/appointments`).
2. THE Patient records created via the Patient_Form SHALL be queryable by the existing Patient_List API (`GET /api/professional/patients`).
3. THE Registration_Appointment SHALL be compatible with the existing Appointment model constraints (required fields: patientId, professionalId, serviceId, date, startTime, endTime, status).
4. THE Patient_Form feature SHALL not modify existing API endpoints or database queries.
