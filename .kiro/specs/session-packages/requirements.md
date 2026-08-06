# Requirements Document

## Introduction

Funcionalidad de venta de paquetes de sesiones de acompañamiento psicológico desde el portal del profesional. Permite al profesional crear paquetes con múltiples sesiones para pacientes existentes, aplicando descuentos escalonados configurables. Soporta dos métodos de pago: Wompi Payment Links y transferencia bancaria con confirmación manual del admin. Al confirmar el pago, se programan automáticamente todas las citas con frecuencia definida y se crean los eventos de Google Calendar con Meet link.

## Glossary

- **Session_Package**: Conjunto de sesiones de acompañamiento psicológico vendidas como un paquete con descuento, creado por un profesional para un paciente existente.
- **Professional_Portal**: Interfaz web autenticada del profesional ubicada en `/profesional/*` desde donde gestiona pacientes, disponibilidad y ahora paquetes de sesiones.
- **Package_Creator**: Módulo del Professional_Portal que permite crear y configurar un Session_Package.
- **Discount_Engine**: Módulo que calcula el descuento aplicable según la cantidad de sesiones y la configuración de tramos definida por el admin.
- **Discount_Tier**: Tramo de descuento configurable que define un rango de sesiones y el monto de descuento por sesión en COP.
- **Payment_Link_Generator**: Módulo que interactúa con la API de Payment Links de Wompi para generar un link de pago programáticamente.
- **Bank_Transfer_Module**: Módulo que muestra datos bancarios al paciente y gestiona el flujo de confirmación manual del admin.
- **Session_Scheduler**: Módulo que calcula las fechas de todas las sesiones del paquete según la fecha de inicio, hora y frecuencia seleccionada.
- **Package_Confirmer**: Módulo que, al recibir confirmación de pago (webhook Wompi o confirmación manual admin), crea todas las citas (Appointment) y eventos de Google Calendar con Meet link.
- **Existing_Patient**: Paciente registrado en el sistema que tiene al menos una cita (Appointment) con el profesional que crea el paquete.
- **Frequency**: Intervalo entre sesiones del paquete. Valores posibles: semanal (7 días), quincenal (15 días), mensual (30 días).
- **Wompi_Payment_Link**: Link de pago generado mediante la API de Payment Links de Wompi que permite al paciente pagar el monto total del paquete.
- **Bank_Details_Config**: Configuración de datos bancarios (Bancolombia, Nequi, etc.) gestionada por el admin y mostrada al paciente en el flujo de transferencia bancaria.
- **Admin_Panel**: Interfaz web del administrador ubicada en `/admin/*` desde donde se gestionan configuraciones globales del sistema.

## Requirements

### Requirement 1: Creación de paquete de sesiones

**User Story:** As a profesional, I want crear un paquete de sesiones para un paciente existente, so that puedo ofrecer un plan de acompañamiento continuado con descuento.

#### Acceptance Criteria

1. WHEN el profesional accede a la sección de paquetes desde el Professional_Portal, THE Package_Creator SHALL mostrar la lista de Existing_Patient asociados al profesional.
2. WHEN el profesional selecciona un paciente y define la cantidad de sesiones (mínimo 1), THE Package_Creator SHALL calcular y mostrar el precio total con descuento aplicado (si aplica).
3. THE Package_Creator SHALL permitir seleccionar únicamente pacientes que tengan al menos una cita con estado CONFIRMED o COMPLETED con el profesional.
4. THE Package_Creator SHALL permitir crear paquetes desde 1 sesión en adelante, sin límite máximo.
5. THE Package_Creator SHALL asociar el Session_Package al servicio que el profesional tiene configurado con su tarifa (ProfessionalTariff).

### Requirement 2: Descuentos escalonados

**User Story:** As a admin, I want configurar los tramos de descuento para paquetes de sesiones, so that puedo controlar la política de precios sin intervención técnica.

#### Acceptance Criteria

