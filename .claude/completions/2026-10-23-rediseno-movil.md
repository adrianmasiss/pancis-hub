# Rediseño móvil sin tocar escritorio (2026-10-23)

- `src/app/movil.css`, importado el último en `src/app/layout.tsx`. Todo dentro
  de `max-width: 767px` (lo de comidas, de 600px). Selectores con
  `html .app-shell` para ganar a las hojas de cada pantalla, que cargan después.
- Estructura: el escenario es una hoja de borde a borde (esquinas sólo arriba);
  títulos de página a 26px y sin el logo repetido.
- Hoy: Ingesta y Sueño lado a lado; orden copiloto → ingesta/sueño → macros →
  actividad. `sleep-card` añadida a la tarjeta de sueño para poder apuntarle.
- Nutrición: macros 2×2; el panel del plan deja de ser tarjeta; sólo la comida
  que toca llega desplegada (`focus` en `PlanMealCard`, `.meal-foods-toggle`
  oculto en escritorio); acciones de alimento neutras; cifras de la cabecera
  en flex (antes se montaban).
- Entrenamiento: maniquí más bajo para que «Iniciar entrenamiento» no quede
  bajo el dock. Progreso: pestañas 4 a partes iguales.
- Rótulos mínimo 11px y controles mínimo 34–36px en teléfono.
- Arreglos fuera de móvil: tableta (≤1023px) usa la lista apilada de comidas
  (`meal-plan.css`, la tabla se rompía); Progreso ≤1000px deja el maniquí
  `static` (un `sticky` posterior lo pegaba encima de las cifras).
- Verificado: 1440/1024/820 idénticos píxel a píxel con y sin `movil.css`;
  360/390 sin scroll horizontal; tsc, eslint y vitest de nutrición OK.
- e2e: 2 fallos previos ajenos (buscan «Sustituto rápido» y «Sustituir
  alimentos — Desayuno», que ya no están en la página).

## Segunda pasada (mismo día)

- Oscuro en teléfono: negro puro, sin foto ni ambiente, escenario sin marco;
  tarjetas planas `#141414` con canto `rgb(255 255 255 / 8%)`, sin filete
  especular ni vidrio (referencias del usuario). El claro no cambia.
- Cabecera de comida: kcal a 22px con su barra, y cuatro mosaicos con el
  NOMBRE del macro (Proteína/Carbos/Grasas/Fibra), cifra y barra.
- Progreso: el maniquí se salía de su caja por el `static` de la pasada
  anterior; ahora `relative`. Alto 420px en teléfono.
- Escritorio/tableta: diferencia de píxeles 0 otra vez.

## Tercera pasada: menos carga

- Hoy: sin párrafo del copiloto; ingesta = anillo con «0 de 2,091 kcal»
  (`.intake-ring-of`, sólo teléfono); sueño sin chip ni onda; macros 2×2 y
  «Registrar comida» como disco; adherencia en 28 puntos sin leyenda.
- Nutrición: sin «0 comidas registradas» ni el párrafo «Solo hoy»; sin vasos
  ni «en tu plan»; cada alimento = nombre, gramos y kcal; tocar la fila abre
  Sustituir / Editar / quitar (`actionsFor` en `PlanMealCard`,
  `.meal-food-hit`). Selector `nth-child(2)` de meal-plan.css cambiado a
  `.meal-row-title + .meal-cell` (el botón nuevo desplazaba el índice).
- Progreso: rangos esenciales como mosaicos 2 columnas (cifra + estado);
  «Cambio desde tu medición anterior» sin las barras.
- Escritorio/tableta: diferencia de píxeles 0; tsc, eslint, 108 tests OK.

## Cuarta pasada: menú de Progreso y movimiento

- Progreso usa `IconTabs` (como Nutrición y Entrenamiento) en escritorio y
  móvil; estilos `.progress-nav` eliminados.
- Movimiento sólo en teléfono (movil.css, sección «Movimiento»): entrada de
  tarjetas 460ms/70ms escalonado, comidas en cascada, puntos de adherencia
  por semana, despliegue de comida con filas 0fr→1fr (`.meal-foods-panel`
  nuevo en `PlanMealCard`), bandeja con `@starting-style`, hundido al tocar.
  Movimiento reducido = fundido de 200ms.
- Verificado: 1440/1024/820 sin cambios por movil.css; 523 tests vitest;
  e2e de Progreso OK; fallos previos en flujo-minimo (registro: «te faltan
  hoy» ya no se pinta) y los que dependen de él.
