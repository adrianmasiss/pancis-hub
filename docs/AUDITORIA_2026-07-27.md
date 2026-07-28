# Auditoría de Pancis Hub y plan de implementación

**Fecha:** 2026-07-27
**Alcance:** auditoría profesional previa a cualquier modificación, según `PROMPT_IMPLEMENTACION.md`.
**Estado:** aprobada. Plan vigente en la **Revisión 2** al final del documento.

> **Aviso de vigencia.** Las secciones A a I siguen siendo válidas como diagnóstico.
> Las secciones **J (plan) y K (Fase 1) fueron sustituidas** por la Revisión 2, que
> incorpora tres correcciones de alcance del usuario: la generación de planes entra
> en alcance, la IA calcula macros a través de herramientas determinísticas, y el
> chat libre con contexto científico pasa a ser una función central.

---

## Hallazgo previo que condiciona todo lo demás

El directorio `/Users/adrianmasis/Desktop/personal/pancis-hub/` **no contiene el proyecto**. Solo están el paquete de documentación (extraído el 2026-07-27 a las 18:09), `logo.png` y `logo-dark.png`. No hay `src/`, `package.json`, `supabase/` ni repositorio git.

El código **no se perdió**: está en `github.com/adrianmasiss/pancis-hub` (público). Se clonó en solo lectura en un directorio temporal de la sesión para poder auditarlo.

**Rama real de trabajo: `feat/sistema-grafito`, 12 commits por delante de `main` y sin fusionar.** Es la única que coincide con la base de datos local (migraciones `pantry_items` y `diet_item_day_swaps`). `main` está en el estado del 2026-07-22. Toda la auditoría describe `feat/sistema-grafito`.

---

## A. Resumen de lo entendido

1. Pancis Hub no genera dietas ni rutinas: asume que el usuario **ya tiene** un plan y lo ayuda a desviarse de él con criterio.
2. El trabajo central es la **sustitución puntual**: cambiar un alimento o un ejercicio *solo por hoy*, viendo qué se gana y qué se pierde.
3. El plan base es sagrado. Un cambio diario es una **excepción con fecha**, nunca una reescritura de la plantilla.
4. Se distinguen tres estados distintos: planificado, seleccionado para hoy y realmente consumido o realizado.
5. Los números salen de **funciones determinísticas**. La IA interpreta, explica y elige contexto; no calcula macros ni inventa cifras.
6. Toda afirmación científica relevante lleva fuente, grado de evidencia, población, limitaciones y fecha de revisión.
7. Se prohíbe la falsa precisión: EMG no prueba hipertrofia, la BIA es una estimación, la biomecánica es una heurística explicable y no un ranking universal.
8. La biometría muestra únicamente lo medido. El cuerpo 3D es una visualización genérica, no un escaneo del usuario.
9. Arquitectura free-first: USDA, Open Food Facts, PubMed, Europe PMC, Crossref, OpenAlex, wger. Lo esencial funciona aunque la IA falle.
10. Nada se modifica sin confirmación explícita del usuario, y todo queda auditado.

---

## B. Documentación revisada

Leídos completos, los 29 archivos del manifiesto: `README.md`, `MASTER_IMPLEMENTATION_SPEC.md`, `manifest.json`, `docs/00` a `docs/20` (incluido `07A`), los 3 esquemas y las 2 plantillas.

**Faltantes o incidencias:**

| Incidencia | Detalle |
|---|---|
| Nombre del prompt | Se refirió a él como `PROMPT_IMPLEMENTATION.md`; el archivo real es `PROMPT_IMPLEMENTACION.md`. Leído. |
| Código fuente ausente | Ver hallazgo previo. Auditado desde el clon de GitHub. |
| Documentación del repo | El repo trae su propia `docs/` (17 archivos: `01_PRODUCT_VISION`, `06_DATABASE_SCHEMA`, `07_DESIGN_SYSTEM`, `DECISIONS.md`, `SECURITY.md`, etc.), **anterior y distinta** a este paquete. Conviven dos fuentes de verdad numeradas 01-10 con contenidos diferentes. Hay que resolverlo, no borrarlo. |

---

## C. Estado actual del sistema

### Validaciones ejecutadas (comandos reales de `package.json`)

| Comando | Resultado |
|---|---|
| `npm run typecheck` | limpio |
| `npm run lint` | limpio |
| `npm run test` | **305 pruebas, 25 archivos, todas pasan** |
| `npm run build` | compila, 23 rutas |
| `npm run test:e2e` | no ejecutado (requiere Supabase local y servidor). Existe 1 archivo: `e2e/flujo-minimo.spec.ts` |

### Completamente funcional

