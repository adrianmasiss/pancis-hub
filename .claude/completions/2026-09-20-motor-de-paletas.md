# Motor de paletas: los 19 tokens del handoff mandan sobre toda la app

**Fecha**: 2026-09-20
**Fase**: 1 de la implementacion de `desing-reference/`

## Que se construyo

El sistema de tema que el handoff define: ocho paletas x dos modos sobre los
mismos diecinueve tokens, escritos en `documentElement` como `--pc-*`.

- `src/lib/theme/palettes.ts` — las ocho paletas extraidas LITERALMENTE de la
  constante `PALETTES` del prototipo `Pancis Hub v8.dc.html`, verificadas token
  a token contra el export del usuario (304 valores, una sola discrepancia).
- `src/lib/theme/apply.ts` — escribe los 19 tokens, la clase `dark`,
  `color-scheme` y los atributos `data-pc` / `data-pc-mode` en una sola pasada.
- `globals.css` — el puente: mapea `--pc-*` a los nombres semanticos que ya
  consumen los 327 archivos del repo.
- `theme-provider.tsx` — lleva paleta ademas de modo, ambos persistidos.
- `appearance-card.tsx` — selector en Configuracion, con muestras pintadas con
  los tokens reales de cada paleta.

## Las dos decisiones que hacen que esto funcione

**El puente usa `html[data-pc]`, no `:root`.** Especificidad (0,1,1) para
ganarle a `.dark` (0,1,0), que sigue trayendo los literales del sistema
terracota. Mientras el proveedor no escriba el atributo —antes de hidratar, o
sin JavaScript— el bloque no aplica y la app se ve con la direccion actual en
vez de quedarse sin color. El cambio es reversible borrando un bloque.

**Cambiar de paleta no toca ningun componente.** Por eso las 16 rutas ya
existentes se tematizan de golpe: el trabajo se hizo una vez, en el mapeo.

## La errata del prototipo

`Sunset.dark.raised` viene como `#37271690` — ocho digitos, con alfa 0x90
(~56%). Los otros siete `raised` son opacos de seis digitos, y el propio
handoff prohibe mezclar superficies opacas contra `transparent`. Se usa
`#372716`, el valor que ya trae el export del usuario. Anotado en el archivo.

## Verificacion

Con Playwright, sesion real contra el Supabase local:

- Arranque: `data-pc=Pancis`, `--pc-bg` #082032 llega a `--background` y al
  `body`.
- Pancis / Gilded / Ocean: lienzo, tarjeta y acento cambian los tres.
- Cero errores de pagina en los tres cambios.
- `tsc`, `eslint` y `next build` limpios.

## Lo que NO se hizo, y por que

El handoff son nueve pantallas, tres piezas 3D (mapa muscular, maniqui InBody,
anillo de Evidencia), riel con pin, cajon de copiloto y tres tipografias. Cuatro
de esas pantallas —Copilot, InBody, Evidencia, Calendario— no existen como ruta
todavia. Eso no cabe en una sesion; el orden propuesto esta en la respuesta.
