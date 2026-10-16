# Diseño del Bugfix — package-price-per-session-display-fix

## Overview

En el paso 2 ("Configurar Sesiones") del wizard de creación de paquetes, el campo "Precio por sesión" del resumen de precio muestra un valor inflado e inexistente cuando hay descuento. La expresión que lo renderiza suma indebidamente el descuento a la tarifa base:

```tsx
formatCOP.format(preview.pricePerSession + preview.discountPerSession)
```

Como `preview.pricePerSession` YA es la tarifa base real devuelta por el endpoint (`tariff.price`), sumarle el descuento produce un tercer valor que no existe en ninguna fuente de datos (ej. $90.000 + $10.000 = $100.000). El resto de la pantalla (subtítulo "N sesiones × $X c/u" y "Total del paquete") sí usa la base correcta, por lo que la pantalla se contradice a sí misma.

El fix es mínimo, acotado y de una sola línea en la capa de presentación: mostrar `preview.pricePerSession` directamente. NO se tocan el motor de cálculo (`discount-engine.ts`), el endpoint `POST /api/professional/packages/calculate`, ni los datos en base de datos. La corrección elimina la contradicción visual sin alterar ningún cálculo subyacente.

## Glosario

- **Bug_Condition (C)**: La condición que dispara el bug — existe un descuento por sesión mayor a cero (`preview.discountPerSession > 0`), rama en la que el componente suma el descuento a la tarifa base al renderizar "Precio por sesión".
- **Property (P)**: El comportamiento deseado — "Precio por sesión" debe mostrar la tarifa base real (`preview.pricePerSession`) sin sumarle el descuento, y la pantalla debe ser internamente coherente.
- **Preservation**: El comportamiento que debe permanecer sin cambios — los valores de "Descuento por sesión", "Ahorro total", "Total del paquete", el subtítulo, el contrato del endpoint, el motor de cálculo, y el caso sin descuento del propio "Precio por sesión".
- **PricePreview**: El objeto respuesta del endpoint calculate que se renderiza en el paso 2. Campos: `pricePerSession` (tarifa base real), `discountPerSession`, `totalPrice`, `totalDiscount`.
- **StepSessionsConfig**: El componente en `src/components/professional/packages/step-sessions-config.tsx` que renderiza el paso 2 del wizard y muestra el resumen de precio a partir de `PricePreview`.
- **F**: Función original (defectuosa) — `renderPrecioPorSesion(X) = format(X.pricePerSession + X.discountPerSession)`.
- **F'**: Función corregida — `renderPrecioPorSesion'(X) = format(X.pricePerSession)`.

## Bug Details

### Bug Condition

El bug se manifiesta visiblemente cuando el `PricePreview` renderizado en el paso 2 tiene un descuento por sesión mayor a cero. En esa rama, el componente `StepSessionsConfig` suma el descuento a la tarifa base al construir la cadena de "Precio por sesión", produciendo un valor inflado que no corresponde ni a la base ni al neto con descuento. Es un defecto puramente de presentación: los datos recibidos del endpoint son correctos; solo la expresión de formateo es incorrecta.

**Especificación Formal:**
```
FUNCTION isBugCondition(X)
  INPUT: X de tipo PricePreview (respuesta del endpoint calculate renderizada en el paso 2)
  OUTPUT: boolean

  // El defecto se manifiesta cuando hay descuento, ya que la rama defectuosa
  // suma discountPerSession a pricePerSession al renderizar "Precio por sesión".
  RETURN X.discountPerSession > 0
