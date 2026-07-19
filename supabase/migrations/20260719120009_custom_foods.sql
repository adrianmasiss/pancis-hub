-- Alimentos personalizados: los usuarios pueden crear sus propios
-- alimentos ademas del catalogo global (owner_user_id null = catalogo).

alter table public.foods
  add column owner_user_id uuid references auth.users (id) on delete cascade;

create index foods_owner_user_id_idx on public.foods (owner_user_id)
  where owner_user_id is not null;

-- La politica de solo catalogo se reemplaza por catalogo + propios.
drop policy "foods_select_authenticated" on public.foods;

create policy "foods_select_catalog_or_own" on public.foods
  for select to authenticated using (
    (owner_user_id is null and (deleted_at is null or public.is_admin()))
    or owner_user_id = (select auth.uid())
  );

create policy "foods_insert_own" on public.foods
  for insert to authenticated with check (
    owner_user_id = (select auth.uid())
  );

create policy "foods_update_own" on public.foods
  for update to authenticated
  using (owner_user_id = (select auth.uid()))
  with check (owner_user_id = (select auth.uid()));

-- Sin DELETE: los alimentos propios se eliminan con soft delete
-- (pueden estar referenciados por snapshots historicos).

-- Las porciones de alimentos propios tambien son gestionables.
drop policy "food_portions_select_authenticated" on public.food_portions;

create policy "food_portions_select_visible" on public.food_portions
  for select to authenticated using (
    exists (
      select 1 from public.foods f
      where f.id = food_id
        and (
          f.owner_user_id is null
          or f.owner_user_id = (select auth.uid())
        )
    )
  );

create policy "food_portions_insert_own" on public.food_portions
  for insert to authenticated with check (
    exists (
      select 1 from public.foods f
      where f.id = food_id and f.owner_user_id = (select auth.uid())
    )
  );

create policy "food_portions_update_own" on public.food_portions
  for update to authenticated
  using (
    exists (
      select 1 from public.foods f
      where f.id = food_id and f.owner_user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.foods f
      where f.id = food_id and f.owner_user_id = (select auth.uid())
    )
  );

create policy "food_portions_delete_own" on public.food_portions
  for delete to authenticated using (
    exists (
      select 1 from public.foods f
      where f.id = food_id and f.owner_user_id = (select auth.uid())
    )
  );
