-- Dominio de entrenamiento: rutinas, dias, ejercicios planificados,
-- sesiones y series registradas.

create table public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  objective text,
  active boolean not null default false,
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workout_plans_user_id_idx on public.workout_plans (user_id);

create trigger workout_plans_set_updated_at
  before update on public.workout_plans
  for each row execute function public.set_updated_at();

alter table public.workout_plans enable row level security;

create policy "workout_plans_select_own" on public.workout_plans
  for select to authenticated using (user_id = (select auth.uid()));

create policy "workout_plans_insert_own" on public.workout_plans
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "workout_plans_update_own" on public.workout_plans
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "workout_plans_delete_own" on public.workout_plans
  for delete to authenticated using (user_id = (select auth.uid()));

create table public.workout_plan_days (
  id uuid primary key default gen_random_uuid(),
  workout_plan_id uuid not null references public.workout_plans (id) on delete cascade,
  day_index smallint not null check (day_index between 1 and 14),
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index workout_plan_days_unique_index
  on public.workout_plan_days (workout_plan_id, day_index);

create trigger workout_plan_days_set_updated_at
  before update on public.workout_plan_days
  for each row execute function public.set_updated_at();

alter table public.workout_plan_days enable row level security;

create policy "workout_plan_days_select_own" on public.workout_plan_days
  for select to authenticated using (
    exists (
      select 1 from public.workout_plans p
      where p.id = workout_plan_id and p.user_id = (select auth.uid())
    )
  );

create policy "workout_plan_days_insert_own" on public.workout_plan_days
  for insert to authenticated with check (
    exists (
      select 1 from public.workout_plans p
      where p.id = workout_plan_id and p.user_id = (select auth.uid())
    )
  );

create policy "workout_plan_days_update_own" on public.workout_plan_days
  for update to authenticated
  using (
    exists (
      select 1 from public.workout_plans p
      where p.id = workout_plan_id and p.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.workout_plans p
      where p.id = workout_plan_id and p.user_id = (select auth.uid())
    )
  );

create policy "workout_plan_days_delete_own" on public.workout_plan_days
  for delete to authenticated using (
    exists (
      select 1 from public.workout_plans p
      where p.id = workout_plan_id and p.user_id = (select auth.uid())
    )
  );

create table public.workout_plan_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_plan_day_id uuid not null references public.workout_plan_days (id) on delete cascade,
  exercise_id uuid not null references public.exercise_catalog (id) on delete restrict,
  position smallint not null check (position >= 1),
  sets smallint check (sets between 1 and 20),
  target_reps_min smallint check (target_reps_min >= 1),
  target_reps_max smallint check (target_reps_max >= 1),
  target_rir numeric(3, 1) check (target_rir >= 0),
  target_rpe numeric(3, 1) check (target_rpe between 1 and 10),
  tempo text,
  rest_seconds integer check (rest_seconds >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workout_plan_exercises_day_idx
  on public.workout_plan_exercises (workout_plan_day_id, position);

create trigger workout_plan_exercises_set_updated_at
  before update on public.workout_plan_exercises
  for each row execute function public.set_updated_at();

alter table public.workout_plan_exercises enable row level security;

create policy "workout_plan_exercises_select_own" on public.workout_plan_exercises
  for select to authenticated using (
    exists (
      select 1
      from public.workout_plan_days d
      join public.workout_plans p on p.id = d.workout_plan_id
      where d.id = workout_plan_day_id and p.user_id = (select auth.uid())
    )
  );

create policy "workout_plan_exercises_insert_own" on public.workout_plan_exercises
  for insert to authenticated with check (
    exists (
      select 1
      from public.workout_plan_days d
      join public.workout_plans p on p.id = d.workout_plan_id
      where d.id = workout_plan_day_id and p.user_id = (select auth.uid())
    )
  );

create policy "workout_plan_exercises_update_own" on public.workout_plan_exercises
  for update to authenticated
  using (
    exists (
      select 1
      from public.workout_plan_days d
      join public.workout_plans p on p.id = d.workout_plan_id
      where d.id = workout_plan_day_id and p.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.workout_plan_days d
      join public.workout_plans p on p.id = d.workout_plan_id
      where d.id = workout_plan_day_id and p.user_id = (select auth.uid())
    )
  );

create policy "workout_plan_exercises_delete_own" on public.workout_plan_exercises
  for delete to authenticated using (
    exists (
      select 1
      from public.workout_plan_days d
      join public.workout_plans p on p.id = d.workout_plan_id
      where d.id = workout_plan_day_id and p.user_id = (select auth.uid())
    )
  );

create table public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  workout_plan_id uuid references public.workout_plans (id) on delete set null,
  workout_plan_day_id uuid references public.workout_plan_days (id) on delete set null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workout_sessions_user_idx on public.workout_sessions (user_id, started_at desc);

create trigger workout_sessions_set_updated_at
  before update on public.workout_sessions
  for each row execute function public.set_updated_at();

alter table public.workout_sessions enable row level security;

create policy "workout_sessions_select_own" on public.workout_sessions
  for select to authenticated using (user_id = (select auth.uid()));

create policy "workout_sessions_insert_own" on public.workout_sessions
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "workout_sessions_update_own" on public.workout_sessions
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "workout_sessions_delete_own" on public.workout_sessions
  for delete to authenticated using (user_id = (select auth.uid()));

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions (id) on delete cascade,
  exercise_id uuid not null references public.exercise_catalog (id) on delete restrict,
  set_number smallint not null check (set_number >= 1),
  is_warmup boolean not null default false,
  weight_kg numeric(6, 2) check (weight_kg >= 0),
  repetitions smallint check (repetitions >= 0),
  rir numeric(3, 1) check (rir >= 0),
  rpe numeric(3, 1) check (rpe between 1 and 10),
  tempo text,
  rest_seconds integer check (rest_seconds >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workout_sets_session_idx on public.workout_sets (session_id);
create index workout_sets_exercise_idx on public.workout_sets (exercise_id);

create trigger workout_sets_set_updated_at
  before update on public.workout_sets
  for each row execute function public.set_updated_at();

alter table public.workout_sets enable row level security;

create policy "workout_sets_select_own" on public.workout_sets
  for select to authenticated using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
  );

create policy "workout_sets_insert_own" on public.workout_sets
  for insert to authenticated with check (
    exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
  );

create policy "workout_sets_update_own" on public.workout_sets
  for update to authenticated
  using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
  );

create policy "workout_sets_delete_own" on public.workout_sets
  for delete to authenticated using (
    exists (
      select 1 from public.workout_sessions s
      where s.id = session_id and s.user_id = (select auth.uid())
    )
  );