- Autenticación Supabase con `src/proxy.ts` (Next 16 sustituye `middleware.ts`), registro, recuperación, onboarding.
- **Aislamiento por usuario: 34 tablas, todas con RLS activo.** `external_food_cache` tiene RLS sin políticas *a propósito* y con `revoke all from authenticated`: es caché de servidor. Correcto.
- Biblioteca híbrida de alimentos: proveedores USDA y Open Food Facts tras el contrato `FoodProvider`, normalizado a 100 g, caché `external_food_cache`, dedup por `(external_source, external_id)`, alias, correcciones de usuario, código de barras, favoritos, personalizados con `owner_user_id`.
- Motor de equivalencias nutricionales (`equivalence.ts`, 576 líneas): puntaje 0-10 por macro y global, pesos, penalizaciones por grupo y por estado crudo/cocido, pisos por macro para no castigar cantidades mínimas, equivalencia doméstica ("≈ 3 unidades"), filtros `similar / mas_proteina / menos_calorias / mas_saciedad / disponibles`.
- **Excepción diaria de nutrición** (`diet_item_day_swaps`, migración del 2026-07-27): el plan deja de sobrescribirse, la sustitución vive por fecha, con instantánea de macros cuando el sustituto no está en la biblioteca, índice único por `(user_id, template_item_id, date)` y deshacer.
- Snapshots nutricionales: `meal_items` guarda `calories_snapshot`, `protein_snapshot`, etc. El histórico no se mueve si cambia el catálogo.
- Versionado de dietas y rutinas con `snapshot` JSON y restauración.
- Auditoría: `audit_logs` con `previous_values`, `new_values`, `reason`, `origin`; lectura propia por RLS, escritura solo service role.
- Entrenamiento: catálogo con biomecánica extendida, planes, días, sesiones, series con RIR/RPE/tempo/descanso, importación de rutinas por texto.
- Almacenamiento: 5 buckets, `progress-photos`, `inbody-files` y `avatars` privados.
- PWA instalable, `/offline`, service worker que nunca cachea Supabase.

### Parcialmente funcional

- **Motor biomecánico** (`biomechanics.ts` y `exercise-comparison.ts`): valora por contexto (objetivo, experiencia, equipo, posición en sesión) y **siempre exige una razón junto al número**, que es exactamente lo que pide el doc 07. Pero sus dimensiones no son las 8 ponderadas del doc 07, y no modela **regiones musculares**: `exercise_catalog` guarda `primary_muscle` y `secondary_muscles` como texto, sin porción clavicular ni esternocostal.
- **Copiloto IA**: `generateObject` con salida estructurada en 3 puntos (asistente, importación de dieta, pregunta de sustitución) sobre Gemini 2.5 Flash, con motor determinístico de respaldo (`rules.ts`) que funciona sin IA. Cumple el principio, pero **no hay capa de herramientas**: 0 de las ~25 `tools` de los docs 08 y 07A. Las conversaciones no se persisten.
- **Biometría**: `body_measurements` con peso, grasa, músculo esquelético, agua, grasa visceral, medidas, `source` y adjunto InBody. Sin segmentos.
- Prescripción y análisis de rutina (`prescription.ts`, `routine-analysis.ts`) existen y están probados, pero **no persisten**: no hay `training_preferences`, `program_blocks`, `exercise_prescriptions` ni `muscle_weekly_loads`.

### Únicamente visual

- **Academia**: 1 bloque de artículos de siembra. `article_references` tiene columna `doi`, pero no hay biblioteca científica real detrás.
- 5 secciones **suspendidas** en `navigation.ts` (Recetas, Despensa, Academia, Historial, Asistente): la ruta responde y el código vive, pero no se enlaza. Está documentado en el código como repliegue deliberado a cuatro pantallas.

### No implementado

- Cuerpo 3D InBody. **No existe dependencia de Three.js ni React Three Fiber.** Doc 09 sin empezar.
- Biblioteca científica y RAG. Sin `pgvector`, sin proveedores PubMed / Europe PMC / Crossref / OpenAlex, sin `evidence_documents`, `evidence_claims`, `evidence_chunks`. Doc 10 sin empezar.
- Vista "Hoy" como pantalla propia del doc 13. Existe "Inicio", que es otra cosa.
- Tolerancias configurables por usuario (doc 01: ±5 % kcal, ±10 % proteína).
- Combinación de 2-3 alimentos para aproximar un objetivo (doc 05).

### Defectuoso o riesgoso

1. **`substitutePlanExercise` sobrescribe el plan base.** `src/features/training/actions.ts:318` hace `update workout_plan_exercises set exercise_id`. Sustituir un ejercicio **destruye la rutina original de forma permanente**. Es el mismo problema que la nutrición resolvió con `diet_item_day_swaps` y que el entrenamiento todavía tiene. Viola ADR-002, RF-002 y el principio 1 del North Star. Solo queda rastro en `audit_logs`.
2. **Alergias por coincidencia de subcadena.** `matchesRestriction` compara `nombre.includes(restriccion)`. El doc 14 las declara restricciones duras. "Leche" no filtra "queso"; "nuez" filtra "nuez moscada" por accidente.
3. **`feat/sistema-grafito` sin fusionar y sin copia local.** 12 commits, incluida la excepción diaria de nutrición y el sistema visual, viven en una sola rama remota.
4. **Deriva entre producción y esquema.** El Supabase local tiene 24 migraciones; `main` publica 22. No se pudo verificar en qué nivel está el proyecto desplegado `bqhybvweumrqtkaalksn`.
5. **Service role key pendiente de rotar** (quedó en el historial de una conversación previa).
6. **El repositorio es público** y el producto maneja biometría, fotos de progreso y alergias. No hay secretos versionados (solo `.env.example`), pero conviene decidirlo a conciencia.
7. Dos árboles de documentación numerados 01-10 con contenidos distintos.

