# Módulo de Entrenamiento: sesión, sustitución, calendario, rutinas con IA y ficha

Fecha: 2026-10-17. Plan aprobado por fases a partir del documento del usuario.
Gran parte ya existía (sesión en vivo con cronómetro, registro por serie,
importador de texto/PDF, biblioteca); se completó lo que faltaba.

## Fase 1 — Datos
- Migración `20261017000000_entrenamiento_sesion.sql`:
  - `workout_plans.origin` (`coach` | `ia`, por defecto `coach`) y `ai_inputs`.
  - Tabla `workout_session_exercises` (original → realizado, por sesión, RLS que
    exige que la sesión sea del usuario).
  - `exercise_catalog.summary` e índice `workout_sessions(user_id, completed_at)`.
- `src/lib/dates.ts`: `weekBoundsISO` (lunes a domingo), `localDateOf`,
  `addDaysISO`, con tests.
- Tipos regenerados en `src/types/database.ts`.

## Fase 2 — Entrenar
- La pestaña «Hoy» pasa a llamarse «Entrenar».
- Cada día muestra «Día N», su enfoque y la marca «hecho esta semana», que
  respeta la zona del perfil (`doneThisWeek` en `getTrainingOverview`).
- `StartSessionButton({ doneOn })`: si el día ya se hizo, aparece el diálogo
  «Ya hiciste este día esta semana» con Repetir y Cancelar.
- Los botones dicen «Iniciar entrenamiento» y «Finalizar entrenamiento».

## Fase 3 — Sustituir solo en la sesión
- `lib/session-substitutes.ts`: % de similitud con Jaccard ponderado por
  músculos (principal ×2), qué músculos comparte, pierde o suma, y desempate
  por patrón y equipo. Tiene tests.
- `session-swap-actions.ts`:
  - `suggestSubstitutes`: el motor elige 12 candidatos y Gemini escoge 2 o 3 con
    su razón, validando los ids. El respaldo, sin clave o con error, son los 3
    mejores del motor. Timeout de 6 s, sin «thinking» y sin reintentos.
  - `searchSubstitutes`, `swapSessionExercise` y `undoSessionSwap`.
- Antes de iniciar, el cambio se anota para hoy (`exercise_day_swaps`), y
  `startSession` lo copia a la sesión. Durante la sesión, el cambio va a
  `workout_session_exercises`. La plantilla nunca se escribe.
- Tarjeta `substitute-exercise.tsx` (FocusCard) con sugerencias, buscador y
  «Volver al original».

## Fase 4 — Historial
- `training-calendar.tsx` + `lib/calendar.ts`, con tests:
  - Mes que empieza en lunes, con un punto en los días entrenados.
  - Detalle del día: rutina, día y enfoque, hora, duración real, series con
    kg × reps y RIR, y la etiqueta «Sustituyó a X».
- El segmento «Sesiones» pasa a ser «Calendario».

## Fase 5 — Rutinas e IA
- Rutinas en dos grupos fijos, «Del coach» y «Creadas por IA», cada uno con
  su estado vacío. Las rutinas manuales cuentan como coach.
- `extractRoutineWithAi`: lee un PDF o una foto con Gemini y devuelve la misma
  vista previa. Errores distintos para «ilegible» e «incompleta».
- La revisión es editable: nombres de día, series, reps, RIR, descanso y
  notas, además del emparejado. `importRoutine` guarda la estructura revisada,
  no el texto.
- `generateRoutine` + cuestionario (`generate-routine-dialog.tsx`):
  - Los candidatos salen del catálogo filtrado por equipo y nivel.
  - Gemini solo elige por referencia, y `validateGenerated` recorta los
    números a rangos razonables.
  - `analyzeRoutine` revisa la rutina; si encuentra problemas de prioridad
    alta, se reintenta una vez.
  - Se guarda con `origin = ia`.
- Aviso `AiNotice` visible en la tarjeta, en el detalle de la rutina y en
  Entrenar cuando la rutina activa es de IA.

## Fase 6 — Biblioteca
- La ficha empieza por cómo se hace, los músculos principales y secundarios
  (con tildes) y de 1 a 3 puntos clave.
- `lib/exercise-summary.ts` recorta la explicación larga si todavía no hay
  resumen.
- `src/lib/flags.ts` → `FLAGS.exercisePersonalBest = false`. Cuando se active,
  `personalBestFor` calcula el peso máximo desde las sesiones.
- `scripts/resumir-ejercicios.mjs` (`npm run resumir:ejercicios`) genera con
  Gemini lite el resumen y los puntos clave, puede retomarse
  (`scripts/datos/resumenes-ejercicios.json`) y escribe la migración
  `20261017010000_resumen_ejercicios.sql`, que actualiza por `external_id` o
  por `id`.

## Verificación
- tsc, eslint y prettier pasan en lo tocado. Vitest: 656 tests.
- e2e `training-workspace` ampliado y en verde: iniciar, registrar, sustituir
  (comprobando que la plantilla no cambia), registrar otra serie, finalizar,
  aviso de repetir e historial con «Sustituyó a».
- Capturas en escritorio y móvil sin scroll horizontal.
- Gemini probado de verdad: la foto de una rutina se leyó (marcó el
  ejercicio incompleto) y se generó una rutina de 4 días en unos 30 s.

## Pendiente o a saber
- Cuota gratis de `gemini-2.5-flash`: 20 peticiones al día. Conviene cambiar
  `GEMINI_MODEL` si estorba (ver memoria).
- `e2e/flujo-minimo.spec.ts` sigue roto por el helper de acceso (anterior a
  esto); su test de importar ya espera los campos editables.
- Producción: hay que aplicar las migraciones con `supabase db push` (primero
  `--dry-run`) y comprobar que `GOOGLE_GENERATIVE_AI_API_KEY` esté en Vercel.
