-- Cotejo entre fuentes: qué dice CADA proveedor del mismo alimento.
--
-- Decisión tomada con el usuario (30 sep 2026): cuando dos fuentes describen
-- el mismo alimento NO se guarda el promedio. Un promedio es un valor que no
-- aparece en ningún informe, y a «¿de dónde sale este número?» habría que
-- responder «de una media entre un laboratorio y algo que alguien tecleó en
-- el móvil» — que es más débil que cualquiera de los dos por separado.
--
-- En su lugar: `foods` conserva el valor de la fuente más fiable, y aquí se
-- apunta lo que dijo cada una. Con eso se puede mostrar «365 kcal, USDA,
-- corroborado por Open Food Facts (362, difiere 0,8 %)» sin inventar nada.
--
-- Y cuando NO se parecen, el alimento queda marcado para revisar en vez de
-- promediar una diferencia que probablemente sea un error de carga —el caso
-- típico: alguien metió el valor por porción en la casilla de por 100 g.

create table if not exists public.food_source_values (
  id uuid primary key default gen_random_uuid(),
  food_id uuid not null references public.foods (id) on delete cascade,
  source text not null check (source in ('usda', 'openfoodfacts', 'dietly')),
  external_id text not null,
  external_name text,
  -- Siempre por 100 g, como todo el catálogo.
  calories numeric(7, 1),
  protein_g numeric(6, 1),
  carbohydrate_g numeric(6, 1),
  fat_g numeric(6, 1),
  fiber_g numeric(5, 1),
  fetched_at timestamptz not null default now(),
  unique (food_id, source, external_id)
);

create index if not exists food_source_values_food_idx
  on public.food_source_values (food_id);

-- Lectura abierta a cualquier sesión: es catálogo, no dato personal. La
-- escritura queda para el proceso de siembra, que usa la clave de servicio.
alter table public.food_source_values enable row level security;

create policy "food_source_values_select_all"
  on public.food_source_values for select to authenticated
  using (true);

-- Mayor discrepancia relativa hallada entre fuentes, en por ciento.
-- Se guarda el NÚMERO, no un booleano: el umbral de «muy notable» puede
-- cambiar, y con el porcentaje guardado no hay que recalcular nada.
alter table public.foods
  add column if not exists max_divergence_pct numeric(5, 1)
    check (max_divergence_pct >= 0);

comment on column public.foods.max_divergence_pct is
  'Mayor desacuerdo relativo entre fuentes para este alimento, en %. Nulo si solo hay una fuente.';

create index if not exists foods_divergence_idx
  on public.foods (max_divergence_pct)
  where max_divergence_pct is not null;
