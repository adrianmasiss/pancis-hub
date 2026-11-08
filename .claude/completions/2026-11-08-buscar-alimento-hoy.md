# Buscar alimento en Nutrición › Hoy (móvil) — 2026-11-08

## Hecho
- `day-food-search.tsx` rehecho: recientes con el campo vacío, resultados ordenados por
  nombre (`day-search-rank.ts`; «pollo» ya no trae «Abadejo» por el alias «pollock»),
  filas con nombre en dos líneas, crudo/cocido, kcal y P/C/G en sus colores, esqueletos.
- Sin resultados: tarjeta destacada «Buscar fuera de tu biblioteca» (OFF y luego la web),
  globo girando, píldora de estado.
- `extra-sheet.tsx`: porciones rápidas (las del alimento + 50–250 g), macros en color y el
  alimento elegido arriba del destino/nombre.
- Animaciones en `mobile.css` (sección «Buscar alimento en Hoy»), todas con reducción de movimiento.
- Verificado: tsc, eslint, vitest, e2e `nutrition-today-add` (E2E_PORT=3100), capturas oscuro y claro.

## Cron de recordatorios
- La ruta en producción acepta el CRON_SECRET de Vercel (200). El fallo está del lado de Supabase.
- Migración `20261108000000_recordatorios_cron_tolerante.sql`: limpia espacios/saltos de línea
  del secreto y la URL de Vault y quita la barra final. Pendiente `supabase db push` del usuario.
