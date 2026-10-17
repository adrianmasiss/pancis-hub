# Progreso compacto + crédito del maniquí plegado

- Progreso / Resumen: escritorio 2984 → 1447 px; móvil 4085 → 2613 px.
  - «Tu cuerpo hoy»: siempre visibles la puntuación y 5 cifras (peso, masa muscular, masa grasa, % grasa, IMC). El resto del informe en `<details>` («Composición», «Parámetros de investigación», «Control de peso», «Perímetros», «Análisis segmental»), cada uno con resumen en una línea.
  - Segmental: magra y grasa en una sola tabla de 5 filas (antes dos listas de 5).
  - Cambio y Evolución del peso lado a lado desde 1100 px, misma altura; barras del cambio en 2 columnas.
  - Maniquí a 560 px en escritorio para acompañar la columna de cifras.
  - Se quitaron los rótulos pequeños sobre los títulos (`progress-eyebrow`) en las cuatro pestañas.
- Crédito CC BY 4.0: `ModelCredit` (botón «i» sobre el modelo, `<details>`), en Hoy y Progreso. Añade «Adaptado para Pancis Hub», que la licencia pide al modificar la obra. Se quitó el párrafo de Hoy.
- e2e `flujo-minimo` «composición corporal con dos InBody»: aserciones actualizadas a «Tu cuerpo hoy» / «Cambio desde tu medición anterior». La prueba ya fallaba antes, en `esperarAcceso` (busca `input[name="email"]`, que el nuevo acceso no tiene).
