---
name: Pancis Hub
description: Codigo de disco — el color es la magnitud, el disco olimpico del macro es permanente, y el grosor de la regla es toda la jerarquia.
colors:
  chalk-floor: "oklch(0.968 0.002 250)"
  bumper-floor: "oklch(0.16 0.003 250)"
  ink: "oklch(0.19 0.006 250)"
  ink-inverse: "oklch(0.97 0.001 250)"
  muted-foreground: "oklch(0.46 0.006 250)"
  subtle-foreground: "oklch(0.58 0.005 250)"
  hairline: "oklch(0.89 0.003 250)"
  rule: "oklch(0.86 0.004 250)"
  rule-strong: "oklch(0.72 0.006 250)"
  steel-primary: "oklch(0.34 0.008 250)"
  steel-primary-foreground: "oklch(0.98 0.001 250)"
  secondary: "oklch(0.93 0.003 250)"
  brand-orange: "oklch(0.56 0.155 42)"
  plate-red-25-fat: "oklch(0.5 0.185 27)"
  plate-blue-20-protein: "oklch(0.46 0.15 255)"
  plate-yellow-15-carbs: "oklch(0.53 0.125 78)"
  plate-green-10-fiber: "oklch(0.46 0.115 155)"
  plate-white-5-water: "oklch(0.55 0.01 250)"
  steel-energy-bar: "oklch(0.3 0.008 250)"
  positive: "oklch(0.48 0.115 155)"
  caution: "oklch(0.52 0.13 68)"
  critical: "oklch(0.5 0.185 27)"
typography:
  stamp:
    fontFamily: "Archivo Black, Archivo, sans-serif"
    fontSize: "clamp(3.25rem, 16vw, 4.5rem)"
    fontWeight: 400
    lineHeight: 0.86
    letterSpacing: "-0.045em"
  title:
    fontFamily: "Archivo, sans-serif"
    fontSize: "1.375rem"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  numStrong:
    fontFamily: "Archivo, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Archivo, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
  labelMicro:
    fontFamily: "Archivo, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0"
rounded:
  sm: "2px"
  md: "2px"
  lg: "2px"
  xl: "2px"
  2xl: "3px"
  3xl: "3px"
  4xl: "4px"
  full: "50%"
components:
  button-primary:
    backgroundColor: "{colors.steel-primary}"
    textColor: "{colors.steel-primary-foreground}"
    rounded: "{rounded.sm}"
    padding: "0 1rem"
    height: "2.5rem"
  button-primary-hover:
    backgroundColor: "color-mix(in oklch, {colors.steel-primary} 92%, transparent)"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 1rem"
    height: "2.5rem"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "0 1rem"
    height: "2.5rem"
  plate-fat:
    backgroundColor: "{colors.plate-red-25-fat}"
    textColor: "#fff"
    rounded: "{rounded.full}"
    size: "1.375rem"
  plate-protein:
    backgroundColor: "{colors.plate-blue-20-protein}"
    textColor: "#fff"
    rounded: "{rounded.full}"
    size: "1.375rem"
  plate-carbs:
    backgroundColor: "{colors.plate-yellow-15-carbs}"
    textColor: "#fff"
    rounded: "{rounded.full}"
    size: "1.375rem"
  plate-fiber:
    backgroundColor: "{colors.plate-green-10-fiber}"
    textColor: "#fff"
    rounded: "{rounded.full}"
    size: "1.375rem"
---

# Design System: Pancis Hub — Codigo de disco

## Overview

**Creative North Star: "Codigo de disco"** (candidata 7 de la lista ordenada por resonancia; seed `b92093d8`).

La tesis es literal: el color no decora, ES la magnitud. Cada macro se queda con su disco del codigo olimpico de gimnasio para siempre — 25 rojo, 20 azul, 15 amarillo, 10 verde, 5 blanco — y nada mas en la pantalla lleva color, salvo la unica excepcion declarada para estado (ver Colores). La rejilla de tarjetas queda prohibida por decision explicita: el contenido vive sobre el suelo, y lo que separa una seccion de otra es una regla horizontal cuyo GROSOR es la jerarquia (1px dentro de un grupo, 2px entre grupos, 3px en la seccion que manda la pantalla).

El mundo material es tiza y acero en claro, goma de bumper en oscuro. Importa el orden real de construccion: el handoff original es **un diseno solo oscuro** (comentario en `globals.css`, bloque `:root`); el modo claro fue derivado despues, en esta implementacion, porque el naranja de marca sobre papel caia a 2.5:1 de contraste y no se podia leer. Cualquier extension del sistema debe pensarse primero en el mundo oscuro (la goma de bumper del gimnasio) y derivar el claro despues, no al reves.

