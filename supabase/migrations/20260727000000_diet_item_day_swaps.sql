-- Sustituciones de un alimento del plan validas para un solo dia.
--
-- Hasta ahora sustituir escribia sobre diet_template_items, es decir cambiaba
-- el plan de forma permanente. Esta tabla separa las dos intenciones: el plan
-- sigue siendo el plan, y aqui se anota "hoy, en lugar de esto, comi aquello".
-- Al pasar el dia el plan vuelve solo a su estado original.
create table public.diet_item_day_swaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  template_item_id uuid not null
    references public.diet_template_items (id) on delete cascade,
  -- Dia al que aplica, en la zona horaria del perfil (fecha, no timestamp).
  date date not null,
  -- Alimento sustituto. Puede ser null cuando la sustitucion viene del
  -- asistente y el producto no existe en la biblioteca: en ese caso los
  -- macros se guardan como instantanea en las columnas de abajo.
  food_id uuid references public.foods (id) on delete set null,
  quantity_g numeric(8, 2) not null check (quantity_g > 0),
  -- Instantanea para sustitutos fuera de la biblioteca. Se guardan los macros
  -- ya resueltos para que el total del dia no dependa de volver a preguntarle
  -- al modelo, que no es reproducible.
  external_name text,
  external_calories numeric(8, 2),
  external_protein_g numeric(8, 2),
  external_carbohydrate_g numeric(8, 2),
  external_fat_g numeric(8, 2),
  -- De donde salio la sustitucion: catalogo propio o estimacion del asistente.
  source text not null default 'biblioteca'
    check (source in ('biblioteca', 'asistente')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- O apunta a un alimento de la biblioteca, o trae su propia instantanea.
  constraint diet_item_day_swaps_target_check check (
    (food_id is not null)
    or (external_name is not null and external_calories is not null)
  )
);

-- Un item del plan tiene como maximo una sustitucion por dia.
create unique index diet_item_day_swaps_unique
  on public.diet_item_day_swaps (user_id, template_item_id, date);

create index diet_item_day_swaps_user_date_idx
  on public.diet_item_day_swaps (user_id, date);

create trigger diet_item_day_swaps_set_updated_at
  before update on public.diet_item_day_swaps
  for each row execute function public.set_updated_at();

alter table public.diet_item_day_swaps enable row level security;

create policy "diet_item_day_swaps_select_own" on public.diet_item_day_swaps
  for select to authenticated using (user_id = (select auth.uid()));

create policy "diet_item_day_swaps_insert_own" on public.diet_item_day_swaps
  for insert to authenticated with check (user_id = (select auth.uid()));

create policy "diet_item_day_swaps_update_own" on public.diet_item_day_swaps
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "diet_item_day_swaps_delete_own" on public.diet_item_day_swaps
  for delete to authenticated using (user_id = (select auth.uid()));
