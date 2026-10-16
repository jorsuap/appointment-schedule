# Implementation Plan

## Overview

Plan de implementación para la edición de tarifas de profesional por admin. Se construye de abajo hacia arriba: primero el schema de validación (base compartida cliente/servidor), luego el endpoint protegido, después el modal cliente, y finalmente la integración en la pestaña Tarifas del Server Component. Cierra con un checkpoint de verificación. Stack existente: Next.js (App Router), Prisma, Zod, shadcn/ui, sonner, Vitest + @testing-library/react.

## Task Dependency Graph

```json
{
  "waves": [
    { "wave": 1, "tasks": ["1"] },
    { "wave": 2, "tasks": ["2.1"] },
    { "wave": 3, "tasks": ["2.2", "3.1"] },
    { "wave": 4, "tasks": ["3.2", "4.1"] },
    { "wave": 5, "tasks": ["4.2"] },
    { "wave": 6, "tasks": ["5"] }
  ],
  "dependencies": {
    "1": [],
    "2.1": ["1"],
    "2.2": ["2.1"],
    "3.1": ["1", "2.1"],
    "3.2": ["3.1"],
    "4.1": ["3.1"],
    "4.2": ["4.1"],
    "5": ["2.2", "3.2", "4.2"]
  }
}
```

Notas del grafo:

- Tarea 1 (schema) es la base, sin dependencias.
- 2.1 y 3.1 dependen de 1; 3.1 depende además de 2.1 (el modal consume el endpoint).
- 4.1 depende de 3.1 (monta el modal); 4.2 depende de 4.1.
- 5 (checkpoint) depende de 2.2, 3.2 y 4.2.

## Tasks

- [x] 1. Crear schema de validación de tarifas
  - Crear `src/lib/validations/tariffs.ts` con `updateTariffSchema` (Zod): `price` entero >= 0, `commission` entero entre 0 y 100 inclusive, con mensajes en español.
  - Exportar el tipo `UpdateTariffInput` inferido.
  - Escribir tests unitarios del schema: acepta límites válidos (price 0, commission 0 y 100) y rechaza inválidos (price -1, commission 101, no enteros).
  - _Requirements: 3.2, 3.3, 3.6_
  - _Properties: Property 2 (Validación de rangos)_

- [x] 2. Crear el endpoint PUT de actualización de tarifa (solo ADMIN)
  - [x] 2.1 Implementar la ruta `src/app/api/admin/professionals/[id]/tariffs/[tariffId]/route.ts`
    - Método `PUT`. Guard ADMIN con `auth()` siguiendo el patrón de `src/app/api/admin/discount-tiers/[id]/route.ts`: si no hay sesión o `role !== 'ADMIN'` → 403 FORBIDDEN sin modificar datos.
    - Validar body con `updateTariffSchema`; si falla → 422 con `fieldErrors`.
    - Verificar que la tarifa `tariffId` exista y pertenezca al `id` (professionalId) del path; si no → 404 TARIFF_NOT_FOUND.
    - `prisma.professionalTariff.update({ where: { id: tariffId }, data: { price, commission } })` y responder 200 con la tarifa actualizada.
    - _Requirements: 1.3, 1.4, 3.6, 5.1_
    - _Properties: Property 1 (Autorización), Property 2 (Validación), Property 3 (Aislamiento), Property 5 (Persistencia)_
  - [x] 2.2 Escribir tests del endpoint (Vitest, mock de `auth()` y `prisma`)
    - Sin sesión ADMIN → 403 y `prisma.update` NO llamado.
    - Sesión ADMIN + payload válido → 200 y `update` llamado con `{ price, commission }` correctos.
    - Payload inválido → 422 sin update.
    - Tarifa inexistente o de otro profesional → 404.
    - _Requirements: 1.4, 2.2, 3.6, 5.1_
    - _Properties: Property 1, Property 2, Property 3_

