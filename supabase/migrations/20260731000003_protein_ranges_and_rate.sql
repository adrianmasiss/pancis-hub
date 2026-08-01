-- NUT-003 y NUT-004: la proteina pasa a rango por objetivo, y el deficit se
-- juzga por ritmo semanal. Aprobado por el usuario el 2026-07-31.

update public.formula_versions set is_active = false
where key = 'protein_g_per_kg';

insert into public.formula_versions
  (id, key, version, value, unit, claim_ref, evidence_grade,
   is_product_parameter, rationale, limitations, approved_by, approved_at)
values
  ('20000000-0000-4000-8000-000000000010',
   'protein_ranges', 1,
   '{"perdida_grasa": {"min": 1.8, "max": 2.4},
     "recomposicion": {"min": 1.8, "max": 2.2},
     "ganancia_muscular": {"min": 1.6, "max": 2.2},
     "mantenimiento": {"min": 1.6, "max": 2.0}}'::jsonb,
   'g/kg de peso corporal',
   'NUT-003', 'A', false,
   'Sustituye al valor unico de 1.8 g/kg. La necesidad cambia con el objetivo: en deficit se sube para conservar masa magra, en mantenimiento no hace falta tanto. Rangos completados con la investigacion aportada por el usuario en /Info.',
   'Calculado sobre peso total. En sobrepeso u obesidad eso sobreestima, y sin composicion corporal no se puede corregir: el sistema advierte en vez de inventar un peso objetivo. Las mujeres estan infrarrepresentadas en esta literatura.',
   'Adrian', now()),

  ('20000000-0000-4000-8000-000000000011',
   'weekly_rate_band_percent', 1, '{"min": 0.5, "max": 1.0}'::jsonb,
   '% del peso corporal por semana',
   'NUT-004', 'B', false,
   'Banda donde mejor se conserva la masa magra en deficit, segun Helms 2014.',
   'Derivada de atletas magros en preparacion de competicion, poblacion mas estrecha que el usuario tipico. Personas con obesidad pueden tolerar tasas mayores bajo supervision.',
   'Adrian', now()),

  ('20000000-0000-4000-8000-000000000012',
   'kcal_per_kg_body_mass', 1, '7700'::jsonb, 'kcal/kg',
   'NUT-004', 'D', true,
   'Aproximacion clasica para traducir un deficit diario a ritmo semanal. Se usa SOLO para comprobar que la tasa cae en la banda, nunca para fijar las calorias.',
   'Es una simplificacion conocida y discutida: no predice bien el cambio de peso a largo plazo porque el gasto se adapta. Por eso su papel es de comprobacion y no de calculo.',
   null, null)
on conflict (id) do nothing;

insert into public.formula_version_sources (formula_version_id, research_source_id, role, note)
values
  ('20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000003', 'matiza', 'Su punto de quiebre de 1.62 g/kg no es significativo, lo que refuerza usar rangos anchos y no una cifra.'),
  ('20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000004', 'sustenta', 'Sostiene ingestas superiores en deficit.'),
  ('20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000006', 'sustenta', 'Posicion oficial del ISSN.'),
  ('20000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000005', 'sustenta', 'Fija la banda de 0.5 a 1 %/semana para maximizar la retencion de musculo.')
on conflict do nothing;
