# Fase 5a: Hoy

**Fecha**: 2026-09-20
**Fase**: 5 de la implementacion de `desing-reference/`

## Dos cosas del handoff que NO se construyeron, y por que

**1. El heroe de Hoy es una propuesta del copiloto.** La captura
`02-hoy.png` abre con una tarjeta: "Copilot ha leido tu dia", un titular con el
ajuste propuesto, el razonamiento, y dos acciones ("Ver la propuesta", "¿Por
que?"). Ese copiloto **no existe en la interfaz**: `/asistente` esta suspendida
en `navigation.ts` y `AssistantFab` no se monta. Construir la tarjeta sin el
motor detras seria inventar una recomendacion, que es exactamente lo que
PRODUCT.md prohibe ("ningun numero sin fuente"). Queda para la fase del
copiloto.

**2. "Once tarjetas en rejilla de cuatro columnas".** Choca de frente con tres
fuentes del propio proyecto:

- PRODUCT.md: "rechazo explicito a las rejillas de tarjetas para datos
  secuenciales".
- DESIGN.md: "No convertir datos secuenciales en una cuadricula" y "Una
  respuesta visual por pantalla".
- El criterio de diseno que el usuario ya habia dado.

No se aplico. Si se quiere, es una decision de producto que toca revertir esas
tres, no un detalle de maquetacion.

## El defecto real de Hoy, que si se arreglo

El lateral estaba `hidden lg:flex`. Por debajo de 1024px **desaparecian la
semana, el peso y el entrenamiento de hoy** — justo en el telefono, que
PRODUCT.md define como la escena principal del producto. El handoff no lo
cubre: admite que solo Nutricion y Acceso estan resueltas en movil.

Ahora se rinden en las tres clases:

| Ancho | Disposicion |
| --- | --- |
| < 768 | apiladas, tras la respuesta del dia |
| 768-1279 | dos columnas |
| >= 1024 | columna lateral con filete, como estaba |

La fotografia editorial si se queda en escritorio: es contexto, y en telefono
el alto se lo deben los datos.

Los cuatro componentes se llamaban `DesktopNextMealCard`, `DesktopWeekCard`,
`DesktopWeightCard` y `DesktopTrainingCard`. Renombrados a `DayNextMeal`,
`DayWeek`, `DayWeight`, `DayTraining`: ya no son de escritorio, y un nombre que
miente es deuda.

## El boton gigante que era una grafica

`DayWeight` dibuja la serie de peso con `flex-1` y `rounded-full` por barra.
Con dos puntos y una columna de 570px, cada barra se estiraba a media columna y
la serie se leia como un boton naranja enorme — lo primero que se veia de la
pantalla en tablet. Ademas contradice DESIGN.md ("No redondear todo a 9999px").

Corregido con un ancho maximo por barra y el radio del sistema. Aguanta
cualquier numero de puntos y cualquier ancho de columna.

## Verificacion

- 390 / 834 / 1440: semana, peso y entrenamiento presentes en las tres, sin
  desborde horizontal.
- `tsc`, `eslint`, `next build` limpios. 446 pruebas unitarias. E2E 4/4.

## Pendiente de la fase 5

Entrenamiento y Progreso. El handoff admite que ambas "mantienen una densidad
anterior, mas apretada" y que no estan resueltas en movil, asi que ahi el
trabajo es traer la jerarquia de Nutricion, no copiar el prototipo.
