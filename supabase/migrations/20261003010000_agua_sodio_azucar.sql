-- Agua, sodio y azucar del dia.
--
-- Agua: la meta ya existia en nutrition_targets.water_ml (NUT-007), pero no
-- habia donde anotar lo bebido. Cada toque de «+ vaso» es una fila; deshacer
-- es borrar la ultima. Filas y no un contador por dia para que deshacer sea
-- exacto y el historial pueda decir a que hora se bebio.
--
-- Sodio y azucar: `foods` ya traia sodium_mg y sugar_g por 100 g, pero al
-- registrar solo se congelaban calorias, macros y fibra. Ahora tambien estos
-- dos, como instantanea. NULL significa «el alimento no tenia el dato», que
-- no es lo mismo que cero: el total del dia cuenta cuantos alimentos lo
-- traian para no presentar como completo un numero parcial.
--
-- Idempotente: se aplico a mano en local.

create table if not exists public.water_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Dia en la zona horaria del perfil, como meals.date.
  date date not null,
  amount_ml integer not null check (amount_ml between 1 and 3000),
  created_at timestamptz not null default now()
);

create index if not exists water_logs_user_date_idx
  on public.water_logs (user_id, date);

alter table public.water_logs enable row level security;

drop policy if exists "water_logs_select_own" on public.water_logs;
create policy "water_logs_select_own" on public.water_logs
  for select to authenticated using (user_id = (select auth.uid()));

drop policy if exists "water_logs_insert_own" on public.water_logs;
create policy "water_logs_insert_own" on public.water_logs
  for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists "water_logs_delete_own" on public.water_logs;
create policy "water_logs_delete_own" on public.water_logs
  for delete to authenticated using (user_id = (select auth.uid()));

alter table public.meal_items
  add column if not exists sodium_snapshot_mg numeric(8, 1)
    check (sodium_snapshot_mg >= 0),
  add column if not exists sugar_snapshot_g numeric(6, 1)
    check (sugar_snapshot_g >= 0);

comment on column public.meal_items.sodium_snapshot_mg is
  'Sodio (mg) de la cantidad registrada. NULL = el alimento no tenia el dato; no es cero.';
comment on column public.meal_items.sugar_snapshot_g is
  'Azucares totales (g) de la cantidad registrada. NULL = sin dato. Incluye los de fruta y lacteos: no son azucares libres.';