---

## D. Matriz de cumplimiento

| Requisito | Origen | Estado | Archivos | Acción requerida | Prio |
|---|---|---|---|---|---|
| Plan base nunca se pierde (dieta) | 00, ADR-002 | Completo | `diet_item_day_swaps.sql`, `day-swap-actions.ts` | ninguna | - |
| Plan base nunca se pierde (rutina) | 00, ADR-002, RF-002 | **Requiere corrección** | `training/actions.ts:304-345` | tabla `exercise_day_swaps` y dejar de escribir el plan | **P0** |
| Alergias como restricción dura | 14 | **Requiere corrección** | `equivalence.ts:matchesRestriction` | tokenizar, alias, grupos alergénicos | **P0** |
| RF-001 versionado de dieta y rutina | 03 | Completo | `diet_template_versions`, `workout_plan_versions` | ninguna | - |
| RF-003 snapshots nutricionales | 03 | Completo | `meal_items.*_snapshot` | ninguna | - |
| RF-018 aislamiento entre usuarios | 03, 14 | Completo | 34 tablas con RLS, `verify-rls.mjs` | reejecutar por fase | - |
| Vista Hoy (planificado/consumido/restante) | 01, 13 | Parcial | `app/(app)/page.tsx`, `dashboard/` | consolidar en pantalla Hoy | P1 |
| Tolerancias configurables | 01 | No existe | - | campos en `profiles` y uso en el motor | P1 |
| Optimizador de porción por vector | 05 | Parcial | `equivalentQuantity` | minimiza un macro ancla, no el error ponderado E | P1 |
| Pesos contextuales por rol de alimento | 05 | Parcial | `COMPATIBILITY_WEIGHTS` | perfil único; faltan proteico y carbohidrato | P2 |
| Combinación de 2-3 alimentos | 05 | No existe | - | motor combinatorio acotado | P2 |
| Regla huevos/pancakes (no genéricos) | 05 | Parcial | `ai-actions.ts` | exigir receta o marca antes de calcular | P1 |
| Sustituir comida completa | 01, 05 | Parcial | `recipe-swap.ts` | solo por receta existente | P2 |
| Proveedores USDA + OFF | 06 | Completo | `lib/food-providers/` | ninguna | - |
| Crudo/cocido no fusionado | 06 | Completo | `foods.cooked_state` | ninguna | - |
| Calidad y confianza del dato visible | 06, esquema swap | Parcial | `foods.verified/source` | exponer `data_confidence` en la respuesta de swap | P1 |
| Regiones musculares anatómicas | 07, RF-010 | No existe | `exercise_catalog` | `exercise_muscle_targets` con regiones | P2 |
| Compatibilidad 8 dimensiones ponderadas | 07 | Parcial | `biomechanics.ts` (6 dimensiones) | alinear con doc 07 | P2 |
| Nunca puntaje sin explicación | 07, 13 | Completo | `ExerciseRating.reason` obligatorio | ninguna | - |
| Divisiones, frecuencia, volumen, fallo, tempo | 07A | Parcial | `prescription.ts`, `routine-analysis.ts` | 4 tablas nuevas y las 10 herramientas | P2 |
| Herramientas del copiloto | 08, 07A | **No existe** | `assistant/actions.ts` | capa `tools` sobre funciones determinísticas | P1 |
| Persistir conversaciones y citas | 08, 11 | No existe | - | `ai_conversations`, `ai_messages`, `ai_tool_calls`, `ai_citations` | P2 |
| RF-013 IA confirma antes de modificar | 03 | Completo | flujo de confirmación en swaps | mantener al añadir tools | - |
| RF-015 funciona sin IA generativa | 03, ADR-010 | Completo | `rules.ts` determinístico | ninguna | - |
| InBody segmental | 09, 11 | No existe | - | `inbody_measurements`, `segmental_measurements` | P2 |
| Cuerpo 3D | 09 | **No existe** | - | R3F, glTF y alternativa tabular | P3 |
| No inventar datos no medidos | 09, 14 | Completo | `body_measurements` solo campos medidos | mantener | - |
| Biblioteca científica y RAG | 10 | **No existe** | `articles` (demo) | proveedores, claims, pgvector | P3 |
| RF-012 cada claim enlazado | 03, 04 | No existe | - | depende de la anterior | P3 |
| E2E del recorrido completo | 15 | Parcial | `e2e/flujo-minimo.spec.ts` | ampliar por fase | P1 |
| Rotación de service role key | 14 | **Bloqueado** | - | requiere acción del usuario en Supabase | **P0** |

---

## E. Arquitectura actual

**Estructura.** Next.js 16.2.10 con App Router y React 19.2.4. `src/app/(app)` para lo autenticado, `(auth)` para el acceso, `src/features/<dominio>/` con `actions.ts`, `queries.ts`, `schemas.ts`, `components/` y `lib/` de funciones puras probadas, `src/lib/` transversal. La organización real coincide con la del doc 12 salvo que no existe `src/server/`.

