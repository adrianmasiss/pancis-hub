-- Lectura de la evidencia en la app: tema, resumen, puntos clave y el texto
-- completo de cada fuente. Todo opcional: hoy la biblioteca es de ejemplo y el
-- usuario traerá los artículos (completos o resumidos). Mientras una fuente
-- no tenga texto, la vista de lectura muestra solo sus datos y el enlace.
alter table public.research_sources
  add column if not exists topic text
    check (topic in ('nutricion', 'entrenamiento', 'recomposicion', 'suplementacion', 'salud')),
  add column if not exists summary text,
  add column if not exists key_points text[],
  add column if not exists body text;

comment on column public.research_sources.topic is
  'Tema para filtrar en Evidencia: nutricion, entrenamiento, recomposicion, suplementacion o salud.';
comment on column public.research_sources.summary is
  'Resumen de 2-3 lineas en español con la conclusion principal.';
comment on column public.research_sources.key_points is
  'Puntos clave para el bloque «En resumen» de la vista de lectura.';
comment on column public.research_sources.body is
  'Texto completo (o resumen extenso) del articulo, en parrafos separados por linea en blanco.';
