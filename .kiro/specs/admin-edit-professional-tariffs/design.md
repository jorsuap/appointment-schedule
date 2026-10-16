# Design Document

## Overview

Esta feature habilita la edición de tarifas (`price` y `commission`) de un profesional, por servicio, desde la pestaña "Tarifas" del detalle de profesional en `/admin/profesionales/[id]`, mediante un modal, restringida al rol ADMIN.

El cambio arquitectónico central: la página de detalle (`src/app/(admin)/admin/profesionales/[id]/page.tsx`) es un **Server Component** que hace `await prisma` directo y renderiza la pestaña Tarifas en modo lectura. Para incorporar un modal interactivo (estado, validación en vivo, fetch) se extrae el contenido de la pestaña Tarifas a un **Client Component** nuevo, al que el Server Component le pasa los datos ya cargados. La persistencia se hace contra un endpoint nuevo protegido por sesión ADMIN.

No se modifica el motor de cálculo de paquetes ni el endpoint `calculate`; el `price` editado alimenta tarifas futuras de forma natural porque los paquetes toman `tariff.price` al momento de calcular.

## Architecture

### Flujo

1. El Server Component carga `professional` con `tariffs` y `services` (ya lo hace hoy).
2. Renderiza un nuevo Client Component `TariffsTab` pasándole la lista de tarifas con el nombre de servicio resuelto.
3. `TariffsTab` muestra cada tarifa con un botón "Editar" que abre `TariffEditModal` (shadcn Dialog).
4. `TariffEditModal` edita `price` y `commission`, muestra el neto recalculado en vivo, valida en cliente, y al confirmar hace `PUT` al endpoint.
5. El endpoint valida sesión ADMIN + payload (Zod), persiste con Prisma y responde la tarifa actualizada.
6. En éxito: toast de confirmación, cierre del modal y `router.refresh()` para re-renderizar el Server Component con los datos nuevos.

### Decisión: ruta del endpoint

Se crea `PUT /api/admin/professionals/[id]/tariffs/[tariffId]` bajo `/api/admin/`, zona que ya aplica guard ADMIN de forma consistente (patrón de `/api/admin/discount-tiers/[id]`).

Nota de seguridad observada (fuera de alcance de este spec): el endpoint existente `DELETE /api/professionals/[id]` NO valida rol ADMIN. No se corrige aquí, pero se deja registrado como riesgo. El nuevo endpoint SÍ aplica el guard correcto.

## Components and Interfaces

### Server Component (modificado)
`src/app/(admin)/admin/profesionales/[id]/page.tsx`
- Reemplaza el bloque de renderizado de la pestaña "tarifas" por `<TariffsTab professionalId={id} tariffs={tariffsWithServiceName} />`.
- Deriva `tariffsWithServiceName`: por cada `tariff`, resuelve el nombre del servicio desde `professional.services`.

### Client Component (nuevo)
`src/app/(admin)/admin/profesionales/[id]/tariffs-tab.tsx` (`'use client'`)
- Props: `professionalId: string`, `tariffs: Array<{ id: string; serviceName: string; price: number; commission: number }>`.
- Renderiza las tarjetas (precio, comisión, neto) + botón "Editar" por tarifa.
- Mantiene estado del modal abierto y la tarifa seleccionada.

### Client Component (nuevo)
`src/app/(admin)/admin/profesionales/[id]/tariff-edit-modal.tsx` (`'use client'`)
- Props: `professionalId`, `tariff` ({ id, serviceName, price, commission }), `open`, `onOpenChange`.
- Usa shadcn `Dialog`, `Input` para price y commission, `Button`, `toast` (sonner), siguiendo el patrón de `delete-professional-button.tsx`.
- Estado local `price`, `commission`; neto derivado = `price - (price * commission / 100)` mostrado en vivo.
- Validación cliente (ver abajo). `fetch` PUT al endpoint; en éxito `router.refresh()` + `toast.success` + cierre; en error `toast`/mensaje inline y modal permanece abierto.

### Endpoint (nuevo)
`src/app/api/admin/professionals/[id]/tariffs/[tariffId]/route.ts`
- `PUT`. Guard ADMIN con `auth()` (patrón de `discount-tiers/[id]`): si no hay sesión o `role !== 'ADMIN'` → 403.
- Valida body con `updateTariffSchema` (Zod). Si falla → 422 con `fieldErrors`.
- Verifica que la tarifa exista y pertenezca al `professionalId` del path; si no → 404.
- `prisma.professionalTariff.update({ where: { id: tariffId }, data: { price, commission } })`.
- Responde 200 con la tarifa actualizada.

