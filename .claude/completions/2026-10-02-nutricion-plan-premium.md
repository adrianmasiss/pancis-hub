# Nutrición · Mi plan, parte 1 (2026-10-02)

- Quitado el título «Resumen del día»; la fila queda con el pulso del día + selector de fecha.
- Ruta del día: cada comida es una parada (hora + punto en el riel) con sus alimentos por separado, foto o ilustración por grupo, kcal y acciones (Cambiar → hoja de sustitución; Editar → diálogo).
- `LogSwitch`: interruptor pedido por el usuario (verde #00DA50), `input role=switch` real. Desmarcar hace soft delete del registro (`deleteMeal`) vía `loggedMealId`.
- `PlanFoodEditDialog`: cantidad con stepper/porciones y vista previa de macros. Día → sustitución del día sobre el mismo alimento; plan → `updateDietTemplateItemQuantity`. «Quitar» solo en plan habitual (`deleteDietTemplateItem`). Quitar solo por un día necesitaría migración (quantity_g > 0 en diet_item_day_swaps).
- Macros de la comida: tres anillos concéntricos (% de la meta diaria por macro), kcal al centro, recuadros y barra de reparto de energía. Un solo turquesa a tres intensidades.
- Cambio sugerido: Ahora → Sugerido con fotos, tabla de diferencias, «Parecido x/10», «Usar este cambio» + «Ver más opciones».
- Fotos: 11 recortes sin marca de TheMealDB en `public/foods/*.webp`, resueltos por palabra entera en `lib/food-visual.ts`; `foods.image_url` manda si existe.
- `LoggedMealRow` (fuera del plan) con la misma piel.
- CSS nuevo en `meal-plan.css`; reglas muertas del panel viejo borradas de `nutrition-dashboard.css`.
- tsc, eslint, 577+ pruebas OK; verificado a 1440 y 402 px.

## Parte 2 (2026-10-03) — el plan a todo el ancho

- Fuera las dos tarjetas laterales (Macros de la comida, Cambio sugerido); `nutrition-meal-insights.tsx` borrado.
- Cada comida: cabecera con totales P · C · G · kcal en columnas y barra fina = parte de la meta diaria (`MacroCells`, `meal-macro-cells.tsx`). Los alimentos repiten las columnas; rótulos de columna una vez arriba (`.meal-legend`).
- Sustitución en la fila: el botón ↔ despliega `InlineSwap` bajo el alimento (sugerencia más parecida, deltas, «Usar este cambio», «Más opciones»). La sugerencia se pide solo al abrir.
- «Comparar» pasa al pie de cada comida.
- Móvil: sin riel ni rótulos; macros bajo el título con su letra; fila de alimento en flex (la rejilla a contenido sacaba los botones de la tarjeta).

## Parte 3 (2026-10-03) — legibilidad, color por macro y «no lo comí hoy»

- Un color por macro a petición del usuario: P turquesa (--chart-1), C violeta #a996ff, G oro #ffc75a, kcal naranja. Rótulos de columna con su punto de color; barras de 5px con pista teñida.
- Horas 12.5px, rótulos 12px sans, cifras 14.5px (cabecera 17px), letras P/C/G en color en móvil.
- Migración `20261003000000_omitir_alimento_del_dia.sql`: `diet_item_day_swaps.omitted` + `log_diet_template_meal` ignora omitidos y rechaza una comida con todo omitido. Aplicada en local con psql (hay 6 migraciones del 29–30 sep sin registrar; no se usó `migration up`).
- `omitDietItemForDay` (day-swap-actions); restaurar = `undoDietItemDaySwap`. `mapDietTemplate` marca `omitted` y lo excluye de totales.
- Papelera del usuario (`OmitFoodButton`, 34px), solo en «Mi plan» del día; aviso con «Deshacer». Fila omitida tachada con «Restaurar».

## Parte 4 (2026-10-03) — sustituir y comparar, en foco

- Nueva primitiva `src/components/ui/focus-card.tsx` + `.css`: diálogo Radix centrado, `v11-card pc-live-edge`, overlay con blur(18px); `layout="stage"` sin superficie para CompareTool (sus dos tarjetas).
- Migradas de Sheet a FocusCard: diet-item-swap-sheet, food-swap-sheet, recipe-swap-sheet, library-swap-sheet, plan-exercise-row (sustituir ejercicio), meal-compare-sheet (stage).
- El ↔ de cada alimento abre la tarjeta (trigger "action"); `inline-swap.tsx` borrado.
- Trampa: `-webkit-backdrop-filter` junto a `backdrop-filter` hacía que el compilador eliminara ambos.

## Parte 5 (2026-10-03) — resumen en cinco tarjetas

- «kcal pendientes del plan» dentro de la tarjeta de Calorías (pastilla naranja); Fibra como quinta tarjeta (verde #7ddc8f).
- Rejilla 1.55fr + 4; ≤980px de contenedor calorías a todo el ancho + 4; móvil 2×2 con meta, barra y nota visibles.
- Barras y puntos del rótulo con el color de cada macro (mismo código que la lista).
- Pendiente de decidir: agua (meta existe, ingesta no se registra) o sodio/azúcar (foods tiene columnas, los snapshots de meal_items no).

## Parte 6 (2026-10-03/04) — agua, sodio, azúcar, biblioteca compacta

- Migración `20261003010000_agua_sodio_azucar.sql`: `water_logs` (RLS), `meal_items.sodium_snapshot_mg / sugar_snapshot_g` (null = sin dato), RPC de registro los guarda. Todas las vías de registro escriben las instantáneas (`lib/extras.ts`).
- Migración `20261004000000_sodio_azucar_alimentos_base.sql`: 20/21 alimentos base con sodio/azúcar de USDA SR Legacy (fdcId en comentarios, verificados por kcal) + relleno de instantáneas null. Falta tortilla de maíz (límite de la API). Avena sin azúcar en USDA.
- Resumen: Calorías · Agua · Proteína · Carbos · Grasas · Fibra en una fila; borde v11 en el color de cada nutriente. Agua con −/+250/+500 (`water-card.tsx`, `water-actions.ts`).
- Sodio/azúcar solo por alimento en el plan, cuando existen y son > 0. Tarjetas diarias retiradas a petición del usuario.
- Colores: proteína oro #ffc75a, carbos violeta #a996ff, grasas turquesa (--chart-1), fibra #7ddc8f, agua #5cc8ff.
- Claims NUT-009 (sodio, OMS 2012, ISBN 9789241504836) y NUT-010 (azúcares, OMS 2015, ISBN 9789241549028), verificados en WHO IRIS.
- Biblioteca: tarjetas de 519→383px, 5-6 por fila, macros con punto de color y letra en móvil.
- Pendiente: queso fresco con macros de feta (preguntado al usuario); migraciones a producción.

## Parte 7 (2026-10-04) — Biblioteca: buscador, pestañas, acciones

- `library-search.tsx`: cápsula con lupa y micrófono (Web Speech API si existe), sugerencias en tarjeta aparte, combobox accesible; sigue siendo `<form method=get>`. `suggest-actions.ts`: catálogo propio + prefijo + contiene; `rankSuggestions` ordena (prefijo > palabra entera > inicio de palabra) y quita repetidos.
- Quitado el enlace «Plan de ejemplo · comidas pendientes».
- Colecciones (Mi biblioteca/Favoritos/…) con las pestañas de Nutrición.
- `components/ui/expand-action.*`: botón que se expande, compartido por Importar dieta y Crear alimento (`FoodFormDialog trigger="expand"`).
- Paginación con `data-glow` (brillo naranja que sigue al puntero).
- Fibra como quinta columna del plan; arreglados los puntos de color de los rótulos de columna (el atributo nunca se había aplicado).

## Parte 8 (2026-10-05) — tarjetas de comparar

- `macro-skill-bars.tsx/.css`: barras de macros con etiqueta flotante y llenado animado (escala de gramos compartida entre las dos tarjetas), halo difuminado por papel (azul actual / naranja alternativa) y `.compare-outline-button`.
- Comparar alimento (`swap-comparison-board.tsx`): `FoodMedia` exportado, barras nuevas, halo; filas a 40px alineadas con la columna de diferencias.
- Comparar comida (`CompactFoodCard`): cabecera con foto del alimento principal + nombre + `mealKind` («Comida completa · N alimentos» o el macro dominante), kcal, barras, «Editar ingredientes» con borde. Sin la franja de 3px.
- Móvil: comparar comida apila las tarjetas; comparar alimento usa letras P/C/G/F.
- Ojo: compare-tool / compact-nutrition / alternative-explorer.css se rehicieron la noche del 4-oct fuera de esta sesión; se construyó encima, sin revertir.