Todo el sistema usa una sola familia, Archivo, con una unica excepcion: Archivo Black, reservada por completo a **la cifra troquelada** — el numero que responde "cuanto me falta" a escala de rotulo industrial, de pie y sin acercarse el telefono a la cara. Aparece como maximo una vez por pantalla; si aparece dos veces, ninguna manda.

**Key Characteristics:**
- El color es un codigo semantico permanente (el disco del macro), nunca una eleccion estetica por pantalla.
- No hay tarjetas: hay suelo, y lo separan reglas cuyo grosor es la jerarquia.
- Una sola cifra troquelada por pantalla, en Archivo Black; todo lo demas es Archivo.
- Radio universal de 2px ("el acero no es blando"); el circulo se reserva al disco, la unica forma redonda.
- Elevacion (sombra) solo en capas flotantes (overlays, la isla de navegacion); en flujo, nunca.
- El mundo nativo es oscuro (goma de bumper); el claro es una derivacion de accesibilidad, no el original.

**Estado de la construccion (`fix`, 2026-08).** El sistema esta completamente aplicado en Hoy y en Configuracion. Nutricion, Entrenamiento, Progreso y el resto de pantallas todavia renderizan la plantilla anterior ("Grafito"), basada en tarjetas: `@/components/ui/card` sigue importado en unas 25 rutas y componentes. Este documento describe el sistema de disco como la unica direccion valida para trabajo nuevo o tocado; no describe esas pantallas sin migrar como una variante legitima.

## Colors

La paleta es deliberadamente casi monocroma: gris tiza/acero neutro para todo el andamiaje de la interfaz, y color unicamente donde ese color ES un dato — el macro que representa, o un estado del dia.

### Primary
- **Acero** (`steel-primary`, `oklch(0.34 0.008 250)` claro / `oklch(0.88 0.003 250)` oscuro): el unico acento de interaccion — botones primarios, foco, enlaces, el anillo de foco. Es acero pulido, no color de marca: la funcion "primary" de shadcn se redefinio a proposito para NO ser el naranja.

### Secondary
- **Naranja de marca** (`brand-orange`, `oklch(0.56 0.155 42)` claro / `oklch(0.72 0.17 45)` oscuro): el naranja historico de Pancis Hub. Vive unicamente en el wordmark (`BrandLogo`, compuesto en `currentColor` sobre la voz de la cifra) y en los PNG de `public/logo*.png`. No aparece en ningun otro elemento de interfaz — es la mayor fuga de color que el sistema identifico y cerro.

### El codigo de disco (el color semantico permanente)
- **25 rojo — grasa** (`plate-red-25-fat`, `oklch(0.5 0.185 27)` / `oklch(0.68 0.17 27)`).
- **20 azul — proteina** (`plate-blue-20-protein`, `oklch(0.46 0.15 255)` / `oklch(0.66 0.16 255)`).
- **15 amarillo — carbohidratos** (`plate-yellow-15-carbs`, `oklch(0.53 0.125 78)` / `oklch(0.79 0.14 78)`).
- **10 verde — fibra** (`plate-green-10-fiber`, `oklch(0.46 0.115 155)` / `oklch(0.72 0.15 155)`).
- **5 blanco/cromo — agua** (`plate-white-5-water`, `oklch(0.55 0.01 250)` / `oklch(0.85 0.004 250)`): el token `--macro-water` existe en `globals.css` y esta reservado para el disco de 5kg, pero **no esta conectado a ningun dato hoy**. `ToleranceKey` (`src/features/nutrition/lib/tolerances.ts`) solo define `calories | protein | carbs | fat | fiber`; no hay macro "agua" en seguimiento. Documentado como reservado, no como activo.
- **Calorias — la barra, nunca un disco** (`steel-energy-bar`, `oklch(0.3 0.008 250)` / `oklch(0.88 0.003 250)`): las calorias son acero, no color, porque son la suma de los demas y no tienen un disco propio en el rack.