**Flujo de datos.** Server Components consultan vía `queries.ts`; las mutaciones pasan por Server Actions validadas con Zod v4; nada de proveedores externos desde el cliente, tal como exige el doc 12. El cliente nunca dicta macros del catálogo compartido: `importExternalFood` recibe `(source, externalId)` y vuelve a consultar al proveedor.

**Autenticación.** Supabase Auth con `@supabase/ssr` y `src/proxy.ts` (Next 16 renombró el middleware). Onboarding obligatorio antes de la app.

**Base de datos.** PostgreSQL en Supabase, 24 migraciones versionadas, 34 tablas, RLS en todas, triggers `set_updated_at`, GRANTs explícitos. Buckets privados con rutas por usuario.

**Servicios e integraciones.** USDA FoodData Central y Open Food Facts tras `FoodProvider` con caché. `free-exercise-db` para imágenes de ejercicios (dominio público). Gemini 2.5 Flash vía Vercel AI SDK 7. Pexels como variable de entorno de apoyo para imágenes.

**Estado de la IA.** Un modelo, tres puntos de uso, salida estructurada con `generateObject`, respaldo determinístico completo. Sin orquestador, sin herramientas, sin RAG, sin memoria.

**Problemas principales.** Los siete listados en la sección C, con `substitutePlanExercise` a la cabeza.

---

## F. Arquitectura propuesta

**El stack se mantiene.** Cumple el doc 12 y la restricción free-first, y no hay ninguna justificación técnica para cambiarlo. Los cambios son aditivos:

1. **Patrón de excepción diaria unificado.** Generalizar lo que ya funciona en nutrición a entrenamiento: `exercise_day_swaps` con la misma forma (fecha, original, sustituto, motivo, origen, único por día). Que ninguna sustitución escriba jamás sobre una tabla de plan.
2. **`src/server/tools/`, capa de herramientas.** Cada función determinística ya existente (`compatibilityScore`, `rebalanceDay`, `recommendPrescription`, `rateExercise`, `analyzeRoutine`) se envuelve como `tool` del AI SDK con esquema Zod. El modelo elige la herramienta, la herramienta calcula, el modelo explica. Es la regla crítica del doc 08 y **no requiere reescribir un solo motor**.
3. **`src/server/providers/research/`** en paralelo a `food/`, con el mismo contrato y las mismas defensas (timeout, retry, caché).
4. **Feature flags** del doc 12 (`AI_CHAT`, `EXTERNAL_FOOD_SEARCH`, `RESEARCH_RAG`, `INBODY_3D`, `AUTO_PLAN_GENERATION`) para que cada fase entre apagada.
5. **Una sola documentación.** Este paquete pasa a `docs/spec/` como fuente de verdad de producto; la `docs/` del repo se conserva íntegra como documentación técnica y de decisiones. No se borra nada.
6. **Diseño.** El sistema "Grafito" ya establece tokens semánticos (`--hairline`, `--macro-protein`, `positive/caution/critical`) y claro/oscuro. En modo preservar: no se toca la paleta ni la arquitectura de información, se corrige contraste midiendo y se respeta `prefers-reduced-motion` cuando llegue el 3D.

---

## G. Cambios de base de datos

**Reutilizables tal cual (sin migración):** `profiles`, `foods`, `food_portions`, `food_aliases`, `food_user_corrections`, `favorites`, `external_food_cache`, `diet_templates` y su árbol, `diet_template_versions`, `meals`, `meal_items`, `nutrition_targets`, `diet_item_day_swaps`, `workout_plans` y su árbol, `workout_plan_versions`, `workout_sessions`, `workout_sets`, `exercise_catalog`, `body_measurements`, `progress_photos`, `audit_logs`, `pantry_items`, `recipes`.

**Equivalencias de nombre.** El doc 11 nombra `diet_plans` / `planned_meals` / `consumed_items`; el sistema usa `diet_templates` / `diet_template_meals` / `meal_items`. **Recomendación: no renombrar.** El modelo real cumple la misma función y renombrar es puro riesgo. Se propone una tabla de equivalencias en la documentación.

**Tablas faltantes, por fase:**

| Fase | Tablas |
|---|---|
| 1 | `exercise_day_swaps` |
| 3 | `training_preferences`, `program_blocks`, `exercise_prescriptions`, `muscle_weekly_loads`, `exercise_muscle_targets` |
| 4 | `inbody_measurements`, `segmental_measurements`, `measurement_files` |
| 5 | `evidence_documents`, `evidence_claims`, `claim_sources`, `evidence_chunks`, `evidence_reviews` (requiere `pgvector`) |
| 6 | `ai_conversations`, `ai_messages`, `ai_tool_calls`, `ai_citations`, `user_memories`, `recommendation_actions` |

**Campos faltantes:** tolerancias en `profiles` (`tolerance_kcal_pct`, etc.); `reason` y `confirmed_at` en `diet_item_day_swaps`; `data_confidence` derivado en la respuesta de swap.

**Índices:** el patrón `(user_id, date)` ya está bien resuelto; replicarlo en `exercise_day_swaps`.

