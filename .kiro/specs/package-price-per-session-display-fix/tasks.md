# Plan de Implementación

- [x] 1. Escribir test de exploración de la condición del bug
  - **Property 1: Bug Condition** - Precio por sesión muestra la tarifa base
  - **CRÍTICO**: Este test DEBE FALLAR sobre el código SIN corregir — la falla confirma que el bug existe
  - **NO intentes corregir el test ni el código cuando falle en esta tarea**
  - **NOTA**: Este test codifica el comportamiento esperado — validará el fix cuando pase tras la implementación
  - **OBJETIVO**: Provocar contraejemplos que demuestren que el bug existe
  - **Enfoque PBT acotado**: para este bug determinista, acota la propiedad a los casos concretos con descuento (`discountPerSession > 0`) para asegurar reproducibilidad
  - Renderizar `StepSessionsConfig` (`src/components/professional/packages/step-sessions-config.tsx`) con `global.fetch` mockeado (`vi.fn()`) que resuelva un `PricePreview` con descuento; esperar el debounce (~500ms) y la resolución del fetch con `waitFor`
  - Caso 1: preview `{ pricePerSession: 90000, discountPerSession: 10000, totalPrice: 480000, totalDiscount: 60000 }`, `sessionCount = 6` → aserter que "Precio por sesión" muestra `$90.000` (formato COP)
  - Caso 2: preview `{ pricePerSession: 120000, discountPerSession: 25000, totalPrice: 380000, totalDiscount: 100000 }`, `sessionCount = 4` → aserter que "Precio por sesión" muestra `$120.000`
  - Caso 3 (coherencia de pantalla): aserter que el valor de "Precio por sesión" coincide con el valor por sesión del subtítulo "N sesiones × $X c/u", y que `(pricePerSession − discountPerSession) × sessionCount === totalPrice`
  - Las aserciones deben coincidir con las Expected Behavior Properties del diseño (Property 1)
  - Ejecutar el test sobre el código SIN corregir con `npm test`
  - **RESULTADO ESPERADO**: el test FALLA (correcto — prueba que el bug existe; el código muestra `$100.000`/`$145.000` en lugar de `$90.000`/`$120.000`)
  - Documentar los contraejemplos encontrados: "Precio por sesión" muestra `pricePerSession + discountPerSession` en vez de `pricePerSession`
  - Marcar la tarea como completa cuando el test esté escrito, ejecutado y la falla documentada
  - _Requirements: 1.1, 1.2, 2.1, 2.2_

- [x] 2. Escribir tests de preservación basados en propiedades (ANTES de implementar el fix)
  - **Property 2: Preservation** - Casos sin descuento y valores no afectados
  - **IMPORTANTE**: Seguir la metodología de observación primero (observation-first)
  - Observar el comportamiento del código SIN corregir para entradas sin descuento (`discountPerSession === 0`): "Precio por sesión" muestra la tarifa base (`base + 0 = base`)
  - Con `fast-check`: generar `pricePerSession` arbitrario (entero positivo) con `discountPerSession = 0` y aserter que el valor mostrado de "Precio por sesión" es `format(pricePerSession)` — propiedad que debe cumplirse para cualquier base generada (equivalencia `F(X) = F'(X)` cuando `discountPerSession === 0`)
  - Observar y aserter que "Descuento por sesión" (`-{discountPerSession}`), "Ahorro total" (`-{totalDiscount}`) y "Total del paquete" (`{totalPrice}`) muestran los mismos valores en entradas con y sin descuento
  - Observar y aserter que el subtítulo "N sesiones × $X c/u" sigue usando `preview.pricePerSession` como valor por sesión
  - Observar que para el caso sin descuento NO se renderizan las filas de "Descuento por sesión" ni "Ahorro total"
  - Ejecutar los tests sobre el código SIN corregir con `npm test`
  - **RESULTADO ESPERADO**: los tests PASAN (confirman el comportamiento base a preservar)
  - Marcar la tarea como completa cuando los tests estén escritos, ejecutados y pasando sobre el código sin corregir
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Fix para "Precio por sesión" inflado por suma indebida del descuento

  - [x] 3.1 Implementar el fix
    - En `src/components/professional/packages/step-sessions-config.tsx` (~línea 155), reemplazar la expresión defectuosa `{formatCOP.format(preview.pricePerSession + preview.discountPerSession)}` por `{formatCOP.format(preview.pricePerSession)}`
    - Eliminar el único término sobrante (`+ preview.discountPerSession`); mostrar la tarifa base directamente
    - NO modificar el subtítulo (~línea 198, ya usa `preview.pricePerSession`), el endpoint `POST /api/professional/packages/calculate`, el motor `src/lib/packages/discount-engine.ts` ni los datos
    - _Bug_Condition: isBugCondition(X) donde X.discountPerSession > 0 (del diseño)_
    - _Expected_Behavior: renderPrecioPorSesion'(X) = format(X.pricePerSession) (del diseño)_
    - _Preservation: Preservation Requirements del diseño (descuento, ahorro, total, subtítulo, endpoint y motor sin cambios)_
    - _Requirements: 2.1, 2.2_

  - [x] 3.2 Verificar que el test de exploración de la condición del bug ahora pasa
    - **Property 1: Expected Behavior** - Precio por sesión muestra la tarifa base
    - **IMPORTANTE**: Re-ejecutar el MISMO test de la tarea 1 — NO escribir un test nuevo
    - El test de la tarea 1 codifica el comportamiento esperado; al pasar, confirma que el comportamiento esperado se satisface
    - Ejecutar el test de exploración de la tarea 1 con `npm test`
    - **RESULTADO ESPERADO**: el test PASA ("Precio por sesión" = `$90.000`/`$120.000`, coherente con subtítulo y total)
    - _Requirements: 2.1, 2.2_

  - [x] 3.3 Verificar que los tests de preservación siguen pasando
    - **Property 2: Preservation** - Casos sin descuento y valores no afectados
    - **IMPORTANTE**: Re-ejecutar los MISMOS tests de la tarea 2 — NO escribir tests nuevos
    - Ejecutar los tests de preservación de la tarea 2 con `npm test`
    - **RESULTADO ESPERADO**: los tests PASAN (confirman que no hay regresiones en descuento, ahorro, total ni subtítulo)
    - Confirmar que todos los tests siguen pasando tras el fix
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 4. Checkpoint - Asegurar que todos los tests pasan
  - Ejecutar la suite completa con `npm test` y confirmar que todos los tests pasan (exploración + preservación)
  - Verificar manualmente en el wizard (paso 2) que al alternar entre un `sessionCount` con descuento y uno sin descuento, "Precio por sesión" refleja siempre la tarifa base sin inflarse y la pantalla es coherente
  - Ante cualquier duda o resultado inesperado, consultar al usuario
  - _Requirements: 2.1, 2.2, 3.1, 3.2, 3.3, 3.4_