create or replace function public.log_diet_template_meal(
  p_template_meal_id uuid,
  p_date date
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_meal_id uuid;
  v_name text;
  v_meal_type text;
  v_scheduled_time time;
  v_has_swaps boolean;
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  select meal.name, meal.meal_type, meal.scheduled_time
    into v_name, v_meal_type, v_scheduled_time
  from public.diet_template_meals meal
  join public.diet_templates template on template.id = meal.template_id
  where meal.id = p_template_meal_id
    and template.user_id = v_user_id
    and template.is_active = true;

  if not found then
    raise exception 'active template meal not found' using errcode = 'P0002';
  end if;

  if not exists (
    select 1
    from public.diet_template_items item
    where item.template_meal_id = p_template_meal_id
  ) then
    raise exception 'template meal has no items' using errcode = 'P0002';
  end if;

  -- Si la persona marco como no consumidos TODOS los alimentos de la comida
  -- ese dia, no hay nada que registrar: una comida vacia no es un registro.
  if not exists (
    select 1
    from public.diet_template_items item
    left join public.diet_item_day_swaps swap
      on swap.template_item_id = item.id
      and swap.user_id = v_user_id
      and swap.date = p_date
    where item.template_meal_id = p_template_meal_id
      and not coalesce(swap.omitted, false)
  ) then
    raise exception 'every item omitted for this date' using errcode = 'P0002';
  end if;

  select exists (
    select 1
    from public.diet_template_items item
    join public.diet_item_day_swaps swap
      on swap.template_item_id = item.id
      and swap.user_id = v_user_id
      and swap.date = p_date
    where item.template_meal_id = p_template_meal_id
  ) into v_has_swaps;

  -- El indice parcial convierte una doble pulsacion o reintento de red en una
  -- lectura del registro existente, nunca en dos comidas consumidas.
  insert into public.meals (
    user_id,
    date,
    meal_type,
    name,
    status,
    modified_reason,
    scheduled_time,
    source_template_meal_id
  ) values (
    v_user_id,
    p_date,
    v_meal_type,
    v_name,
    case when v_has_swaps then 'completada_con_cambios' else 'completada' end,
    case when v_has_swaps then 'Sustituciones del plan aplicadas para esta fecha.' else null end,
    v_scheduled_time,
    p_template_meal_id
  )
  on conflict (user_id, source_template_meal_id, date)
    where deleted_at is null and source_template_meal_id is not null
    do nothing
  returning id into v_meal_id;

  if v_meal_id is null then
    select id into v_meal_id
    from public.meals
    where user_id = v_user_id
      and source_template_meal_id = p_template_meal_id
      and date = p_date
      and deleted_at is null;

    return jsonb_build_object('meal_id', v_meal_id, 'created', false);
  end if;

  insert into public.meal_items (
    meal_id,
    food_id,
    external_name,
    quantity_g,
    serving_equivalence,
    calories_snapshot,
    protein_snapshot,
    carbohydrate_snapshot,
    fat_snapshot,
    fiber_snapshot,
    sodium_snapshot_mg,
    sugar_snapshot_g
  )
  select
    v_meal_id,
    case when swap.id is null then item.food_id else swap.food_id end,
    case when swap.id is not null and swap.food_id is null then swap.external_name else null end,
    case when swap.id is null then item.quantity_g else swap.quantity_g end,
    case when swap.id is null then item.serving_equivalence else null end,
    round(
      (case when swap.id is null then item.quantity_g else swap.quantity_g end) / 100
      * case
          when swap.id is null then original_food.calories
          when swap.food_id is not null then substitute_food.calories
          else swap.external_calories
        end,
      1
    ),
    round(
      (case when swap.id is null then item.quantity_g else swap.quantity_g end) / 100
      * case
          when swap.id is null then original_food.protein_g
          when swap.food_id is not null then substitute_food.protein_g
          else coalesce(swap.external_protein_g, 0)
        end,
      1
    ),
    round(
      (case when swap.id is null then item.quantity_g else swap.quantity_g end) / 100
      * case
          when swap.id is null then original_food.carbohydrate_g
          when swap.food_id is not null then substitute_food.carbohydrate_g
          else coalesce(swap.external_carbohydrate_g, 0)
        end,
      1
    ),
    round(
      (case when swap.id is null then item.quantity_g else swap.quantity_g end) / 100
      * case
          when swap.id is null then original_food.fat_g
          when swap.food_id is not null then substitute_food.fat_g
          else coalesce(swap.external_fat_g, 0)
        end,
      1
    ),
    round(
      (case when swap.id is null then item.quantity_g else swap.quantity_g end) / 100
      * case
          when swap.id is null then original_food.fiber_g
          when swap.food_id is not null then substitute_food.fiber_g
          else 0
        end,
      1
    ),
    -- Sodio y azucar: null cuando el alimento no trae el dato. Un sustituto
    -- estimado por el asistente tampoco lo trae. Nunca 0 inventado.
    round(
      (case when swap.id is null then item.quantity_g else swap.quantity_g end) / 100
      * case
          when swap.id is null then original_food.sodium_mg
          when swap.food_id is not null then substitute_food.sodium_mg
          else null
        end,
      1
    ),
    round(
      (case when swap.id is null then item.quantity_g else swap.quantity_g end) / 100
      * case
          when swap.id is null then original_food.sugar_g
          when swap.food_id is not null then substitute_food.sugar_g
          else null
        end,
      1
    )
  from public.diet_template_items item
  join public.foods original_food on original_food.id = item.food_id
  left join public.diet_item_day_swaps swap
    on swap.template_item_id = item.id
    and swap.user_id = v_user_id
    and swap.date = p_date
  left join public.foods substitute_food on substitute_food.id = swap.food_id
  where item.template_meal_id = p_template_meal_id
    -- Lo que la persona no comio ese dia no entra en la instantanea.
    and not coalesce(swap.omitted, false);

  return jsonb_build_object('meal_id', v_meal_id, 'created', true);
end;
$$;

revoke all on function public.log_diet_template_meal(uuid, date) from public;
revoke all on function public.log_diet_template_meal(uuid, date) from anon;
grant execute on function public.log_diet_template_meal(uuid, date) to authenticated;
