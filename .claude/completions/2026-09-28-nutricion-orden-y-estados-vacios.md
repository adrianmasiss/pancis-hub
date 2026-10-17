# Nutrición: orden según la maqueta + sistema de estados vacíos

**Fecha**: 2026-09-28
**Rama**: `diseno/sistema-del-handoff`

## Qué se pidió

1. Que la pantalla de Nutrición quedara tan ordenada como la maqueta de Figma
   (`Desktop / Nutrition Dashboard`).
2. Que los estados vacíos —empezando por «no hay dieta»— ayudaran al usuario,
   siguiendo las cuatro reglas de las referencias aportadas: guiar al usuario,
   ofrecer alternativas, cargar el espacio con contenido, y escribir con un
   tono que coincida con el momento.

Decisión tomada con el usuario: sin dieta, **una sola superficie de
bienvenida** (no el tablero saneado), y alcance **toda Nutrición**.

## Qué se cambió

### Orden (estado con datos)

- **`nutrition-overview.tsx` + `nutrition-dashboard.css`** — las cuatro
  tarjetas del resumen compartían caja pero no estructura: calorías ponía la
  nota antes de la barra y los macros después, así que las cuatro barras caían
  a alturas distintas. Ahora todas siguen `rótulo / cifra / barra / nota` sobre
  una rejilla `auto 1fr auto auto`, que es lo que las alinea. Rótulos en mono
  10px +0.11em (rol `label` de DESIGN.md).
- **`nutrition-overview.tsx`** — el pie del resumen era una línea suelta pegada
  a la rejilla; ahora es un cierre con filete y aire propio. La frase «0 kcal
  pendientes del plan» ya no aparece cuando no hay plan.
- **`plan-meal-card.tsx`** — el rótulo del grupo repetía el nombre de la comida
  y la fila listaba los alimentos, así que la misma comida se anunciaba dos
  veces con dos textos distintos. Ahora el rótulo es el **tipo** y el título de
  la fila es el **nombre**, como en la maqueta. Los `snack` se desambiguan por
  su propia hora (Media mañana / Merienda / Antes de dormir): un plan típico
  llevaba dos filas rotuladas «SNACK».
- **`nutrition-workspace.tsx`** — «Registro del día» flotaba sin superficie;
  ahora es una tarjeta como las de arriba. La columna lateral desaparece cuando
  el plan no tiene comidas, en vez de mostrar dos tarjetas con guiones.
- **`nutrition-meal-insights.tsx`** — la tarjeta decía «Selecciona una comida
  del plan» incluso con una ya seleccionada y resaltada. Ahora nombra lo que se
  está mirando.
- **Móvil** — las pestañas cortaban «Historial» a media palabra sin señal de
  que la fila seguía: máscara de degradado + relleno final. El pie del resumen
  ya no deja un `·` huérfano al principio de la línea siguiente.

### Estados vacíos

`EmptyState` (`src/components/shared/empty-state.tsx`) se amplió de forma
retrocompatible con `size` (`inline` | `page`), `tone`, `secondaryAction`,
`suggestions` y `surface`. Los 11 usos anteriores siguen igual.

| Estado | Dónde | Tratamiento |
|---|---|---|
| Sin dieta ni registros | Nutrición / Mi plan | Superficie de página completa: sin ceros, sin tarjetas muertas. Dos salidas + tres alternativas |
| Sin dieta, con comidas sueltas | Panel del plan | Vacío en línea; el resumen de arriba sí es dato real |
| Dieta sin comidas | Panel del plan | Vacío en línea → Gestionar dieta |
| Día sin registros | Registro del día | Tono cálido, explica las dos vías de registro |
| Búsqueda sin resultados | Biblioteca de alimentos | Devuelve los filtros que sí tienen contenido, uno a uno |
| Historial sin datos | Tendencias | Tono llano (ausencia de dato de salud, no bandeja vacía) + salida |

El tono se separó a propósito, según la regla 4 de las referencias: la bandeja
sin estrenar admite calidez; la ausencia de un dato de salud, no.

## Fallo previo encontrado al verificar

**En tema claro, Nutrición entera era ilegible.** El bloque «material oscuro de
Nutrición» de `nutrition-workspace.css` declaraba la tinta (`--foreground:
#f4f4f2`) pero nunca pintaba su papel — las hojas en portal sí lo hacen. En
oscuro no se notaba porque el escenario ya era oscuro; en claro dejaba texto
casi blanco sobre crema, cabecera y pestañas incluidas. Medido en el navegador,
no a ojo.

