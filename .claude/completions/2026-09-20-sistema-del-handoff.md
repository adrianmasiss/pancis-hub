# El handoff pasa a ser la autoridad visual

**Fecha**: 2026-09-20

## La decision

El usuario abrio `Pancis Hub v8.dc.html` y confirmo: la app debe verse como el
prototipo. Eso **revierte las tres reservas** que yo habia planteado y que
habian dejado la app en otro mundo visual:

| Reserva | Fuente que la sostenia | Decision |
| --- | --- | --- |
| Gilded dorada es un segundo color de marca | DESIGN.md | aplicada |
| Karrik es una fuente de display ajena al sistema | DESIGN.md | aplicada |
| La banda de acento es un degradado de interfaz | DESIGN.md regla 3 | aplicada |

Queda cerrado. `DESIGN.md` se reescribio entero para no contradecir al codigo:
antes describia terracota, sin degradados y radio 18; ahora describe el sistema
del handoff. Un documento que contradice al codigo es peor que no tenerlo.

## Que cambio

**Paleta** — `DEFAULT_PALETTE = "Gilded"`. Una linea, porque el motor de
paletas ya estaba. Lienzo `#131313`, riel `#0D0D0D`, tarjeta `#2E3A4F`, acento
crema `#F7E7CE` sobre tinta `#151515`.

**Tipografia** — tres familias, todas locales:
- Karrik de display (titulo de pantalla 38 px, de seccion 21 px, peso 400),
  servida desde `src/app/fonts/`.
- Geist Mono para la cifra protagonista (34 px, 700, `-0.04em`) y para la
  etiqueta de seccion (10 px, 500, `+0.11em`, caja alta).
- Geist Sans de cuerpo, 15 px con linea 1.65.

**Radios** — los cuatro del handoff: 24 / 16 / 12 / 9999. Los nombres de
Tailwind se remapearon a esa escala en vez de anadir una paralela, para que
`rounded-xl` de lo que el sistema dice.

**Superficies** — `surface-card` con la receta del handoff (filete en tinta al
9 %, fondo al 58 %, luz interior, sombra tendida) y `surface-glass` nueva, solo
para lo que se superpone.

**La banda de acento** — `.hero-band`. El heroe del dia pasa de tarjeta oscura
con un filete a superficie clara con el degradado de marca sangrando al borde,
que es lo que hace reconocible la pantalla. Sale de los tokens de la paleta
activa: crema sobre casi negro en Gilded, naranja sobre marino en Pancis.

## Dos defectos que aparecieron al cambiar, y se corrigieron

1. **Los titulos no usaban Karrik.** Las utilidades nuevas existian y nadie las
   llamaba. `PageHeader`, el titulo de Acceso y el del panel de acento pasan a
   `page-display`.

2. **El punto de Carbohidratos desaparecia.** Usaba `--primary`, que en Gilded
   ES crema, sobre una banda crema. El prototipo no usa el acento ahi: usa
   `--pc-brand-from` mezclado contra negro. Aplicada su formula exacta para los
   cuatro macros, que ademas resuelve el mismo problema en las otras siete
   paletas.

## Lo que queda distinto del prototipo

- El riel es un panel plano con rotulos; el prototipo lo dibuja como isla
  flotante con iconos redondos.
- No hay barra superior: `TopBar` sigue huerfana, asi que faltan el conmutador
  de tema y el acceso al copiloto.
- El rotulo "EL DIA" va encima del segmentado, no a su izquierda.
- El cuerpo es Geist Sans y no Inter. Inter no esta instalada y traerla de
  Google Fonts ata el build a la red; se cierra con `@fontsource/inter`.

## Verificacion

- Login, Hoy y Nutricion comparados contra `screenshots/03-nutricion.png`.
- 390 / 834 / 1280: banda presente, Karrik en los titulos, sin desborde.
- `tsc`, `eslint`, `next build` limpios. 446 pruebas unitarias. E2E 4/4.