### Estado (la excepcion declarada a la regla 1)
- **Positivo** (`positive`, `oklch(0.48 0.115 155)` / `oklch(0.72 0.15 155)`): confirmacion; toma prestado el verde del disco de 10 porque el codigo ya esta aprendido.
- **Precaucion** (`caution`, `oklch(0.52 0.13 68)` / `oklch(0.79 0.14 72)`): el ambar de advertencia. **Es una excepcion deliberada, no un descuido**: la regla 1 ("nada mas en pantalla lleva color") admite color para estado, y las advertencias de Hoy (pasarse de un macro, plan fuera de tolerancia, objetivos desactualizados) usan `caution` a proposito.
- **Critico** (`critical`, `oklch(0.5 0.185 27)` / `oklch(0.68 0.17 27)`): toma prestado el rojo del disco de 25 para "te pasaste".

### Neutral
- **Suelo claro** (`chalk-floor`, `oklch(0.968 0.002 250)`) / **suelo oscuro** (`bumper-floor`, `oklch(0.16 0.003 250)`): el fondo, y tambien el valor de `--card` — una "tarjeta" vale lo mismo que el fondo porque no puede leerse como contenedor.
- **Tinta** (`ink`, `oklch(0.19 0.006 250)` claro / `oklch(0.97 0.001 250)` oscuro): texto primario.
- **Tinta apagada** (`muted-foreground`, `oklch(0.46 0.006 250)` / `oklch(0.72 0.004 250)`): metadatos, unidades, captions.
- **Filete** (`hairline` / `rule`, `oklch(0.89 0.003 250)` / `oklch(1 0 0 / 10%)`): el separador de 1px, dentro de un grupo.
- **Filete fuerte** (`rule-strong`, `oklch(0.72 0.006 250)` / `oklch(1 0 0 / 26%)`): el separador de 2px, entre grupos y en las barras ancladas.

### Named Rules
**La Regla del Disco Permanente.** Un macro no cambia de color entre pantallas. Si la proteina es el disco azul de 20 en Hoy, es el disco azul de 20 en cualquier otra pantalla que la muestre — nunca una barra gris ni un color distinto.

**La Regla del Color Unico.** Fuera del codigo de disco y de la excepcion de estado (`caution`/`positive`/`critical`), ningun elemento de interfaz lleva color. Un boton, un icono o un fondo decorativo en un color nuevo es una fuga, no una variante.

**La Regla de la Marca Aislada.** El naranja de marca vive solo en el logotipo. No es un token disponible para botones, acentos ni highlights de producto.

## Typography

**Stamp Font:** Archivo Black (`--font-stamp`), solo para la cifra troquelada.
**Body/UI Font:** Archivo (`--font-sans`), para absolutamente todo lo demas: titulos, etiquetas, botones, cuerpo y datos.

**Character:** una sola grotesca de senaletica industrial, con una excepcion puntual y deliberada: el numeral de rotulo que se lee al otro lado del gimnasio.

### Hierarchy
- **Stamp** (400, `clamp(3.25rem, 16vw, 4.5rem)`, line-height 0.86, utilidad `num-display`): la cifra que manda la pantalla — "cuanto me falta". Aparece como maximo una vez por vista.
- **Title** (700, `1.375rem`, line-height 1.15, `-0.02em`, utilidad `display-title`): titulo de seccion. Nunca compite con la cifra: es rotulo, no protagonista.
- **Num Strong** (600, `1.0625rem`, utilidad `num-strong`): la cifra secundaria que manda dentro de su propia fila (p. ej. "faltan 42g" en una fila de macro), no en la pantalla completa.
- **Body** (400, `0.875rem` tipico): texto corrido, descripciones, avisos.
- **Label Micro** (400, `0.75rem`, sin tracking, sin mayusculas, utilidad `label-micro`): el nombre pequeno de un dato. Ver regla siguiente — esto NO es un antetitulo.

Toda cifra que puede cambiar (kcal, gramos, porcentajes) lleva `font-variant-numeric: tabular-nums` (utilidad `.num`), para que no "baile" al actualizarse.

### Named Rules
**La Regla de la Cifra Unica.** `num-display` (Archivo Black) aparece una sola vez por pantalla. Si una segunda cifra necesita mandar, es `num-strong`, nunca una segunda instancia de `num-display`.

**La Regla del Antetitulo Retirado.** `label-micro` es una etiqueta de dato en caja normal, sin `letter-spacing` ni mayusculas. El eyebrow en versalitas-con-tracking fue el patron que este sistema vino a eliminar (llego a repetirse diez veces en una sola pantalla); no se reintroduce ni siquiera para un titulo "importante". **Estado real:** una instancia sobrevive fuera del alcance de esta utilidad — el `CardTitle` de `Nutricion` que renderiza "Totales del dia" hereda el estilo de version anterior de `@/components/ui/card`, no de `label-micro`. Es un defecto de migracion pendiente, no una segunda forma valida de etiqueta.

