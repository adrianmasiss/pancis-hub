# Inicio móvil rediseñado (2026-10-24)

Referencia: `~/Downloads/pancis-hub-inicio-referencia` (Inicio.dc.html, Nav.dc.html, prompt).

- `src/mobile/screens/home/home-view.tsx`: encabezado (avatar 48, fecha, «Hola», racha),
  entreno de hoy (semana, «Empezar» → `startSession`, «Continuar» si hay sesión, «Listo por
  hoy» si ya entrenó), nutrición (anillo 92, macros, siguiente comida), agua (`useWater`,
  misma acción que Nutrición) y peso (cambio en 4 semanas previas a la última medida, color
  según objetivo, línea que se dibuja), consejo del copiloto y accesos.
- Consejo POR REGLAS (decisión del usuario, no IA): `insight.ts` + tests. Orden: ajuste por
  entreno → comida con >1 h de atraso → proteína (≥15 h, falta >1/3) → agua (≥15 h, <50 %).
  Sin regla, la tarjeta no aparece.
- Racha compartida con Perfil: `src/mobile/streak.ts`.
- «Guardar» del resumen del entreno vuelve a Inicio: `finishSession({ returnTo: "/" })`
  (escritorio sigue en /entrenamiento por defecto). Perfil ya volvía a `/`.
- Desvíos: macros con nuestros colores; pesos de letra a 600 para seguir el cambio de
  tipografía que había en el árbol (sin Saira).
- Sin días de descanso en el modelo de rutina: «descanso» = ya entrenó hoy.

## Pruebas y correcciones (misma sesión)

- Rutinas PDF: `routine-parser.ts` (renglones partidos, más indicaciones, circuitos en lista,
  notas del día), `exercise-matcher.ts` (press de pecho máquina, sissy, militar, conflicto de
  equipo), `import-actions.ts` (respaldo por texto si falla la IA, sólo con `respaldo=texto`
  que manda el móvil). Rutina 2: 11 → 5 dudosos.
- Plan de nutrición PDF: prompt (scoop ≈ 30 g, «al gusto» = 50 g); `/nutricion/dieta` en móvil.
- Copiloto: sólo evidencia citada (`citedSources`), bloque «Evidencia» visible en móvil.
  Migración `20261024000000_evidencia_texto_usuario.sql` — PENDIENTE `db push` en prod.
- `/evidencia` en móvil; `format-value.ts` sin «[object Object]» y con etiquetas legibles
  (también se ve en escritorio, `constant-row.tsx`).
- Sustituciones: `SwapSheet` con `key`; sin balísticos/estiramientos salvo que el original lo
  sea; alimentos sugeridos genéricos del mismo grupo y ±50 % kcal (compartido con escritorio).
- Ficha de alimento: `src/mobile/screens/nutrition/food-detail.tsx` (`?alimento=<id>`), con
  porciones, tabla porción/100 g, «Sin dato» para null, «Qué aporta y qué no»
  (`food-facts.ts`, umbrales FSA/UE, con tests) y fuente. La biblioteca enlaza a la ficha.
- Datos dudosos reportados, no corregidos (biblioteca propia del usuario): ~480 alimentos
  USDA con kcal que no cuadran, 90 con >900 kcal/100 g (probables kJ), marcas en inglés,
  ejercicios sin foto/secundarios y duplicados.

## Limpieza del catálogo (pedida: «hazlos en el orden que quieras»)

- Hallazgo: los genéricos de USDA que «no cuadraban» con 4/4/9 están BIEN (alcohol 7 kcal/g,
  fibra, especias, polioles: USDA usa factores propios). No se tocaron.
- `20261025000000_alimentos_datos_dudosos.sql`: `foods.data_issue` + trigger. 365 etiquetas
  de marca marcadas (117 macros imposibles, 248 kcal incoherentes). No se corrigen (no se
  sabe qué número es el malo): quedan fuera de biblioteca, búsquedas, sugerencias, copiloto e
  importación de dietas; la ficha móvil avisa. Lo propio del usuario siempre se ve.
- Biblioteca «Todos» sin búsqueda: sin productos de marca (afecta escritorio: 28.140 → 12.011).
  OFF ya prefería `product_name_es`.
- `20261025010000_ejercicios_duplicados.sql`: 185 repetidos fusionados (177 con su versión
  con foto), referencias repuntadas, soft delete; 55 sentadillas/zancadas/prensas con
  cuádriceps de principal; «в°» → «°»; `has_image` y biblioteca con foto primero.
  Sin secundarios: casi todos aislamientos/estiramientos, correcto. 1.142 siguen sin foto
  (no hay fuente libre).
- `20261025020000_micronutrientes_usda.sql` (2,6 MB, generada por
  `scripts/micronutrientes-usda.mjs` desde las descargas públicas de FDC, sin clave):
  `foods.micronutrients` en 11.958 genéricos. Ficha: saturada, colesterol, 10 vitaminas y
  minerales con % VD (FDA), «Rico en…» (≥20 % VD/100 g, top 3).
- Pendiente usuario: `db push` de 20261024000000, 20261025000000, 20261025010000, 20261025020000.
