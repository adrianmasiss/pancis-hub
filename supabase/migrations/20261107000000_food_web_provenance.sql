-- La importación del copiloto conserva su origen y sigue siendo personal/no verificada.
alter table public.foods add column web_provenance jsonb;
comment on column public.foods.web_provenance is
  'Búsqueda web: consulta, fecha, fuentes y transcripción original antes de convertir a 100 g/ml.';

create policy "food_aliases_insert_own" on public.food_aliases
  for insert to authenticated with check (
    exists (select 1 from public.foods f where f.id = food_id
      and f.owner_user_id = (select auth.uid()) and f.deleted_at is null)
  );
