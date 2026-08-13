---
name: Pancis Hub
description: Marino profundo y el naranja del logotipo, en registro iOS. Un solo acento, que marca lo accionable y el avance del dia; tarjeta como agrupador y muelles como movimiento.
colors:
  background-dark: "#082032"
  background-light: "#ecedee"
  card-dark: "#2c394b"
  card-light: "#ffffff"
  card-raised-dark: "#334756"
  card-raised-light: "#f6f7f8"
  ink-dark: "#d2d2d2"
  ink-light: "#082032"
  primary: "#f05a27"
  primary-strong: "#d94a1c"
  primary-foreground: "#082032"
  brand-from: "#e43030"
  brand-to: "#fc841e"
  muted-foreground-dark: "#9aa6b0"
  muted-foreground-light: "#2c394b"
  subtle-foreground-dark: "#6e7e8c"
  subtle-foreground-light: "#6b7885"
  rule-dark: "#334756"
  rule-light: "#e0e2e4"
  border-dark: "#41566a"
  border-light: "#d8dbde"
  positive-dark: "#46b98a"
  positive-light: "#1f7a54"
  caution-dark: "#f5a15c"
  caution-light: "#8f4f14"
  critical-dark: "#e5484d"
  critical-light: "#c0392f"
typography:
  numDisplay:
    fontFamily: "system-ui, Inter, sans-serif"
    fontSize: "clamp(3.5rem, 17vw, 4.5rem)"
    fontWeight: 800
    lineHeight: 0.94
    letterSpacing: "-0.038em"
  displayTitle:
    fontFamily: "system-ui, Inter, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.022em"
  numStrong:
    fontFamily: "system-ui, Inter, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.014em"
  body:
    fontFamily: "system-ui, Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0"
  labelMicro:
    fontFamily: "system-ui, Inter, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0.006em"
rounded:
  sm: "10px"
  md: "14px"
  lg: "18px"
  xl: "22px"
  2xl: "26px"
  3xl: "34px"
  4xl: "40px"
  full: "9999px"
components:
  button-brand:
    background: "linear-gradient(135deg, {colors.brand-from}, {colors.brand-to})"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.full}"
    padding: "0 1.25rem"
    height: "3rem"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.full}"
    padding: "0 1.25rem"
    height: "3rem"
  button-primary-hover:
    backgroundColor: "{colors.primary-strong}"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.ink-dark}"
    rounded: "{rounded.full}"
    padding: "0 1.25rem"
    height: "3rem"
  card:
    backgroundColor: "{colors.card-dark}"
    rounded: "{rounded.2xl}"
    padding: "1.25rem"
  magnitude-bar:
    trackColor: "{colors.rule-dark}"
    fillColor: "{colors.primary}"
    rounded: "{rounded.full}"
    height: "6px"
---

# Design System: Pancis Hub

## Overview

**Norte creativo: marino profundo + el naranja del logotipo, en registro iOS.**

La maqueta de referencia son 27 pantallas en Figma, movil y escritorio, con los dos temas y con movimiento:
<https://www.figma.com/design/zrDvYIcBmJPjlc20hyuXxA>

El sistema tiene **un solo acento**, y ese acento sale del logotipo real: `#f05a27` es el punto medio del degradado del PNG de marca. Por eso la interfaz y la marca por fin concuerdan, cosa que no pasaba con las paletas anteriores. El naranja no decora: marca **lo accionable** y **el avance del dia**, y nada mas.

La escena que manda el diseno es concreta: de pie, con una mano, en una cocina, un gimnasio o la calle. De ahi salen el acento que se ve desde lejos, los objetivos grandes y la cifra a escala de rotulo.

Los **dos temas son de primera clase**. El claro es este mismo sistema con los neutros invertidos; el acento y la tinta oscura sobre el no se invierten, porque `#082032` sobre naranja da 4.9:1 en ambos y asi el boton no cambia de caracter al cambiar de tema.

