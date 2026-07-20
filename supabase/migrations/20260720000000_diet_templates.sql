create table public.diet_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  is_active boolean not null default false,
  target_calories numeric(7, 1) not null default 0,
  target_protein numeric(6, 1) not null default 0,
  target_carbs numeric(6, 1) not null default 0,
  target_fat numeric(6, 1) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index diet_templates_user_idx on public.diet_templates (user_id);

create trigger diet_templates_set_updated_at
  before update on public.diet_templates
  for each row execute function public.set_updated_at();

alter table public.diet_templates enable row level security;

create policy "diet_templates_select_own" on public.diet_templates
  for select to authenticated using (user_id = (select auth.uid()));

create policy "diet_templates_insert_own" on public.diet_templates
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "diet_templates_update_own" on public.diet_templates
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "diet_templates_delete_own" on public.diet_templates
  for delete to authenticated using (user_id = (select auth.uid()));

create table public.diet_template_meals (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.diet_templates (id) on delete cascade,
  meal_type text not null check (meal_type in ('desayuno', 'almuerzo', 'cena', 'snack', 'otro')),
  name text,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index diet_template_meals_template_idx on public.diet_template_meals (template_id);

create trigger diet_template_meals_set_updated_at
  before update on public.diet_template_meals
  for each row execute function public.set_updated_at();

alter table public.diet_template_meals enable row level security;

create policy "diet_template_meals_select_own" on public.diet_template_meals
  for select to authenticated using (
    exists (
      select 1 from public.diet_templates t
      where t.id = template_id and t.user_id = (select auth.uid())
    )
  );

create policy "diet_template_meals_insert_own" on public.diet_template_meals
  for insert to authenticated with check (
    exists (
      select 1 from public.diet_templates t
      where t.id = template_id and t.user_id = (select auth.uid())
    )
  );

create policy "diet_template_meals_update_own" on public.diet_template_meals
  for update to authenticated
  using (
    exists (
      select 1 from public.diet_templates t
      where t.id = template_id and t.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.diet_templates t
      where t.id = template_id and t.user_id = (select auth.uid())
    )
  );

create policy "diet_template_meals_delete_own" on public.diet_template_meals
  for delete to authenticated using (
    exists (
      select 1 from public.diet_templates t
      where t.id = template_id and t.user_id = (select auth.uid())
    )
  );

create table public.diet_template_items (
  id uuid primary key default gen_random_uuid(),
  template_meal_id uuid not null references public.diet_template_meals (id) on delete cascade,
  food_id uuid not null references public.foods (id) on delete restrict,
  quantity_g numeric(7, 1) not null check (quantity_g > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index diet_template_items_meal_idx on public.diet_template_items (template_meal_id);
create index diet_template_items_food_idx on public.diet_template_items (food_id);

create trigger diet_template_items_set_updated_at
  before update on public.diet_template_items
  for each row execute function public.set_updated_at();

alter table public.diet_template_items enable row level security;

create policy "diet_template_items_select_own" on public.diet_template_items
  for select to authenticated using (
    exists (
      select 1 from public.diet_template_meals m
      join public.diet_templates t on t.id = m.template_id
      where m.id = template_meal_id and t.user_id = (select auth.uid())
    )
  );

create policy "diet_template_items_insert_own" on public.diet_template_items
  for insert to authenticated with check (
    exists (
      select 1 from public.diet_template_meals m
      join public.diet_templates t on t.id = m.template_id
      where m.id = template_meal_id and t.user_id = (select auth.uid())
    )
  );

create policy "diet_template_items_update_own" on public.diet_template_items
  for update to authenticated
  using (
    exists (
      select 1 from public.diet_template_meals m
      join public.diet_templates t on t.id = m.template_id
      where m.id = template_meal_id and t.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.diet_template_meals m
      join public.diet_templates t on t.id = m.template_id
      where m.id = template_meal_id and t.user_id = (select auth.uid())
    )
  );

create policy "diet_template_items_delete_own" on public.diet_template_items
  for delete to authenticated using (
    exists (
      select 1 from public.diet_template_meals m
      join public.diet_templates t on t.id = m.template_id
      where m.id = template_meal_id and t.user_id = (select auth.uid())
    )
  );

-- Función para asegurar que solo haya una dieta activa por usuario a la vez
create or replace function public.ensure_single_active_diet_template()
returns trigger as $$
begin
  if new.is_active = true then
    update public.diet_templates
    set is_active = false
    where user_id = new.user_id and id != new.id and is_active = true;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger tr_ensure_single_active_diet_template
  before insert or update on public.diet_templates
  for each row execute function public.ensure_single_active_diet_template();