## Layout

No hay grid de tarjetas. El contenido se apila en una sola columna vertical ("suelo continuo"), separado por reglas horizontales cuyo grosor codifica la jerarquia — no hay contenedor visible, ni margen de tarjeta, ni sombra que agrupe visualmente.

- **Escala de regla:** 1px dentro de un grupo (`.border-rule`, entre filas de una misma lista) · 2px entre grupos (`.rule-band`, entre secciones normales) · 3px en la seccion que manda la pantalla (`.rule-plate`, reservada a UNA sola seccion — si todas la llevan, ninguna manda).
- **Densidad movil-primero:** la escena de uso es de pie, con una mano, telefono sin acercar a la cara (ver `PRODUCT.md`). El escritorio anade la barra lateral (`Sidebar`, 240px fijo, `lg:flex`); en movil esa barra desaparece y la navegacion pasa a una barra inferior anclada de icono-solo.
- **Objetivo tactil:** celdas de navegacion inferior de 44px (`h-11 w-11`), pensadas para el pulgar.
- **Barra fija opaca:** la navegacion inferior y la barra superior (`.island`, `.surface-bar`) son opacas sobre el fondo con blur, nunca translucidas al punto de dejar leer el contenido por debajo — el desenfoque decorativo sin este respaldo dejaba texto ilegible bajo la barra en un telefono de pie.

## Elevation & Depth

Sistema plano por definicion. `--shadow-card: none` en ambos temas; no hay sombra de tarjeta en todo el sistema. La unica sombra que existe (`--shadow-island`) se reserva a **capas verdaderamente flotantes** — overlays, popovers, el sheet de "mas" en movil — nunca a contenido en flujo. La profundidad en flujo se transmite por regla (grosor) y por una sub-superficie muy leve (`--card-raised`, un tono apenas mas claro/oscuro que el fondo) para el unico caso en que algo necesita un fondo propio sin llegar a ser una tarjeta.

### Shadow Vocabulary
- **island** (`0 12px 32px -20px oklch(0.19 0.006 250 / 0.55)` claro, `0 12px 32px -18px oklch(0 0 0 / 0.8)` oscuro): overlays y capas flotantes exclusivamente.

### Named Rules
**La Regla de la Elevacion Solo Flotante.** Si un elemento vive en el flujo normal de la pagina, no lleva sombra, sin excepcion. Sombra es sinonimo de "esto flota sobre el contenido", nunca de "esto es importante".

## Shapes

Radio universal de 2px en toda superficie rectangular (botones, inputs, sub-superficies) — "el acero no es blando", pero tampoco es afilado. Las excepciones de radio mayor (3px, 4px) son pasos de la misma escala reducida, no una familia distinta. **El circulo esta reservado por completo al disco** (`border-radius: 50%`): es la unica forma redonda de todo el sistema, y es la que lleva el codigo de color semantico.

Las reglas (bordes horizontales, nunca verticales salvo el canto activo de navegacion) son el unico recurso de separacion — no hay `border` perimetral en tarjetas ni caja alrededor de contenido; solo un `border-top` que anuncia el inicio de una seccion.

## Components

### Buttons
- **Shape:** radio 2px (`rounded-sm`, escala colapsada).
- **Primary:** fondo acero (`--primary`), texto invertido; altura 2.5rem, padding horizontal 1rem.
- **Hover / Focus:** cambio de tono unicamente (`bg-primary/92` en hover, `/84` en active) — sin escala, sin rebote; foco con anillo de 2px en el color acero. Cada boton lleva un halo sutil que sigue al puntero (`.btn-spotlight`, radial-gradient de 7rem en `--btn-x`/`--btn-y`), desactivado en tactil (`@media (hover: none)`).
- **Secondary / Outline / Ghost:** variantes de tono neutro (gris secundario, borde hairline, o transparente); ninguna introduce color nuevo.
- **Destructive:** unica variante que usa `--destructive`/`--critical` de fondo, y solo para acciones irreversibles.