**RLS:** política de 4 verbos por `user_id = (select auth.uid())`, idéntica a la de `diet_item_day_swaps`. Las tablas de evidencia son catálogo compartido: lectura para `authenticated`, escritura solo service role.

**Versionado y snapshots:** el patrón `*_versions` con `snapshot` JSON ya está probado; extenderlo a `program_blocks`.

**Riesgos de migración:** (a) la deriva local/producción sin verificar; (b) `diet_item_day_swaps` y `pantry_items` **nunca se han ejercitado en producción**; (c) instalar `pgvector` en el plan gratuito de Supabase hay que confirmarlo antes de diseñar sobre él. **Ninguna migración destructiva en el plan.**

---

## H. Componentes y servicios

**Reutilizables sin cambios:** primitivos Grafito y shadcn/ui v4, `BrandLogo`, `FoodPicker`, `ExternalFoodSearch`, `BarcodeScanner`, `MealCard`, `DaySummary`, `AssistantFab`, `AskAboutButton`, `MeasurementsTable`, `PlanVersionsSection`, `DietVersionsSection`, `RoutineAnalysisSection`, `ExerciseDetailSheet`.

**A modificar:** `PlanExerciseRow` y `substitutePlanExercise` (excepción diaria); `matchesRestriction` (alergias); `FoodSwapSheet` (mostrar `data_confidence` y fuente); `navigation.ts` (Hoy).

**Nuevos:** `ExerciseDaySwapSheet`, `UndoExerciseSwapButton`, pantalla Hoy unificada, comparador de divisiones, visor `InBody3D` con alternativa tabular obligatoria, `EvidenceBadge` con grado y fecha.

**Servicios nuevos:** `src/server/tools/*` (nutrición, entrenamiento, evidencia, biometría), `src/server/providers/research/*`, `src/server/policies/` para los límites de salud del doc 14.

**Proveedores externos:** actuales USDA, Open Food Facts, free-exercise-db, Gemini. A añadir: PubMed E-utilities, Europe PMC, Crossref, OpenAlex. Todos con plan gratuito, en línea con el criterio de "todo gratis siempre".

**Pruebas necesarias:** unitarias por motor nuevo; *golden tests* de sustitución con valores revisados; *property tests* (macros no negativos, score dentro de 0-10, alergias siempre excluidas, inmutabilidad del histórico); e2e por fase; `verify-rls.mjs` como puerta de cada fase.

---

## I. Riesgos

| Riesgo | Estado hoy | Mitigación |
|---|---|---|
| **Pérdida de trabajo** | `feat/sistema-grafito` sin fusionar y sin copia local | restaurar el repo y decidir la fusión **antes de cualquier código** |
| **Pérdida de datos** | sustituir ejercicio destruye la rutina base | Fase 1 |
| Acceso entre usuarios | RLS completo y verificable | `verify-rls.mjs` como puerta por fase |
| Migraciones | deriva local (24) contra `main` (22), producción sin verificar | reconciliar antes de migrar; nada destructivo |
| APIs externas | contrato, caché y respaldo manual | mantener el patrón al añadir investigación |
| Calidad de alimentos | OFF es colaborativo e incompleto | exponer `data_confidence` en la UI (P1) |
| **Alergias** | subcadena ingenua | Fase 1, riesgo de salud real |
| Costos de IA | funciones esenciales sin IA, un solo modelo | flags, límite por usuario, herramientas antes que texto libre |
| Respuestas científicas incorrectas | sin biblioteca real; Academia es demo | no prometer evidencia hasta la Fase 5 |
| Falsa precisión biomecánica | mitigado: `reason` obligatorio, nada de rankings | mantener la regla |
| Falsa precisión InBody | mitigado: solo campos medidos | no inferir segmentos al llegar el 3D |
| Derechos de autor | sin PDFs; imágenes de dominio público | solo metadatos y fragmentos autorizados |
| Rendimiento | build limpio, 23 rutas | `pgvector` y glTF entran con carga diferida |
| **Secretos** | service role key pendiente de rotar; repo público | rotar ya; decidir visibilidad |
| Deuda técnica | dos árboles de docs; 5 rutas suspendidas | unificar docs en Fase 0 |

---

## J. Plan de implementación

Basado en `docs/16_IMPLEMENTATION_ROADMAP.md`, ajustado a lo que ya existe. **Cada fase termina compilando, con typecheck, lint, pruebas, migraciones, RLS verificado y documentación.**

### Fase 0 - Recuperación y reenfoque *(sin código de producto)*
Restaurar el repositorio en la carpeta del usuario, decidir la fusión de `feat/sistema-grafito`, reconciliar el nivel de migraciones con producción, rotar la service role key, unificar la documentación.
**Criterio de terminado:** `main` y la copia local coinciden, las 4 validaciones pasan en la máquina del usuario, una sola fuente de verdad documental.

### Fase 1 - Excepción diaria de entrenamiento y alergias duras *(P0)*
Detalle completo en la sección K.

### Fase 2 - Vista Hoy, tolerancias y confianza del dato
Pantalla Hoy con planificado / consumido / restante para dieta y sesión; tolerancias configurables; `data_confidence` visible en cada sustitución; regla huevos/pancakes (exigir receta o marca antes de calcular).
**Migraciones:** campos en `profiles`. **Depende de:** Fase 1. **Riesgo:** bajo.

