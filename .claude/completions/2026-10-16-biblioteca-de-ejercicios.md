# Biblioteca de ejercicios como pestaña de Entrenamiento

- Nueva pestaña «Biblioteca» (`/entrenamiento?vista=biblioteca`) junto a Hoy, Historial y Rutinas.
- Misma forma que la biblioteca de alimentos (reutiliza `food-library.css` y las pestañas de `nutrition-workspace.css`): categorías por grupo muscular, colecciones (Todos / En mis rutinas / Recientes) con buscador, rejilla de fichas con foto y paginación.
- Grupos: `lib/library-groups.ts` agrupa los 16 músculos del catálogo en 11 categorías; `rotuloCatalogo` pone las tildes que el catálogo no guarda.
- `MuscleFigure`: silueta SVG con las zonas de `MODEL_REGIONS` encendidas; icono de categoría y foto de reemplazo (solo 880 de 2207 ejercicios tienen foto).
- Ficha: grupo, «En tu rutina», equipo, músculo principal + secundarios, «Con biomecánica», y «Cómo hacerlo» (abre `ExerciseDetailSheet`, que ahora acepta `triggerClassName`).
- `/entrenamiento/catalogo` redirige a la pestaña conservando búsqueda, músculo (→ grupo) y equipo. Se quitaron el enlace «Explorar ejercicios», los estilos `.catalog-*` de globals.css y `messages.training.catalog`.
