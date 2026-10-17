# Biblioteca de alimentos: una sola, de todas las fuentes

**Fecha**: 30 sep 2026 · **Rama**: `diseno/sistema-del-handoff`

## Qué se pidió

«De todos los lados posibles agarres información y que tengamos una biblioteca
de 1000 o más productos, y si hay algunos que se repiten, comparas y me das el
promedio. Siempre y cuando se parezcan; si hay un cambio muy notable, sí sería
de revisar.»

## La decisión que cambió el pedido

**No se promedia.** Un promedio entre un laboratorio y algo que alguien tecleó
en el móvil es un valor que no aparece en ningún informe, y a «¿de dónde sale
este número?» no se podría contestar. Choca de frente con la regla del
producto: *ningún número sin fuente*.

En su lugar, `foods` conserva el valor de la fuente más fiable y
`food_source_values` apunta lo que dijo cada una. Con eso se puede mostrar
«500 kcal, Open Food Facts, corroborado por USDA (difiere 0,7 %)» sin
inventar nada. Y cuando no se parecen, el alimento queda marcado con su
porcentaje para revisarlo.

## Resultado

| | |
|---|---|
| alimentos | **28.140** |
| · USDA | 27.073 |
| · Open Food Facts (Costa Rica) | 1.045 |
| · propios | 22 |
| con código de barras | 16.129 |
| valores de fuente guardados | 28.246 |
| con divergencia calculada | 125 |
| **a revisar (>15 %)** | **25** |

Los dos casos que demuestran que el cotejo sirve:

- **Rellenitas** (Galletas GN, tico) — OFF y USDA dan 500 kcal, P5,6 C72,2
  G19,4. Difieren 0,7 %: corroborado por dos fuentes independientes.
- **Cap'n Crunch's Crunch Berries** — OFF dice 150 kcal/32 g de carbos, USDA
  405/86,5. Difieren 63 % y va a la cola. Es el error de carga que la migración
  anticipaba: 150 kcal es el valor **por porción** (37 g) escrito en la casilla
  de por 100 g. USDA tiene razón.

## Lo que hubo que resolver

1. **El buscador viejo de OFF no se puede paginar.** `/api/v2/search` devuelve
   503 en las páginas profundas de la consulta de Costa Rica (la 11 y la 20
   fallaron en todos los intentos; la 12 contestó 401), y se quedaba en 583
   productos. Se cambió a `search.openfoodfacts.org`, que contestó 200 en
   todas. Entrega los mismos campos, salvo `brands`, que ahora es lista.
2. **USDA y OFF no se cruzan por sí solos, y se midió.** De 30 códigos de
   barras ticos, USDA conocía 0: el prefijo `744` es el código de país de Costa
   Rica y una base estadounidense no lleva registro tico. Pero 1 de cada 3
   productos de aquí trae prefijo estadounidense, así que se añadió
   `--solo=cruce`, que le pregunta a USDA por los códigos concretos que ya
   están guardados en vez de descargar catálogo a ciegas.
3. **El nombre no es identidad en un producto de marca.** Agrupar por nombre +
   grupo fundía el «Queso Crema» de una marca con el de otra y producía un
   70 % de diferencia que no era desacuerdo entre fuentes: eran dos quesos.
   La marca entró en la clave.
4. **Una fila no debe cotejarse consigo misma.** Al cargar lo ya guardado,
   cada producto recién traído se emparejaba con su propia copia; el recuento
   de «más de una fuente» subía a casi todo lo recogido y el cotejo moría en
   «ON CONFLICT DO UPDATE no puede afectar la misma fila dos veces».
5. **El catálogo «Branded» trae valores imposibles por 100 g** y reventaba la
   escritura con `numeric field overflow`, llevándose lotes de 500 filas
   buenas. Se rechaza la fila, no se recorta al techo: un valor ajustado a
   mano ya no es lo que dijo la fuente.