END FUNCTION
```

### Examples

- **Caso típico con descuento (manifiesta el bug):** tarifa base $90.000, descuento $10.000/sesión, 6 sesiones. Esperado: "Precio por sesión" = $90.000. Actual: $90.000 + $10.000 = **$100.000** (incorrecto). El total ($480.000) y el subtítulo ("6 sesiones × $90.000 c/u") solo son coherentes con $90.000, no con $100.000.
- **Caso con descuento distinto (manifiesta el bug):** tarifa base $120.000, descuento $25.000/sesión, 4 sesiones. Esperado: $120.000. Actual: **$145.000** (incorrecto).
- **Caso sin descuento (NO manifiesta el bug):** tarifa base $90.000, descuento $0, 1 sesión. Esperado y actual: $90.000 + $0 = **$90.000** (correcto, idéntico antes y después del fix).
- **Caso borde — sessionCount >= 2 pero sin tier aplicable (NO manifiesta el bug):** `discountPerSession = 0`, por lo que "Precio por sesión" = base + 0 = base. Comportamiento preservado.

## Expected Behavior

### Preservation Requirements

**Comportamientos sin cambios:**
- "Descuento por sesión" (`-{formatCOP.format(preview.discountPerSession)}`) se muestra igual que hoy.
- "Ahorro total" (`-{formatCOP.format(preview.totalDiscount)}`) se muestra igual que hoy.
- "Total del paquete" (`formatCOP.format(preview.totalPrice)`) se muestra igual que hoy.
- El subtítulo "N sesiones × $X c/u" sigue usando `preview.pricePerSession` como valor por sesión.
- El contrato y la lógica del endpoint `POST /api/professional/packages/calculate` (devuelve `pricePerSession = tariff.price`, `discountPerSession`, `totalPrice`, `totalDiscount`).
- El motor de cálculo `src/lib/packages/discount-engine.ts` y los datos en base de datos.
- Para el caso sin descuento (`discountPerSession === 0`), "Precio por sesión" sigue mostrando `preview.pricePerSession` sin alteración.

**Alcance:**
Todas las entradas donde NO se cumple la condición del bug (`discountPerSession === 0`) deben quedar completamente inalteradas por este fix. El fix solo cambia la expresión de formateo del campo "Precio por sesión". No afecta:
- El cálculo de descuentos, ahorro total ni total del paquete.
- El comportamiento del endpoint ni del motor de cálculo.
- La maquetación, estilos ni el resto de la UI del wizard.

**Nota:** El comportamiento correcto esperado para el caso con descuento se define en la sección Correctness Properties (Property 1).

## Hypothesized Root Cause

La causa raíz está confirmada por lectura directa del código y es única:

1. **Suposición incorrecta sobre la semántica de `pricePerSession`**: El componente asume que `preview.pricePerSession` viene como neto con el descuento ya restado, por lo que le vuelve a sumar `discountPerSession` para "reconstruir" la base. En realidad el endpoint devuelve `pricePerSession = tariff.price`, es decir la base real sin descuento. La suma produce `base + descuento`, un valor que no existe en ningún lado.
   - `src/components/professional/packages/step-sessions-config.tsx`, línea ~155.
   - Expresión defectuosa: `formatCOP.format(preview.pricePerSession + preview.discountPerSession)`.

2. **Contradicción interna evidenciada por el resto de la pantalla**: El subtítulo (línea ~198) ya usa `preview.pricePerSession` correctamente, y "Total del paquete" proviene del motor. Esto demuestra que la fuente de verdad es la base real y que solo la expresión de "Precio por sesión" está desalineada.

No hay otras hipótesis que explorar: el defecto no está en el cálculo, en el contrato del endpoint ni en los datos, sino exclusivamente en la expresión de formateo del campo "Precio por sesión".

## Correctness Properties

Property 1: Bug Condition - Precio por sesión muestra la tarifa base

_For any_ `PricePreview` donde la condición del bug se cumple (`isBugCondition` retorna true, es decir `discountPerSession > 0`), el componente corregido SHALL mostrar en "Precio por sesión" el valor de `preview.pricePerSession` directamente (la tarifa base real), sin sumarle el descuento; y la pantalla SHALL ser internamente coherente, de modo que el valor mostrado de "Precio por sesión" sea igual al valor por sesión del subtítulo y que `(pricePerSession − discountPerSession) × sessionCount` sea igual a `totalPrice`.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - Casos sin descuento y valores no afectados

_For any_ `PricePreview` donde la condición del bug NO se cumple (`isBugCondition` retorna false, es decir `discountPerSession === 0`), el componente corregido SHALL producir exactamente el mismo resultado que el componente original para "Precio por sesión" (`base + 0 = base`), preservando el comportamiento existente; y para todas las entradas (con o sin descuento), los valores de "Descuento por sesión", "Ahorro total", "Total del paquete" y el subtítulo SHALL permanecer idénticos a los actuales, al igual que el contrato del endpoint y la lógica del motor de cálculo.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4**

## Fix Implementation

### Changes Required

Asumiendo que el análisis de causa raíz es correcto (lo está, confirmado por lectura del código):

**Archivo**: `src/components/professional/packages/step-sessions-config.tsx`

**Ubicación**: línea ~155, dentro del bloque de "Precio por sesión" del resumen de precio.

**Cambios específicos**:
1. **Eliminar la suma del descuento en "Precio por sesión"**: reemplazar la expresión defectuosa por el valor base directo.

   Antes (F):
   ```tsx
   <span className="text-sm font-medium text-foreground">
     {formatCOP.format(preview.pricePerSession + preview.discountPerSession)}
   </span>
   ```

   Después (F'):
   ```tsx
   <span className="text-sm font-medium text-foreground">
     {formatCOP.format(preview.pricePerSession)}
   </span>
   ```

2. **No se requieren más cambios.** El subtítulo (línea ~198) ya usa `preview.pricePerSession` correctamente; el resto del componente, el endpoint, el motor y los datos quedan intactos. El fix es de una sola línea y sin efectos colaterales: elimina el único término sobrante (`+ preview.discountPerSession`).

## Testing Strategy

### Validation Approach

La estrategia sigue un enfoque de dos fases: primero, provocar contraejemplos que demuestren el bug sobre el código SIN corregir; luego, verificar que el fix funciona y que preserva el comportamiento existente. El proyecto ya dispone de `vitest`, `@testing-library/react` + `jsdom` y `fast-check` (ver `package.json`), por lo que las pruebas unitarias, de componente y basadas en propiedades son ejecutables con `npm test`.

Las peticiones de red al endpoint `calculate` se mockean (ej. `vi.fn()` sobre `global.fetch`) para inyectar `PricePreview` controlados, dado que el bug es puramente de presentación y no depende del backend.

### Exploratory Bug Condition Checking

**Objetivo**: Provocar contraejemplos que demuestren el bug ANTES de implementar el fix. Confirmar o refutar el análisis de causa raíz. Si se refuta, habrá que re-hipotetizar.

**Plan de prueba**: Renderizar `StepSessionsConfig` con un `fetch` mockeado que resuelva un `PricePreview` con descuento, esperar el debounce (500ms) y la resolución, y aserter el texto renderizado en "Precio por sesión". Ejecutar sobre el código SIN corregir para observar la falla.

**Casos de prueba**:
1. **Precio con descuento típico**: preview `{ pricePerSession: 90000, discountPerSession: 10000, totalPrice: 480000, totalDiscount: 60000 }`, sessionCount 6. Se espera que "Precio por sesión" muestre $90.000 (fallará en el código sin corregir, que muestra $100.000).
2. **Precio con descuento distinto**: preview `{ pricePerSession: 120000, discountPerSession: 25000, ... }`, sessionCount 4. Se espera $120.000 (fallará mostrando $145.000).
3. **Coherencia de pantalla**: aserter que el valor de "Precio por sesión" coincide con el valor por sesión del subtítulo "N sesiones × $X c/u" (fallará en el código sin corregir por la discrepancia $100.000 vs $90.000).

**Contraejemplos esperados**:
- "Precio por sesión" muestra `pricePerSession + discountPerSession` en lugar de `pricePerSession`.
- Causa: la expresión de formateo suma indebidamente el descuento a la tarifa base.

### Fix Checking

**Objetivo**: Verificar que para toda entrada donde se cumple la condición del bug, el componente corregido produce el comportamiento esperado.

**Pseudocódigo:**
```
FOR ALL X WHERE isBugCondition(X) DO            // X.discountPerSession > 0
  mostrado := renderPrecioPorSesion_fixed(X)
  ASSERT mostrado = format(X.pricePerSession)
  // Coherencia global de la pantalla:
  ASSERT (X.pricePerSession - X.discountPerSession) * X.sessionCount = X.totalPrice
