-- Registra una comida del plan como una instantanea atomica de lo que la
-- persona tenia delante ese dia. Antes la accion insertaba primero `meals` y
-- despues `meal_items`: un fallo a mitad dejaba una comida vacia, y las
-- sustituciones del dia no participaban en los snapshots.

alter table public.meals
  add column source_template_meal_id uuid
    references public.diet_template_meals (id) on delete set null;

comment on column public.meals.source_template_meal_id is
  'Comida del plan que origino este registro. Permite estado e idempotencia por identidad, no por nombre.';

create unique index meals_one_plan_log_per_day_idx
  on public.meals (user_id, source_template_meal_id, date)
  where deleted_at is null and source_template_meal_id is not null;

-- Una sustitucion estimada por el asistente no tiene `foods.id`, pero si una
-- instantanea reproducible. El nombre externo conserva lo que la persona vio.
alter table public.meal_items
  add column external_name text;

alter table public.meal_items
  alter column food_id drop not null;

alter table public.meal_items
  add constraint meal_items_food_or_external_name_check check (
    food_id is not null or nullif(btrim(external_name), '') is not null
  );

comment on column public.meal_items.external_name is
  'Nombre congelado de un sustituto externo cuando no existe una fila en foods.';

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
    fiber_snapshot
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
    )
  from public.diet_template_items item
  join public.foods original_food on original_food.id = item.food_id
  left join public.diet_item_day_swaps swap
    on swap.template_item_id = item.id
    and swap.user_id = v_user_id
    and swap.date = p_date
  left join public.foods substitute_food on substitute_food.id = swap.food_id
  where item.template_meal_id = p_template_meal_id;

  return jsonb_build_object('meal_id', v_meal_id, 'created', true);
end;
$$;

revoke all on function public.log_diet_template_meal(uuid, date) from public;
revoke all on function public.log_diet_template_meal(uuid, date) from anon;
grant execute on function public.log_diet_template_meal(uuid, date) to authenticated;

comment on function public.log_diet_template_meal(uuid, date) is
  'Registra de forma atomica e idempotente una comida del plan con las sustituciones vigentes de esa fecha.';
