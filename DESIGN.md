---
name: Pancis Hub
description: El sistema del handoff `desing-reference/`. Gilded canonica sobre ocho paletas intercambiables, Karrik de display y la banda de acento como unica pieza protagonista.
colors:
  background-dark: "#131313"
  background-light: "#EBEBEB"
  sidebar-dark: "#0D0D0D"
  card-dark: "#2E3A4F"
  card-light: "#ffffff"
  card-raised-dark: "#3A485F"
  card-raised-light: "#F7F4ED"
  ink-dark: "#F7E7CE"
  ink-light: "#1A1A1A"
  primary: "#F7E7CE"
  primary-strong: "#FFF6E6"
  primary-foreground: "#151515"
  muted-foreground-dark: "#A7AFBD"
  muted-foreground-light: "#3D4757"
  border-dark: "#4C5C75"
  border-light: "#CFCFCF"
  positive-dark: "#78B394"
  positive-light: "#1F7A54"
  caution-dark: "#D9B778"
  caution-light: "#8A5A18"
  critical-dark: "#D45F62"
  critical-light: "#B8342F"
  brand-from: "#C9A227"
  brand-to: "#F7E7CE"
typography:
  pageDisplay:
    fontFamily: "Karrik, Geist Sans, system-ui, sans-serif"
    fontSize: "clamp(1.75rem, 6vw, 2.375rem)"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.03em"
  sectionTitle:
    fontFamily: "Karrik, Geist Sans, system-ui, sans-serif"
    fontSize: "1.3125rem"
    fontWeight: 400
    letterSpacing: "-0.022em"
  numDisplay:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "clamp(2rem, 9vw, 2.125rem)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.04em"
  label:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.625rem"
    fontWeight: 500
    letterSpacing: "0.11em"
    textTransform: "uppercase"
  body:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  card: "24px"
  panel: "16px"
  control: "12px"
  full: "9999px"
components:
  button-brand:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.action}"
    height: "3.375rem"
  button-default:
    backgroundColor: "{colors.ink-light}"
    textColor: "{colors.background-light}"
    rounded: "{rounded.control}"
    height: "2.5rem"
  card:
    backgroundColor: "{colors.card-light}"
    rounded: "{rounded.card}"
    borderColor: "{colors.border-light}"
  magnitude-bar:
    fillColor: "{colors.primary}"
    rounded: "{rounded.full}"
---

# Design System: Pancis Hub

## Direccion

**El sistema del handoff.** La autoridad visual es
`desing-reference/design_handoff_pancis_hub/`: sus dos prototipos y su README.
Decidido el 2026-09-20, tras abrir `Pancis Hub v8.dc.html` y confirmarlo.

Ocho paletas x dos modos sobre los mismos diecinueve tokens. **Gilded es la
canonica** —la que define la identidad y con la que se juzga cualquier pantalla
nueva—; las otras siete son temas que la persona elige en Configuracion. El
modo principal es el oscuro.

La escena sigue siendo el telefono, de pie y con una mano (PRODUCT.md). El
handoff nacio en escritorio y solo resuelve movil en dos pantallas: donde no
llega, manda la escena real, no el prototipo.

## Reglas

1. **Ningun color suelto.** Todo sale de una variable `--pc-*` y se modula con
   `color-mix` en `oklab` u `oklch`. Al mezclar contra `transparent` el tono se
   lava: para superficies opacas se mezcla contra un solido.
2. **Una respuesta visual por pantalla.** Una cifra, decision o estado manda;
   el resto construye contexto.
3. **La banda de acento es la unica excepcion.** El heroe del dia es superficie
   clara sobre el lienzo oscuro, con el degradado de marca sangrando al borde
   (`.hero-band`). Ninguna otra pieza lleva degradado.
4. **Cuatro radios, sin excepciones.** 24 tarjeta, 16 panel interno, 12
   control, 9999 pastilla. Todo lo demas se redondea a uno de estos.