Arreglado pintando el fondo **solo en claro**, así el tema oscuro queda byte a
byte como estaba. Se cerraron además dos fugas de la segunda paleta: el isotipo
y el botón de marca se pintaban desde `--pc-primary` (morado en claro) en vez
de `--primary`, y el punto de Grasas desde `--chart-3`.

## Verificación

- Capturas en escritorio (1440) y móvil (402), en los **dos temas**, con datos
  y vacío.
- `tsc --noEmit` limpio · `eslint` limpio · **524 tests en 46 archivos**.
- Detector de Impeccable: 39 hallazgos, todos `advisory` y del tipo que ya
  tenía el archivo (literales px fuera de la rampa). Ninguno bloqueante.

## Nota sobre datos

El usuario demo **no tenía dieta**, que es justo el caso pedido. Para ver el
estado con datos se sembró un plan temporal de 5 comidas y **se borró al
terminar**: la base queda como estaba (0 dietas para `demo@pancis.local`).

---

## Añadido después: interruptor de dieta en el panel de Fondos

Petición: poder activar y desactivar una dieta desde el mismo botón, para ver
las dos pantallas sin tocar la base de datos a mano.

- **`src/features/nutrition/dieta-demo-actions.ts`** — acciones de servidor
  `estadoDeLaDieta`, `alternarDieta` y `borrarPlanDeEjemplo`.
- **`background-switcher.tsx`** — grupo «Dieta del usuario» arriba del panel,
  con las pastillas `Con dieta` / `Sin dieta` y una nota que dice qué hará el
  encendido según el estado de la cuenta.

Decisiones:

- **Pasa por el camino real.** Apagar baja `is_active`, que es exactamente lo
  que filtra `getDietPlanForDate`. No es una maqueta del vacío; es el vacío.
- **Apagar nunca borra.** El plan queda entero con sus comidas y vuelve tal
  cual al encender. Verificado: apagar → encender devuelve las 5 filas y la
  base sigue con una sola plantilla, no dos.
- **Si la cuenta no tiene ningún plan**, encender siembra uno de ejemplo de
  cinco comidas con hora; sin eso el interruptor no serviría en la cuenta que
  justo hay que poder mirar. El plan lleva nombre marcador y se puede quitar
  desde el propio panel, con confirmación de dos pulsaciones.
- **Doble candado de producción.** La interfaz ya estaba tras `CON_SELECTOR`,
  pero la acción de servidor comprueba el entorno por su cuenta: esconder un
  botón no cierra una ruta.
- El panel tiene ahora techo de altura y se desplaza por dentro: con el grupo
  nuevo pasaba de largo en una pantalla de portátil.

Estado en que queda la base local: el plan de ejemplo **queda sembrado y
activo**, para que el interruptor tenga las dos posiciones desde el primer
momento. Se quita con «Borrar plan de ejemplo».

---

## Añadido después: fuera el registro, y acento en dos tarjetas

### «Registro del día» absorbido, no borrado

La sección repetía la lista entera debajo de la del plan: la misma comida
aparecía dos veces, una con casilla y otra en un desplegable. Se retira, y su
contenido se reparte donde ya tenía sentido:

- Lo registrado del plan ya se ve en su propia fila («Registrada»).
- Las comidas ajenas al plan cierran **la misma lista** bajo el rótulo «Fuera
  del plan», con filete discontinuo y un desplegable que abre `MealCard` +
  comparar — o sea, editar y comparar siguen dentro (`logged-meal-row.tsx`).
- «Agregar comida» es la fila de filete discontinuo que remata la lista. Ese
  es justo el `trigger="plan-row"` que ya existía: en la cabecera se salía de
  la tarjeta y el discontinuo no tenía a qué referirse.
- El menú de acciones secundarias (Duplicar ayer, etc.) sube a la cabecera.

Filtro clave: solo entran las comidas **sin** `sourceTemplateMealId`. Las que
sí salen del plan ya están arriba, y mostrarlas otra vez sería contar dos veces
la misma comida.

### Acento: filete de esquinas en turquesa, en dos tarjetas

- **Calorías** (la cifra que manda) y **Sustituto rápido** (la única
  accionable) recuperan el filete cónico del v11, teñido de `--chart-1`, más
  un tinte radial bajísimo. Las otras siguen mates.
- **Dos y no ocho a propósito.** Con las cuatro del resumen el color dejaría de
  decir «mira esto» para decir «esto es un macro» — el «código de disco» ya
  descartado.
- **La barra de calorías se queda naranja.** DESIGN.md reserva naranja para
  energía y turquesa para macros; teñirla invertía justo eso. El acento vive en
  el filete, que no representa ninguna magnitud.
