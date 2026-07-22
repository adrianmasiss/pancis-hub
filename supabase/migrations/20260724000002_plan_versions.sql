-- Versionado de dietas y rutinas (docs/02_PRODUCT_REQUIREMENTS.md 22).
--
-- El historial ya registraba QUE cambio, pero no permitia volver atras.
-- Aqui se guarda el plan completo en cada version.
--
-- Modelo elegido: SNAPSHOT INMUTABLE en jsonb, no filas versionadas.
--   - La plantilla viva (diet_templates + comidas + items) sigue siendo la
--     que se edita a diario, sin columnas de version que compliquen cada
--     consulta.
--   - Cada version es una foto completa y congelada. No depende de que los
--     alimentos sigan existiendo ni de que sus macros no cambien: guarda
--     tambien los nombres y valores del momento, igual que los snapshots
--     de las comidas.
--   - Restaurar es reconstruir la plantilla desde la foto.
--
-- La alternativa (versionar fila por fila con validez temporal) obligaria
-- a filtrar por version en todas las consultas del modulo de nutricion a
-- cambio de una flexibilidad que aqui no se necesita.

create table public.diet_template_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  template_id uuid not null references public.diet_templates (id) on delete cascade,
  -- Correlativo por plantilla, empezando en 1.
  version integer not null check (version >= 1),
  name text not null,
  -- Foto completa: comidas, items, cantidades y macros del momento.
  snapshot jsonb not null,
  -- Por que se guardo esta version.
  reason text,
  created_at timestamptz not null default now()
);

create unique index diet_template_versions_unique
  on public.diet_template_versions (template_id, version);

create index diet_template_versions_user_idx
  on public.diet_template_versions (user_id, created_at desc);

alter table public.diet_template_versions enable row level security;

create policy "diet_template_versions_select_own"
  on public.diet_template_versions
  for select to authenticated using (user_id = (select auth.uid()));

create policy "diet_template_versions_insert_own"
  on public.diet_template_versions
  for insert to authenticated with check (user_id = (select auth.uid()));

-- Sin UPDATE ni DELETE: una version es un registro historico. Si pudiera
-- editarse o borrarse dejaria de servir como respaldo de lo que hubo.

create table public.workout_plan_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_id uuid not null references public.workout_plans (id) on delete cascade,
  version integer not null check (version >= 1),
  name text not null,
  snapshot jsonb not null,
  reason text,
  created_at timestamptz not null default now()
);

create unique index workout_plan_versions_unique
  on public.workout_plan_versions (plan_id, version);

create index workout_plan_versions_user_idx
  on public.workout_plan_versions (user_id, created_at desc);

alter table public.workout_plan_versions enable row level security;

create policy "workout_plan_versions_select_own"
  on public.workout_plan_versions
  for select to authenticated using (user_id = (select auth.uid()));

create policy "workout_plan_versions_insert_own"
  on public.workout_plan_versions
  for insert to authenticated with check (user_id = (select auth.uid()));

comment on table public.diet_template_versions is
  'Fotos inmutables de una dieta. Sin update ni delete: son registro historico.';
