-- Cierre de la fase 3: BIO-005, BIO-006 y NUT-001.
-- Aprobado por el usuario el 2026-07-31.
--
-- Ninguno cambia un calculo. BIO-005 y BIO-006 corrigen lo que el sistema
-- DICE, y NUT-001 solo completa la trazabilidad de un valor que ya estaba
-- bien: Mifflin-St Jeor fue la unica constante del archivo que la fase 2
-- encontro correctamente justificada.

insert into public.research_sources
  (id, title, authors, year, journal, doi, pmid, source_type, evidence_grade,
   population, limitations, is_open_access, full_text_read, verified_at)
values
  ('10000000-0000-4000-8000-000000000019',
   'Effect of repetition duration during resistance training on muscle hypertrophy: a systematic review and meta-analysis',
   'Schoenfeld BJ, Ogborn DI, Krieger JW',
   2015, 'Sports Med', '10.1007/s40279-015-0304-0', '25601394',
   'metaanalisis', 'B',
   'Ocho estudios en adultos sanos. Criterio de inclusion: todos los protocolos llevaban las series al fallo.',
   'Base estrecha (8 estudios). Los autores avisan de que faltan estudios controlados en el extremo muy lento. Al haberse entrenado siempre al fallo, el hallazgo no se puede extender sin mas a series lejos de el.',
   false, false, '2026-07-28'),

  ('10000000-0000-4000-8000-000000000020',
   'How many times per week should a muscle be trained to maximize muscle hypertrophy? A systematic review and meta-analysis of studies examining the effects of resistance training frequency',
   'Schoenfeld BJ, Grgic J, Krieger J',
   2019, 'J Sports Sci', '10.1080/02640414.2018.1555906', '30558493',
   'metaanalisis', 'B',
   'Adultos con entrenamiento de fuerza',
   'Con el volumen igualado, el efecto de la frecuencia sobre la hipertrofia es mucho menor de lo que se suele afirmar.',
   false, false, '2026-07-28')
on conflict (id) do nothing;

insert into public.formula_versions
  (id, key, version, value, unit, claim_ref, evidence_grade,
   is_product_parameter, rationale, limitations, approved_by, approved_at)
values
  ('20000000-0000-4000-8000-000000000020',
   'tempo_very_slow_seconds', 1, '10'::jsonb, 'segundos por repeticion',
   'BIO-006', 'B', false,
   'Unico umbral con evidencia. La hipertrofia es SIMILAR entre 0.5 y 8 segundos por repeticion, asi que el sistema no prescribe tempo: solo interpreta el que el usuario escriba y avisa por encima de este valor.',
   'Ocho estudios, todos con series llevadas al fallo. Los autores avisan de que faltan estudios controlados en el extremo lento, asi que el aviso se redacta como tendencia y no como certeza.',
   'Adrian', now()),

  ('20000000-0000-4000-8000-000000000021',
   'frequency_is_distribution', 1, 'true'::jsonb, null,
   'BIO-005', 'A', false,
   'Con el volumen igualado, la frecuencia es una herramienta de reparto y no un estimulo adicional. El analisis de rutina solo avisa cuando hay tanto volumen en una sesion que la calidad de las ultimas series se resiente, que es el argumento practico real para repartir.',
   'En fuerza si se identifica un efecto consistente de la frecuencia; el hallazgo de "compatible con insignificante" es para hipertrofia.',
   'Adrian', now())
on conflict (id) do nothing;

insert into public.formula_version_sources (formula_version_id, research_source_id, role, note)
values
  ('20000000-0000-4000-8000-000000000020', '10000000-0000-4000-8000-000000000019', 'sustenta', 'Hipertrofia similar entre 0.5 y 8 s; inferior por encima de 10 s.'),
  ('20000000-0000-4000-8000-000000000021', '10000000-0000-4000-8000-000000000020', 'sustenta', 'Efecto de la frecuencia sobre hipertrofia con volumen igualado.'),
  ('20000000-0000-4000-8000-000000000021', '10000000-0000-4000-8000-000000000014', 'sustenta', 'Probabilidad posterior menor al 100 % para el efecto de la frecuencia sobre hipertrofia.')
on conflict do nothing;