- Liso, no vidrio: sobre la losa oscura el vidrio queda vidrio-sobre-vidrio.
- Respeta `prefers-reduced-motion` (sin giro) y `prefers-reduced-transparency`
  (sin tinte, filete intacto).

Ambos cambios revierten cosas escritas en DESIGN.md («sin perímetros
luminosos», «registro del día»), así que **DESIGN.md queda actualizado** con
las dos excepciones y su porqué.

### Verificado

Pulsando en el navegador: la fila «Fuera del plan» aparece, se despliega y el
chevron rota. Escritorio y móvil, en los dos temas. 524 tests pasan.

Un fallo propio por el camino: la clase del chevron se concatenaba sin espacio
(`nutrition-row-chevronis-open`), así que no habría rotado nunca. Pasado a
`cn()`, que es el idioma del repo.

**Datos del demo**: se borraron las dos comidas de prueba de esta sesión
(«Café con leche» y el «Pinto con huevo» registrado); el 28 de septiembre queda
en cero. El plan de ejemplo sigue activo, con su botón para quitarlo.

---

## Añadido después: las dos variantes de acento, para elegir mirando

`data-acento-tarjeta` en `<html>` intercambia tres tratamientos de las MISMAS
dos tarjetas (Calorías y Sustituto rápido). Se alterna desde el panel de
Fondos → «Acento de la tarjeta», se guarda en `localStorage` y se aplica antes
del primer pintado, como las demás preferencias del selector.

| Variante | Qué es |
|---|---|
| `filete` (por omisión) | Carbón mate + borde cónico del v11 teñido de turquesa |
| `solido` | Tarjeta entera en turquesa, tinta carbón, filete del color del lienzo |
| `vidrio` | Turquesa translúcido, desenfoque detrás y filo claro arriba |

CSS puro sobre el marcado existente: ningún componente de Nutrición se entera,
igual que `cargasDelEnvio`. `acentos-tarjeta.ts` guarda slugs, clave y atributo.

Dos trampas encontradas al construirlas, ambas medidas en el navegador:

- **`background-color` no tapa un `background-image`.** La tarjeta de Sustituto
  lleva también `enter-card`, que pinta un degradado radial. Sin
  `background-image: none` el fondo seguía oscuro mientras la tinta ya se había
  invertido a carbón: texto negro sobre carbón, ilegible.
- **Hacía falta más especificidad.** `.v11-card.nutrition-substitute` en vez de
  `.nutrition-substitute` a secas.

Contraste medido de la nota de Calorías: filete 8,45:1 · sólido 14,7:1 ·
vidrio 5,95:1. Los dos últimos son aproximados (fondo con alfa), ninguno cerca
del límite. Comprobado en escritorio y móvil, en los dos temas: la superficie de
Nutrición es losa oscura en ambos, así que las variantes se ven igual.

**Sin decidir todavía.** Cuando se elija una, hay que tirar las otras dos del
CSS, dejarla fija y anotarla en DESIGN.md.

**Dato de prueba vivo**: la comida `cccc0002-…` («Pinto con huevo», 28 sep) se
sembró para que las barras tuvieran progreso y la comparación fuera justa.
Borrarla cuando sobre.

---

## Revisión de `solido`: las cuatro rellenas, borde al pasar el cursor

Corrección de alcance pedida por el usuario. `solido` pasa a ser:

- **Las CUATRO del resumen** (Calorías, Proteína, Carbohidratos, Grasas) con
  relleno turquesa y tinta carbón.
- **Las dos de la derecha** vuelven a su estado original: sin relleno, sin
  filete cónico y sin el tinte radial que les ponía la variante por omisión.
- **Borde al pasar el cursor** en las seis: negro en las rellenas, turquesa en
  las mates.

Una decisión de implementación que cambió el resultado: el borde es un
**anillo interior** (`box-shadow: inset`), no un borde exterior. Un trazo negro
por fuera de una tarjeta turquesa, sobre un lienzo casi negro, no se ve — se
funde con el fondo y solo parece que la tarjeta encogió. Por dentro cae sobre
el turquesa, que es contra lo que tiene que contrastar. Al ser sombra tampoco
ocupa espacio, así que nada se mueve al entrar el cursor.

`:focus-within` replica el anillo: en la escena real (teléfono) no hay hover,
y el borde no puede ser la única señal de que la tarjeta responde.

**Consecuencia a la vista:** con las cuatro del mismo tono, la fila gana
presencia pero pierde jerarquía — Calorías deja de destacar sobre las otras
tres. Si se quiere recuperar, la vía es un solo tono con intensidad
descendente, no un color por macro.

