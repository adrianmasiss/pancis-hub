-- Correcciones de alimentos por usuario
-- (docs/02_PRODUCT_REQUIREMENTS.md 7.5).
--
-- Los alimentos importados de fuentes externas entran al catalogo
-- COMPARTIDO, asi que un usuario no puede editarlos: cambiarlos afectaria
-- a todos. Pero los datos comunitarios de Open Food Facts a veces vienen
-- mal, y quedarse con un dato equivocado sin poder tocarlo se siente como
-- un defecto de la aplicacion.
--
-- La solucion es una capa de correccion POR USUARIO que se superpone al
-- leer, sin alterar el dato original: el requisito pide explicitamente
-- "permitir correcciones del usuario sin alterar el dato original".
--
-- Solo se guardan los campos corregidos; los que quedan en null heredan
-- el valor del catalogo. Asi, si la fuente corrige su dato mas adelante,
-- el usuario se beneficia en todo lo que no haya tocado.

create table public.food_user_corrections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  food_id uuid not null references public.foods (id) on delete cascade,

  -- Cada campo es opcional: null = "usar el valor del catalogo".
  name text,
  calories numeric(7, 1) check (calories >= 0),
  protein_g numeric(6, 1) check (protein_g >= 0),
  carbohydrate_g numeric(6, 1) check (carbohydrate_g >= 0),
  fat_g numeric(6, 1) check (fat_g >= 0),
  fiber_g numeric(5, 1) check (fiber_g >= 0),
  cooked_state text check (cooked_state in ('crudo', 'cocido')),

  -- Por que se corrigio, para que el propio usuario lo recuerde despues.
  reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Una sola correccion por alimento y usuario: se edita, no se acumula.
create unique index food_user_corrections_unique
  on public.food_user_corrections (user_id, food_id);

create trigger food_user_corrections_set_updated_at
  before update on public.food_user_corrections
  for each row execute function public.set_updated_at();

alter table public.food_user_corrections enable row level security;

create policy "food_user_corrections_select_own" on public.food_user_corrections
  for select to authenticated using (user_id = (select auth.uid()));

create policy "food_user_corrections_insert_own" on public.food_user_corrections
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "food_user_corrections_update_own" on public.food_user_corrections
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "food_user_corrections_delete_own" on public.food_user_corrections
  for delete to authenticated using (user_id = (select auth.uid()));

comment on table public.food_user_corrections is
  'Capa de correccion por usuario sobre el catalogo compartido. No modifica el alimento original.';
