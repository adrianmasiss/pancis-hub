-- Entrenamiento: de dónde viene cada rutina, qué se hizo de verdad en cada
-- sesión y la ficha corta de cada ejercicio.

-- 1. Origen de la rutina. Lo que no generó la IA es del coach: importada o
--    armada a mano, la escribió una persona.
alter table public.workout_plans
  add column origin text not null default 'coach'
    check (origin in ('coach', 'ia')),
  add column ai_inputs jsonb;

comment on column public.workout_plans.ai_inputs is
  'Respuestas del cuestionario con que la IA generó la rutina (solo origin = ia).';

-- 2. El ejercicio realizado en una sesión cuando no es el de la plantilla.
--    Sustituir vive aquí y nunca en workout_plan_exercises: la rutina
--    original queda intacta.
create table public.workout_session_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  session_id uuid not null
    references public.workout_sessions (id) on delete cascade,
  plan_exercise_id uuid
    references public.workout_plan_exercises (id) on delete set null,
  original_exercise_id uuid not null
    references public.exercise_catalog (id) on delete restrict,
  performed_exercise_id uuid not null
    references public.exercise_catalog (id) on delete restrict,
  source text not null default 'usuario'
    check (source in ('usuario', 'sugerencia')),
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (original_exercise_id <> performed_exercise_id)
);

create unique index workout_session_exercises_unique
  on public.workout_session_exercises (session_id, plan_exercise_id);

create index workout_session_exercises_user_idx
  on public.workout_session_exercises (user_id, session_id);

create trigger workout_session_exercises_set_updated_at
  before update on public.workout_session_exercises
  for each row execute function public.set_updated_at();

alter table public.workout_session_exercises enable row level security;

-- La sesión también tiene que ser del usuario: sin esto, alguien podría
-- colgar un cambio de la sesión de otro sabiendo su id.
create policy "workout_session_exercises_select_own"
  on public.workout_session_exercises
  for select to authenticated using (user_id = (select auth.uid()));

create policy "workout_session_exercises_insert_own"
  on public.workout_session_exercises
  for insert to authenticated with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
  );

create policy "workout_session_exercises_update_own"
  on public.workout_session_exercises
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "workout_session_exercises_delete_own"
  on public.workout_session_exercises
  for delete to authenticated using (user_id = (select auth.uid()));

grant select, insert, update, delete
  on public.workout_session_exercises to authenticated;

-- 3. La ficha corta: «cómo se hace» en dos o tres líneas. Los puntos clave
--    de técnica ya viven en technique_cues.
alter table public.exercise_catalog add column summary text;

-- 4. La semana y el calendario piden sesiones terminadas por fecha.
create index if not exists workout_sessions_user_completed_idx
  on public.workout_sessions (user_id, completed_at);
