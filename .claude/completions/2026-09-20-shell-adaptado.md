# Fases 2 y 3: muelle del sistema y shell adaptado a tres dispositivos

**Fecha**: 2026-09-20
**Fase**: 2 y 3 de la implementacion de `desing-reference/`

## Cambio de plan acordado

La tipografia sale de la fase 2: se queda la del login (Geist Sans) hasta que
haya opciones que elegir. Los colores tampoco se tocan. Entra en su lugar el
sistema de movimiento, que no depende de ninguno de los dos.

Lo adaptado pasa a ser el eje: telefono, tablet y escritorio, con movil
primero.

## Movimiento

`--pc-spring`, la funcion `linear()` de dieciocho puntos del handoff, y
`--dur-long: 560ms` como cuarta duracion. `--ease-spring` queda como alias:
el handoff pide UN muelle, no una curva por pantalla.

## Shell: tres clases, no dos

Antes el corte era uno solo (`lg`, 1024px): dock de telefono debajo, riel de
220px encima. Una tablet de 834px recibia el dock del telefono estirado.

| Ancho | Navegacion |
| --- | --- |
| < 768 | dock inferior con rotulos |
| 768-1279 | riel de 64px, solo iconos |
| >= 1280 | riel de 244px, desplegado |

Mas el pin explicito del handoff, que sobrescribe el punto de corte en los dos
sentidos y se recuerda. No hay despliegue al pasar el raton: en una pantalla de
uso diario eso es molesto.

## La decision que costo tres intentos

**El estado del riel se decide en CSS, no en React.** Los dos primeros intentos
—`useState` + `useEffect`, y despues `ResizeObserver`— daban el mismo problema:
el servidor no sabe el ancho, asi que rendia el riel colapsado y en escritorio
saltaba a 244px al hidratar. Ademas el primero era un `setState` sincrono
dentro de un efecto, que el lint rechaza con razon.

La version final: `.app-rail-label`, `.rail-wide` y `.rail-narrow` se resuelven
por punto de corte en la hoja, y `[data-rail]` —que solo existe si la persona
ha usado el pin— sobrescribe. El pin se lee con `useSyncExternalStore`, que es
lo que corresponde a un valor que vive en localStorage.

Medido: primer fotograma pintado y estado asentado coinciden en las tres
clases. Cero salto.

## Pasillo del copiloto

El handoff reserva 74px a la derecha para que el flotante no tape contenido.
Se implemento, pero atado a si el boton existe: lo marca `AssistantFab` con
`data-copilot` en la raiz. Reservarlo siempre dejaba 74px de vacio en Hoy, que
es justo una de las rutas donde el flotante no se muestra.

**Ahora mismo el pasillo es 0 en todas partes**, porque `AssistantFab` es el
cuarto componente huerfano del shell: existe y no se monta en ningun sitio,
como `TopBar`, `ThemeToggle` y `UserMenu` antes de esta sesion. El asistente no
tiene acceso desde la interfaz.

## Verificacion

- Tres clases (390 / 834 / 1440): riel, dock, pasillo y desborde horizontal.
- Pin en tablet 64 -> 244 y en escritorio 244 -> 64, persistido.
- Hidratacion sin salto en las tres.
- `tsc`, `eslint` y `next build` limpios; e2e 4/4.
