-- Sustituciones de un ejercicio del plan validas para un solo dia.
--
-- Hasta ahora sustituir un ejercicio hacia
--   update workout_plan_exercises set exercise_id = ...
-- es decir, DESTRUIA la rutina original de forma permanente. Sustituir el
-- lunes porque la maquina estaba ocupada dejaba al usuario sin su rutina.
-- Solo quedaba rastro en audit_logs.
--
-- Esta tabla replica el patron que ya resolvio lo mismo en nutricion
-- (20260727000000_diet_item_day_swaps): el plan sigue siendo el plan, y aqui
-- se anota "hoy, en lugar de este ejercicio, hice aquel". Al pasar el dia el
-- plan vuelve solo a su estado original.
--
-- Migracion puramente aditiva: no altera ninguna tabla existente, asi que
-- aplica igual sobre cualquier estado previo del esquema.
create table public.exercise_day_swaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_exercise_id uuid not null
    references public.workout_plan_exercises (id) on delete cascade,
  -- Dia al que aplica, en la zona horaria del perfil (fecha, no timestamp).
  date date not null,
  substitute_exercise_id uuid not null
    references public.exercise_catalog (id) on delete cascade,
  -- Por que se sustituyo (maquina ocupada, molestia, preferencia). Se pide en
  -- la UI porque una sustitucion sin motivo no se puede interpretar despues.
  reason text,
  -- De donde salio: eleccion del usuario o sugerencia aceptada del asistente.
  source text not null default 'usuario'
    check (source in ('usuario', 'asistente')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un ejercicio del plan tiene como maximo una sustitucion por dia.
create unique index exercise_day_swaps_unique
  on public.exercise_day_swaps (user_id, plan_exercise_id, date);

create index exercise_day_swaps_user_date_idx
  on public.exercise_day_swaps (user_id, date);

create trigger exercise_day_swaps_set_updated_at
  before update on public.exercise_day_swaps
  for each row execute function public.set_updated_at();

alter table public.exercise_day_swaps enable row level security;

create policy "exercise_day_swaps_select_own" on public.exercise_day_swaps
  for select to authenticated using (user_id = (select auth.uid()));

create policy "exercise_day_swaps_insert_own" on public.exercise_day_swaps
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "exercise_day_swaps_update_own" on public.exercise_day_swaps
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "exercise_day_swaps_delete_own" on public.exercise_day_swaps
  for delete to authenticated using (user_id = (select auth.uid()));

grant select, insert, update, delete on public.exercise_day_swaps to authenticated;
