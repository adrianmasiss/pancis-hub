-- BIO-004: el umbral unico de volumen se sustituye por rangos por nivel.
-- Aprobado por el usuario el 2026-07-31.
--
-- El umbral de 22 series era un error CONCEPTUAL, no de calibracion: la
-- relacion entre volumen e hipertrofia tiene rendimientos decrecientes, o sea
-- que la curva se aplana, no cae. Marcar un techo convierte una curva continua
-- en un limite binario que la evidencia no describe.
--
-- Los rangos proceden de la investigacion aportada por el usuario en /Info,
-- que aporto el sustituto que al claim BIO-004 le faltaba.

insert into public.research_sources
  (id, title, authors, year, journal, doi, pmid, source_type, evidence_grade,
   population, limitations, is_open_access, full_text_read, verified_at)
values
  ('10000000-0000-4000-8000-000000000014',
   'The Resistance Training Dose Response: Meta-Regressions Exploring the Effects of Weekly Volume and Frequency on Muscle Hypertrophy and Strength Gains',
   'Pelland JC, Remmert JF, Robinson ZP, Hinson SR, Zourdos MC',
   2026, 'Sports Med', '10.1007/s40279-025-02344-w', '41343037',
   'metaanalisis', 'A',
   '67 estudios, 2058 participantes. 79.1 % hombres, 20.9 % mujeres, edad media 25.2 anos.',
   'Muestra construida sobre adultos jovenes y mayoritariamente hombres. La probabilidad posterior del efecto del volumen es del 100 %, pero con rendimientos decrecientes, mas pronunciados en fuerza que en hipertrofia.',
   false, false, '2026-07-28'),

  ('10000000-0000-4000-8000-000000000015',
   'American College of Sports Medicine Position Stand. Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults: An Overview of Reviews',
   'Currier BS, et al.',
   2026, 'Med Sci Sports Exerc', '10.1249/MSS.0000000000003897', '41843416',
   'guia_oficial', 'A',
   'Adultos sanos. Sintetiza 137 revisiones sistematicas.',
   'El propio documento avisa de que buena parte de la evidencia sintetizada proviene de personas con poca o ninguna experiencia previa en entrenamiento.',
   true, true, '2026-07-29')
on conflict (id) do nothing;

insert into public.formula_versions
  (id, key, version, value, unit, claim_ref, evidence_grade,
   is_product_parameter, rationale, limitations, approved_by, approved_at)
values
  ('20000000-0000-4000-8000-000000000015',
   'weekly_set_ranges', 1,
   '{"mantenimiento": {"min": 2, "max": 6},
     "principiante": {"min": 6, "max": 10},
     "intermedio": {"min": 8, "max": 16},
     "avanzado": {"min": 10, "max": 20}}'::jsonb,
   'series duras por musculo y semana',
   'BIO-004', 'A', false,
   'Sustituyen al umbral unico de 22 series. Anclados en el ACSM 2026, que situa mayor hipertrofia con aproximadamente 10 o mas series semanales, sin implicar que todo musculo o persona necesite siempre esa cifra.',
   'No son limites: la curva de rendimientos decrecientes se aplana, no cae. Por encima del rango conviene MIRAR (rendimiento, sueno, recuperacion), no cortar. La muestra de referencia es de adultos jovenes y 79 % hombres.',
   'Adrian', now())
on conflict (id) do nothing;

insert into public.formula_version_sources (formula_version_id, research_source_id, role, note)
values
  ('20000000-0000-4000-8000-000000000015', '10000000-0000-4000-8000-000000000014', 'sustenta', 'Probabilidad posterior del 100 % para el efecto del volumen, con rendimientos decrecientes.'),
  ('20000000-0000-4000-8000-000000000015', '10000000-0000-4000-8000-000000000015', 'sustenta', 'Ancla el ~10 series/semana como referencia de mayor hipertrofia.')
on conflict do nothing;