6. **La divergencia es un hecho derivado.** Escribirla sólo desde el
   agrupamiento de la corrida la borraba al volver a sembrar una sola fuente
   (el 63 % del Cap'n Crunch se perdía aunque las dos mediciones siguieran
   guardadas) y dejaba marcas viejas sin corregir. Ahora se recalcula de
   `food_source_values` al final de cada corrida, así el catálogo dice lo mismo
   sin importar en qué orden ni a trozos se haya sembrado.

## Archivos

- `scripts/sembrar-alimentos.mjs` — siembra idempotente. `npm run alimentos`
  con `--seco`, `--solo=usda|off|cruce`, `--limite=N`.
- `supabase/migrations/20260930100000_cotejo_de_fuentes.sql` —
  `food_source_values` + `foods.max_divergence_pct`.
- `supabase/migrations/20260930110000_indice_referencia_externa.sql` — el
  índice único parcial no servía para `ON CONFLICT`.
- `src/lib/food-providers/relevance.ts` (+ 7 pruebas) — filtro de relevancia.
- `src/features/foods/library-queries.ts` — `externalFoodCards`,
  `mergeLibraryCards`.
- `src/features/foods/library-types.ts` — `provider` + `externalId` en vez de
  `dietlyId`.

## Pendiente

- **Nada de esto se ve todavía.** `food_source_values` y
  `max_divergence_pct` están poblados pero ninguna pantalla muestra
  «corroborado por USDA (difiere 0,7 %)» ni hay cola de revisión para los 25.
- Búsqueda en tiempo real mientras se escribe.
- Recetas para los platos ticos que ninguna fuente tiene como producto.
- Decidir si se deja caer Dietly: HTTP 525 toda la sesión, y re-sirve OFF/USDA.

**Comprobado**: `tsc --noEmit` limpio · `eslint` limpio · 544 pruebas en 49
archivos, todas pasan · 0 alimentos marcados con una sola fuente.

---

# Segunda parte: que se vea, y que se pueda revisar

## El tope de 148

> «¿Por qué solo me muestra 148 alimentos?»

El tope estaba en la consulta, no en los datos: `getFoodsLibrary` pedía
`.limit(100)`. Con 22 alimentos propios no se notaba; con 28.140 escondía
28.040 y la pantalla afirmaba un número falso.

Ahora es paginación de verdad — `getFoodsLibraryPage` con `range()` y total
exacto, 48 por página, `?pagina=` en la URL para que una página concreta se
pueda compartir. **28 140 alimentos · página 1 de 587**, y la 587 trae 12, que
cuadra.

El tope tapaba otras dos cosas:

- **La portada quedaba en manos de USDA.** Ordenando sólo por nombre, las
  primeras fichas eran `-KUNG PAO- TEMPURA CAULIFLOWER`, `;ratio Keto Friendly
  Bar` y `:60 SECOND PASTA`: productos de marca que empiezan por un signo de
  puntuación y ordenan antes que cualquier letra. Ahora manda lo que no viene
  de un proveedor, después los genéricos (sin código de barras, los que sirven
  para armar una dieta) y al final los 16.129 de marca.
- **Dietly colaba 48 fichas** de «descubrimiento» sin que nadie buscara nada:
  rompían la cuenta de 48 por página y empujaban la biblioteca propia hacia
  abajo. Ahora sólo con búsqueda escrita — y `origen=dietly`, que estaba
  declarado y no hacía nada, pasa a significar lo que su nombre promete.

También se quitó el «Ver más» de 12 en 12 del cliente: con paginación del
servidor eran dos paginaciones encajadas.

## El sello de fuentes

`src/features/foods/components/source-seal.tsx`. Es el único sitio donde
«ningún número sin fuente» deja de ser una línea del documento y se ve:

- **Corroborado por USDA · coinciden** — Rellenitas (Galletas GN): 500 kcal,
  P5,6 C72,2 G19,4 idénticos en las dos fuentes.
- **USDA no coincide · difieren 63 %. Revisar** — Cap'n Crunch.

No se dibuja nada con una sola medición: un sello que apareciera siempre
dejaría de significar algo. La ficha ampliada añade los números de cada fuente,
uno al lado del otro.

