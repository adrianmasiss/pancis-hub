-- Comer fuera, ronda nov 2026: el directorio se filtra por tipo de comida, el
-- menu se ordena por secciones (platos, acompañamientos, bebidas, postres) y
-- un plato puede traer opciones que cambian sus cifras («sin salsa», «doble
-- pollo»), tal como las publica la tabla del restaurante.

alter table public.restaurants
  add column category text
    check (category in (
      'hamburguesas', 'pollo', 'sandwiches', 'pizza', 'mexicana',
      'asiatica', 'cafe', 'saludable', 'otro'
    ));

alter table public.restaurant_items
  add column section text not null default 'plato'
    check (section in ('plato', 'acompanamiento', 'bebida', 'postre'));

-- Las opciones guardan la DIFERENCIA con el plato base, por porcion: pueden
-- ser negativas («sin salsa» quita grasa). Comparten el estado del plato.
create table public.restaurant_item_options (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.restaurant_items (id) on delete cascade,
  label text not null check (char_length(label) between 2 and 60),
  calories_delta numeric(7, 1) not null default 0,
  protein_delta numeric(6, 1) not null default 0,
  carbohydrate_delta numeric(6, 1) not null default 0,
  fat_delta numeric(6, 1) not null default 0,
  fiber_delta numeric(5, 1) not null default 0,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index restaurant_item_options_label_key
  on public.restaurant_item_options (item_id, lower(label));

alter table public.restaurant_item_options enable row level security;

create policy "restaurant_item_options_select_authenticated"
  on public.restaurant_item_options
  for select to authenticated using (true);

create policy "restaurant_item_options_insert_authenticated"
  on public.restaurant_item_options
  for insert to authenticated with check (created_by = (select auth.uid()));

-- La categoria la pone quien crea el restaurante (o la IA al investigarlo).
create policy "restaurants_update_category" on public.restaurants
  for update to authenticated
  using (created_by = (select auth.uid()) or public.is_admin())
  with check (created_by = (select auth.uid()) or public.is_admin());

-- El logo real de la cadena, de Wikimedia Commons (lo enlaza Wikidata). Solo
-- se acepta ese origen: nadie puede poner una imagen cualquiera como logo.
alter table public.restaurants
  add column logo_url text
    check (logo_url ~ '^https://commons\.wikimedia\.org/wiki/Special:FilePath/[^/?#]+$');

-- La tabla nutricional del plato, como la de los alimentos: las tablas de
-- los restaurantes publican tambien grasa saturada, azucar y sodio.
alter table public.restaurant_items
  add column sat_fat_g numeric(6, 1) check (sat_fat_g >= 0),
  add column sugar_g numeric(6, 1) check (sugar_g >= 0),
  add column sodium_mg numeric(7, 1) check (sodium_mg >= 0);