1. THE Admin_Panel SHALL permitir crear, editar y eliminar Discount_Tier con rango de sesiones (mínimo y máximo) y monto de descuento por sesión en COP.
2. WHEN el profesional crea un paquete con 1 sola sesión, THE Discount_Engine SHALL NOT aplicar ningún descuento (precio completo).
3. WHEN el profesional crea un paquete con 2 o más sesiones dentro de un Discount_Tier configurado, THE Discount_Engine SHALL aplicar el descuento correspondiente por sesión al calcular el precio total.
4. THE Discount_Engine SHALL calcular el precio total como: (precio_por_sesion - descuento_por_sesion) × cantidad_de_sesiones. Para 1 sesión: precio_por_sesion × 1 (sin descuento).
5. IF no existe un Discount_Tier que cubra la cantidad de sesiones seleccionada (y es mayor a 1), THEN THE Discount_Engine SHALL calcular el precio total sin descuento (precio_por_sesion × cantidad_de_sesiones).
6. WHEN el admin modifica un Discount_Tier, THE Admin_Panel SHALL aplicar los cambios únicamente a paquetes creados a partir de ese momento, sin afectar paquetes existentes.

### Requirement 3: Programación de sesiones

**User Story:** As a profesional, I want definir la fecha de inicio, hora y frecuencia de las sesiones del paquete, so that las citas se agenden automáticamente con un patrón regular.

#### Acceptance Criteria

1. WHEN el profesional configura un paquete, THE Package_Creator SHALL solicitar fecha de inicio, hora de inicio y Frequency (semanal, quincenal o mensual).
2. THE Session_Scheduler SHALL calcular las fechas de todas las sesiones aplicando la Frequency seleccionada a partir de la fecha y hora de inicio.
3. WHEN la Frequency es semanal, THE Session_Scheduler SHALL programar cada sesión con 7 días de diferencia respecto a la anterior.
4. WHEN la Frequency es quincenal, THE Session_Scheduler SHALL programar cada sesión con 15 días de diferencia respecto a la anterior.
5. WHEN la Frequency es mensual, THE Session_Scheduler SHALL programar cada sesión con 30 días de diferencia respecto a la anterior.
6. THE Package_Creator SHALL mostrar al profesional un resumen con todas las fechas calculadas antes de proceder al pago.

### Requirement 4: Pago mediante Wompi Payment Link

**User Story:** As a profesional, I want generar un link de pago de Wompi para el paquete, so that el paciente pueda pagar de forma segura y el sistema confirme automáticamente.

#### Acceptance Criteria

1. WHEN el profesional selecciona Wompi Payment Link como método de pago, THE Payment_Link_Generator SHALL crear un Payment Link mediante la API de Wompi con el monto total del paquete y una referencia única.
2. THE Payment_Link_Generator SHALL generar el Payment Link con los datos del paciente (nombre y email) como información de la transacción.
3. WHEN el Payment Link es generado exitosamente, THE Professional_Portal SHALL mostrar el link al profesional para que lo comparta con el paciente.
4. THE Session_Package SHALL quedar en estado PENDING_PAYMENT hasta que el webhook de Wompi confirme el pago como APPROVED.
5. WHEN Wompi notifica el pago aprobado mediante webhook, THE Package_Confirmer SHALL cambiar el estado del Session_Package de PENDING_PAYMENT a CONFIRMED.
6. IF la creación del Payment Link falla en la API de Wompi, THEN THE Payment_Link_Generator SHALL mostrar un mensaje de error al profesional con la opción de reintentar.

### Requirement 5: Pago mediante transferencia bancaria

**User Story:** As a profesional, I want ofrecer pago por transferencia bancaria, so that los pacientes que no pueden pagar con tarjeta tengan una alternativa.

#### Acceptance Criteria

1. WHEN el profesional selecciona transferencia bancaria como método de pago, THE Bank_Transfer_Module SHALL mostrar los datos bancarios configurados (Bank_Details_Config) para compartir con el paciente.
2. THE Bank_Transfer_Module SHALL crear el Session_Package con estado PENDING_PAYMENT hasta que el admin confirme la recepción del pago.
3. WHEN el admin confirma el pago de una transferencia bancaria desde el Admin_Panel, THE Package_Confirmer SHALL cambiar el estado del Session_Package de PENDING_PAYMENT a CONFIRMED.
4. THE Admin_Panel SHALL mostrar una lista de Session_Package con estado PENDING_PAYMENT pendientes de confirmación de transferencia bancaria.
5. THE Admin_Panel SHALL permitir al admin rechazar un pago pendiente, cambiando el estado del Session_Package a CANCELLED.

### Requirement 6: Configuración de datos bancarios

**User Story:** As a admin, I want configurar los datos bancarios mostrados al paciente, so that puedo actualizar las cuentas de recepción sin intervención técnica.

#### Acceptance Criteria