### Fase 3 - Programación del entrenamiento (doc 07A)
`training_preferences`, `program_blocks`, `exercise_prescriptions`, `muscle_weekly_loads`, `exercise_muscle_targets` con regiones anatómicas; comparador de divisiones; frecuencia y volumen directo e indirecto; tempo de 4 fases; deload sugerido y nunca aplicado solo.
**Riesgo:** falsa precisión, se mitiga manteniendo la regla de "número con razón".

### Fase 4 - Biometría e InBody 3D
`inbody_measurements`, `segmental_measurements`, `measurement_files`; React Three Fiber con glTF optimizado y carga diferida; **alternativa tabular obligatoria** y `prefers-reduced-motion`.
**Riesgo:** peso del bundle y falsa precisión segmental.

### Fase 5 - Biblioteca científica y RAG
Proveedores PubMed, Europe PMC, Crossref, OpenAlex; documentos, claims, grados A-D, retractaciones; `pgvector`.
**Bloqueante previo:** confirmar `pgvector` en el plan gratuito. Sin PDFs protegidos.

### Fase 6 - Copiloto con herramientas
`src/server/tools/` sobre los motores existentes; orquestador; persistencia de conversación, llamadas y citas; confirmación obligatoria antes de escribir.
**Depende de:** fases 3 y 5 para las herramientas de programación y evidencia.

### Fase 7 - Calidad
E2E del recorrido completo del doc 15, accesibilidad AA medida, rendimiento, observabilidad, *release gate*.

---

## K. Propuesta para la Fase 1

**Objetivo:** que sustituir un ejercicio deje de destruir la rutina, y que una alergia declarada nunca deje pasar un candidato incompatible.

**Rama sugerida:** `feat/excepcion-diaria-entrenamiento` (desde la base que se apruebe en Fase 0).

### Tareas

1. Migración `exercise_day_swaps` con el mismo patrón que `diet_item_day_swaps`: `user_id`, `plan_exercise_id`, `date`, `substitute_exercise_id`, `reason`, `source`, único por `(user_id, plan_exercise_id, date)`, índice `(user_id, date)`, RLS de 4 verbos.
2. Reescribir `substitutePlanExercise`: deja de hacer `update` sobre `workout_plan_exercises` y escribe una excepción con fecha. El `update` solo sobrevive tras confirmación explícita de "cambiar en el plan, no solo hoy".
3. `getTodayWorkout` aplica las excepciones del día sobre el plan al leer, sin mutarlo.
4. `ExerciseDaySwapSheet` con comparación, `reason` obligatorio de `rateExercise` y deshacer.
5. Endurecer `matchesRestriction`: normalización, tokenización por palabra, alias en español y grupos alergénicos básicos (lácteos, frutos secos, gluten, mariscos, huevo, soja). Sustituye la comparación por subcadena.
6. Registrar ambas acciones en `audit_logs`.

### Archivos a crear

- `supabase/migrations/2026XXXXXXXXXX_exercise_day_swaps.sql`
- `src/features/training/day-swap-actions.ts`
- `src/features/training/lib/day-swaps.ts` y `day-swaps.test.ts`
- `src/features/training/components/exercise-day-swap-sheet.tsx`
- `src/features/foods/lib/allergens.ts` y `allergens.test.ts`

### Archivos a modificar

- `src/features/training/actions.ts`, `queries.ts`, `schemas.ts`
- `src/features/training/components/plan-exercise-row.tsx`, `session-view.tsx`
- `src/features/foods/lib/equivalence.ts`
- `src/types/database.ts`
- `e2e/flujo-minimo.spec.ts`
- `docs/DECISIONS.md`

### Pruebas

- Unitarias de resolución de excepciones: sin excepción, con excepción, excepción de ayer que no debe aplicar hoy, cambio de zona horaria.
- *Property test*: el plan base es idéntico tras N sustituciones.
- Batería de alérgenos con casos límite: "leche" no debe filtrar "lechuga", "nuez" sí debe filtrar "nuez de la India".
- E2E: sustituir, ver el cambio hoy, verificar que al día siguiente volvió el original.

### Criterios de aceptación

- Sustituir un ejercicio **no modifica ninguna fila** de `workout_plan_exercises`.
- La sustitución solo se ve en su fecha.
- El original vuelve solo al día siguiente.
- Un alérgeno declarado nunca aparece como candidato, ni por IA ni por catálogo.
- `verify-rls.mjs` limpio; typecheck, lint, 305+ pruebas y build en verde.

### Verificación manual

1. Entrar con `demo@pancis.local`.
2. Sustituir un ejercicio en la sesión de hoy.
3. Comprobar en Supabase Studio que `workout_plan_exercises` no cambió y que hay una fila en `exercise_day_swaps`.
4. Consultar el día siguiente y ver el ejercicio original.
5. Declarar "lácteos" en el perfil y confirmar que ningún queso aparece como alternativa.

---

## L. Preguntas bloqueantes

