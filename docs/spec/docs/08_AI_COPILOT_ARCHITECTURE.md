# 08 — Arquitectura del copiloto IA

## No es un chatbot simple

Está compuesto por modelo conversacional, contexto, herramientas, reglas, búsqueda científica, memoria, permisos y acciones.

## Flujo

```text
Usuario -> Orquestador -> datos y herramientas -> evidencia
-> respuesta estructurada -> acción confirmable
```

## Herramientas nutricionales

- `get_today_plan`
- `search_foods`
- `get_food_details`
- `optimize_food_swap`
- `compare_meals`
- `calculate_remaining_macros`
- `propose_day_adjustment`
- `apply_daily_swap`

## Herramientas de entrenamiento

- `get_today_workout`
- `get_exercise`
- `find_exercise_substitutes`
- `compare_exercises`
- `analyze_session`
- `propose_set_rep_change`
- `apply_session_swap`

## Evidencia y biometría

- `search_evidence`
- `get_claim_sources`
- `get_biometric_history`
- `compare_measurements`

## Regla crítica

El modelo decide qué herramienta usar; la herramienta calcula; el modelo explica.

## RAG

Filtrar por dominio, priorizar revisiones, excluir retractados, considerar fecha y población, y devolver fragmentos con metadata.

## Memoria

Aislada por usuario, borrable y limitada a preferencias aprobadas.

## Costos

Las funciones determinísticas funcionan sin IA. La IA se reserva para explicación, consulta libre, síntesis y selección contextual.

## Evaluación

Medir exactitud de herramientas, citas, alucinaciones, seguridad, utilidad y latencia.

---

## Estado de implementación (2026-08-05)

El bucle de herramientas está conectado: `src/server/tools/toolset.ts`, con
`generateText` + `stopWhen` en `src/features/assistant/actions.ts`.

**Implementadas.** `search_foods`, `find_food_alternatives`, `compare_foods`,
`get_today_plan`, `propose_day_adjustment`, `find_exercise_substitutes`,
`propose_set_rep_change`, `analyze_session`, `get_claim_sources`,
`search_evidence`, `get_biometric_history`.

**No implementadas, y por qué.** Las `apply_*` no existen a propósito: escribir
es de la interfaz, previa confirmación. `get_food_details` y `get_exercise` se
cubren con `search_foods` y `find_exercise_substitutes`.
`calculate_remaining_macros` no hace falta como herramienta: los objetivos y lo
consumido ya viajan en el contexto de cada pregunta. `compare_meals` y
`compare_measurements` siguen pendientes.

**La respuesta final es la herramienta `responder`.** Gemini no admite function
calling y `responseMimeType: application/json` a la vez. Ver DECISIONS.md.

**Evaluación:** pendiente, sigue sin medirse (arnés en el board).
