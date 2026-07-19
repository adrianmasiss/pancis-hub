# Base de datos

## Objetivo

Migraciones reproducibles de Supabase/PostgreSQL con Row Level Security,
control por propietario y datos historicos seguros.

## Migraciones (supabase/migrations/)

1. `20260719120001_extensions_and_helpers.sql` — pgcrypto, `set_updated_at()`, `is_admin()`.
2. `20260719120002_profiles_identity.sql` — `profiles`, `dietary_preferences`, `nutrition_targets`, trigger `handle_new_user`.
3. `20260719120003_catalogs.sql` — `foods`, `food_portions`, `exercise_catalog`, `articles`, `article_references`.
4. `20260719120004_nutrition_domain.sql` — `meals`, `meal_items`, `recipes`, `recipe_ingredients`, `favorites`.
5. `20260719120005_training_domain.sql` — `workout_plans`, `workout_plan_days`, `workout_plan_exercises`, `workout_sessions`, `workout_sets`.
6. `20260719120006_progress_and_journal.sql` — `body_measurements`, `progress_photos`, `daily_checkins`, `recommendations`, `audit_logs`.
7. `20260719120007_storage_buckets.sql` — buckets privados y politicas de storage.
8. `20260719120008_grants.sql` — privilegios de tabla para `authenticated` y `service_role`.

Aplicar todo desde cero:

```bash
supabase db reset
```

Regenerar tipos TypeScript tras cambiar el esquema:

```bash
supabase gen types typescript --local > src/types/database.ts
```

## Convenciones

- UUID (`gen_random_uuid()`) como clave primaria; `profiles.id` es el id de `auth.users`.
- `created_at` y `updated_at` con trigger `set_updated_at` en todas las tablas mutables.
- Claves foraneas con comportamiento explicito: `cascade` en hijos puros,
  `restrict` desde registros historicos hacia catalogos, `set null` en referencias blandas.
- Enums como `text` + `CHECK`, espejados por enums Zod en `src/features/*/schemas.ts`.
- Indices en `user_id`, fechas, slugs y relaciones frecuentes.
- Soft delete (`deleted_at`) en `foods`, `recipes`, `workout_plans`, `articles`, `meals`.
- `nutrition_targets` nunca se borra: el activo anterior pasa a `superseded`
  (indice unico parcial garantiza un solo `active` por usuario).
- Snapshots de macros en `meal_items`: un cambio en el catalogo no altera comidas pasadas.

## Seguridad en dos capas

1. **GRANT**: `authenticated` tiene `select/insert/update/delete` sobre `public`;
   `anon` no tiene privilegios sobre datos.
2. **RLS habilitado en las 23 tablas**, con este patron:

| Tipo                                                       | Politica                                                                                                                       |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Personales (`profiles`, `meals`, `body_measurements`, ...) | `user_id = auth.uid()` en las 4 operaciones (en `profiles`, `id = auth.uid()`; sin DELETE en `profiles` y `nutrition_targets`) |
| Hijas sin `user_id` (`meal_items`, `workout_sets`, ...)    | `EXISTS` contra la tabla padre del propietario                                                                                 |
| `recipes`                                                  | propietario, o `visibility = 'public'` no borrada para lectura                                                                 |
| Catalogos (`foods`, `exercise_catalog`, `articles`, ...)   | solo SELECT para `authenticated`; escritura unicamente con service role                                                        |
| `recommendations`                                          | lectura/actualizacion del propietario; las inserta el sistema                                                                  |
| `audit_logs`                                               | sin politicas de usuario (solo service role)                                                                                   |

Ninguna politica consulta `profiles` (evita recursion); el rol admin futuro
se resuelve con `is_admin()` leyendo `app_metadata.role` del JWT.

## Storage

Buckets privados con limite de tamano y MIME:

- `progress-photos` (10 MB; jpeg, png, webp, heic)
- `inbody-files` (20 MB; pdf, jpeg, png, webp)

Convencion de ruta `user_id/archivo`: las politicas de `storage.objects`
comparan el primer segmento con `auth.uid()`. La lectura en la app usa URLs
firmadas de corta duracion.

## Seed (supabase/seed.sql)

Datos ficticios de desarrollo: usuario demo `demo@pancis.local` /
`demo12345` (solo stack local), 22 alimentos con porciones, 15 ejercicios,
2 articulos demostrativos con `Referencia pendiente de verificacion.`,
objetivos, mediciones, diario, rutina, sesion y comidas con snapshots.

Los valores nutricionales del seed son aproximados y estan marcados como
demostrativos (`source = 'Datos demostrativos'`, `verified = false`).
