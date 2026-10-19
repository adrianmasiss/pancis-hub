# Ficha «Cómo hacerlo» compacta — 2026-10-17

La ficha del ejercicio tenía ~15 secciones seguidas (1 860 px de scroll) y, sin
`summary`, ni siquiera mostraba «Cómo se hace».

- `exercise-detail-sheet.tsx`: a la vista sólo fotogramas, cómo se hace (cae a
  `executionNotes` si no hay resumen), qué trabaja (principal/apoyo), 1–3
  puntos clave y la mejor marca (tras el flag). Movimiento, curva, posición,
  errores, esquema sugerido y valoración van en un único «Detalle técnico»
  cerrado por defecto (grid-template-rows, `inert` al cerrar).
- `exercise-detail.css` nuevo; claves i18n `worksTitle`, `movement`,
  `primaryShort`, `secondaryShort`, `technicalTitle`, `technicalHint`.
- Cargando = esqueleto con `role=status`; en móvil el panel ocupa el ancho entero.
- e2e `training-workspace` ahora espera «Qué trabaja» en vez de «Cargando…».
