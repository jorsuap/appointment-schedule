# Requirements Document

## Introduction

Edición de tarifas de profesionales por parte del administrador. Hoy las tarifas (`ProfessionalTariff`: `price` y `commission`) solo se crean al dar de alta un profesional (`POST /api/professionals/create`) o vía seed, y no existe forma de modificarlas desde la aplicación. La pestaña "Tarifas" del detalle del profesional (`/admin/profesionales/[id]`) es de solo lectura.

Esta funcionalidad permite al administrador editar, por cada servicio del profesional, el precio por sesión y el porcentaje de comisión de la plataforma mediante un modal, con las validaciones correspondientes y recálculo del neto profesional. El acceso queda restringido al rol ADMIN tanto en la interfaz como en el endpoint.

## Glossary

- **Admin_Session**: Sesión autenticada de un usuario con rol ADMIN, validada mediante `auth()` (patrón ya usado en `/api/admin/discount-tiers/[id]`).
- **Professional_Detail**: Página de detalle del profesional en `/admin/profesionales/[id]`, que incluye la pestaña "Tarifas".
- **Tariff**: Registro `ProfessionalTariff` que vincula un profesional y un servicio con un `price` (COP por sesión) y una `commission` (porcentaje de plataforma). Identificado por su `id`.
- **Tariffs_Tab**: Pestaña "Tarifas" dentro de Professional_Detail que lista una Tariff por cada servicio del profesional (precio, comisión, neto profesional).
- **Tariff_Edit_Modal**: Modal (shadcn Dialog) para editar `price` y `commission` de una Tariff específica.
- **Net_Professional**: Monto neto que recibe el profesional por sesión, calculado como `price - (price * commission / 100)`.
- **Tariff_Update_Endpoint**: Endpoint de API que persiste la edición de una Tariff, protegido por Admin_Session.

## Requirements

### Requirement 1: Acceso a la edición de tarifas (solo ADMIN)

**User Story:** Como administrador, quiero poder editar las tarifas de un profesional desde su detalle, para mantener los precios y comisiones actualizados sin tocar la base de datos.

#### Acceptance Criteria

1. WHEN the Admin views the Tariffs_Tab in Professional_Detail, THE Tariffs_Tab SHALL display an edit action (e.g. an "Editar" button) for each Tariff listed.
2. WHEN the Admin activates the edit action for a Tariff, THE Professional_Detail SHALL open the Tariff_Edit_Modal pre-populated with the current `price` and `commission` of that Tariff.
3. THE edit action and the Tariff_Update_Endpoint SHALL be available only to users with an active Admin_Session.
4. IF a user without an Admin_Session calls the Tariff_Update_Endpoint, THEN THE endpoint SHALL respond with HTTP 403 FORBIDDEN and SHALL NOT modify any Tariff.

### Requirement 2: Edición por servicio

**User Story:** Como administrador, quiero editar la tarifa de cada servicio del profesional de forma independiente, porque un profesional puede tener precios distintos por servicio.

#### Acceptance Criteria

1. THE Tariff_Edit_Modal SHALL operate on a single Tariff identified by its `id`, corresponding to one professional-service pair.
2. WHEN the Admin edits one Tariff, THE Tariff_Update_Endpoint SHALL update only that Tariff and SHALL NOT alter the other Tariffs of the same professional.
3. THE Tariff_Edit_Modal SHALL display the name of the service to which the Tariff belongs, so the Admin knows which service is being edited.

### Requirement 3: Campos editables y validación

**User Story:** Como administrador, quiero que el modal valide el precio y la comisión antes de guardar, para evitar valores inválidos.

#### Acceptance Criteria

1. THE Tariff_Edit_Modal SHALL allow editing two fields: `price` (COP per session) and `commission` (platform percentage).
2. THE Tariff_Edit_Modal SHALL accept a `price` that is an integer greater than or equal to 0.
3. THE Tariff_Edit_Modal SHALL accept a `commission` that is an integer between 0 and 100 inclusive.
4. WHEN the Admin enters a `price` below 0 or a non-integer, THE Tariff_Edit_Modal SHALL display an inline validation error and SHALL prevent submission.
5. WHEN the Admin enters a `commission` below 0, above 100, or a non-integer, THE Tariff_Edit_Modal SHALL display an inline validation error and SHALL prevent submission.
6. THE Tariff_Update_Endpoint SHALL re-validate `price` (integer >= 0) and `commission` (integer 0-100) on the server side, and IF validation fails THEN SHALL respond with HTTP 422 and a validation error payload without modifying the Tariff.

### Requirement 4: Recálculo del neto profesional

**User Story:** Como administrador, quiero ver el neto profesional actualizado al editar, para entender cuánto recibirá el profesional con los nuevos valores.

#### Acceptance Criteria

1. WHILE the Admin edits `price` or `commission` in the Tariff_Edit_Modal, THE Tariff_Edit_Modal SHALL display the resulting Net_Professional recalculated as `price - (price * commission / 100)`.
2. WHEN the Tariff is updated successfully, THE Tariffs_Tab SHALL reflect the new `price`, `commission`, and Net_Professional without requiring a manual full-page reload.

### Requirement 5: Persistencia y confirmación

**User Story:** Como administrador, quiero guardar los cambios y recibir confirmación, para saber que la edición se aplicó.

#### Acceptance Criteria

1. WHEN the Admin confirms the edit with valid values, THE Tariff_Update_Endpoint SHALL persist the new `price` and `commission` for the target Tariff and SHALL respond with HTTP 200 and the updated Tariff.
2. WHEN the update succeeds, THE Professional_Detail SHALL close the Tariff_Edit_Modal and SHALL display a success confirmation (toast).
3. IF the Tariff_Update_Endpoint returns an error, THEN THE Tariff_Edit_Modal SHALL display the error message and SHALL keep the modal open so the Admin can retry.
4. WHEN the Admin cancels the Tariff_Edit_Modal, THE Professional_Detail SHALL close the modal without persisting any change.