---

## Cuarta variante: `naranja` (referencia de glassmorphism del usuario)

Única variante que cambia la SUPERFICIE entera, no solo las tarjetas: lienzo de
naranja profundo con dos degradados radiales, y tarjetas de vidrio naranja
encima (una sola capa de vidrio, sobre lienzo opaco).

Tres problemas reales que hubo que resolver para que sea interfaz y no sólo
imagen:

1. **El naranja es el color de acción.** Sobre fondo naranja los botones
   desaparecían. La acción se invierte a crema (`--primary: #ffe9d6`,
   `--primary-foreground: #58200a`), y sigue siendo lo más prominente.
2. **El contraste se caía.** Medido a nivel de píxel con la primera versión: el
   rótulo «CALORÍAS» en **1,38:1**, la nota en 2,50, el subtítulo de fila en
   2,01. Se corrigió oscureciendo las tarjetas (mezcla de naranja del 46% al
   26% sobre una base más opaca) y subiendo el secundario a `#ffe3d2`. Medido
   de nuevo con el método correcto —color declarado contra fondo muestreado,
   que es lo que exige WCAG, no el suavizado del texto—: **6,99 · 7,18 · 4,56 ·
   6,53**, todos sobre el mínimo de 4,5.
3. **Sobre superficie de color el secundario no puede ser un tono medio.** Se
   acerca al blanco y se separa por peso y tamaño, no por claridad.

Trampa de especificidad: `nutrition-workspace.css` fija estas tarjetas en
`html[data-pc="Pancis"] .nutrition-workspace .nutrition-home-card.v11-card` con
un `#1a1a1a` literal. Sin igualar esa especificidad (`[data-pc]` en el
selector) el naranja no llegaba y las tarjetas seguían negras.

Comprobado en escritorio y móvil. 524 tests pasan.

### Ajeno a este trabajo

`npx tsc --noEmit` reporta `e2e/training-workspace.spec.ts(162,10): TS2532`.
Es un archivo **sin seguimiento** que no se creó en esta sesión; se deja
intacto y se reporta.

---

## Corrección del usuario: el color es NARANJA y solo en las cuatro

Dos errores míos de interpretación, corregidos:

1. **`solido` pasa de turquesa a naranja.** Relleno `#f0793f` con tinta
   `#2a0f04` — el mismo par que el sistema ya usaba en el botón primario, no
   uno nuevo. Medido: 6,43:1 en la cifra.
2. **`naranja` deja de llevarse la superficie entera.** Yo había teñido
   lienzo, filas, pestañas y botones. Ahora el lienzo vuelve a ser el carbón
   mate de siempre y el vidrio naranja vive solo en las cuatro del resumen.
   Al apoyarse sobre carbón y no sobre naranja, el tinte tuvo que subir del
   26% al 34% para seguir leyéndose como vidrio naranja.

También se retiró el filete turquesa que quedaba en Sustituto: con las cuatro
en naranja, dejarlo hacía convivir dos acentos.

**Contraste, medido otra vez en las dos variantes** (el secundario volvió a
fallar y hubo que corregirlo en ambas):

| | primera medición | corregido |
|---|---|---|
| `solido` nota/rótulo | 2,97:1 y 1,23:1 | **5,07:1** (`#4a1e0c` fijo, no una mezcla transparente) |
| `naranja` rótulo/nota/fila | 1,38 · 2,50 · 2,01 | **6,99 · 7,18 · 4,56** |

La lección repetida: **sobre superficie de color el texto secundario no puede
ser un tono medio ni una transparencia del principal.** Se separa por peso y
tamaño, no por claridad.

Comprobado en escritorio y móvil. 524 tests pasan.

---

## Entrenamiento: distribución bento según referencia del usuario

Referencia: fila de tres tarjetas iguales arriba; abajo, una tarjeta ancha con
bloque de texto al pie y tira vertical al borde, más una tarjeta alta a la
derecha.

**Mapeo a contenido real** (sin inventar tarjetas):

| Referencia | Contenido |
|---|---|
| 3 tarjetas iguales arriba | Ejercicios · Series previstas · Grupos musculares |
| Pastilla al pie de cada una | El detalle de cada métrica, ahora como pastilla |
| Tarjeta ancha abajo-izq. | La sesión: día, Iniciar, lista de ejercicios |
| Tira vertical en su borde | El selector de día (`.training-day-rail`) |
| Bloque de texto al pie | El detalle del ejercicio seleccionado |
| Tarjeta alta derecha | Mapa muscular + trabajo por músculo |

