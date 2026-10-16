# Documento de Requisitos del Bugfix

## Introducción

En el wizard de creación de paquetes de sesiones, paso 2 ("Configurar Sesiones"), el resumen de precio muestra un valor de "Precio por sesión" que contradice al resto de la pantalla.

Para una tarifa base de $90.000 por sesión, un descuento de $10.000 por sesión y 6 sesiones, el resumen muestra:

- "Precio por sesión": **$100.000** (incorrecto, debería ser $90.000)
- "Descuento por sesión": -$10.000 (correcto)
- "Ahorro total": -$60.000 (correcto)
- "Total del paquete": $480.000 (correcto)
- Subtítulo: "6 sesiones × $90.000 c/u" (correcto)

La misma pantalla se contradice: arriba indica $100.000 pero el subtítulo dice $90.000 c/u, y el total ($480.000) solo es coherente con $90.000.

La causa raíz está en `src/components/professional/packages/step-sessions-config.tsx`. La expresión que renderiza "Precio por sesión" suma indebidamente el descuento a la tarifa base:

```
formatCOP.format(preview.pricePerSession + preview.discountPerSession)
```

El campo `preview.pricePerSession` que devuelve el endpoint `POST /api/professional/packages/calculate` YA es el precio base real de la tarifa ($90.000), tomado de `professional_tariffs.price`. NO es el neto con descuento aplicado. El componente asume erróneamente que `pricePerSession` ya viene con el descuento restado, por lo que le vuelve a sumar el descuento para "reconstruir" la base, produciendo $90.000 + $10.000 = $100.000: un valor que no existe en ninguna fuente de datos.

El impacto es que el profesional ve una tarifa por sesión incorrecta e inflada en el resumen, lo que genera desconfianza en el total mostrado aunque el total sea correcto.

El motor de cálculo (`src/lib/packages/discount-engine.ts`), el endpoint de cálculo y los datos en base de datos (tarifa y tiers de descuento) son correctos y NO deben modificarse.

## Análisis del Bug

### Comportamiento Actual (Defecto)

1.1 WHEN el usuario está en el paso 2 "Configurar Sesiones" del wizard de paquetes y existe un descuento por sesión mayor a cero (`preview.discountPerSession > 0`) THEN el sistema muestra en "Precio por sesión" el resultado de `preview.pricePerSession + preview.discountPerSession`, es decir la tarifa base más el descuento, produciendo un valor inflado inexistente (ej. $100.000 en lugar de $90.000)

1.2 WHEN el "Precio por sesión" se muestra inflado pero el subtítulo "N sesiones × $X c/u" y el "Total del paquete" se calculan con la tarifa base real THEN el sistema presenta una pantalla internamente contradictoria (ej. "Precio por sesión $100.000" junto a "6 sesiones × $90.000 c/u" y total $480.000)

### Comportamiento Esperado (Correcto)

2.1 WHEN el usuario está en el paso 2 "Configurar Sesiones" del wizard de paquetes y existe un descuento por sesión mayor a cero THEN el sistema SHALL mostrar en "Precio por sesión" el valor de `preview.pricePerSession` directamente (la tarifa base real, ej. $90.000), sin sumarle el descuento

2.2 WHEN se muestran "Precio por sesión", "Descuento por sesión", "Total del paquete" y el subtítulo "N sesiones × $X c/u" THEN el sistema SHALL presentar valores coherentes entre sí, de modo que `Precio por sesión` sea igual al valor por sesión del subtítulo y que `(Precio por sesión − Descuento por sesión) × N` sea igual al `Total del paquete` (ej. precio $90.000, descuento $10.000, total $480.000)

### Comportamiento Sin Cambios (Prevención de Regresiones)

3.1 WHEN no existe descuento por sesión (`preview.discountPerSession === 0`) THEN el sistema SHALL CONTINUE TO mostrar en "Precio por sesión" el valor de `preview.pricePerSession` sin alteración, igual que hoy (sin descuento, base más cero = base)

3.2 WHEN se calculan "Descuento por sesión", "Ahorro total" y "Total del paquete" THEN el sistema SHALL CONTINUE TO mostrar los mismos valores que hoy, ya que provienen del endpoint y del motor de cálculo que son correctos y no se modifican

3.3 WHEN el endpoint `POST /api/professional/packages/calculate` recibe una solicitud THEN el sistema SHALL CONTINUE TO devolver `pricePerSession = tariff.price` (tarifa base), `discountPerSession`, `totalPrice` y `totalDiscount` sin cambios en su contrato ni en su lógica

3.4 WHEN el subtítulo "N sesiones × $X c/u" se renderiza THEN el sistema SHALL CONTINUE TO usar `preview.pricePerSession` como valor por sesión, igual que hoy

## Condición del Bug y Propiedades

### Función de Condición del Bug

```pascal
FUNCTION isBugCondition(X)
  INPUT: X de tipo PricePreview (respuesta del endpoint calculate renderizada en el paso 2)
  OUTPUT: boolean

  // El defecto se manifiesta visiblemente cuando hay descuento,
  // ya que la rama suma el descuento a la base.
  RETURN X.discountPerSession > 0
END FUNCTION
```

### Especificación de la Propiedad (Fix Checking)

```pascal
// Propiedad: Fix Checking - El precio por sesión mostrado es la tarifa base
FOR ALL X WHERE isBugCondition(X) DO
  mostrado ← renderPrecioPorSesion'(X)
  ASSERT mostrado = X.pricePerSession
  // Coherencia global de la pantalla:
  ASSERT (X.pricePerSession - X.discountPerSession) * X.sessionCount = X.totalPrice
END FOR
```

Donde:
- **F**: `renderPrecioPorSesion(X) = format(X.pricePerSession + X.discountPerSession)` (código actual, defectuoso)
- **F'**: `renderPrecioPorSesion'(X) = format(X.pricePerSession)` (código corregido)

### Objetivo de Preservación (Preservation Checking)

```pascal
// Propiedad: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  // Sin descuento, discountPerSession = 0, por lo que
  // X.pricePerSession + 0 = X.pricePerSession
  ASSERT F(X) = F'(X)
END FOR
```

Esto garantiza que, para los casos sin descuento, el valor mostrado del precio por sesión es idéntico antes y después del fix.
