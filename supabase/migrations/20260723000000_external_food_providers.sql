-- Proveedores externos de alimentos (USDA FoodData Central y Open Food
-- Facts). Ambos son gratuitos; no se integra ningun proveedor de pago.
--
-- Los alimentos importados entran al catalogo compartido
-- (owner_user_id null) para que la deduplicacion sea global y nadie
-- reimporte lo que otro usuario ya trajo. La escritura la hacen Server
-- Actions con el cliente service role, igual que las imagenes.

alter table public.foods
  add column external_source text check (
    external_source in ('usda', 'openfoodfacts')
  ),
  -- Identificador en el proveedor (fdcId de USDA, code de OFF).
  add column external_id text,
  -- Nombre tal como lo entrega el proveedor, casi siempre en ingles. Se
  -- conserva aparte de "name" (que es el nombre mostrable, editable y en
  -- espanol cuando se conoce) para poder rastrear el origen del dato.
  add column external_name text,
  add column barcode text,
  add column sugar_g numeric(6, 1) check (sugar_g >= 0),
  add column sodium_mg numeric(7, 1) check (sodium_mg >= 0),
  -- Fecha de publicacion del dato en el proveedor, no la de importacion.
  add column source_updated_at timestamptz;

-- Deduplicacion global: un mismo alimento externo no puede importarse dos
-- veces. Parcial porque los alimentos manuales no tienen origen externo.
create unique index foods_external_ref_unique
  on public.foods (external_source, external_id)
  where external_source is not null;

create index foods_barcode_idx on public.foods (barcode)
  where barcode is not null;

-- Alias de busqueda: permiten encontrar "pollo" aunque el alimento se haya
-- importado como "Chicken, broilers or fryers, breast, meat only, raw".
create table public.food_aliases (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references public.foods (id) on delete cascade,
  alias text not null check (length(trim(alias)) > 0),
  locale text not null default 'es' check (locale in ('es', 'en')),
  created_at timestamptz not null default now()
);

create unique index food_aliases_unique
  on public.food_aliases (food_id, locale, lower(alias));

create index food_aliases_alias_idx on public.food_aliases (lower(alias));

alter table public.food_aliases enable row level security;

-- Lectura para todo usuario autenticado sobre alimentos que ya puede ver;
-- la escritura queda reservada al service role (importacion).
create policy "food_aliases_select_visible" on public.food_aliases
  for select to authenticated using (
    exists (
      select 1 from public.foods f
      where f.id = food_id
        and (f.owner_user_id is null or f.owner_user_id = (select auth.uid()))
    )
  );

-- Cache de respuestas de proveedores externos. Evita repetir llamadas por
-- la misma busqueda y respeta los limites de uso de las APIs gratuitas.
-- Sin politicas RLS: solo el service role la lee y escribe desde el
-- servidor, nunca el cliente.
create table public.external_food_cache (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('usda', 'openfoodfacts')),
  -- Consulta normalizada (minusculas, sin acentos) o "barcode:<code>".
  cache_key text not null,
  payload jsonb not null,
  fetched_at timestamptz not null default now()
);

create unique index external_food_cache_unique
  on public.external_food_cache (source, cache_key);

create index external_food_cache_fetched_at_idx
  on public.external_food_cache (fetched_at);

alter table public.external_food_cache enable row level security;

revoke all on public.external_food_cache from authenticated;