**Cuatro problemas que resolvió, no solo estética:**

1. **Hueco muerto de ~350px.** `align-items: start` dejaba a cada tarjeta con
   su alto natural, y el mapa muscular es mucho más alto que la sesión. Ahora
   la fila estira y cierra.
2. **El vacío se mudó dentro de la tarjeta**, así que el detalle del ejercicio
   pasa a estar SIEMPRE (con estado en reposo) y anclado abajo con
   `margin-top: auto` — es el bloque de texto de la referencia y es lo que
   absorbe la holgura. Antes aparecía y desaparecía, y la tarjeta saltaba de
   alto al tocar una fila.
3. **`align-items: start` también en la tarjeta**: el cuerpo no se estiraba,
   así que el `margin-top: auto` no tenía contra qué empujar.
4. **Línea huérfana** («Todos los ejercicios de la sesión») flotando entre las
   dos tarjetas de la derecha: ahora es la banda-pie del mapa, a hueso, con
   `:has()` quitando el redondeo inferior de la tarjeta y un margen negativo
   que cancela exactamente el `gap` de la columna.

**«Última sesión» salió de la fila de arriba.** Los otros tres describen la
sesión que viene; ese describía la anterior y se leía como un cuarto dato del
plan sin serlo. Tres es además lo que pide la referencia.

Móvil: el riel pasa a fila horizontal bajo 900px, y bajo 600px «Ejercicios»
ocupa la fila entera con los otros dos debajo.

`.training-day-tabs` de `training-workspace.css` quedó huérfano y se retiró.
Quedan reglas del mismo nombre en `globals.css`, anteriores a este cambio, sin
tocar.

---

## Progreso: reconstruido a lo pedido (29 sep 2026)

La pantalla pasa de nueve bloques a **tres tarjetas en una columna**, en orden
de importancia, más una segunda pestaña.

**Pestaña Resumen**
1. `BodyCompositionCard` — tarjeta grande: maniquí 3D reutilizado de
   Entrenamiento a la izquierda, lectura completa a la derecha (peso, grasa,
   masa muscular esquelética, masa magra, masa grasa, grasa visceral, agua) y
   los cinco perímetros.
2. `InbodyComparison` — antes y después contra la medición anterior, con barra
   por métrica. Sólo con anterior; si no, una nota lo explica.
3. Tendencia del peso.

**Pestaña Historial** — `MeasurementsTable` (que ya abría el archivo original
por URL firmada) + el aviso de bioimpedancia.

### Decisiones que no eran obvias

- **Bienestar y Fotos NO se borraron.** «Sólo lo siguiente» se aplicó al
  resumen; esas dos son registro, así que viven en la pestaña de registro.
  Borrar funciones que sirven no era lo pedido.
- **La tarjeta del cuerpo usa la última medición CON composición**, no la
  última a secas: en el demo la última es un pesaje suelto y la tarjeta habría
  salido con seis «Sin dato» escondiendo el InBody que sí tiene algo que
  contar.
- **El rótulo dice la fuente real** (`Lectura del InBody` / `de la báscula` /
  `Medición manual`). Llamar InBody a un pesaje manual le atribuiría una
  precisión que no tiene.
- **El resaltado del maniquí dice «dónde hay medida de cinta»**, no masa
  segmental — y el pie de la tarjeta lo deja escrito. No tenemos datos
  segmentales.
- **Color = juicio, flecha = hecho** en la comparación: bajar grasa es
  favorable y bajar músculo no, así que el tono nunca va solo.
- Las pestañas van por URL (`?vista=`), no por estado de cliente: se comparten,
  recargan y responden al botón de atrás.

### Cuatro fallos cazados al verificar

1. **El canvas 3D se desbordaba** y tapaba la columna de cifras: faltaba la
   clase `muscle-model`, que aporta `position: relative` y la altura.
2. **Fechas cruzadas en la comparación** (`24 jul → 10 jul`): pasaba la fecha
   de la tarjeta del cuerpo, que puede ser una medición más vieja, en vez de
   las dos que el informe compara.
3. **La barra empujaba su cifra fuera del borde**: su `%` se medía contra la
   fila entera. Ahora vive dentro de una pista.
4. **Desfase de un día**: `measured_at` es un DATE y `new Date("2026-07-31")`
   se parsea como medianoche UTC; formateado en Costa Rica retrocedía al 30.
   La misma medición salía «31 jul» en la tabla y «30 de julio» en la
   cabecera. Resuelto formateando en UTC.