- [x] 3. Crear el modal de edición de tarifa (client component)
  - [x] 3.1 Implementar `src/app/(admin)/admin/profesionales/[id]/tariff-edit-modal.tsx`
    - `'use client'`. Props: `professionalId`, `tariff` ({ id, serviceName, price, commission }), `open`, `onOpenChange`.
    - Usar shadcn `Dialog`, `Input`, `Button`, `toast` (sonner) siguiendo el patrón de `delete-professional-button.tsx`.
    - Estado local `price` y `commission` inicializados desde `tariff`. Mostrar el nombre del servicio.
    - Mostrar en vivo el neto profesional = `price - (price * commission / 100)`.
    - Validación cliente con `updateTariffSchema`: deshabilitar submit y/o mostrar error inline si price < 0 o commission fuera de 0-100 o no enteros.
    - Al confirmar: `fetch` PUT a `/api/admin/professionals/${professionalId}/tariffs/${tariff.id}`. En éxito: `toast.success`, `onOpenChange(false)`, `router.refresh()`. En error: mostrar mensaje (mapear `fieldErrors`/error) y mantener el modal abierto.
    - Accesibilidad/mobile: inputs full-width, >=16px, touch targets >=44px, labels asociados.
    - _Requirements: 2.1, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 5.1, 5.2, 5.3, 5.4_
    - _Properties: Property 2, Property 4 (Neto)_
  - [x] 3.2 Escribir tests unitarios del modal (Vitest + Testing Library)
    - El neto se recalcula al cambiar price/commission.
    - Submit bloqueado / error inline con valores inválidos (price -1, commission 101).
    - Respuesta OK → toast de éxito y `onOpenChange(false)`; respuesta de error → modal permanece abierto.
    - _Requirements: 3.4, 3.5, 4.1, 5.2, 5.3_
    - _Properties: Property 2, Property 4_

- [x] 4. Extraer la pestaña Tarifas a client component con acción de editar
  - [x] 4.1 Implementar `src/app/(admin)/admin/profesionales/[id]/tariffs-tab.tsx`
    - `'use client'`. Props: `professionalId`, `tariffs: Array<{ id; serviceName; price; commission }>`.
    - Renderizar las tarjetas (precio, comisión, neto) replicando el estilo actual de la pestaña Tarifas, con un botón "Editar" por tarifa.
    - Manejar estado del modal abierto y la tarifa seleccionada; montar `TariffEditModal`.
    - _Requirements: 1.1, 1.2, 2.1, 4.2_
    - _Properties: Property 4_
  - [x] 4.2 Integrar en el Server Component `src/app/(admin)/admin/profesionales/[id]/page.tsx`
    - Derivar `tariffsWithServiceName` resolviendo el nombre de servicio desde `professional.services`.
    - Reemplazar el bloque de renderizado inline de la pestaña "tarifas" por `<TariffsTab professionalId={id} tariffs={tariffsWithServiceName} />`.
    - No cambiar la carga de datos existente (ya incluye `tariffs` y `services`).
    - _Requirements: 1.1, 1.2_

- [x] 5. Checkpoint — verificación integral
  - Ejecutar `npm test` (suite relevante) y confirmar que los tests nuevos (schema, endpoint, modal) pasan.
  - Ejecutar `npx tsc --noEmit` y `npx eslint` sobre los archivos nuevos/modificados; corregir errores.
  - Verificación manual: abrir pestaña Tarifas, editar un servicio, confirmar que la tarjeta refleja el nuevo precio/comisión/neto sin recargar y que las otras tarifas no cambian.
  - _Requirements: 1.1, 2.2, 4.2, 5.1, 5.2_
  - _Properties: Property 3, Property 4, Property 5_

## Notes

- El endpoint se ubica bajo `/api/admin/` para mantener la convención de guard ADMIN consistente con `discount-tiers`.
- Riesgo observado fuera de alcance: `DELETE /api/professionals/[id]` no valida rol ADMIN. No se corrige en este spec; queda registrado en design.md.
- No hay cambios de esquema Prisma; se opera sobre `ProfessionalTariff` existente.
- `router.refresh()` re-renderiza el Server Component para reflejar los nuevos valores sin recarga manual.
