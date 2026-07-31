# 11 — Modelo de datos

## Perfil

`profiles`: usuario, nombre, nacimiento, sexo para cálculos, altura, zona horaria, objetivo, experiencia y unidades.

## Dieta

- `diet_plans`
- `diet_plan_versions`
- `diet_days`
- `planned_meals`
- `planned_meal_items`
- `daily_nutrition_logs`
- `daily_meals`
- `consumed_items`
- `nutrition_swaps`

## Alimentos

- `foods`
- `food_portions`
- `food_aliases`
- `food_images`
- `food_corrections`
- `food_favorites`

## Entrenamiento

- `workout_plans`
- `workout_plan_versions`
- `workout_days`
- `planned_exercises`
- `exercise_catalog`
- `exercise_muscle_targets`
- `exercise_biomechanics`
- `exercise_evidence`
- `workout_sessions`
- `performed_exercises`
- `workout_sets`
- `exercise_swaps`

## Biometría

- `biometric_measurements`
- `inbody_measurements`
- `segmental_measurements`
- `progress_photos`
- `measurement_files`

## Evidencia

- `evidence_documents`
- `evidence_claims`
- `claim_sources`
- `evidence_chunks`
- `evidence_reviews`

## IA

- `ai_conversations`
- `ai_messages`
- `ai_tool_calls`
- `ai_citations`
- `user_memories`
- `recommendation_actions`

## Auditoría

`audit_events`: usuario, acción, entidad, antes, después y fecha.

Todas las tablas personales usan RLS. Los archivos se almacenan en buckets privados con URLs firmadas.