END FOR
```

### Preservation Checking

**Objetivo**: Verificar que para toda entrada donde NO se cumple la condición del bug, el componente corregido produce el mismo resultado que el original.

**Pseudocódigo:**
```
FOR ALL X WHERE NOT isBugCondition(X) DO        // X.discountPerSession === 0
  // Sin descuento: X.pricePerSession + 0 = X.pricePerSession
  ASSERT F(X) = F'(X)
END FOR
```

**Enfoque de pruebas**: La prueba basada en propiedades es idónea para la preservación porque:
- Genera muchos casos automáticamente sobre el dominio de entrada (`pricePerSession` arbitrario, `discountPerSession = 0`).
- Captura casos borde que las pruebas unitarias manuales podrían omitir.
- Da garantías fuertes de que el valor mostrado del precio por sesión es idéntico antes y después del fix cuando no hay descuento.

**Plan de prueba**: Observar el comportamiento del código SIN corregir para el caso sin descuento, y escribir pruebas basadas en propiedades que confirmen que `F(X) = F'(X)` para `discountPerSession === 0`. Dado que `F` y `F'` coinciden exactamente cuando `discountPerSession = 0`, la propiedad debe mantenerse para cualquier `pricePerSession` generado.

**Casos de prueba**:
1. **Preservación sin descuento**: observar que "Precio por sesión" muestra la base cuando `discountPerSession === 0` en el código sin corregir, y verificar que sigue igual tras el fix.
2. **Preservación de descuento/ahorro/total**: verificar que "Descuento por sesión", "Ahorro total" y "Total del paquete" muestran los mismos valores antes y después del fix para entradas con y sin descuento.
3. **Preservación del subtítulo**: verificar que "N sesiones × $X c/u" sigue usando `preview.pricePerSession`.

### Unit Tests

- Renderizar `StepSessionsConfig` con un `PricePreview` con descuento (mock de `fetch`) y aserter que "Precio por sesión" muestra `pricePerSession` formateado (ej. $90.000), no `pricePerSession + discountPerSession`.
- Aserter que "Descuento por sesión", "Ahorro total" y "Total del paquete" se mantienen (ej. -$10.000, -$60.000, $480.000).
- Caso sin descuento (`discountPerSession = 0`): aserter que "Precio por sesión" muestra la base y que no se renderizan las filas de descuento/ahorro.
- Caso borde: `sessionCount = 1` (el motor nunca aplica descuento) → preview con `discountPerSession = 0`, comportamiento preservado.

### Property-Based Tests

- Con `fast-check`: generar `pricePerSession` arbitrario (entero positivo) con `discountPerSession = 0` y verificar que el valor mostrado de "Precio por sesión" en F' es igual al de F (preservación, Property 2).
- Generar `pricePerSession` y `discountPerSession > 0` (con `discountPerSession < pricePerSession`) y `sessionCount >= 2`, derivando `totalPrice = (pricePerSession - discountPerSession) * sessionCount`; verificar que F' muestra `pricePerSession` y que la coherencia `(pricePerSession - discountPerSession) * sessionCount === totalPrice` se cumple (Property 1).

### Integration Tests

- Flujo del wizard de paquetes: avanzar al paso 2, cambiar la cantidad de sesiones para disparar el fetch (debounced), y verificar que el resumen completo es coherente (Precio por sesión = valor del subtítulo, y total = (base − descuento) × sesiones).
- Verificar que al alternar entre un `sessionCount` con descuento y uno sin descuento, "Precio por sesión" refleja siempre la tarifa base sin inflarse.