**Caracteristicas clave:**
- Un acento, el del logotipo. El degradado de marca se reserva a la accion prominente.
- Tarjeta como agrupador: sobre un marino profundo, una superficie elevada agrupa mejor que un filete.
- Registro iOS, no Material: capsulas, esquina continua, el activo marcado en el propio simbolo, muelles.
- Tracking por tamano, nunca fijo.
- Cifras tabulares en todo el sistema.

## Las cinco reglas que no se rompen

Estan tambien en la cabecera de `src/app/globals.css`, que es la fuente de verdad.

1. **UNA accion prominente por pantalla**, con el degradado del logotipo. Las demas acciones reales van en naranja solido. Solo los descartes — cancelar, ahora no, reintentar — se quedan callados.
2. **El color mira el PAPEL, no el pixel.** Un relleno naranja puede ser un boton o puede ser un dato, y se tratan distinto.
3. **Registro iOS, no Material.** Esquina continua, capsula en botones y campos, el item activo marcado **en el propio simbolo** (Material marca con pastilla detras; Apple cambia el simbolo), y muelles en vez de curvas.
4. **Tracking por tamano, nunca fijo.** Apretado en display (`-0.032em` en h1), abierto en cuerpos pequenos (`+0.006em`). Un solo valor esta mal en algun cuerpo.
5. **Los dos temas son de primera clase.**

### La trampa de la regla 2

Merece su propio parrafo porque ya costo una regresion real.

Al aplicar "quita el relleno naranja de los botones secundarios" sobre la maqueta, la regla se ejecuto mirando el **color** en vez del **papel**, y vacio la tira de adherencia de la semana: aquellos cuadros naranjas no eran botones, eran los dias cumplidos. Es decir, eran informacion, y desaparecio.

Antes de aplicar cualquier regla de color a un conjunto de elementos, hay que responder por cada uno: **¿esto es una accion o es un dato?** Y despues hay que mirar el resultado, no darlo por bueno.

## Colors

### Acento

- **`--primary` `#f05a27`** — el naranja del logotipo. Botones, foco, enlaces, la barra de magnitud. Igual en los dos temas.
- **`--primary-strong` `#d94a1c`** — el estado hover/pressed.
- **`--primary-foreground` `#082032`** — la tinta sobre naranja. No se invierte por tema (ver arriba).
- **`--brand-from` `#e43030` → `--brand-to` `#fc841e`** — los dos extremos del degradado del logotipo. Solo la accion prominente de cada pantalla lo usa.

### Neutros

| Papel | Oscuro | Claro |
|---|---|---|
| Suelo (`--background`) | `#082032` | `#ecedee` |
| Tarjeta (`--card`) | `#2c394b` | `#ffffff` |
| Sub-superficie (`--card-raised`) | `#334756` | `#f6f7f8` |
| Tinta (`--foreground`) | `#d2d2d2` | `#082032` |
| Tinta secundaria (`--muted-foreground`) | `#9aa6b0` | `#2c394b` |
| Regla (`--rule`) | `#334756` | `#e0e2e4` |
| Borde (`--border`) | `#41566a` | `#d8dbde` |

### Estado

- **Positivo** — `#46b98a` oscuro / `#1f7a54` claro.
- **Precaucion** — `#f5a15c` oscuro / `#8f4f14` claro. **Es ambar, no amarillo**: la paleta tiene un tono, y un amarillo nuevo seria un segundo. El aviso se distingue del acento por claridad, no por matiz.
- **Critico** — `#e5484d` oscuro / `#c0392f` claro. **El rojo es la unica segunda familia que se gana su sitio**, porque "te pasaste" no puede leerse como marca.

### Fondos tenidos de estado

`--tint-caution`, `--tint-critical`, `--tint-info` y sus `-border`. **No son neutros**, asi que un remapeo de tema que solo toque los grises no los cubre: si se olvidan, quedan oscuros con texto ilegible encima. Ya paso una vez con el aviso de objetivos.

## Typography