Escritorio y móvil comprobados. `tsc` y `eslint` limpios, 536 tests pasan.

**Nota sobre las guías invocadas**: `high-end-visual-design` prescribe otro
mundo visual (prohíbe Lucide, pide Clash Display, Double-Bezel). `DESIGN.md`
es la autoridad de este proyecto, así que se aplicó su criterio —jerarquía,
ritmo, profundidad, motion con curva propia— dentro del sistema existente, no
la estética ajena.

---

## Progreso: fotos por medición y cuatro pestañas (29 sep 2026)

**Resumen · Historial · Fotos · Bienestar**, todas por URL (`?vista=`).

### El trío ya estaba en el modelo

`progress_photos.view_type` sólo admite `frontal | lateral | posterior`. Las
«tres fotos por medición» no hubo que inventarlas: faltaba el enlace.

**Migración `20260929100000_fotos_por_medicion.sql`** — `measurement_id`
opcional, `on delete set null` (borrar una medición no puede llevarse las
fotos: el número se vuelve a tomar, la foto de ese día no), índice parcial y
retrollenado por fecha+usuario para las fotos que ya existieran.

### Piezas nuevas

- `PhotoTrio` — siempre tres huecos. La vista que falta se dibuja apagada con
  su rótulo: una rejilla que sólo muestra lo que hay no deja ver que falta la
  lateral.
- `MeasurementHistory` — el historial pasa de tabla a fichas. Una tabla obliga
  a columnas fijas y aquí casi ninguna medición las tiene: un pesaje trae un
  número y un InBody trae ocho. La ficha muestra lo que esa medición SÍ
  registró, y deja sitio para las fotos de ese día.
- `PhotoGallery` — todas las fotos agrupadas por día, de la más reciente a la
  más antigua. Agrupar por fecha y no por vista es lo que permite bajar y ver
  cómo cambia el mismo encuadre sesión a sesión.
- `PhotoUploadDialog` y `MeasurementAttachmentButton` — extraídos de
  `PhotosSection` y `MeasurementsTable`.

### Bienestar

No se borró: pasa a su propia pestaña. El usuario dijo «de momento», que no es
lo mismo que «para siempre».

### Fallos cazados probando en el navegador

1. **Fecha y medición podían discrepar**: se podía enlazar una foto a la
   medición del 31 y fecharla el 11; salía bajo el 11 en la galería y bajo el
   31 en el historial. Ahora, con medición elegida, la fecha la fija el
   servidor desde ella.
2. **La foto lateral no se pintaba** con `next/image`: la fuente es una URL
   firmada de diez minutos y única por carga, así que el optimizador no puede
   cachear nada y sólo añade una capa que puede fallar. Pasado a `<img>`, que
   es lo que ya hacía el código existente.
3. **Miniaturas del tamaño de un póster**: la rejilla se repartía los dos mil
   píxeles de la tarjeta. Techo de 340px en el historial, 620px en la galería.
4. **La cabecera de la galería anunciaba «aún no hay fotos»** justo encima de
   las fotos, porque metí `PhotosSection` entera para usar sólo su botón. De
   ahí la extracción del diálogo.

Probado subiendo fotos de verdad por la interfaz. 536 tests pasan.
`PhotosSection` queda sin usar en Progreso; se revirtió su edición para no
dejar código muerto a medio tocar. Las fotos de prueba se borraron.

---

## Progreso: análisis segmental del InBody (29 sep 2026)

### El antes y después lidera con lo que importa

`InbodyComparison` reordena: **grasa corporal y masa muscular primero**,
después masa grasa, masa magra, peso, cintura, visceral y agua. El peso solo
no distingue perder grasa de perder músculo, así que encabezar con él es
encabezar con la cifra más fácil de malinterpretar.

### El modelo 3D con los elementos del informe

**Migración `20260929120000_analisis_segmental.sql`**:

- Tabla `measurement_segments` — cinco segmentos (brazo izq/der, tronco,
  pierna izq/der) con `lean_mass_kg`, `lean_percent`, `fat_mass_kg`,
  `fat_percent` y `evaluation`. Tabla aparte y no veinte columnas más en
  `body_measurements`: son cinco filas de la misma forma.
- **El porcentaje y la evaluación se guardan, no se calculan**: InBody los
  obtiene contra un ideal propio por altura, sexo y edad. Derivarlos aquí
  sería inventar una cifra y presentarla como del aparato.
- `body_measurements` gana los totales que el informe sí da y no cabían:
  `protein_kg`, `mineral_kg`, `total_body_water_l`,
  `basal_metabolic_rate_kcal`, `inbody_score`.

