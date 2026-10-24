# Comparador de alimentos — identidad Pancis

El comparador comparte los materiales de Nutrición: negro y grafito, reflejos finos del componente v11, radios de 24–26 px, naranja para acciones y el mismo color por nutriente (oro, violeta, turquesa y verde). Las superficies se mantienen sólidas dentro del diálogo para preservar contraste y evitar desenfoques apilados.

Foto y nombre se leen juntos. Las imágenes conservan su forma, sin marcos circulares decorativos; si no existe fotografía se muestra un símbolo discreto. Si una descarga falla se intenta la ilustración conocida y después el símbolo. La referencia muestra sus macros mientras se exploran alternativas.

Una tabla semántica reúne cantidades actuales, alternativas y diferencias. Todas las barras comparten escala en gramos. La alternativa usa los colores de cada macro y la referencia usa gris; los encabezados identifican ambas columnas sin depender del color. La conclusión energética describe el cambio sin calificar la alternativa como mejor o peor. Los cálculos y la confirmación existentes se conservan.

CSS Modules aísla la composición de las antiguas tarjetas recortadas. En móvil se apilan las superficies y los controles se reorganizan según el ancho de su columna. Se permite desplazamiento vertical para nombres largos, zoom y acceso a confirmar.

## Oportunidades de movimiento

Auditoría aplicada antes de implementar. Curva existente: `cubic-bezier(0.32, 0.72, 0, 1)`.

| Ubicación                                         | Situación                       | Propósito            | Frecuencia  | Receta implementada                                                                                                                           |
| ------------------------------------------------- | ------------------------------- | -------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `swap-comparison-board.tsx`, retrato de FoodCard  | Cambia el alimento seleccionado | Evitar cambio brusco | Ocasional   | Opacidad 0→1 y escala .97→1, 220 ms; movimiento reducido: solo opacidad, 100 ms. No se bloquean controles.                                    |
| `comparison-table.module.css`, botones            | Confirmar la pulsación          | Feedback             | Decenas/día | Escala .98 durante la presión, 140 ms; movimiento reducido conserva el feedback visual del control sin escala. Hover limitado a puntero fino. |
| `swap-comparison-board.tsx`, barras de nutrientes | Cambia la porción               | Indicar estado       | Ocasional   | `scaleX` al valor real en 220 ms, misma curva; reducido: actualización inmediata. Los números siempre cambian inmediatamente.                 |

## Candidatos descartados

- Contadores animados de kcal/gramos: dificultan leer y escribir cantidades. Rechazados por función.
- Alimentos flotando continuamente: decoración en una herramienta de decisión. Rechazados por propósito y función.
- Entradas escalonadas de resultados de búsqueda: retrasan exploración repetida. Rechazadas por frecuencia.
- Animación de foco de teclado: no debe retrasar navegación. Rechazada por interacción de teclado.

La pantalla necesita poco movimiento. El cambio del retrato aporta la mayor continuidad; las cifras deben permanecer estables. Para futuras revisiones aisladas: `improve-animations plan transición de selección del alimento`.

## Verificación

`e2e/comparison-table.spec.ts` usa una cuenta temporal en Supabase local y comprueba búsqueda, cantidades inválidas, actualización de alternativas sin modificar la referencia, ancho de 320/390/768/1440 px, acceso a confirmar, foco de teclado, Escape, movimiento reducido y errores de JavaScript. Las capturas quedan en `test-results`. La prueba no ejecuta una sustitución real.
