-- BIO-003 y BIO-007: la prescripcion de entrenamiento pasa a distinguir por
-- objetivo, y el descanso gana un suelo. Aprobado por el usuario el 2026-07-31.

insert into public.research_sources
  (id, title, authors, year, journal, doi, pmid, source_type, evidence_grade,
   population, limitations, is_open_access, full_text_read, verified_at)
values
  ('10000000-0000-4000-8000-000000000011',
   'Exploring the Dose-Response Relationship Between Estimated Resistance Training Proximity to Failure, Strength Gain, and Muscle Hypertrophy',
   'Robinson ZP, Pelland JC, Remmert JF, Refalo MC, Jukic I, Steele J, Zourdos MC',
   2024, 'Sports Med', '10.1007/s40279-024-02069-2', '38970765',
   'metaanalisis', 'B',
   'Adultos con entrenamiento de fuerza',
   'Las repeticiones en reserva fueron ESTIMADAS de las descripciones de cada protocolo, no medidas. Calidad de ajuste modesta y los propios autores lo califican de exploratorio y piden cautela.',
   false, false, '2026-07-28'),

  ('10000000-0000-4000-8000-000000000012',
   'Give it a rest: a systematic review with Bayesian meta-analysis on the effect of inter-set rest interval duration on muscle hypertrophy',
   'Singer A, Wolf M, Generoso L, Arias E, Delcastillo K, Echevarria K, et al.',
   2024, 'Front Sports Act Living', '10.3389/fspor.2024.1429789', '39205815',
   'metaanalisis', 'B',
   '9 estudios, 19 mediciones en adultos sanos',
   'Base estrecha, heterogeneidad sustancial, y los intervalos de credibilidad de las comparaciones controladas cruzan el cero.',
   true, false, '2026-07-29'),

  ('10000000-0000-4000-8000-000000000013',
   'Effects of resistance training performed to repetition failure or non-failure on muscular strength and hypertrophy',
   'Grgic J, Schoenfeld BJ, Orazem J, Sabol F',
   2022, 'J Sport Health Sci', '10.1016/j.jshs.2021.01.007', '33497853',
   'metaanalisis', 'B',
   'Adultos con entrenamiento de fuerza',
   'Compara al fallo frente a no al fallo, que es una pregunta distinta de la relacion continua con las repeticiones en reserva.',
   true, false, '2026-07-29')
on conflict (id) do nothing;

insert into public.formula_versions
  (id, key, version, value, unit, claim_ref, evidence_grade,
   is_product_parameter, rationale, limitations, approved_by, approved_at)
values
  ('20000000-0000-4000-8000-000000000013',
   'rir_by_goal', 1,
   '{"fuerza": 3, "hipertrofia": 1, "recomposicion": 2, "resistencia": 3}'::jsonb,
   'repeticiones en reserva',
   'BIO-003', 'B', false,
   'Fuerza e hipertrofia no responden igual a la proximidad al fallo: la relacion con la fuerza es insignificante, la hipertrofia mejora al acercarse. Antes se prescribia RIR 2 para casi todo.',
   'Las repeticiones en reserva de los estudios fueron estimadas, no medidas, y el analisis es exploratorio. Ademas las personas estiman peor su propio RIR cuando empiezan o cuando estan lejos del fallo, asi que a un principiante se le deja mas margen.',
   'Adrian', now()),

  ('20000000-0000-4000-8000-000000000014',
   'min_rest_seconds', 1, '60'::jsonb, 'segundos',
   'BIO-007', 'B', false,
   'Por debajo de 60 s el descanso empieza a costar carga de volumen, que es el mecanismo por el que perjudica. Pasados los 90 s no se detectan diferencias apreciables.',
   'El objetivo "resistencia" prescribia 60 y 75 s, y lo hacia porque resistencia suena a poco descanso, no porque mejorase nada. Esta fuente mide hipertrofia: si el objetivo real fuese resistencia muscular, no es la que decide.',
   'Adrian', now())
on conflict (id) do nothing;

insert into public.formula_version_sources (formula_version_id, research_source_id, role, note)
values
  ('20000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000011', 'sustenta', 'Modela la relacion continua con las repeticiones en reserva.'),
  ('20000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000013', 'matiza', 'Compara al fallo frente a no al fallo: acercarse al fallo importa, llegar hasta el no necesariamente.'),
  ('20000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000012', 'sustenta', 'Beneficio por encima de 60 s, sin diferencia apreciable pasados los 90.')
on conflict do nothing;