5. **Solida o vidrio, y no es estetico.** `surface-card` para todo lo que va en
   flujo; `surface-glass` SOLO para lo que se superpone: menus, hojas,
   popovers, el cajon del copiloto.
6. **No todo vive en una tarjeta.** Las secuencias usan filas y divisores. Los
   datos secuenciales NO se convierten en cuadricula (PRODUCT.md).
7. **Compilar no es verificar.** Todo cambio visual se revisa a 390, 834 y
   1440 px.

## Color

Los diecinueve tokens y las ocho paletas viven en `src/lib/theme/palettes.ts`,
extraidos literalmente del prototipo. `globals.css` los mapea una vez a los
nombres semanticos, asi que cambiar de paleta no toca ningun componente.

Gilded, oscuro: lienzo `#131313`, riel `#0D0D0D`, tarjeta `#2E3A4F`, superficie
interna `#3A485F`, tinta `#F7E7CE`, acento `#F7E7CE` sobre `#151515`.

El acento de Gilded es crema, no dorado: el dorado `#C9A227` es el inicio del
degradado de marca, no el color de la accion.

## Tipografia

Tres familias, todas locales: el build no depende de la red.

- **Karrik** (display): titulo de pantalla 38 px y titulo de seccion 21 px,
  peso 400. **Solo de 26 px arriba** — su trazo irregular se come la
  legibilidad en cuerpos pequenos.
- **Geist Mono**: cifra protagonista 34 px peso 700 tracking `-0.04em`, y
  etiqueta de seccion 10 px peso 500 `+0.11em` en caja alta.
- **Geist Sans**: cuerpo 15 px con linea 1.65, fichas y tablas 13 px.

Pendiente: el handoff pide **Inter** para el cuerpo. Geist Sans lo sustituye
porque Inter no esta instalada y traerla desde Google Fonts ata el build a la
red. Se cierra con `@fontsource/inter` cuando se quiera exacto.

Toda cifra comparable lleva `tabular-nums`. Los parrafos de explicacion no
superan ~60 caracteres.

## Composicion

- Rejilla de 16 px entre tarjetas; relleno de 22 a 26 px dentro.
- Separacion de 8 a 14 px dentro de un grupo, siempre con `gap`.
- Tres clases de dispositivo: dock inferior < 768, riel de 64 px de 768 a 1279,
  riel de 244 px desde 1280. El pin de la persona sobrescribe el punto de corte
  en ambos sentidos.
- Pasillo de 74 px a la derecha donde el flotante del copiloto se rinde.
- Ningun elemento pulsable baja de 44 px.

## Movimiento

Un solo muelle, `--pc-spring`: funcion `linear()` de dieciocho puntos,
criticamente amortiguada, rebasa un 2,6 % y se asienta. No se anaden curvas por
pantalla.

Cuatro duraciones: 140 ms respuesta, 240 ms cambio de estado, 380 ms entrada,
560 ms transicion larga. `prefers-reduced-motion` desactiva lo no esencial.

## No hacer

- No escribir un color fuera de una variable.
- No anadir un radio fuera de los cuatro.
- No poner degradado en nada que no sea la banda de acento.
- No usar vidrio esmerilado en contenido que va en flujo.
- No convertir datos secuenciales en una cuadricula.
- No introducir fuentes remotas que aten el build a la red.
- No usar Karrik por debajo de 26 px.

## Estado

Implementado: motor de paletas, muelle, shell adaptado, Acceso, heroe y riel de
Nutricion, veredicto de sustitucion, Hoy, Entrenamiento y Progreso.

Sin construir, y por que: la propuesta del copiloto en Hoy y la rejilla de once
tarjetas dependen del copiloto, que no existe todavia. "Comer fuera" e
"Historial" de Nutricion, y las rutas Copilot, InBody, Evidencia y Calendario,
solo existen en la prosa del README del handoff, no en su prototipo.
