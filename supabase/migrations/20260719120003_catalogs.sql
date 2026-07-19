-- Catalogos compartidos: alimentos, porciones, ejercicios y academia.
-- Lectura para usuarios autenticados; escritura solo con service role
-- (seed o procesos administrativos). Ver docs/DECISIONS.md.

create table public.foods (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  brand text,
  food_group text not null check (
    food_group in (
      'proteina', 'carbohidrato', 'grasa', 'lacteo', 'fruta',
      'verdura', 'legumbre', 'bebida', 'mixto', 'otro'
    )
  ),
  serving_amount numeric(7, 1) not null default 100 check (serving_amount > 0),
  serving_unit text not null default 'g',
  grams_per_serving numeric(7, 1) not null default 100 check (grams_per_serving > 0),
  calories numeric(7, 1) not null check (calories >= 0),
  protein_g numeric(6, 1) not null check (protein_g >= 0),
  carbohydrate_g numeric(6, 1) not null check (carbohydrate_g >= 0),
  fat_g numeric(6, 1) not null check (fat_g >= 0),
  fiber_g numeric(5, 1) not null default 0 check (fiber_g >= 0),
  cooked_state text check (cooked_state in ('crudo', 'cocido')),
  verified boolean not null default false,
  source text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index foods_name_idx on public.foods (lower(name));
create index foods_food_group_idx on public.foods (food_group);

create trigger foods_set_updated_at
  before update on public.foods
  for each row execute function public.set_updated_at();

alter table public.foods enable row level security;

create policy "foods_select_authenticated" on public.foods
  for select to authenticated using (deleted_at is null or public.is_admin());

create table public.food_portions (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references public.foods (id) on delete cascade,
  label text not null,
  grams numeric(7, 1) not null check (grams > 0),
  household_measure text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index food_portions_food_id_idx on public.food_portions (food_id);

create trigger food_portions_set_updated_at
  before update on public.food_portions
  for each row execute function public.set_updated_at();

alter table public.food_portions enable row level security;

create policy "food_portions_select_authenticated" on public.food_portions
  for select to authenticated using (true);

create table public.exercise_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  primary_muscle text not null,
  secondary_muscles text[] not null default '{}',
  movement_pattern text,
  equipment text,
  difficulty text check (difficulty in ('principiante', 'intermedio', 'avanzado')),
  instructions text,
  video_url text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index exercise_catalog_primary_muscle_idx on public.exercise_catalog (primary_muscle);

create trigger exercise_catalog_set_updated_at
  before update on public.exercise_catalog
  for each row execute function public.set_updated_at();

alter table public.exercise_catalog enable row level security;

create policy "exercise_catalog_select_authenticated" on public.exercise_catalog
  for select to authenticated using (deleted_at is null or public.is_admin());

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  summary text not null,
  body text not null,
  category text not null,
  level text check (level in ('basico', 'intermedio', 'avanzado')),
  reading_minutes integer check (reading_minutes > 0),
  key_points text[] not null default '{}',
  evidence_level text check (evidence_level in ('alta', 'moderada', 'baja', 'demostrativo')),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  reviewed_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index articles_slug_idx on public.articles (slug);
create index articles_category_idx on public.articles (category);

create trigger articles_set_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

alter table public.articles enable row level security;

create policy "articles_select_published" on public.articles
  for select to authenticated
  using ((status = 'published' and deleted_at is null) or public.is_admin());

-- "references" es palabra reservada en SQL; la tabla se llama article_references.
create table public.article_references (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles (id) on delete cascade,
  citation text not null,
  url text,
  doi text,
  publication_year integer check (publication_year between 1900 and 2100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index article_references_article_id_idx on public.article_references (article_id);

create trigger article_references_set_updated_at
  before update on public.article_references
  for each row execute function public.set_updated_at();

alter table public.article_references enable row level security;

create policy "article_references_select_authenticated" on public.article_references
  for select to authenticated using (true);
