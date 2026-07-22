-- Pasos, conservacion, meal prep y variantes de recetas
-- (docs/02_PRODUCT_REQUIREMENTS.md 8).
--
-- `instructions` era un solo campo de texto. Cocinando con el telefono en
-- la mano eso obliga a releer todo el bloque para saber por donde se iba;
-- con pasos numerados se puede seguir uno a uno.

create table public.recipe_steps (
  id uuid primary key default gen_random_uuid(),
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  position smallint not null check (position >= 1),
  instruction text not null check (length(trim(instruction)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index recipe_steps_recipe_idx on public.recipe_steps (recipe_id, position);

create trigger recipe_steps_set_updated_at
  before update on public.recipe_steps
  for each row execute function public.set_updated_at();

alter table public.recipe_steps enable row level security;

-- Mismas reglas que los ingredientes: los pasos de una receta publica son
-- visibles, y solo el dueno puede modificarlos.
create policy "recipe_steps_select_visible" on public.recipe_steps
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

create policy "recipe_steps_insert_own" on public.recipe_steps
  for insert to authenticated with check (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id and r.owner_user_id = (select auth.uid())
    )
  );

create policy "recipe_steps_update_own" on public.recipe_steps
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

create policy "recipe_steps_delete_own" on public.recipe_steps
  for delete to authenticated using (
    exists (
      select 1 from public.recipes r
      where r.id = recipe_id and r.owner_user_id = (select auth.uid())
    )
  );

alter table public.recipes
  add column storage_notes text,
  add column meal_prep_notes text,
  -- Una variante apunta a la receta de la que salio, para poder verlas
  -- juntas ("igual pero con pollo en vez de atun").
  add column parent_recipe_id uuid references public.recipes (id) on delete set null;

create index recipes_parent_idx on public.recipes (parent_recipe_id)
  where parent_recipe_id is not null;

-- Las instrucciones existentes se convierten en pasos, una linea no vacia
-- por paso. El texto original NO se borra: si la division quedara mal, el
-- contenido sigue estando en `instructions`.
insert into public.recipe_steps (recipe_id, position, instruction)
select
  r.id,
  row_number() over (partition by r.id order by linea.orden),
  trim(linea.texto)
from public.recipes r
cross join lateral (
  select
    texto,
    ordinality as orden
  from unnest(string_to_array(r.instructions, E'\n')) with ordinality as t(texto, ordinality)
) as linea
where r.instructions is not null
  and length(trim(linea.texto)) > 0;

comment on column public.recipes.instructions is
  'Texto original. Los pasos numerados viven en recipe_steps.';