1. THE Admin_Panel SHALL permitir crear, editar y eliminar registros de Bank_Details_Config con campos: banco, tipo de cuenta, número de cuenta, titular y alias (Nequi, Daviplata, etc.).
2. WHEN el profesional selecciona transferencia bancaria, THE Bank_Transfer_Module SHALL mostrar todos los registros activos de Bank_Details_Config.
3. THE Admin_Panel SHALL permitir activar o desactivar registros individuales de Bank_Details_Config sin eliminarlos.

### Requirement 7: Confirmación de pago y creación automática de citas

**User Story:** As a profesional, I want que al confirmar el pago se creen automáticamente todas las citas con evento de Google Calendar, so that no tenga que crear cada sesión manualmente.

#### Acceptance Criteria

1. WHEN el estado del Session_Package cambia a CONFIRMED, THE Package_Confirmer SHALL crear una Appointment para cada sesión del paquete con las fechas calculadas por el Session_Scheduler.
2. THE Package_Confirmer SHALL crear cada Appointment con estado CONFIRMED, asociada al paciente, profesional y servicio del paquete.
3. WHEN el profesional tiene Google Calendar conectado (googleCalendarConnected = true), THE Package_Confirmer SHALL crear un evento de Google Calendar con Meet link para cada Appointment del paquete.
4. THE Package_Confirmer SHALL almacenar el googleEventId y meetLink en cada Appointment creada.
5. IF la creación de un evento de Google Calendar falla, THEN THE Package_Confirmer SHALL confirmar la Appointment sin evento de Calendar y registrar el error en logs.
6. WHEN todas las citas del paquete son creadas exitosamente, THE Package_Confirmer SHALL enviar un email de confirmación al paciente con el resumen del paquete y los links de Meet de cada sesión.

### Requirement 8: Integración con API de Payment Links de Wompi

**User Story:** As a developer, I want integrar la API de Payment Links de Wompi, so that el sistema pueda generar links de pago programáticamente.

#### Acceptance Criteria

1. THE Payment_Link_Generator SHALL autenticarse con la API de Wompi usando la clave privada de producción (WOMPI_PRIVATE_KEY) mediante Bearer token.
2. THE Payment_Link_Generator SHALL enviar el monto del paquete en centavos (COP × 100) al crear el Payment Link en la API de Wompi.
3. THE Payment_Link_Generator SHALL incluir una referencia única por paquete con formato `PKG-{packageId}` para identificar el pago en el webhook.
4. WHEN el webhook recibe una notificación con referencia que inicia con `PKG-`, THE Package_Confirmer SHALL procesar el evento como pago de paquete de sesiones.
5. THE Package_Confirmer SHALL verificar la firma del webhook usando WOMPI_EVENTS_SECRET antes de procesar cualquier notificación de pago.
6. WHEN el webhook reporta un estado diferente a APPROVED, THE Package_Confirmer SHALL mantener el Session_Package en estado PENDING_PAYMENT.

### Requirement 9: Visualización y gestión de paquetes

**User Story:** As a profesional y admin, I want ver los paquetes creados y su estado, so that puedo hacer seguimiento y gestionar los pagos.

#### Acceptance Criteria

1. THE Professional_Portal SHALL mostrar una lista de Session_Package creados por el profesional con su estado actual (PENDING_PAYMENT, CONFIRMED, CANCELLED) y búsqueda por paciente.
2. THE Admin_Panel SHALL mostrar una lista de TODOS los Session_Package del sistema, con filtros por profesional, paciente y estado.
3. WHEN el profesional selecciona un Session_Package, THE Professional_Portal SHALL mostrar el detalle del paquete incluyendo: paciente, cantidad de sesiones, precio total, descuento aplicado, frecuencia, método de pago y lista de citas programadas.
4. THE Professional_Portal SHALL NOT permitir al profesional cambiar el estado de un Session_Package (solo visualización).
5. THE Admin_Panel SHALL permitir al admin cambiar el estado de un Session_Package a CONFIRMED, CANCELLED o PENDING_PAYMENT (para corregir errores).
6. WHILE un Session_Package está en estado PENDING_PAYMENT, THE Professional_Portal SHALL mostrar la opción de cancelar el paquete (única excepción — solo cancela, no confirma).
7. WHEN el profesional cancela un paquete en estado PENDING_PAYMENT, THE Professional_Portal SHALL cambiar el estado del Session_Package a CANCELLED.
