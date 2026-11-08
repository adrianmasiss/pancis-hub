# Reparto de la IA en dos niveles (2026-11-08)

- `src/lib/ai/google.ts`: niveles `fino` / `rapido`, `withGeminiFallback` (cuota agotada o modelo caído → el otro, una vez).
- `src/features/assistant/lib/routing.ts`: quién contesta cada pregunta (reglas / rápido / fino). Síntoma clínico ya no pasa por la IA.
- Copiloto: botón «Analizar a fondo» en escritorio y móvil (`deep: true` → fino). El reformateo a JSON va al rápido.
- Las otras 8 funciones con IA tienen nivel fijo: rápido para elegir sustitutos y estimar macros; fino para PDF, InBody, etiquetas, generar rutinas y buscar en la web (su formateo, rápido).
- Prompt: la acción debe llevar cantidades si el payload las trae (el lite daba respuestas sin gramos).
- Nueva variable opcional `GEMINI_MODEL_RAPIDO` (default gemini-3.1-flash-lite). No requiere cambios en Vercel.
- Verificado: 745 tests, typecheck, lint; en la app local, rápida 5 s con gramos, a fondo 10 s.

## Productos: Open Food Facts antes que la web (mismo día)
- `src/server/tools/off-lookup.ts` + `importWebFood(query, { barcode })`: biblioteca → OFF → web.
- OFF: relevancia estricta o nombre contenido en la búsqueda (con marca), calorías coherentes con macros, snacks secos <250 kcal rechazados (porción cargada como 100 g), fibra ausente solo con carbos ≤ 5 g. Fichas en conflicto → códigos para elegir.
- `volumeBasis` en web-food.ts: tabla citada por 100 ml no se guarda como 100 g; bebida "por 100 g" sin cita → incompleta; porción en ml sin gramos → incompleta.
- Búsqueda web fijada a `getGeminiSearchModel()` (solo 2.5-flash acepta Google Search gratis).
- Verificado: 763 tests; copiloto local guardó «Chiky» desde OFF en 5 s (antes 21 s y sin guardar).