### El disco (`Plate` / `PlateBar`) — componente de firma del sistema
El unico circulo de la interfaz, y el vehiculo del codigo semantico completo.
- **Como chip** (`Plate`): 1.375rem de diametro, fondo del color del macro, numeral de kilos ("25", "20", "15", "10") impreso dentro en su tinta de contraste — la doble senal (color + numero) existe para quien no distingue bien el color.
- **Como barra** (`PlateBar`): pista de 1.5px del color `rule`, relleno del color del macro cuyo ANCHO es la magnitud (`value / target`), a canto vivo — nunca redondeada, nunca pildora. Incluye una muesca vertical de 2px en el color de tinta que marca donde te deja el plan del dia (`planned`), y un canto de 3px al final cuando te pasas del objetivo. **Estado real:** las tres senales (relleno, muesca, canto de "pasado") estan implementadas y activas en el codigo, pero con datos reales del usuario demo sin registro del dia las tres resultan invisibles — no es un componente sin terminar, es un componente sin datos que mostrar todavia.

### Cards / Containers — retirado como forma, conservado como nombre de clase
No existe una "tarjeta" visual en el sistema nuevo. `Section` (`src/components/shared/section.tsx`) sustituye a `Card` en toda pantalla migrada: es una `<section>` con una regla superior (`rule-band` de 2px por defecto, `rule-plate` de 3px reservada a la seccion protagonista) y aire antes del contenido — nada de fondo propio, borde perimetral ni sombra. Las clases heredadas (`.surface-panel`, `.hairline-card`, `.glass-card`, `.hero-banner`) se conservan por nombre para no romper vistas sin migrar, pero su CSS ya no dibuja caja: solo un `border-top: 1px solid var(--rule)`.
**Estado real:** `@/components/ui/card` (el componente shadcn original, con caja, cabecera y sombra clasicas) sigue importado en ~25 archivos — Nutricion, Entrenamiento, Progreso, Academia, formularios de autenticacion, entre otros. Esas pantallas renderizan la plantilla anterior ("Grafito"), no el sistema de disco. Cualquier pantalla nueva o tocada usa `Section`, nunca `Card`.

### Navigation
- **Sidebar (escritorio, ≥1024px):** riel fijo de 240px. El item activo se marca con un canto izquierdo de 3px (`border-l-foreground`) y peso semibold — sin pildora, sin fondo, sin halo. Las etiquetas de grupo van en caja normal (`label-micro`-equivalente), nunca en versalitas.
- **Bottom Navigation (movil, <1024px):** barra anclada a todo el ancho (`island`, no una capsula flotante), icono-solo por falta de espacio para cinco etiquetas en 390px — el nombre persiste como `aria-label`/`title` para lectores de pantalla. El activo se marca con `glow-ring` (un inset-shadow de 3px en la base, no un halo de color). Un boton "mas" abre un sheet inferior con el resto de secciones.
- **Wordmark:** una sola tinta (`currentColor`), compuesto con la voz de la cifra (Archivo Black), nunca el PNG de cuatro tintas original.

## Do's and Don'ts

### Do:
- **Do** asignar a cada macro su disco del codigo olimpico para siempre — 25 rojo grasa, 20 azul proteina, 15 amarillo carbohidratos, 10 verde fibra — y mantenerlo idéntico en cualquier pantalla que lo muestre.
- **Do** usar el grosor de regla (1px / 2px / 3px) como unico mecanismo de jerarquia entre bloques de contenido, en vez de tarjetas, sombras o fondos distintos.
- **Do** limitar `num-display` (Archivo Black) a una cifra por pantalla; si algo mas necesita destacar, usar `num-strong`.
- **Do** usar `caution` para advertencias de estado en Hoy — es la excepcion deliberada de color que la regla 1 admite, no una fuga.
- **Do** construir cualquier lista o seccion nueva sobre `Section` (`rule-band`/`rule-plate`), nunca sobre `@/components/ui/card`.
- **Do** escribir las etiquetas de dato en caja normal, sin tracking (`label-micro`); un antetitulo en versalitas es exactamente el patron retirado.

### Don't:
- **Don't** introducir un color decorativo nuevo — cada color en la interfaz tiene que ser o el disco de un macro, o uno de los tres estados (`positive`/`caution`/`critical`).
- **Don't** usar el naranja de marca (`brand-orange`) fuera del wordmark; no es un token disponible para botones ni acentos de producto.
- **Don't** dibujar una caja alrededor de contenido en flujo (borde perimetral, fondo de tarjeta, sombra) — la unica sombra del sistema es para capas flotantes.
- **Don't** dar a un disco una forma que no sea el circulo, ni dar forma circular a nada que no sea un disco.
- **Don't** tratar las pantallas migradas de `@/components/ui/card` (Nutricion, Entrenamiento, Progreso, Academia y el resto de las ~25 rutas) como una plantilla valida para trabajo nuevo: son deuda de migracion documentada, no una segunda direccion visual legitima.
