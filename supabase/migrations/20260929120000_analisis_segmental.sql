-- Análisis segmental del InBody: masa magra y masa grasa por segmento.
--
-- El informe reparte el cuerpo en CINCO segmentos —brazo izquierdo, brazo
-- derecho, tronco, pierna izquierda y pierna derecha— y de cada uno da los
-- kilos, el porcentaje respecto a lo ideal para esa persona y una evaluación
-- (bajo / normal / alto). Eso es lo que hace útil el muñeco del informe, y es
-- justo lo que `body_measurements` no tenía.
--
-- Tabla aparte y no veinte columnas más en `body_measurements`: son cinco
-- filas de la misma forma, y meterlas en la tabla principal obligaría a
-- inventar un nombre por combinación de segmento y métrica.
--
-- El porcentaje y la evaluación se GUARDAN, no se calculan: InBody los
-- obtiene contra un ideal propio que depende de altura, sexo y edad, y
-- derivarlos aquí sería inventar una cifra y presentarla como del aparato.

create table if not exists public.measurement_segments (
  id uuid primary key default gen_random_uuid(),
  measurement_id uuid not null
    references public.body_measurements (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  segment text not null check (
    segment in (
      'brazo_izquierdo',
      'brazo_derecho',
      'tronco',
      'pierna_izquierda',
      'pierna_derecha'
    )
  ),
  lean_mass_kg numeric(5, 2) check (lean_mass_kg > 0),
  lean_percent numeric(5, 1) check (lean_percent > 0),
  fat_mass_kg numeric(5, 2) check (fat_mass_kg >= 0),
  fat_percent numeric(5, 1) check (fat_percent > 0),
  -- La evaluación que imprimió el aparato, tal cual.
  evaluation text check (evaluation in ('bajo', 'normal', 'alto')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Un segmento aparece una sola vez por medición.
  unique (measurement_id, segment)
);

create index if not exists measurement_segments_measurement_idx
  on public.measurement_segments (measurement_id);

alter table public.measurement_segments enable row level security;

create policy "measurement_segments_select_own"
  on public.measurement_segments for select to authenticated
  using (user_id = (select auth.uid()));

create policy "measurement_segments_insert_own"
  on public.measurement_segments for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "measurement_segments_update_own"
  on public.measurement_segments for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "measurement_segments_delete_own"
  on public.measurement_segments for delete to authenticated
  using (user_id = (select auth.uid()));

create trigger measurement_segments_set_updated_at
  before update on public.measurement_segments
  for each row execute function set_updated_at();

-- Totales del InBody que tampoco cabían en la tabla principal y que el
-- informe sí da. Se añaden aquí porque la tarjeta de composición los lee.
alter table public.body_measurements
  add column if not exists protein_kg numeric(5, 2) check (protein_kg > 0),
  add column if not exists mineral_kg numeric(5, 2) check (mineral_kg > 0),
  add column if not exists total_body_water_l numeric(5, 1)
    check (total_body_water_l > 0),
  add column if not exists basal_metabolic_rate_kcal integer
    check (basal_metabolic_rate_kcal > 0),
  add column if not exists inbody_score smallint
    check (inbody_score between 0 and 120);

comment on column public.body_measurements.inbody_score is
  'Puntuación InBody sobre 100. Una persona musculosa puede pasar de 100.';
