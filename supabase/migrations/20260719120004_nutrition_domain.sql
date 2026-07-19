-- Dominio de nutricion: comidas, items con snapshots, recetas y favoritos.

create table public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  meal_type text not null check (meal_type in ('desayuno', 'almuerzo', 'cena', 'snack', 'otro')),
  name text,
  status text not null default 'planificada' check (status in ('planificada', 'completada', 'omitida')),
  notes text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index meals_user_date_idx on public.meals (user_id, date desc);

create trigger meals_set_updated_at
  before update on public.meals
  for each row execute function public.set_updated_at();

alter table public.meals enable row level security;

create policy "meals_select_own" on public.meals
  for select to authenticated using (user_id = (select auth.uid()));

create policy "meals_insert_own" on public.meals
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "meals_update_own" on public.meals
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "meals_delete_own" on public.meals
  for delete to authenticated using (user_id = (select auth.uid()));

-- Los snapshots conservan los macros del momento del registro:
-- un cambio posterior en el catalogo no altera comidas pasadas.
create table public.meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references public.meals (id) on delete cascade,
  food_id uuid not null references public.foods (id) on delete restrict,
  quantity_g numeric(7, 1) not null check (quantity_g > 0),
  calories_snapshot numeric(7, 1) not null check (calories_snapshot >= 0),
  protein_snapshot numeric(6, 1) not null check (protein_snapshot >= 0),
  carbohydrate_snapshot numeric(6, 1) not null check (carbohydrate_snapshot >= 0),
  fat_snapshot numeric(6, 1) not null check (fat_snapshot >= 0),
  fiber_snapshot numeric(5, 1) not null default 0 check (fiber_snapshot >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index meal_items_meal_id_idx on public.meal_items (meal_id);
create index meal_items_food_id_idx on public.meal_items (food_id);

create trigger meal_items_set_updated_at
  before update on public.meal_items
  for each row execute function public.set_updated_at();

alter table public.meal_items enable row level security;

create policy "meal_items_select_own" on public.meal_items
  for select to authenticated using (
    exists (
      select 1 from public.meals m
      where m.id = meal_id and m.user_id = (select auth.uid())
    )
  );

create policy "meal_items_insert_own" on public.meal_items
  for insert to authenticated with check (
    exists (
      select 1 from public.meals m
      where m.id = meal_id and m.user_id = (select auth.uid())
    )
  );

create policy "meal_items_update_own" on public.meal_items
  for update to authenticated
  using (
    exists (
      select 1 from public.meals m
      where m.id = meal_id and m.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.meals m
      where m.id = meal_id and m.user_id = (select auth.uid())
    )
  );

create policy "meal_items_delete_own" on public.meal_items
  for delete to authenticated using (
    exists (
      select 1 from public.meals m
      where m.id = meal_id and m.user_id = (select auth.uid())
    )
  );

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  servings numeric(5, 1) not null default 1 check (servings > 0),
  instructions text,
  preparation_minutes integer check (preparation_minutes > 0),
  difficulty text check (difficulty in ('facil', 'media', 'dificil')),
  tags text[] not null default '{}',
  allergens text[] not null default '{}',
  image_storage_path text,
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recipes_owner_idx on public.recipes (owner_user_id);
create index recipes_visibility_idx on public.recipes (visibility) where visibility = 'public';

create trigger recipes_set_updated_at
  before update on public.recipes
  for each row execute function public.set_updated_at();

alter table public.recipes enable row level security;

create policy "recipes_select_own_or_public" on public.recipes
  for select to authenticated using (
    owner_user_id = (select auth.uid())
    or (visibility = 'public' and deleted_at is null)
  );

create policy "recipes_insert_own" on public.recipes
  for insert to authenticated with check (owner_user_id = (select auth.uid()));

create policy "recipes_update_own" on public.recipes
  for update to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

create policy "recipes_delete_own" on public.recipes
  for delete to authenticated using (owner_user_id = (select auth.uid()));

create table public.recipe_ingredients (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  food_id uuid not null references public.foods (id) on delete restrict,
  quantity_g numeric(7, 1) not null check (quantity_g > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recipe_ingredients_recipe_id_idx on public.recipe_ingredients (recipe_id);
create index recipe_ingredients_food_id_idx on public.recipe_ingredients (food_id);

create trigger recipe_ingredients_set_updated_at
  before update on public.recipe_ingredients
  for each row execute function public.set_updated_at();

alter table public.recipe_ingredients enable row level security;

-- Los ingredientes de recetas publicas son visibles para calcular macros.
create policy "recipe_ingredients_select_visible" on public.recipe_ingredients
  for select to authenticated using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id
        and (
          r.owner_user_id = (select auth.uid())
          or (r.visibility = 'public' and r.deleted_at is null)
        )
    )
  );

create policy "recipe_ingredients_insert_own" on public.recipe_ingredients
  for insert to authenticated with check (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id and r.owner_user_id = (select auth.uid())
    )
  );

create policy "recipe_ingredients_update_own" on public.recipe_ingredients
  for update to authenticated
  using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id and r.owner_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id and r.owner_user_id = (select auth.uid())
    )
  );

create policy "recipe_ingredients_delete_own" on public.recipe_ingredients
  for delete to authenticated using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id and r.owner_user_id = (select auth.uid())
    )
  );

create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_type text not null check (item_type in ('food', 'recipe', 'exercise', 'article')),
  item_id uuid not null,
  created_at timestamptz not null default now()
);

create unique index favorites_unique_item
  on public.favorites (user_id, item_type, item_id);

alter table public.favorites enable row level security;

create policy "favorites_select_own" on public.favorites
  for select to authenticated using (user_id = (select auth.uid()));

create policy "favorites_insert_own" on public.favorites
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "favorites_delete_own" on public.favorites
  for delete to authenticated using (user_id = (select auth.uid()));
