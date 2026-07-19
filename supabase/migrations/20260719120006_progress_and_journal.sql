-- Progreso corporal, fotografias, diario, recomendaciones y auditoria.

create table public.body_measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  measured_at date not null default current_date,
  weight_kg numeric(5, 2) check (weight_kg > 0),
  body_fat_percentage numeric(4, 1) check (body_fat_percentage between 1 and 75),
  skeletal_muscle_kg numeric(5, 2) check (skeletal_muscle_kg > 0),
  waist_cm numeric(5, 1) check (waist_cm > 0),
  hip_cm numeric(5, 1) check (hip_cm > 0),
  chest_cm numeric(5, 1) check (chest_cm > 0),
  arm_cm numeric(4, 1) check (arm_cm > 0),
  thigh_cm numeric(4, 1) check (thigh_cm > 0),
  visceral_fat_level numeric(4, 1) check (visceral_fat_level >= 0),
  body_water_percentage numeric(4, 1) check (body_water_percentage between 1 and 90),
  source text not null default 'manual' check (source in ('manual', 'inbody', 'bascula', 'onboarding', 'otro')),
  attachment_storage_path text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index body_measurements_user_idx on public.body_measurements (user_id, measured_at desc);

create trigger body_measurements_set_updated_at
  before update on public.body_measurements
  for each row execute function public.set_updated_at();

alter table public.body_measurements enable row level security;

create policy "body_measurements_select_own" on public.body_measurements
  for select to authenticated using (user_id = (select auth.uid()));

create policy "body_measurements_insert_own" on public.body_measurements
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "body_measurements_update_own" on public.body_measurements
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "body_measurements_delete_own" on public.body_measurements
  for delete to authenticated using (user_id = (select auth.uid()));

create table public.progress_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  captured_at date not null default current_date,
  view_type text not null check (view_type in ('frontal', 'lateral', 'posterior')),
  private_storage_path text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index progress_photos_user_idx on public.progress_photos (user_id, captured_at desc);

create trigger progress_photos_set_updated_at
  before update on public.progress_photos
  for each row execute function public.set_updated_at();

alter table public.progress_photos enable row level security;

create policy "progress_photos_select_own" on public.progress_photos
  for select to authenticated using (user_id = (select auth.uid()));

create policy "progress_photos_insert_own" on public.progress_photos
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "progress_photos_update_own" on public.progress_photos
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "progress_photos_delete_own" on public.progress_photos
  for delete to authenticated using (user_id = (select auth.uid()));

-- Diario inteligente: escalas consistentes de 1 a 5, un registro por dia.
create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null default current_date,
  sleep_hours numeric(3, 1) check (sleep_hours between 0 and 24),
  sleep_quality smallint check (sleep_quality between 1 and 5),
  hunger smallint check (hunger between 1 and 5),
  energy smallint check (energy between 1 and 5),
  stress smallint check (stress between 1 and 5),
  soreness smallint check (soreness between 1 and 5),
  mood smallint check (mood between 1 and 5),
  nutrition_adherence smallint check (nutrition_adherence between 1 and 5),
  training_completed boolean,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index daily_checkins_one_per_day on public.daily_checkins (user_id, date);

create trigger daily_checkins_set_updated_at
  before update on public.daily_checkins
  for each row execute function public.set_updated_at();

alter table public.daily_checkins enable row level security;

create policy "daily_checkins_select_own" on public.daily_checkins
  for select to authenticated using (user_id = (select auth.uid()));

create policy "daily_checkins_insert_own" on public.daily_checkins
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "daily_checkins_update_own" on public.daily_checkins
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "daily_checkins_delete_own" on public.daily_checkins
  for delete to authenticated using (user_id = (select auth.uid()));

-- Las recomendaciones nunca modifican objetivos automaticamente:
-- el usuario las acepta o descarta (docs/06_DATABASE_SCHEMA.md).
create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  title text not null,
  explanation text not null,
  confidence text not null check (confidence in ('baja', 'media', 'alta')),
  status text not null default 'nueva' check (status in ('nueva', 'vista', 'aceptada', 'descartada')),
  evidence_context jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recommendations_user_idx on public.recommendations (user_id, created_at desc);

create trigger recommendations_set_updated_at
  before update on public.recommendations
  for each row execute function public.set_updated_at();

alter table public.recommendations enable row level security;

create policy "recommendations_select_own" on public.recommendations
  for select to authenticated using (user_id = (select auth.uid()));

create policy "recommendations_update_own" on public.recommendations
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Sin INSERT/DELETE de usuario: las genera el sistema (service role).

-- Auditoria: solo service role escribe y lee.
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);

create index audit_logs_created_idx on public.audit_logs (created_at desc);

alter table public.audit_logs enable row level security;
-- Sin policies: ningun rol de usuario accede; el service role las omite.