El maniquí pasa a resaltarse **desde el segmental** cuando existe, con el peso
del trazo tomado de la evaluación impresa (bajo pinta suave, normal pleno).
Sin segmental se cae a los perímetros de cinta, como antes.

**Límite declarado en la propia tarjeta**: el modelo no distingue izquierda de
derecha, así que un brazo pinta los dos. El informe reparte en cinco trozos y
el maniquí está hecho de músculos — el mapeo es aproximado por definición y la
interfaz lo dice.

La tarjeta elige ahora la medición **con segmental** primero, luego cualquiera
con composición, y por último la más reciente: es la única que llena el
maniquí.

### Pendiente

**El formulario no captura lo segmental todavía.** Los datos entran por SQL.
La vía buena no es un formulario de veinte campos sino leer el PDF del InBody,
que es otra tarea.

### Datos del demo

Sembradas dos mediciones InBody con los valores del informe aportado por el
usuario (14 ago: 66,5 kg · 17,5 % · 30,8 kg SMM · 40,3 L · 10,9 kg proteína ·
3,70 kg minerales · 1555 kcal · puntuación 78, más sus cinco segmentos; y 20
ago como anterior para que el antes y después tenga grasa y músculo). Se dejan
puestas: son sus propios datos y hacen la pantalla verificable.

536 tests pasan. `tsc`, `eslint` y `prettier` limpios.

---

## Progreso: el informe InBody completo (29 sep 2026)

El usuario señaló, con razón, que la versión anterior dejaba fuera la mayor
parte del informe. Lo que faltaba y ahora está:

| Faltaba | Ahora |
|---|---|
| **Rangos normales** de cada valor | `reference_ranges` (jsonb) + barra Bajo/Normal/Alto |
| IMC | `bmi`, en Análisis de obesidad |
| Análisis de **grasa segmental** | Se guardaba desde antes; ahora se pinta junto a la magra |
| Puntuación InBody | Se guardaba; ahora encabeza la columna |
| Control de peso, grasa y músculo · peso ideal | Cuatro campos nuevos, sección propia |
| Relación cintura-cadera | `waist_hip_ratio`, en Parámetros de investigación |

**Migración `20260929140000_inbody_completo.sql`.** Los rangos van en `jsonb`
y no en veinticuatro columnas: son pares min/max de una docena de métricas y
dependen de altura, sexo y edad. Se guarda **lo que imprimió el informe**;
recalcularlos aquí sería inventarlos.

La columna sigue ahora las cuatro secciones del informe en su orden —
composición, músculo-grasa, obesidad, parámetros de investigación— más control
de peso y los dos segmentales.

### Decisiones

- **La barra de rango es lo que convierte la cifra en un juicio.** «10,9 kg de
  proteína» no dice nada; «10,9 de 9,6 a 11,7» dice que estás dentro.
- **El estado va en palabra, no sólo en color**: «Bajo» y «Alto» no se
  distinguen por el tono a solas.
- **Sin rango impreso no se dibuja barra.** La masa muscular esquelética no
  trae min~max en el informe (su barra es una escala porcentual), así que
  queda la cifra sola — y se conserva su columna para que la fila no se
  descoloque, que fue el único fallo de maquetación de esta tanda.
- La escala de la barra se abre un 30 % del rango a cada lado para que un
  valor fuera de banda caiga dentro del dibujo en vez de pegarse al borde.

Escritorio y móvil comprobados. 536 tests pasan; `tsc`, `eslint` y `prettier`
limpios.

**Sigue pendiente**: el formulario no captura nada de esto. Entra por SQL. La
vía buena es leer el PDF del InBody, que es otra tarea.

---

## Biblioteca de alimentos: una sola lista (30 sep 2026)

### Lo que ya estaba

El plan hablaba de construir la búsqueda híbrida, pero ya existía: los tres
proveedores (`src/lib/food-providers/`), la caché de 7 días, el deduplicado
entre fuentes, el código de barras y el campo `provenance`. El hueco era de
PRESENTACIÓN: tres bloques separados —tu biblioteca, «descubrir con Dietly» y
un desplegable con las demás fuentes—, así que para encontrar un alimento
había que saber de antemano en cuál de los tres buscar.

### Lo hecho

- **`LibraryCardFood` deja de estar atada a Dietly.** `dietlyId` se sustituye
  por `provider` + `externalId`. La acción de guardar escribía `"dietly"` a
  mano, y eso impedía que USDA y Open Food Facts compartieran lista.
- **`externalFoodCards()`** convierte los resultados de `searchExternalFoods`
  —USDA, OFF, Dietly— en la misma tarjeta que lo local.