1. **¿Dónde se restaura el proyecto y sobre qué base se trabaja?** Lo natural es clonar en `/Users/adrianmasis/Desktop/personal/pancis-hub/` y fusionar `feat/sistema-grafito` a `main`, porque es la rama que coincide con la base de datos local. Confirmar si esa fusión procede o si la rama quedó a medias a propósito.
2. **¿En qué nivel de migraciones está producción (`bqhybvweumrqtkaalksn`)?** Local tiene 24, `main` publica 22. No hay credenciales para verificarlo y determina si la Fase 1 migra sobre 22 o sobre 24.
3. **"Hoy" contra "Inicio".** El doc 13 pide una pantalla Hoy que responda qué comer, qué se consumió, qué queda y qué entrenar. La app se replegó a cuatro pantallas con "Inicio". ¿Se convierte Inicio en la vista Hoy del doc, o son pantallas distintas?
4. **Recetas, Despensa, Academia, Historial y Asistente están suspendidas en la navegación.** ¿Se recuperan en alguna fase o el repliegue a cuatro pantallas es definitivo? Cambia el alcance de las fases 2 y 6.
5. **Service role key:** ¿la rota el usuario en Supabase antes de que empiece la Fase 1?

---

## Anexo: recomendación sobre reescribir desde cero

**Recomendación: redireccionar la app existente, no empezar de cero.**

- La prueba decisiva es si la arquitectura pelea contra la especificación nueva. No pelea: el doc 12 pide `src/features/<dominio>/` con proveedores tras un contrato y la UI sin tocar APIs externas, que es exactamente lo que ya está construido.
- Lo que se perdería es lo más caro de recuperar: pesos y pisos calibrados del motor de equivalencias, RLS en 34 tablas con GRANTs explícitos, los bugs que solo aparecieron contra APIs reales (clasificación por subcadena, motores que solo alimentaban al proveedor de respaldo, fecha UTC en los valores por defecto del cliente) y 305 pruebas.
- Lo que falta (3D, RAG, herramientas del copiloto) hay que escribirlo igual en cualquiera de los dos escenarios. Envolver los motores existentes como `tools` es trabajo de días **porque los motores ya existen**.
- El defecto de `substitutePlanExercise` no es deuda estructural: es una tabla que falta, con el patrón ya resuelto en nutrición.
- El cambio de foco del producto (de diez módulos a copiloto de sustituciones) es un cambio de arquitectura de información, no de código. El repliegue a cuatro pantallas ya iba en esa dirección.

Reescribir se justificaría si el modelo de datos no admitiera la excepción diaria, si no hubiera pruebas, o si el stack fuera otro. Ninguna de las tres se cumple.

---

# Revisión 2 (2026-07-27, aprobada)

Sustituye a las secciones J y K. Motivada por tres correcciones de alcance del usuario.

## R2.1 Correcciones de alcance

### Generación de dieta y rutina: entra en alcance

`docs/spec/` la excluye en cuatro lugares (`MASTER_IMPLEMENTATION_SPEC` §4, `01_SCOPE_AND_MVP`, **ADR-008** y `16_IMPLEMENTATION_ROADMAP`). El usuario la requiere: hay dos perfiles reales, quien ya tiene plan en PDF y lo sube, y quien no tiene nada y necesita un punto de partida.

**Se registra como ADR-011, que deroga ADR-008.** No se omite el conflicto.

`_old-docs-2026-07-27/08-generacion-automatica.md` ya lo resolvía en la misma dirección y se adopta su criterio:

- La selección de alimentos y ejercicios es **determinística** sobre datos verificados. La IA solo redacta la explicación del plan generado.
- La generación no es un sistema aparte: es un punto de partida sobre la misma infraestructura de sustitución.
- Dos condiciones previas: fórmulas de macros validadas contra fuentes, y catálogo de ejercicios con cobertura por región muscular.

### La IA calcula macros, a través de herramientas

No hay contradicción con el principio de cálculo determinístico. Se distinguen tres cosas:

| Qué | Veredicto |
|---|---|
| La IA hace aritmética en texto libre | Prohibido |
| La IA invoca una función que calcula, y explica el resultado | **Requerido, y es lo que falta** |
| Las constantes dentro de esa función | Deben venir de fuentes, no estar fijas en el código |

Coincide con `08_AI_COPILOT_ARCHITECTURE`: "el modelo decide qué herramienta usar; la herramienta calcula; el modelo explica".

**Defecto concreto detectado:** `src/features/onboarding/lib/nutrition-targets.ts` fija `PROTEIN_G_PER_KG = 1.8`, `MIN_FAT_G_PER_KG = 0.8`, `FIBER_G_PER_1000_KCAL = 14`, `WATER_ML_PER_KG = 35` y los factores de actividad como constantes sin fuente. Contradice el principio "ningún número mágico sin fuente" de `_old-docs/00-README.md` y el mecanismo `formula_versions` de `_old-docs/04-modulo-dieta.md`.

**Segundo defecto:** `calculateInitialTargets` se invoca solo en el onboarding. Los objetivos no se recalculan al cambiar peso u objetivo.

### El chat libre con contexto científico es función central