### Validación (nuevo schema)
`src/lib/validations/tariffs.ts`
```ts
export const updateTariffSchema = z.object({
  price: z.number().int().min(0, 'El precio no puede ser negativo'),
  commission: z.number().int().min(0).max(100, 'La comisión debe estar entre 0 y 100'),
});
```
Reutilizado en cliente (parse para habilitar/deshabilitar submit) y servidor (safeParse).

## Data Models

No hay cambios de esquema Prisma. Se opera sobre `ProfessionalTariff` existente:
- `id: String` (identificador de la tarifa a editar)
- `professionalId: String`, `serviceId: String`
- `price: Int` (editable, >= 0)
- `commission: Int` (editable, 0-100)

## Error Handling

- 403 FORBIDDEN: sin sesión ADMIN. El cliente muestra toast de error.
- 422 VALIDATION_ERROR: payload inválido (precio < 0, comisión fuera de 0-100, no enteros). El cliente mapea `fieldErrors` a mensajes inline.
- 404 TARIFF_NOT_FOUND: la tarifa no existe o no pertenece al profesional del path.
- 500 INTERNAL_ERROR: fallo inesperado; toast genérico, modal permanece abierto para reintento.
- Validación cliente previa evita la mayoría de los 422; el servidor re-valida como defensa.

## Testing Strategy

### Unit (Vitest + @testing-library/react)
- `TariffEditModal`: el neto se recalcula en vivo al cambiar price/commission (`price - price*commission/100`).
- `TariffEditModal`: submit deshabilitado o error inline cuando price < 0 o commission fuera de 0-100.
- `TariffEditModal`: en respuesta OK, dispara toast de éxito y `onOpenChange(false)`; en error, mantiene el modal abierto.
- `updateTariffSchema`: acepta límites válidos (price 0, commission 0 y 100) y rechaza inválidos (price -1, commission 101, no enteros).

### API (Vitest)
- `PUT .../tariffs/[tariffId]` sin sesión ADMIN → 403 y no modifica datos (mock de `auth()`).
- Con sesión ADMIN y payload válido → 200 y `prisma.professionalTariff.update` llamado con los valores correctos.
- Payload inválido → 422 sin update.
- Tarifa inexistente o de otro profesional → 404.

### Integración (manual)
- Abrir pestaña Tarifas, editar un servicio, confirmar, verificar que la tarjeta refleja el nuevo precio/comisión/neto sin recargar manualmente.
- Verificar que editar un servicio no altera las otras tarifas del profesional.

## Accessibility & Mobile (design-system)
- Modal mobile-first: inputs full-width, mínimo 16px para evitar zoom iOS, touch targets >= 44px.
- Labels asociados a inputs, foco inicial en el primer campo, cierre con Escape (shadcn Dialog ya lo provee).
- Paleta conAlma (grape/plum) coherente con el resto del admin.

## Correctness Properties

Property 1: Autorización — solo ADMIN modifica tarifas
_For any_ request to `PUT .../tariffs/[tariffId]` without an active Admin_Session, THE endpoint SHALL respond 403 and SHALL NOT change any `ProfessionalTariff`.
**Validates: Requirements 1.3, 1.4**

Property 2: Validación de rangos
_For any_ payload where `price` is not an integer >= 0 OR `commission` is not an integer in [0, 100], THE endpoint SHALL respond 422 and SHALL NOT persist changes; conversely, boundary values (price = 0, commission = 0, commission = 100) SHALL be accepted.
**Validates: Requirements 3.2, 3.3, 3.4, 3.5, 3.6**

Property 3: Aislamiento por servicio
_For any_ successful update of a Tariff `T` of professional `P`, only `T` SHALL change; every other Tariff of `P` SHALL remain identical.
**Validates: Requirements 2.1, 2.2**

Property 4: Coherencia del neto profesional
_For any_ `price` and `commission` shown in the modal, THE displayed Net_Professional SHALL equal `price - (price * commission / 100)`, and after a successful update THE Tariffs_Tab SHALL show the same recalculated net.
**Validates: Requirements 4.1, 4.2**

Property 5: Persistencia idempotente
_For any_ successful update with values `(price, commission)`, a subsequent read of the Tariff SHALL return exactly `(price, commission)`.
**Validates: Requirements 5.1**
