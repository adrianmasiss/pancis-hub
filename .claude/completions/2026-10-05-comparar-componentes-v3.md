# Comparar: componentes v3 (barras, tarjetas esmeriladas, diferencia mínima)

**Fecha**: 5 oct 2026 · **Rama**: `diseno/sistema-del-handoff`

Se conservó la estructura (dos tarjetas + diferencia + chat) y se cambió cómo
se ven los componentes, en las dos pantallas que comparten `SwapComparisonBoard`
(sustituir un alimento y comparar comidas).

- **Barras**: línea fina de color por nutriente sobre un riel neutro, con
  extremos redondeados (el relleno usa `width`, no `scaleX`, que aplastaba la
  curva).
- **Tarjetas de alimento**: un panel esmerilado liso (brillo suave sobre fondo
  difuminado), sin tinte de papel ni filete v11.
- **Diferencia**: «vs» discreto, kcal en una píldora, y por nutriente los gramos
  con signo sobre una barrita que crece desde el centro (derecha = la
  alternativa tiene más), en la misma escala de gramos que las tarjetas.
- **Acciones**: Similares · Macros cercanos + dos círculos (lupa y +) con el
  dibujo de referencia; el + gira 90° al pasar el puntero.
  `src/components/shared/circle-glyph.tsx`.
- **Quitado**: «Otras opciones» (se vuelve a las opciones pulsando el modo
  activo) y «Añadir a la alternativa», que repetía lo que hace el +.
- **Chat**: el compositor de Copilot a tamaño compacto, con el brillo del botón
  enviar.
- En escritorio la barra de acciones ocupa también el hueco sobre la columna de
  diferencia; si no, «Macros cercanos» se cortaba en comparar comidas.

Pruebas: `tsc` y `eslint` limpios, 214 pruebas de nutrición/alimentos/compartidos.
La unitaria y la e2e que pulsaban «Otras opciones» ahora pulsan el modo activo.

## Después: volver y tipografía

- **Volver** (`src/components/shared/back-arrow-button.tsx`): círculo con
  flecha que se desliza; aparece cuando hay una alternativa elegida y reabre
  las opciones.
- **Tipografía**: dos estilos. Display semibold (600) y el NOMBRE manda (el
  usuario: «el nombre es lo principal»): nombre 36, kcal 26, título 19.
  Secundario regular (400) a 16 px. Teléfono: nombre 16, kcal 18, secundario
  11. En la página Comparar (tarjetas estrechas) el nombre baja a 28 y la foto
  a 44 px. Variables `--cmp-*` en `.swap-workbench`.
- **Quitado «Cambiar alimento o comida»** del diálogo de sustituir. En la
  página Comparar el selector de comida sigue: es como se elige la comida A.
  `comparison-source-picker.tsx` quedó sin uso.
- **Panel de opciones**: la tarjeta derecha, cuando muestra las opciones, usa
  la misma superficie negra que las tarjetas de alimento, sin marco naranja.
- En tableros estrechos (página Comparar) el selector y las acciones ocupan una
  fila entera (consulta de contenedor `cmp`), para que los rótulos de 21 px no
  se corten. El envoltorio de la página necesitó `width: 100%`: la contención
  de tamaño lo dejaba en 0 px dentro del flex.

## Bandeja, aire y movimiento

- **Bandeja** (solo oscuro): el diálogo es grafito iluminado desde arriba;
  tarjetas, panel de opciones y compositor son insertos negros con filete y
  brillo superior. Sin lavado naranja.
- **Aire**: diálogo hasta 1160 px, cuerpo 44 px de margen, tablero con 28 px
  entre columnas y 136 px de diferencia; tarjetas 26/30 px de relleno. La
  página Comparar sube a 980 px (`div.` para ganarle a alternative-explorer).
- **Movimiento** (filtrado con find-animation-opportunities): entrada en orden
  de lectura, la alternativa nueva re-entra (la tarjeta va con `key` por
  alimento), panel de opciones y sus filas, presión `scale: .96` en controles,
  respuesta del copiloto. Todo < 300 ms con la curva de la casa; reducido =
  solo opacidad.
