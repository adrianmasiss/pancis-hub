-- Despensa del usuario: "lo que tengo en casa".
--
-- El usuario declara que alimentos tiene disponibles eligiendolos de la
-- biblioteca o escaneando su codigo de barras. Esto alimenta el filtro
-- "disponibles" del motor de sustitucion (requisito 5.2): las alternativas
-- que el usuario ya tiene en casa se priorizan sobre las que tendria que
-- comprar.

create table public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  food_id uuid not null references public.foods (id) on delete cascade,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Un alimento aparece una sola vez en la despensa activa de un usuario.
-- El indice es parcial para que, tras quitarlo (soft-delete), pueda volver
-- a agregarse sin chocar con el registro anterior.
create unique index pantry_items_unique_active
  on public.pantry_items (user_id, food_id)
  where deleted_at is null;

create index pantry_items_user_idx on public.pantry_items (user_id);

create trigger pantry_items_set_updated_at
  before update on public.pantry_items
  for each row execute function public.set_updated_at();

alter table public.pantry_items enable row level security;

create policy "pantry_items_select_own" on public.pantry_items
  for select to authenticated using (user_id = (select auth.uid()));

create policy "pantry_items_insert_own" on public.pantry_items
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "pantry_items_update_own" on public.pantry_items
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "pantry_items_delete_own" on public.pantry_items
  for delete to authenticated using (user_id = (select auth.uid()));