Una sola familia. `font-family: system-ui, var(--font-sans), sans-serif` — y **`system-ui` va primero a proposito**: en iPhone entrega SF Pro con su tamano optico y sus tablas de tracking reales. Inter es la red de seguridad para el resto de plataformas, no la primera opcion.

Sin monoespaciada en ningun sitio: `font-variant-numeric: tabular-nums` alinea las columnas igual, y sin disfrazar la interfaz de terminal.

### Jerarquia

- **`num-display`** — la cifra protagonista. `clamp(3.5rem, 17vw, 4.5rem)`, peso 800, tracking `-0.038em`. **Una por pantalla, nunca dos**: si aparece dos veces, ninguna manda. Responde "cuanto me falta" de un vistazo, con el telefono en una mano.
- **`display-title`** — titulo de tarjeta o pantalla, `1.375rem`/700. Nunca compite con la cifra: es rotulo, no protagonista.
- **`num-strong`** — cifra secundaria, `1.0625rem`/600. Manda dentro de su fila, no en la pantalla.
- **`num`** — cifra en flujo, con tabulares y `-0.008em`.
- **`label-micro`** — el nombre pequeno de una cifra, `0.75rem`, caja normal. **No es un antetitulo**: la version en versalitas con tracking se retiro porque llegó a repetirse diez veces en la misma pantalla.

### Tracking por tamano

En `@layer base`: h1 `-0.032em`, h2 `-0.024em`, h3/h4 `-0.018em`, `small`/`text-xs` `+0.006em`.

## Layout

- Movil primero, ancho de contenido con la barra inferior anclada.
- En escritorio, barra lateral de navegacion y una columna de contenido centrada — no se reparte el contenido en columnas por rellenar el ancho.
- **La rejilla de tarjetas esta prohibida para datos secuenciales.** Criterio explicito del usuario: una lista de dias, de comidas o de series es una lista, no una cuadricula. Alcanza tambien a las rutinas y a las secciones de lectura de Entrenamiento, que iban en `lg:grid-cols-2`: la segunda columna no aportaba comparacion, solo rellenaba ancho.

## Elevation & Depth

- La tarjeta agrupa; la elevacion la hace el **salto de tono**, no una sombra.
- Sombra **solo** en capas flotantes: `surface-overlay` (popovers, hojas) y `--shadow-lifted` (el boton del asistente). Esa es toda la lista. El boton flotante se gana la excepcion porque es lo unico que se mueve sobre contenido arbitrario: no hay un tono debajo al que saltar.
- **`island`** — la barra inferior anclada. `backdrop-filter: blur(20px) saturate(160%)` sobre un fondo al **0.93** de opacidad, con un filete arriba que marca donde acaba el contenido. El desenfoque aqui si tiene proposito: separa la navegacion del contenido manteniendo el contexto de lo que hay debajo. A 0.86 el parrafo de debajo se seguia leyendo entre los rotulos de las pestanas; el filete solo no basta.
- Nunca apilar una superficie translucida clara sobre otra: la legibilidad se cae.

## Shapes

Escala de radios en registro iOS. Lo decide el papel y el tamano de la pieza, no el gusto: una barra de 4px es una capsula, una tarjeta de 350px pide 26.

`sm 10` miniaturas y casillas · `md 14` campos pequenos · `lg 18` botones y campos · `xl 22` paneles medianos · `2xl 26` paneles grandes · `3xl 34` la tarjeta de acceso · `4xl 40` hojas y canto superior.

Botones y chips van en **capsula** (`rounded-full`). En Figma la maqueta usa `cornerSmoothing 0.6` (la esquina continua de iOS); en web se aproxima con el radio generoso de esta escala.

## Motion

Muelles, no curvas de duracion fija: un muelle es interrumpible y hereda velocidad.

- **`--ease-spring`** — muelle criticamente amortiguado, expresado como `linear()`.
- **`--dur-fast` 140ms** — respuesta al pulsar.
- **`--dur-base` 240ms** — transicion de estado.
- **`--dur-enter` 380ms** — entrada.
- **`--stagger` 60ms** — separacion entre elementos que entran.

