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