- **Rechazado**: animar los números (se leen y cambian al teclear), rellenar
  las barras al abrir (datos que se leen), elevar tarjetas al pasar el puntero
  (el v11 lo desactivó a propósito), y animar el propio diálogo (ya lo hace).

## La muesca

Referencia del usuario: tarjeta con la esquina superior derecha recortada y
una pastilla («MARKETING») dentro del recorte. Aplicado a las tarjetas de
alimento y al panel de opciones: la pastilla lleva el papel («Tu alimento» /
«Alternativa», con un punto de su color). El recorte es una máscara SVG sobre
`::before` (el fondo pintado), no sobre la tarjeta, para que la pastilla siga
visible. La etiqueta de papel salió del flujo de la rejilla, así que el resto
de las piezas de la tarjeta se fijan a su fila.

## Barra para encontrar la alternativa

`src/components/shared/comparison-toolbar.tsx` (sustituye a `circle-glyph`,
borrado). Similares · Macros cercanos · buscar son UNA elección: pista negra y
un pulgar grafito que se desliza (`layoutId` de motion, resorte sin rebote,
0,38 s; se puede cambiar a medio camino). El activo lleva una línea naranja
fina; el naranja sigue siendo de comprometerse. «+» aparte, redondo, gira al
pasar el puntero; ← al principio. Las tres piezas a 44 px (36 en teléfono).
Los nombres accesibles no cambiaron (las pruebas siguen pasando).
Título del diálogo arriba a la izquierda, con la fecha bajo el texto.

## Prueba: la tipografía del comparador en todo el sistema

`src/app/tipografia.css`, importado en `layout.tsx` justo después de
`globals.css`. Karrik (títulos) y Geist Mono (cifras, rótulos) apuntan a
Geist; títulos y cifras a 600, la negrita 700 baja a 600. Sin capa, para
ganar a las utilidades de Tailwind. **Para volver: quitar ese import.** Si el
usuario lo aprueba, lo correcto es integrarlo en `globals.css` y DESIGN.md
(hoy dicen Karrik + Mono) y borrar el archivo.

## Agregar alimento: una hoja, tres caminos (6 oct 2026)

`features/foods/components/add-food-sheet.tsx` (+ `.css`). Todas las
entradas (`FoodFormDialog`: biblioteca, editar fila, comparar, «+») abren la
misma hoja. Caminos en un `SegmentedControl` (ahora compartido,
`components/shared/segmented-control.tsx` + `pill-controls.css`, con tema
claro/oscuro): **Etiqueta** (foto o imagen → `readNutritionLabel`, Gemini
gratuito, `thinkingBudget: 0` porque con razonamiento tardaba ~45 s; ahora
6–13 s), **Código** (cámara en vivo, hook `use-barcode-camera.ts` extraído del
escáner) y **Manual**. Todos llenan el mismo formulario; nada se guarda solo.
La conversión por porción → 100 g vive en `lib/nutrition-label.ts` (+7
pruebas), no en el modelo. Un producto escaneado sin cambiar números se
importa con su fuente (Open Food Facts); si se cambian, queda como propio.
Azúcar y sodio (opcionales) se agregaron al esquema y a las acciones.
Probado de punta a punta con una etiqueta generada: 135 kcal/30 g → 450/100 g,
guardado con sodio y azúcar, y la fila de prueba borrada después.

## La diferencia, con presencia (6 oct 2026)

Columna central como «espina» negra (mismo material que las tarjetas). kcal
a 32 px con halo naranja que late una vez por alternativa nueva, y un
veredicto («menos que el tuyo»). Nutrientes a 16 px en su color pleno, barra
de 6 px con brillo. Los números ruedan (`RollingDelta`: `useSpring` sin rebote,
se redirige al teclear gramos; movimiento reducido = salto). El lector oye
solo el valor final en un `role=status` aparte; las cifras animadas van
`aria-hidden`. Trampa: la regla tipográfica con `:is()` toma la especificidad
de su argumento más fuerte, así que estas reglas llevan `.swap-live-differences`
de más. Probado: −3 → +116 → +164 → +176 → +179 al pasar de 120 a 250 g.