La respuesta va en `pointerdown`, no al soltar: `:active { transform: scale(0.975) }` en las acciones. El rebote se reserva a lo que "llega" tras un gesto con impulso; una tarjeta que solo aparece no rebota.

## Components

### Buttons

- **Prominente** — `variant="brand" size="lg"`: degradado de marca, mas alto que el resto. **Una por pantalla.**
- **Primario** — `variant="default"`, `--primary` plano. Todas las demas acciones reales.
- **Callado** — sin relleno. **Solo descartes**: cancelar, ahora no, reintentar.

Un boton secundario translucido sobre el marino da menos de 1.5:1 y se lee como fondo. Se probo y se revirtio: si es una accion, es naranja.

La variante `brand` no existia: la regla 1 no se podia expresar en codigo, todas las acciones salian iguales y ninguna mandaba. Cuidado con una trampa que ya costo un fallo: el degradado es una `background-image`, y el `disabled:bg-muted` de Tailwind cambia el `background-color`, asi que un boton apagado seguia viendose como la accion prominente. El estado deshabilitado se apaga en el CSS de `.bg-brand-button`, no en la utilidad.

**Una pantalla puede no tener accion prominente, y esta bien.** Configuracion es una lista de formularios independientes: sus cuatro "Guardar" son acciones locales de su tarjeta y ninguna manda sobre las otras. La prominente aparece solo cuando el aviso de objetivos desajustados esta presente, porque entonces si hay algo que la pantalla esta pidiendo. Forzar una prominente donde no la hay es tan malo como tener cinco.

### `MagnitudeBar` — la primitiva de dato del sistema

`src/components/shared/magnitude.tsx`. El ancho **es** la cantidad. Pista en `--rule`, relleno en el acento, capsula, 6px.

Tres estados y ninguno mas: normal (acento), excedido (critico, hasta el tope), y la muesca vertical del plan del dia. La muesca va **sobre la misma barra** en vez de en una columna aparte, porque la pregunta es "¿el plan me lleva ahi?" y eso se responde mirando, no comparando dos cifras.

Sustituyo al "codigo de disco", que daba a cada macro un chip de color con su numeral de kilos. Aquel sistema pedia cinco colores; este tiene uno, y el naranja ya esta ocupado por lo accionable. La identidad del macro la lleva su rotulo, que se lee.

### `MacroChip` — el macro en linea

`src/components/shared/macro-chip.tsx`. La misma regla, aplicada a la fila densa: rotulo corto (`P`, `C`, `G`, `F`, `Cal`) y la cifra, sin color y sin icono.

Llevaba un icono por macro —llama, carne, trigo, gota, hoja— pintado con los tokens `chart-1..5`. Era el codigo de disco sobreviviendo en las pantallas de Nutricion, y ademas `chart-1` **es** el naranja del acento: cada cifra de calorias se pintaba del color reservado a lo accionable. El nombre completo viaja en `sr-only`, porque fuera de contexto "G" no dice "Grasas".

### `MetricCard` — la lectura secundaria

`src/components/shared/metric-card.tsx`. **La cifra primero, el rotulo debajo**, igual que la cifra troquelada de Hoy. Nunca a escala `num-display`: esa esta reservada a una por pantalla y estas van en fila de tres.

Iba al reves. Con el rotulo encima, uno largo —"vs semana pasada"— envolvia a dos lineas y empujaba su cifra medio renglon por debajo de las vecinas: tres lecturas que existen para compararse de un vistazo dejaban de compartir linea base. Poniendo la cifra arriba, arrancan todas a la misma altura y el rotulo envuelve donde no estorba.

### Cards

`surface-card` — fondo `--card`, radio `2xl`, sin borde. `Section` (`src/components/shared/section.tsx`) es el envoltorio con titulo; `variant="plain"` quita la superficie para bloques que ya traen su propia caja dentro.