## La cola de revisión

`/nutricion/alimentos/revisar`, con aviso desde la biblioteca que sólo aparece
si hay algo («12 alimentos tienen fuentes que no coinciden»).

Cada tarjeta enfrenta las mediciones, marca cuál usa tu biblioteca, nombra el
macronutriente donde está el mayor desacuerdo —«1,4 g contra 26,2 g» se decide
solo, «difieren 94,7 %» no dice nada— y ofrece un botón por medición.

**Resolver no toca `foods`.** El catálogo es compartido; la elección se guarda
en `food_user_corrections`, la capa por usuario que ya existía, con el motivo
escrito («Las fuentes discrepaban 63 %; se toma el valor de USDA») y su entrada
de auditoría. Si mañana el proveedor arregla su dato, los demás se benefician
sin que nadie deshaga nada.

## Dos fallos que la prueba en el navegador destapó

1. **Dos botones idénticos.** «Usar el de USDA» aparecía dos veces, palabra por
   palabra, en alimentos con dos mediciones de la misma fuente. Cuando la
   fuente se repite, manda la cifra que las separa: «USDA · 265 kcal» contra
   «USDA · 395 kcal».

2. **El titular de la cola era ruido.** «Cheese, Mexican blend» encabezaba con
   un 95,8 % que salía de 0,1 g contra 2,4 g de carbohidratos. Pasaba el suelo
   —que mira el valor mayor— pero sus calorías difieren un 5,7 %, su proteína
   un 6,8 % y su grasa un 8,7 %: variación normal entre dos mediciones del
   mismo queso. Se añadió una **diferencia mínima** (15 kcal, 3 g por macro)
   además del suelo. La cola pasó de 25 a **12**, y los 12 son reales:
   parmesano rallado con 1,4 g contra 26,2 g de carbos, Cap'n Crunch con 150
   contra 405 kcal.

   Y un tercero que salió de ese: tratar la divergencia nula como «no hay con
   qué comparar» tenía el efecto exacto al revés del buscado — **cuanto mejor
   coincidían dos fuentes, menos decía el sello**. Las Rellenitas se quedaban
   sin sello por coincidir del todo. Ahora nula con dos fuentes significa que
   ningún macro llegó a la diferencia mínima: el acuerdo más fuerte posible.

## Archivos

- `src/features/foods/lib/source-agreement.ts` (+ 18 pruebas) — veredicto,
  diferencia por macro, etiqueta de medición. Lógica pura, fuera de la vista.
- `src/features/foods/source-queries.ts` — cotejo por alimento, cola, recuento.
- `src/features/foods/review-actions.ts` — resolver como corrección de usuario.
- `src/features/foods/components/source-seal.tsx`, `review-queue.tsx`
- `src/app/(app)/nutricion/alimentos/revisar/page.tsx`
- `src/features/foods/queries.ts` — `getFoodsLibraryPage`, orden, paginación.
- `src/types/database.ts` — regenerado; única diferencia, `food_source_values`.

## Comprobado

`tsc --noEmit` limpio · `eslint src scripts` limpio · **562 pruebas en 50
archivos**, todas pasan · navegador: paginación, sello corroborado, sello
discrepante, cola de 12 y la acción de resolver (deshecha después, la base del
demo queda como estaba).

**Dos e2e fallan, y son anteriores a este trabajo:**

- `flujo-minimo` espera «te faltan hoy» en la portada;
  `TodayRemainingCard` ya no lo importa nadie desde el rediseño de la rama.
- `registro-plan-nutricion` espera el botón «Sustituir alimentos — Desayuno»;
  la página dibuja «Ver macros», «Marcar como comida» y «Comparar», que es como
  quedó `plan-meal-card.tsx` en el rediseño de Nutrición.
- `food-library` falla al importar de Dietly: la API responde **HTTP 525** a
  cualquier petición. Caída del proveedor; la ficha se dibuja desde la caché
  pero importar llama a la API viva.
