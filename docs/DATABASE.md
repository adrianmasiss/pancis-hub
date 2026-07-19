# Base de datos

## Objetivo

Convertir el esquema de producto en migraciones reproducibles de Supabase/PostgreSQL con Row Level Security, control por propietario y datos historicos seguros.

## Tablas MVP previstas

- `profiles`
- `dietary_preferences`
- `nutrition_targets`
- `foods`
- `food_portions`
- `meals`
- `meal_items`
- `recipes`
- `recipe_ingredients`
- `exercise_catalog`
- `workout_plans`
- `workout_plan_days`
- `workout_plan_exercises`
- `workout_sessions`
- `workout_sets`
- `body_measurements`
- `progress_photos`
- `daily_checkins`
- `articles`
- `article_references`
- `recommendations`
- `favorites`
- `audit_logs`

## Reglas generales

- Usar UUID como clave primaria.
- Incluir `created_at` y `updated_at`.
- Incluir `deleted_at` cuando soft delete proteja historicos o experiencia de usuario.
- Incluir claves foraneas con comportamiento explicito.
- Crear indices para `user_id`, fechas, slugs, busqueda y relaciones frecuentes.
- Habilitar RLS en todas las tablas con datos privados.
- Conservar snapshots nutricionales en `meal_items` y recetas registradas.
- No modificar registros pasados cuando cambien objetivos nutricionales.

## Datos privados

Tablas privadas deben filtrar por `auth.uid()`:

- `profiles`
- `dietary_preferences`
- `nutrition_targets`
- `meals`
- `meal_items`
- `recipes` privadas
- `workout_plans`
- `workout_sessions`
- `workout_sets`
- `body_measurements`
- `progress_photos`
- `daily_checkins`
- `recommendations`
- `favorites`

## Catalogos

`foods`, `food_portions`, `exercise_catalog`, `articles` y `article_references` podran tener lectura publica autenticada o anonima segun el caso. La escritura debe restringirse a administradores o procesos de seed.

## Storage

Buckets privados previstos:

- `progress-photos`
- `inbody-files`

El acceso debe hacerse con URLs firmadas y validacion de propietario.

## Seed

`supabase/seed.sql` contendra datos ficticios de desarrollo:

- alimentos y porciones;
- recetas demo;
- ejercicios;
- articulos con referencias verificadas o placeholder `Referencia pendiente de verificacion.`;
- usuario demo solo cuando el flujo de Supabase local lo permita sin exponer credenciales reales.
