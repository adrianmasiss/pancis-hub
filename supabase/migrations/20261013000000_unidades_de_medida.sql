-- Unidades de medida: gramos por dentro, la unidad que la persona quiera por
-- fuera.
--
-- La cantidad canónica sigue siendo `quantity_g`: el plan, el registro, los
-- snapshots y el historial no cambian. Las demás unidades son una forma de
-- escribir y leer esa cantidad, y para convertirlas hacen falta dos datos por
-- alimento que hasta ahora no estaban.
--
-- 1. `nutrition_basis`: sobre qué cantidad están los valores. Una etiqueta de
--    bebida declara «por 100 ml», no «por 100 g». Open Food Facts los publica
--    en las mismas casillas `_100g`, así que sin esta marca la ficha decía
--    «por 100 g» de un refresco cuyos números son por 100 ml.
--
-- 2. `density_g_per_ml`: cuánto pesa un mililitro de ESE alimento. Sin ella
--    no se puede ofrecer «1 taza» ni «1 cucharada»: una taza de aceite pesa
--    218 g y una de harina 125 g. Se rellena con datos medidos (USDA publica
--    el peso de una taza de cada alimento); si falta, la app no inventa una:
--    las bebidas asumen 1 g/ml y lo dicen con «≈», el resto no ofrece
--    unidades de volumen.

alter table public.foods
  add column nutrition_basis text not null default '100g'
    check (nutrition_basis in ('100g', '100ml')),
  add column density_g_per_ml numeric(5, 3)
    check (density_g_per_ml > 0.1 and density_g_per_ml < 3);

comment on column public.foods.nutrition_basis is
  '100g = valores por 100 g; 100ml = por 100 ml (bebidas con etiqueta en volumen).';
comment on column public.foods.density_g_per_ml is
  'Gramos por mililitro, medido (p. ej. peso de 1 taza en USDA / 236,6 ml). Null = desconocida.';

-- De dónde sale cada porción, y porciones propias.
--
-- `source` permite decir «1 taza = 158 g (USDA)» y separar lo medido de lo
-- que escribió la persona. `owner_user_id` hace posible «mi taza = 250 ml»
-- sin que esa taza aparezca a los demás.
alter table public.food_portions
  add column source text not null default 'pancis'
    check (source in ('pancis', 'usda', 'openfoodfacts', 'usuario')),
  add column owner_user_id uuid references auth.users (id) on delete cascade;

create index food_portions_owner_idx on public.food_portions (owner_user_id)
  where owner_user_id is not null;

-- Una porción por alimento y nombre: volver a correr el relleno actualiza en
-- vez de duplicar. Sin condición (ver 20260928000000: PostgREST no apoya un
-- `on conflict` en un índice parcial); los nulos de owner no chocan entre sí,
-- así que el índice va sobre una expresión que los iguala.
create unique index food_portions_unique_label
  on public.food_portions (
    food_id,
    coalesce(owner_user_id, '00000000-0000-0000-0000-000000000000'::uuid),
    lower(label)
  );

-- Las políticas de 20260719120009 ya dejan al dueño de un alimento propio
-- gestionar sus porciones. Se amplían, no se reemplazan: ahora también hay
-- porciones propias sobre alimentos compartidos («mi taza» de avena), que
-- sólo ve y borra quien las creó.
drop policy "food_portions_select_visible" on public.food_portions;
create policy "food_portions_select_visible" on public.food_portions
  for select to authenticated using (
    (owner_user_id is null or owner_user_id = (select auth.uid()))
    and exists (
      select 1 from public.foods f
      where f.id = food_id
        and (
          f.owner_user_id is null
          or f.owner_user_id = (select auth.uid())
        )
    )
  );

drop policy "food_portions_insert_own" on public.food_portions;
create policy "food_portions_insert_own" on public.food_portions
  for insert to authenticated with check (
    exists (
      select 1 from public.foods f
      where f.id = food_id and f.owner_user_id = (select auth.uid())
    )
    or (
      owner_user_id = (select auth.uid())
      and source = 'usuario'
      and exists (
        select 1 from public.foods f
        where f.id = food_id and f.owner_user_id is null
      )
    )
  );

drop policy "food_portions_delete_own" on public.food_portions;
create policy "food_portions_delete_own" on public.food_portions
  for delete to authenticated using (
    owner_user_id = (select auth.uid())
    or exists (
      select 1 from public.foods f
      where f.id = food_id and f.owner_user_id = (select auth.uid())
    )
  );
