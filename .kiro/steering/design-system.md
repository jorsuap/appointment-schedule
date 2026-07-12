---
inclusion: fileMatch
fileMatchPattern: 'src/**/*.tsx'
---

# Design System — conAlma

## Mobile-First (OBLIGATORIO)

El tráfico principal viene de redes sociales (Instagram, TikTok). La mayoría de usuarios abrirán la app en el celular.

### Reglas

1. **Diseña primero para 375px** (iPhone SE), luego escala a tablet y desktop
2. **Tailwind mobile-first**: clases base son mobile, prefijos `sm:`, `md:`, `lg:` para pantallas mayores
3. **Touch targets**: Botones y elementos interactivos mínimo 44x44px
4. **Formularios**: Inputs full-width en mobile, máximo 2 columnas en desktop
5. **Tipografía**: Mínimo 16px en inputs para evitar zoom automático en iOS
6. **Espaciado**: Padding mínimo 16px (p-4) en mobile para contenido principal
7. **Scroll**: Evitar scroll horizontal. Flujo vertical siempre
8. **CTA principal**: Siempre visible, preferiblemente sticky en mobile si es paso de wizard

### Breakpoints

- Mobile: 0-639px (diseño base)
- Tablet: 640px-1023px (`sm:` y `md:`)
- Desktop: 1024px+ (`lg:` y `xl:`)

### Patrones mobile del flujo de agendamiento

- Wizard de pasos: un paso por pantalla, sin tabs laterales
- Progress indicator: barra o texto "Paso X de Y" en la parte superior
- Botón "Continuar" fijo en bottom o al final del scroll
- Cards de selección: stack vertical, touch-friendly
- Calendario: componente nativo adaptado a mobile con swipe

## Paleta de colores (conAlma)

| Token     | Hex     | Uso                                  |
| --------- | ------- | ------------------------------------ |
| `grape`   | #3C1955 | Primary, textos principales, botones |
| `plum`    | #D2AAF0 | Acentos suaves, focus rings, badges  |
| `jasmine` | #FFE169 | CTAs destacados, accent              |
| `lilac`   | #FAF5FA | Background principal                 |

## Tipografía

- **Font**: Montserrat (Google Fonts)
- **Pesos**: 300 (light), 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Headings**: bold, color grape
- **Body**: regular, color foreground o muted-foreground

## Componentes

- UI Kit: shadcn/ui (Radix + Tailwind)
- Iconos: Lucide React (viene con shadcn)
- Toasts: Sonner