Hoy el asistente es un motor de expresiones regulares más tres llamadas acotadas a Gemini. Sin recuperación sobre investigaciones, sin herramientas, sin persistencia de conversación.

`_old-docs/06-chat-ia.md` ya especifica el comportamiento pedido, con grounding por búsqueda dirigida sobre `research_sources` en vez de enviar la biblioteca completa por llamada, y con la obligación de distinguir cifra verificada de estimación del modelo.

**Consecuencia:** la capa de evidencia deja de ser tardía y pasa al frente, por dependencia técnica de los macros, del chat y de la generación.

## R2.2 Cambios sobre lo ya construido

| Qué | Por qué |
|---|---|
| `nutrition-targets.ts` | constantes a `formula_versions` con fuente; recálculo al cambiar peso u objetivo |
| `matchesRestriction` | sube de gravedad: en generación construiría la dieta entera con el alérgeno |
| `substitutePlanExercise` | sigue sobrescribiendo la rutina base |
| `exercise_catalog` | sin regiones no hay rutina balanceada real |
| `import-routine-dialog` | la dieta acepta PDF, la rutina solo texto pegado |
| `rules.ts` | se conserva como respaldo sin IA (RF-015, ADR-010) |

## R2.3 Fase 2, Investigación fundacional

Fase sin código, **en paralelo a la Fase 1**. Entregable: revisiones argumentadas que la Fase 3 convierte en `research_sources` y `formula_versions`.

### Alcance, derivado del código

**Cálculo de objetivos:** fórmula de metabolismo basal (Mifflin-St Jeor), factores de actividad (1.2 / 1.375 / 1.55 / 1.725), ajuste por objetivo (0.85 / 0.95 / 1.0 / 1.1), proteína 1.8 g/kg, piso de grasa 0.8 g/kg, fibra 14 g/1000 kcal, agua 35 ml/kg, piso de seguridad BMR x 1.1.

**Equivalencias:** coeficientes del índice de saciedad (`proteína x 1.5 + fibra x 2`), hoy inventados.

**Biomecánica y programación:** clasificación por región muscular, valores de estabilidad, rango y fatiga, proximidad al fallo, volumen semanal, frecuencia, tempo, descansos, equivalencia entre divisiones con volumen igualado.

### Método

Una revisión por afirmación con `docs/spec/templates/RESEARCH_REVIEW_TEMPLATE.md`.

Reglas no negociables:

- Jerarquía de `04_SCIENTIFIC_GOVERNANCE`. Un EMG informa excitación aguda y no prueba hipertrofia; queda escrito en cada claim que se apoye en uno.
- **Cero identificadores inventados.** Cada PMID y DOI se verifica contra PubMed E-utilities y Crossref. Si no resuelve, no entra.
- Verificación de retractaciones.
- Sin PDFs protegidos: metadatos, resúmenes propios y fragmentos autorizados.
- Población declarada siempre, con la distancia respecto al usuario real visible.
- Aprobación humana de toda regla de alto impacto.

### Tres resultados válidos por constante

1. **Se sostiene:** entra como `formula_version` con grado A-D, fuentes, población y limitaciones.
2. **No se sostiene:** se cambia el valor y se documenta por qué el anterior estaba mal.
3. **No es científica:** pesos de compatibilidad y tolerancias son parámetros de producto (lo dice `01_SCOPE_AND_MVP`). Se etiquetan como tales y dejan de presentarse como ciencia.

### Criterio de terminado

Ninguna constante llega a producción sin una de las tres etiquetas. Es la puerta de entrada a la Fase 7.

## R2.4 Plan de fases vigente

| Fase | Contenido | Código |
|---|---|---|
| 0 | Push, reconciliar migraciones, consolidar documentación, rotar service role key | no |
| 1 | Excepción diaria de entrenamiento y alergias duras | sí |
| 2 | Investigación fundacional (en paralelo a la 1) | no |
| 3 | `research_sources`, `formula_versions`, fuera los números mágicos, recálculo de objetivos | sí |
| 4 | Copiloto con herramientas, chat con grounding y citas | sí |
| 5 | Rutina desde PDF, vista Hoy, tolerancias, confianza del dato | sí |
| 6 | Regiones musculares y programación 07A | sí |
| 7 | Generación de dieta y rutina inicial | sí |
| 8 | Biblioteca navegable y RAG completo | sí |
| 9 | InBody segmental y 3D | sí |
| 10 | Calidad y despliegue | sí |

## R2.5 Decisión sobre el nivel de migraciones en producción

La migración de la Fase 1 es **puramente aditiva** (`create table`, cero `alter` sobre tablas existentes), así que aplica limpio tanto sobre 22 como sobre 24 y deja de bloquear.

Reconciliación en Fase 0:

```
supabase migration list --linked
git push origin main
supabase db push
```

Estado verificado: CLI 2.109.1 instalada, proyecto **sin vincular** (`supabase link --project-ref ...` es un paso interactivo del usuario), 11 contenedores locales arriba.

## R2.6 Fase 1 vigente

Sin cambios respecto a la sección K, con dos precisiones:

- La migración es aditiva por la decisión R2.5.
- El endurecimiento de alérgenos sube de prioridad porque es prerequisito de seguridad de la Fase 7.
