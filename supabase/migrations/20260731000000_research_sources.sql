-- Trazabilidad cientifica: de donde sale cada numero que el sistema afirma.
--
-- Implementa el principio "ningun numero magico sin fuente"
-- (_old-docs-2026-07-27/00-README.md) y el mecanismo de formula_versions de
-- 04-modulo-dieta.md. Cierra el defecto D-002.
--
-- La fase 2 auditó las 32 afirmaciones del sistema y encontro que casi ningun
-- VALOR estaba mal, pero casi ningun criterio estaba justificado. Estas tablas
-- son donde vive esa justificacion, versionada y consultable.
--
-- Son CATALOGO COMPARTIDO, no datos personales: lectura para cualquier usuario
-- autenticado, escritura solo con service role. Un usuario no puede inventarse
-- una fuente cientifica.

-- =========================================================================
-- research_sources
-- =========================================================================

create table public.research_sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  authors text,
  year integer check (year between 1900 and 2100),
  journal text,
  -- Identificadores. Al menos uno deberia existir, pero las guias oficiales
  -- (informes del Institute of Medicine, dictamenes de EFSA) a veces solo
  -- tienen DOI de libro o ni eso.
  doi text,
  pmid text,
  url text,
  source_type text not null check (source_type in (
    'guia_oficial',        -- consensos y position stands
    'revision_sistematica',
    'metaanalisis',
    'ensayo_controlado',
    'estudio_longitudinal',
    'estudio_agudo',       -- incluye EMG: informa excitacion, no hipertrofia
    'opinion_experta',
    'normativa'            -- listas de alergenos, etiquetado
  )),
  -- Grado A-D de 04_SCIENTIFIC_GOVERNANCE.
  evidence_grade text check (evidence_grade in ('A', 'B', 'C', 'D')),
  -- Poblacion estudiada. Obligatoria de facto: la fase 2 encontro que esta
  -- literatura esta construida sobre hombres jovenes, y el producto tiene que
  -- poder decirlo cuando prescribe a alguien que no se parece a esa muestra.
  population text,
  limitations text,
  -- Conflictos de interes declarados. Morton 2018 tiene un coautor en el
  -- consejo asesor de un fabricante de suplementos, declarado en una errata.
  conflicts_of_interest text,
  is_open_access boolean not null default false,
  /** true si se leyo el texto completo, no solo el resumen. */
  full_text_read boolean not null default false,
  is_retracted boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index research_sources_pmid_unique
  on public.research_sources (pmid) where pmid is not null;
create unique index research_sources_doi_unique
  on public.research_sources (lower(doi)) where doi is not null;

create trigger research_sources_set_updated_at
  before update on public.research_sources
  for each row execute function public.set_updated_at();

-- =========================================================================
-- formula_versions
-- =========================================================================

create table public.formula_versions (
  id uuid primary key default gen_random_uuid(),
  -- Identificador estable de la constante, p. ej. 'protein_g_per_kg'.
  key text not null,
  version integer not null default 1,
  -- El valor. jsonb porque unas constantes son un numero, otras un rango y
  -- otras una tabla por objetivo.
  value jsonb not null,
  unit text,
  -- Claim de docs/investigacion que sustenta esta version, p. ej. 'NUT-003'.
  claim_ref text,
  evidence_grade text check (evidence_grade in ('A', 'B', 'C', 'D')),
  /**
   * true cuando NO es una afirmacion cientifica sino una decision de producto
   * (pesos de compatibilidad, tolerancias). La fase 2 encontro que el codigo
   * mezclaba los dos tipos sin distinguirlos, y esa distincion es la que mas
   * higiene aporta.
   */
  is_product_parameter boolean not null default false,
  rationale text,
  limitations text,
  effective_from date not null default current_date,
  is_active boolean not null default true,
  -- Quien aprobo esta version. 04_SCIENTIFIC_GOVERNANCE exige aprobacion
  -- humana antes de cambiar reglas de alto impacto.
  approved_by text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index formula_versions_key_version_unique
  on public.formula_versions (key, version);
-- Una sola version activa por constante.
create unique index formula_versions_one_active
  on public.formula_versions (key) where is_active;

create trigger formula_versions_set_updated_at
  before update on public.formula_versions
  for each row execute function public.set_updated_at();

-- =========================================================================
-- Relacion: que fuentes sostienen cada version de cada formula
-- =========================================================================

create table public.formula_version_sources (
  formula_version_id uuid not null
    references public.formula_versions (id) on delete cascade,
  research_source_id uuid not null
    references public.research_sources (id) on delete restrict,
  -- Como sostiene esta fuente a esta formula.
  role text not null default 'sustenta' check (role in (
    'sustenta',    -- la respalda directamente
    'matiza',      -- la limita o acota
    'contradice'   -- se conserva a proposito: ocultar el desacuerdo seria peor
  )),
  note text,
  primary key (formula_version_id, research_source_id)
);

-- =========================================================================
-- Seguridad: catalogo compartido, no datos personales
-- =========================================================================

alter table public.research_sources enable row level security;
alter table public.formula_versions enable row level security;
alter table public.formula_version_sources enable row level security;

create policy "research_sources_read_all" on public.research_sources
  for select to authenticated using (true);
create policy "formula_versions_read_all" on public.formula_versions
  for select to authenticated using (true);
create policy "formula_version_sources_read_all" on public.formula_version_sources
  for select to authenticated using (true);

-- Sin politicas de escritura: solo service role. Deliberado.
grant select on public.research_sources to authenticated;
grant select on public.formula_versions to authenticated;
grant select on public.formula_version_sources to authenticated;
