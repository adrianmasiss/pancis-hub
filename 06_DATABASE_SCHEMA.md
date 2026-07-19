# 06 — Esquema inicial de base de datos

## Entidades principales

### users

- id
- email
- created_at
- updated_at

### profiles

- id
- user_id
- display_name
- birth_date
- biological_sex
- height_cm
- timezone
- locale
- unit_system
- theme
- experience_level
- primary_goal

### dietary_preferences

- id
- user_id
- preference_type
- value
- severity
- notes

### nutrition_targets

- id
- user_id
- effective_from
- calories
- protein_g
- carbohydrate_g
- fat_g
- fiber_g
- water_ml
- source
- status

### foods

- id
- name
- brand
- serving_amount
- serving_unit
- calories
- protein_g
- carbohydrate_g
- fat_g
- fiber_g
- verified
- source

### food_portions

- id
- food_id
- label
- grams
- household_measure

### meals

- id
- user_id
- date
- meal_type
- name
- status

### meal_items

- id
- meal_id
- food_id
- quantity_g
- calories_snapshot
- protein_snapshot
- carbohydrate_snapshot
- fat_snapshot

### recipes

- id
- owner_user_id
- name
- description
- servings
- instructions
- preparation_minutes
- visibility

### recipe_ingredients

- id
- recipe_id
- food_id
- quantity_g

### exercise_catalog

- id
- name
- primary_muscle
- secondary_muscles
- equipment
- instructions
- video_url

### workout_plans

- id
- user_id
- name
- objective
- active

### workout_sessions

- id
- user_id
- workout_plan_id
- started_at
- completed_at
- notes

### workout_sets

- id
- session_id
- exercise_id
- set_number
- weight
- repetitions
- rir
- rpe
- tempo
- rest_seconds

### body_measurements

- id
- user_id
- measured_at
- weight_kg
- body_fat_percentage
- skeletal_muscle_kg
- waist_cm
- hip_cm
- chest_cm
- arm_cm
- thigh_cm
- source

### progress_photos

- id
- user_id
- captured_at
- view_type
- private_storage_path
- notes

### daily_checkins

- id
- user_id
- date
- sleep_hours
- sleep_quality
- hunger
- energy
- stress
- soreness
- mood
- nutrition_adherence
- training_completed
- notes

### articles

- id
- title
- slug
- summary
- body
- category
- evidence_level
- published_at
- status

### references

- id
- article_id
- citation
- url
- doi
- publication_year

### recommendations

- id
- user_id
- created_at
- category
- title
- explanation
- confidence
- status
- evidence_context

## Reglas

- Todas las tablas personales deben incluir control de propietario.
- Los valores históricos de macros deben conservar snapshots.
- Las recomendaciones no deben sobrescribir objetivos automáticamente sin confirmación.
- Las fotografías deben almacenarse en un contenedor privado.
