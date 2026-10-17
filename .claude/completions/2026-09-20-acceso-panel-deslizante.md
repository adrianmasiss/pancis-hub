# Acceso: panel deslizante con la paleta del sistema

**Fecha**: 2026-09-20
**Pantallas**: `/login`, `/registro`

## Que se pidio

Rediseñar Acceso con el patron del video de referencia del usuario (tarjeta
partida, panel de color que se desliza al otro lado al cambiar entre entrar y
crear cuenta), **conservando los colores y el logotipo de la app**.

## Que se hizo

### Color: fuera la paleta dorada

`.auth-shell` reescribia ~25 variables con una paleta dorada (`#f2c230` sobre
`#0d0d0d`) del handoff "Gilded". Era un segundo color de marca —lo que DESIGN.md
prohibe— y peleaba con el isotipo naranja. Se elimino: Acceso ahora hereda
`--background`, `--card` y el unico acento terracota del tema activo, y funciona
en claro y en oscuro.

La tipografia Karrik se retiro del layout raiz; el sistema vuelve a tener una
sola fuente (Geist Sans). Los `.woff2` siguen en `src/app/fonts/` sin usarse.

### Forma

- Tarjeta con relleno de 10 px: el panel de acento **flota dentro** en vez de
  sangrar al borde, asi su desplazamiento se lee como una pieza que se mueve.
- Panel terracota con filetes de medicion (el motivo del sistema) en vez de un
  bloque de color plano.
- Se abandonan las capsulas: campos de 48 px con radio 12 px, accesos sociales
  como cuadrados redondeados, segmentados a 14 px.
- El isotipo pasa de flotar sobre la tarjeta (partia en dos el panel) a la
  cabecera de la columna del formulario, con el nombre en tipografia viva.

### Movimiento

`/login` y `/registro` siguen siendo rutas reales con sus server actions. El
intercambio lo resuelve la View Transitions API: ambos paneles comparten `name`
entre paginas.

- Grupos de panel: 460 ms con `--ease-spring` (muelle, no `ease-out`).
- Desenfoque de 4 px a media vuelta: tapa artefactos y lee como velocidad.
- El panel de acento viaja por encima del formulario (`z-index` por nombre).
- Contenido: cruce asimetrico, 140 ms de salida y 260 ms de entrada con 160 ms
  de retardo.
- Se suprime el fundido de `root`, acotado al tipo `auth-swap`, para que solo
  se muevan los dos paneles y el resto sea el ancla espacial.
- Las columnas se definen por variante (`1fr 0.78fr` / `0.78fr 1fr`): con anchos
  fijos el panel cambiaba de lado **y** de tamaño.

## Tres cosas que costaron encontrarse

1. **El CTA del panel era invisible.** La capa base tiñe TODO enlace con
   `a { color: var(--primary) }`, que en el panel es su propio fondo. Hace falta
   `text-[var(--primary-foreground)]` explicito.
2. **`experimental.viewTransition` no estaba activo.** Sin el flag el componente
   renderiza pero la navegacion no dispara la transicion.
3. **Next bloquea sus recursos de dev fuera de `localhost`.** Con el bloqueo el
   router no puede pedir el RSC de la ruta siguiente y cae a navegacion dura,
   lo que anula cualquier view transition. Se añadio `allowedDevOrigins`.

## Verificacion

- `tsc --noEmit`, `eslint` y `next build`: limpios (los 2 errores de lint que
  quedan son de `desing-reference/`, el handoff de terceros).
- Capturas a 1440×900 y 390×844, en claro y oscuro.
- Vuelo de la transicion fotografiado a 8x de lentitud.
- E2E: `registro-plan-nutricion` y `sustitucion-por-dia` pasan (4/4).

## Pendiente, ajeno a esta tarea

`e2e/flujo-minimo.spec.ts:67` falla buscando el boton "Agregar alimento" y, por
ser serial, arrastra 15 pruebas mas. **Es previo**: falla igual con
`viewTransition: false`. Viene del rediseño de Nutricion sin commitear.
