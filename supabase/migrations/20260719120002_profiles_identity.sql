-- Identidad: perfil, preferencias dietarias y objetivos nutricionales.

-- El PK de profiles es el id de auth.users (patron estandar de Supabase).
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  birth_date date,
  biological_sex text check (biological_sex in ('masculino', 'femenino')),
  height_cm numeric(5, 1) check (height_cm > 0),
  timezone text not null default 'UTC',
  locale text not null default 'es-419',
  unit_system text not null default 'metric' check (unit_system in ('metric', 'imperial')),
  theme text not null default 'system' check (theme in ('light', 'dark', 'system')),
  experience_level text check (experience_level in ('principiante', 'intermedio', 'avanzado')),
  primary_goal text check (
    primary_goal in ('recomposicion', 'perdida_grasa', 'ganancia_muscular', 'mantenimiento')
  ),
  training_days_per_week smallint check (training_days_per_week between 0 and 7),
  training_type text,
  activity_level text check (activity_level in ('sedentario', 'ligero', 'moderado', 'alto')),
  daily_steps integer check (daily_steps >= 0),
  meals_per_day smallint check (meals_per_day between 1 and 10),
  usual_training_time time,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using (id = (select auth.uid()));

create policy "profiles_insert_own" on public.profiles
  for insert to authenticated with check (id = (select auth.uid()));

create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Sin policy de DELETE: el perfil se elimina en cascada con la cuenta.

-- Crea el perfil automaticamente al registrarse.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, locale, theme)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    'es-419',
    'system'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table public.dietary_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  preference_type text not null check (
    preference_type in ('preferencia', 'alergia', 'restriccion', 'alimento_no_deseado')
  ),
  value text not null,
  severity text check (severity in ('leve', 'moderada', 'severa')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index dietary_preferences_user_id_idx on public.dietary_preferences (user_id);

create trigger dietary_preferences_set_updated_at
  before update on public.dietary_preferences
  for each row execute function public.set_updated_at();

alter table public.dietary_preferences enable row level security;

create policy "dietary_preferences_select_own" on public.dietary_preferences
  for select to authenticated using (user_id = (select auth.uid()));

create policy "dietary_preferences_insert_own" on public.dietary_preferences
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "dietary_preferences_update_own" on public.dietary_preferences
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "dietary_preferences_delete_own" on public.dietary_preferences
  for delete to authenticated using (user_id = (select auth.uid()));

-- Objetivos nutricionales versionados: nunca se borran ni se sobreescriben;
-- un cambio archiva el registro anterior (status = 'superseded').
create table public.nutrition_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  effective_from date not null default current_date,
  calories integer not null check (calories > 0),
  protein_g numeric(6, 1) not null check (protein_g >= 0),
  carbohydrate_g numeric(6, 1) not null check (carbohydrate_g >= 0),
  fat_g numeric(6, 1) not null check (fat_g >= 0),
  fiber_g numeric(5, 1) not null check (fiber_g >= 0),
  water_ml integer not null check (water_ml >= 0),
  source text not null check (source in ('estimacion_inicial', 'manual', 'ajuste_recomendado')),
  status text not null default 'active' check (status in ('active', 'superseded', 'draft')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index nutrition_targets_user_id_idx on public.nutrition_targets (user_id, effective_from desc);

-- Un solo objetivo activo por usuario.
create unique index nutrition_targets_one_active_per_user
  on public.nutrition_targets (user_id)
  where status = 'active';

create trigger nutrition_targets_set_updated_at
  before update on public.nutrition_targets
  for each row execute function public.set_updated_at();

alter table public.nutrition_targets enable row level security;

create policy "nutrition_targets_select_own" on public.nutrition_targets
  for select to authenticated using (user_id = (select auth.uid()));

create policy "nutrition_targets_insert_own" on public.nutrition_targets
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "nutrition_targets_update_own" on public.nutrition_targets
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Sin policy de DELETE: el historial de objetivos se conserva.
