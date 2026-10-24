-- Movil v2 (oct 2026): lo que el diseño movil necesita y no existia.
--
-- 1. Restaurantes y su menu, en una base COMPARTIDA: cualquiera agrega, todos
--    leen. Cada plato dice de donde salen sus cifras (estado + fuente).
-- 2. Favoritos de ejercicios.
-- 3. Hora de una comida del plan movida SOLO un dia (el plan no cambia).
-- 4. Pausas de la sesion: la duracion guardada las descuenta.
-- 5. Ajuste de la meta por entreno (preferencia) y origen de la dieta, que
--    decide su valor por defecto.
-- 6. Recordatorios por notificacion push.

-- ── 1. Restaurantes ──────────────────────────────────────────────────────

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  country text not null default 'CR',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index restaurants_name_key on public.restaurants (lower(name));

create trigger restaurants_set_updated_at
  before update on public.restaurants
  for each row execute function public.set_updated_at();

alter table public.restaurants enable row level security;

create policy "restaurants_select_authenticated" on public.restaurants
  for select to authenticated using (true);

create policy "restaurants_insert_authenticated" on public.restaurants
  for insert to authenticated with check (created_by = (select auth.uid()));

create table public.restaurant_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  -- «1 sub de 15 cm», «combo mediano»: como lo vende el restaurante.
  serving_label text,
  -- Gramos de esa porcion, si se conocen. Sin ellos se registra por porcion.
  serving_g numeric(7, 1) check (serving_g > 0),
  -- Por porcion. Nulos = aun no investigado (estado «pendiente»).
  calories numeric(7, 1) check (calories >= 0),
  protein_g numeric(6, 1) check (protein_g >= 0),
  carbohydrate_g numeric(6, 1) check (carbohydrate_g >= 0),
  fat_g numeric(6, 1) check (fat_g >= 0),
  fiber_g numeric(5, 1) check (fiber_g >= 0),
  -- verificado: tabla oficial del restaurante revisada por un admin.
  -- estimado: buscado por la IA o escrito por un usuario.
  -- pendiente: el plato existe pero sus cifras no.
  status text not null default 'estimado'
    check (status in ('verificado', 'estimado', 'pendiente')),
  source_url text,
  source_note text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    status = 'pendiente'
    or (calories is not null and protein_g is not null
        and carbohydrate_g is not null and fat_g is not null)
  )
);

create unique index restaurant_items_name_key
  on public.restaurant_items (restaurant_id, lower(name));

create trigger restaurant_items_set_updated_at
  before update on public.restaurant_items
  for each row execute function public.set_updated_at();

alter table public.restaurant_items enable row level security;

create policy "restaurant_items_select_authenticated" on public.restaurant_items
  for select to authenticated using (true);

-- Nadie se autoverifica: «verificado» solo lo pone un admin.
create policy "restaurant_items_insert_authenticated" on public.restaurant_items
  for insert to authenticated with check (
    created_by = (select auth.uid())
    and (status <> 'verificado' or public.is_admin())
  );

create policy "restaurant_items_update_own" on public.restaurant_items
  for update to authenticated
  using (created_by = (select auth.uid()) or public.is_admin())
  with check (
    (created_by = (select auth.uid()) and status <> 'verificado')
    or public.is_admin()
  );

-- ── 2. Favoritos de ejercicios ───────────────────────────────────────────

create table public.exercise_favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id uuid not null references public.exercise_catalog (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

alter table public.exercise_favorites enable row level security;

create policy "exercise_favorites_own" on public.exercise_favorites
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ── 3. Hora movida solo un dia ───────────────────────────────────────────

create table public.diet_meal_day_times (
  user_id uuid not null references auth.users (id) on delete cascade,
  template_meal_id uuid not null references public.diet_template_meals (id) on delete cascade,
  date date not null,
  scheduled_time time not null,
  created_at timestamptz not null default now(),
  primary key (user_id, template_meal_id, date)
);

alter table public.diet_meal_day_times enable row level security;

create policy "diet_meal_day_times_own" on public.diet_meal_day_times
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1
      from public.diet_template_meals m
      join public.diet_templates t on t.id = m.template_id
      where m.id = template_meal_id and t.user_id = (select auth.uid())
    )
  );

-- ── 4. Pausas de la sesion ───────────────────────────────────────────────

alter table public.workout_sessions
  add column paused_seconds integer not null default 0
    check (paused_seconds >= 0);

-- ── 5. Ajuste por entreno ────────────────────────────────────────────────

-- De donde salio la dieta. Las que ya existen se importaron del
-- nutricionista: con ellas el ajuste arranca apagado.
alter table public.diet_templates
  add column origin text not null default 'nutricionista'
    check (origin in ('nutricionista', 'ia', 'manual'));

-- null = segun el origen de la dieta (encendido solo si la hizo la IA).
alter table public.profiles
  add column training_adjustment boolean;

-- ── 6. Recordatorios ─────────────────────────────────────────────────────

alter table public.profiles
  add column reminders_enabled boolean not null default false;

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

create policy "push_subscriptions_own" on public.push_subscriptions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Lo ya avisado, para no repetir: una vez por comida y dia, una por entreno.
create table public.reminder_log (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('comida', 'entreno')),
  ref text not null,
  date date not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, kind, ref, date)
);

alter table public.reminder_log enable row level security;
-- Sin politicas: solo lo escribe el cron con la service role.