**`Card` de shadcn no es una alternativa.** Su superficie ya apunta a `surface-card`, pero `CardHeader` cierra con una regla divisoria y `CardTitle` es un `card-eyebrow` en versalitas: dos decisiones del handoff v2 que este sistema revirtio. Una tarjeta migrada lleva `display-title` y ninguna regla bajo la cabecera.

Cuando la cabecera no cabe en el par titulo/accion —un titulo, una cifra, meta y tres disparadores— se usa `surface-card` directamente y se reparte en dos filas: arriba lo que identifica la pieza y su cifra, debajo la meta. En una sola linea flex, 390px parten el titulo.

### Navigation

`island` abajo en movil, barra lateral en escritorio. El item activo se marca **en el propio simbolo**: acento en el icono y en el rotulo, trazo mas grueso (1.75 → 2.25) y rotulo en semibold. **Nada de pastilla detras** — esa es la firma de Material 3, y fue lo primero que delato el diseno como Android. La utilidad `glow-ring`, que era esa pastilla, se retiro del CSS al quedarse sin usos.

**Por que peso y no relleno.** SF Symbols marcaria el activo con la variante rellena, y asi lo pide la regla 3. lucide es un juego de trazo **sin variantes rellenas**: rellenar sus glifos da resultados dispares — `Home` cierra silueta, pero `Utensils` y `TrendingUp` son trazos abiertos y se convierten en manchas. Se usa entonces el otro eje que Apple tambien usa para esto, el peso. Si algun dia se cambia el juego de iconos por uno con pareja trazo/relleno, esta es la decision a revisar.

Las cinco pestanas se reparten el ancho de una barra anclada al borde, no de una capsula flotante, y **con rotulo visible**. En la isla estrecha el rotulo solo existia como `aria-label`; a todo el ancho cabe, y un icono suelto obliga a adivinar el destino. Objetivo tactil: 56px de alto por un quinto del ancho (78px en 390px).

## Do's and Don'ts

### Do

- Una accion prominente por pantalla, y que sea la que el usuario vino a hacer.
- Preguntarse por cada elemento si es accion o dato, antes de aplicarle una regla de color.
- Derivar el tema claro invirtiendo neutros, y comprobar aparte los fondos tenidos de estado.
- Poner la respuesta en `pointerdown`.
- Mirar el resultado en el navegador. Compilar no es verlo.

### Don't

- No introducir un tercer color. Positivo y critico ya existen; cualquier otro matiz nuevo hay que justificarlo por papel, no por gusto.
- No usar pastilla de fondo para el item activo de la navegacion.
- No usar rejilla de tarjetas para datos secuenciales.
- No poner dos `num-display` en la misma vista.
- No apilar translucidos.
- No dejar `letter-spacing` fijo para todos los tamanos.

## Estado de la construccion

Al 2026-08-13, sobre `feat/sistema-visual-p7`:

- **Hecho:** capa de tokens (`globals.css`), `layout.tsx`, `Section`, `BrandLogo`, `MagnitudeBar`, `MacroChip`, `MetricCard`, Hoy, la navegacion completa (barra inferior, barra lateral y boton flotante), y las secciones de **Nutricion**, **Entrenamiento**, **Progreso** y **Configuracion** con sus sub-paginas.
- **Pendiente:** Login, Onboarding, Recetas, Academia y el chat del asistente siguen con la plantilla anterior; `@/components/ui/card` sigue importado en 11 archivos.

### Encabezado de pantalla

Las pantallas migradas no pasan `icon` a `PageHeader`: la barra superior y el riel ya dicen donde estas, y un glifo de 20px junto al titulo es decoracion. La `description` se queda solo cuando explica algo que la pantalla no dice sola — "Gestiona tus comidas del dia" bajo el titulo "Nutricion" no lo hacia.

Lo que si sube a la cabecera es el **contexto**: en Nutricion el selector de fecha vive dentro de `PageHeader`, no como una fila suelta debajo, porque la fecha es parte de "donde estoy".

Este documento describe el sistema como la unica direccion valida para trabajo nuevo o tocado; las pantallas sin migrar no son una variante legitima.