- **`mergeLibraryCards()`** funde ambas listas. Lo local gana siempre: trae
  favorito, correcciones e ilustración. Un alimento ya importado llegaba por
  los dos caminos con el mismo `foodId` y salía duplicado.
- **Una sección, una rejilla.** Fuera el bloque de Dietly, el desplegable de
  «otras fuentes» y la pestaña «Descubrir con Dietly», que ya no controlaba
  nada.
- **Atribución ODbL** visible con enlace a la licencia, como exige Open Food
  Facts.

**La fuente no se borra.** Cada ficha sigue diciendo de dónde viene: un dato
de USDA está medido en laboratorio y uno de OFF lo subió alguien con el móvil.
Que compartan tarjeta está bien; que no se distingan, no.

### Verificación

**Los tres proveedores estaban caídos o sin configurar** al probar: USDA sin
`USDA_API_KEY`, Open Food Facts devolviendo «Page temporarily unavailable» y
Dietly HTTP 525. Para verificar el código propio sin depender de terceros se
sembró la caché con una respuesta de OFF: la lista pasó de 2 tarjetas a 4,
mezcladas y con su fuente cada una. Los datos de prueba se borraron después.

537 tests pasan; `tsc`, `eslint` y `prettier` limpios.

### Pendiente

- **USDA necesita la clave del usuario** en `.env` (gratuita). Sin ella el
  proveedor ni se consulta.
- Afinar `LOCAL_RESULTS_THRESHOLD`: con la lista unificada probablemente
  convenga consultar siempre y ordenar por relevancia.

### Fases 4 y 5 (30 sep 2026)

- **USDA activo.** El usuario puso `USDA_API_KEY` en `.env.local`. Verificado
  contra la API real (HTTP 200, 39 coincidencias para «arroz») y en la app:
  la lista pasa de 2 tarjetas a 21, con la fuente visible en cada ficha. Next
  tomó la variable sin reiniciar el servidor.
- **Umbral retirado.** `LOCAL_RESULTS_THRESHOLD` quedó como código muerto al
  unificar: sólo se consultaba fuera con menos de cinco resultados locales, y
  eso escondía resultados buenos detrás de cinco mediocres. Ahora se pregunta
  siempre que haya búsqueda escrita; la caché de siete días cuida la cuota.

**Estado de los proveedores al cerrar:** USDA bien. Open Food Facts
inestable —devuelve respuestas truncadas o HTML con estado 200—, pero su
proveedor ya lo maneja (tiempo límite de 8 s, 429 y HTML contemplados) y se
rinde en silencio sin romper la lista. **Dietly lleva todo el día en HTTP
525**, caído de su lado.

### Filtro de relevancia (30 sep 2026)

**El problema, medido.** Buscar «gallo pinto» devolvía doce tarjetas y ninguna
era gallo pinto: `PINTO BEANS`, `PICO DE GALLO TORTILLA`, `Beans, pinto,
immature seeds, frozen`. USDA declaraba 1.996 coincidencias, pero empareja
PALABRAS, no platos. Añadir el conjunto `Survey (FNDDS)` —el de platos
preparados— sólo sumaba 17 resultados, igual de irrelevantes.

**La regla.** `src/lib/food-providers/relevance.ts`: todas las palabras
significativas de la búsqueda tienen que aparecer en el texto del alimento.
Se descartan las vacías (`de`, `con`, `the`…) y las de menos de tres letras,
que emparejan con casi todo. Se compara contra nombre, nombre original, marca
y alias — no sólo el nombre — para que un alimento en inglés con alias en
español siga pasando.

Si la búsqueda no deja ninguna palabra significativa, NO se filtra: sin
criterio no se puede juzgar, y vaciar la lista sería peor.

**Dónde va.** Después de cachear y antes de mostrar: la caché guarda lo que el
proveedor devolvió de verdad, así que afinar el filtro mañana no obliga a
volver a pedir.

**El resultado inesperado.** El filtro no sólo quitó ruido: **destapó** el
gallo pinto real. Open Food Facts sí tiene productos ticos —Zomera Foods,
Preparato, 143 y 155 kcal— y estaban enterrados bajo las doce de USDA. De 12
tarjetas falsas a 6 verdaderas.

Comprobado también que no estorba al caso bueno: «pollo» 12, «arroz» 12 (tres
fuentes), «arroz con leche» 9, y los plurales (`frijol` / `frijoles`,
`huevos`) no sufren.

7 pruebas nuevas. 544 tests en 49 archivos.
