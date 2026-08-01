-- Bloque de presentacion y etiquetado de la fase 3.
-- EQ-001, NUT-005, NUT-006, NUT-007, BIA-001. Aprobado el 2026-07-31.
--
-- Ninguno cambia un calculo: cambian lo que el sistema DICE sobre sus propios
-- numeros. Es la conclusion transversal de la fase 2, que el sistema no miente
-- en el numero sino en la confianza.

insert into public.research_sources
  (id, title, authors, year, journal, doi, pmid, source_type, evidence_grade,
   population, limitations, is_open_access, full_text_read, verified_at)
values
  ('10000000-0000-4000-8000-000000000016',
   'A satiety index of common foods',
   'Holt SH, Miller JC, Petocz P, Farmakalidis E',
   1995, 'Eur J Clin Nutr', null, '7498104',
   'ensayo_controlado', 'B',
   'Adultos, alimentos comunes con carga isocalorica',
   'Es una medicion EMPIRICA por alimento, no una formula de macros. Su hallazgo mas citado, la papa hervida en lo mas alto, es justo lo que una suma proteina-mas-fibra no predeciria.',
   false, false, '2026-07-28'),

  ('10000000-0000-4000-8000-000000000017',
   'Low-fat diets and testosterone in men: Systematic review and meta-analysis of intervention studies',
   'Whittaker J, Wu K',
   2021, 'J Steroid Biochem Mol Biol', '10.1016/j.jsbmb.2021.105878', '33741447',
   'metaanalisis', 'C',
   'Solo varones. 6 estudios, 206 participantes en total.',
   'Efectos pequenos (0.30 a 0.38) y el intervalo de la testosterona total casi toca el cero. Los autores piden mas ensayos para confirmarlo. Hay un corrigendum de 2026 (PMID 41139558) que no se ha podido leer por estar tras muro de pago.',
   false, false, '2026-07-29'),

  ('10000000-0000-4000-8000-000000000018',
   'Body composition: validity of segmental bioelectrical impedance analysis',
   'LaForgia J, Gunn S, Withers RT',
   2008, 'Asia Pac J Clin Nutr', null, '19114394',
   'ensayo_controlado', 'B',
   'Adultos, contra modelo de cuatro compartimentos',
   'Las MEDIAS no difieren del criterio, pero el error intraindividual va de -3.0 a +4.4 puntos de grasa corporal y de -3.3 a +1.9 kg de masa libre de grasa. Los autores concluyen exactitud individual pobre.',
   false, false, '2026-07-29')
on conflict (id) do nothing;

insert into public.formula_versions
  (id, key, version, value, unit, claim_ref, evidence_grade,
   is_product_parameter, rationale, limitations, approved_by, approved_at)
values
  ('20000000-0000-4000-8000-000000000018',
   'protein_fiber_density_weights', 1,
   '{"proteinG": 1.5, "fiberG": 2}'::jsonb, 'peso relativo',
   'EQ-001', null, true,
   'Ordena alternativas por proteina y fibra, que son los componentes con respaldo mas consistente sobre el apetito. Se renombra: NO es el Indice de Saciedad de Holt, que es una medicion empirica por alimento.',
   'Los coeficientes no proceden de ninguna fuente. La saciedad depende ademas del volumen, el agua y lo procesado que este el alimento, que una suma de macros no captura.',
   'Adrian', now()),

  ('20000000-0000-4000-8000-000000000019',
   'bia_individual_error', 1,
   '{"body_fat_pct": {"min": -3.0, "max": 4.4}, "fat_free_mass_kg": {"min": -3.3, "max": 1.9}}'::jsonb,
   'desviacion respecto al modelo de cuatro compartimentos',
   'BIA-001', 'B', false,
   'Cifras para poner en la advertencia. "Es una estimacion" es mucho mas debil que el numero: con el dato delante, el usuario entiende por que no debe reaccionar a un cambio de un punto.',
   'De un dispositivo concreto y muestra pequena. El sesgo tiene direccion conocida: subestima masa libre de grasa y sobrestima grasa. Los algoritmos del firmware del aparato no deberian considerarse fiables.',
   'Adrian', now())
on conflict (id) do nothing;

insert into public.formula_version_sources (formula_version_id, research_source_id, role, note)
values
  ('20000000-0000-4000-8000-000000000018', '10000000-0000-4000-8000-000000000016', 'contradice', 'El Indice de Saciedad real no es una formula de macros: por eso la funcion se renombra en vez de conservar el nombre.'),
  ('20000000-0000-4000-8000-000000000019', '10000000-0000-4000-8000-000000000018', 'sustenta', 'Aporta los rangos de error intraindividual.'),
  ('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000017', 'matiza', 'El argumento hormonal del piso de grasa: efectos pequenos, solo varones, corrigendum sin leer.')
on conflict do nothing;
