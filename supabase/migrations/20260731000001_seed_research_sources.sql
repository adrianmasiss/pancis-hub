-- Fuentes verificadas de la Fase 2 y primeras formulas versionadas.
--
-- Va en una MIGRACION y no en seed.sql a proposito: es catalogo compartido que
-- produccion necesita, y `supabase db push` no ejecuta el seed. Es exactamente
-- el error que causo D-001.
--
-- Todos los PMID y DOI de aqui se verificaron contra PubMed E-utilities y
-- Crossref el 2026-07-28 y 2026-07-29. Ninguno se escribio de memoria.

insert into public.research_sources
  (id, title, authors, year, journal, doi, pmid, source_type, evidence_grade,
   population, limitations, conflicts_of_interest, is_open_access,
   full_text_read, verified_at)
values
  ('10000000-0000-4000-8000-000000000001',
   'A new predictive equation for resting energy expenditure in healthy individuals',
   'Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO',
   1990, 'Am J Clin Nutr', null, '2305711',
   'ensayo_controlado', 'A',
   '498 adultos sanos con y sin obesidad, Estados Unidos',
   'Poblacion general, no entrenada en fuerza. No usa composicion corporal, asi que subestima en personas con mucha masa magra. Sin validacion en poblacion latinoamericana.',
   null, false, false, '2026-07-28'),

  ('10000000-0000-4000-8000-000000000002',
   'Comparison of predictive equations for resting metabolic rate in healthy nonobese and obese adults: a systematic review',
   'Frankenfield D, Roth-Yousey L, Compher C',
   2005, 'J Am Diet Assoc', null, '15883556',
   'revision_sistematica', 'A',
   'Adultos sanos con y sin obesidad',
   'Compara exactitud de grupo. Ninguna ecuacion sustituye a la calorimetria indirecta en un individuo.',
   null, false, false, '2026-07-28'),

  ('10000000-0000-4000-8000-000000000003',
   'A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults',
   'Morton RW, Murphy KT, McKellar SR, Schoenfeld BJ, Henselmans M, Helms E, Aragon AA, Devries MC, Banfield L, Krieger JW, Phillips SM',
   2018, 'Br J Sports Med', '10.1136/bjsports-2017-097608', '28698222',
   'metaanalisis', 'A',
   '49 estudios, 1863 adultos sanos con entrenamiento de fuerza de 6 semanas o mas. Mujeres infrarrepresentadas.',
   'El punto de quiebre de 1.62 g/kg NO es estadisticamente significativo: p = 0.079, IC 95 % de 1.03 a 2.20, R2 = 0.19. Los autores lo presentan pese a ello, y solo consta en la tabla suplementaria. Citarlo como umbral demostrado es incorrecto.',
   'Declarado en errata de 2020 (DOI 10.1136/bjsports-2017-097608corr1): un coautor formaba parte del consejo asesor de un fabricante de suplementos deportivos al escribirse el trabajo, y continua en el.',
   true, true, '2026-07-29'),

  ('10000000-0000-4000-8000-000000000004',
   'A systematic review of dietary protein during caloric restriction in resistance trained lean athletes',
   'Helms ER, Zinn C, Rowlands DS, Brown SR',
   2014, 'Int J Sport Nutr Exerc Metab', '10.1123/ijsnem.2013-0054', '24092765',
   'revision_sistematica', 'B',
   'Atletas entrenados y magros en deficit calorico',
   'Poblacion estrecha: atletas magros en preparacion. Razona sobre masa libre de grasa, no sobre peso total. Sin acceso a texto completo.',
   null, false, false, '2026-07-28'),

  ('10000000-0000-4000-8000-000000000005',
   'Evidence-based recommendations for natural bodybuilding contest preparation: nutrition and supplementation',
   'Helms ER, Aragon AA, Fitschen PJ',
   2014, 'J Int Soc Sports Nutr', '10.1186/1550-2783-11-20', '24864135',
   'revision_sistematica', 'B',
   'Culturistas naturales en preparacion de competicion',
   'Poblacion mas magra y disciplinada que el usuario tipico. Sus tasas son una extrapolacion fuera de ese contexto.',
   null, true, false, '2026-07-29'),

  ('10000000-0000-4000-8000-000000000006',
   'International Society of Sports Nutrition Position Stand: protein and exercise',
   'Jager R, Kerksick CM, Campbell BI, Cribb PJ, Wells SD, Skwiat TM, et al.',
   2017, 'J Int Soc Sports Nutr', '10.1186/s12970-017-0177-8', '28642676',
   'guia_oficial', 'A',
   'Adultos que entrenan',
   'Recomendaciones por comida dependientes de edad y estimulo reciente.',
   null, true, true, '2026-07-29'),

  ('10000000-0000-4000-8000-000000000007',
   'International society of sports nutrition position stand: nutritional concerns of the female athlete',
   'Sims ST, Kerksick CM, Smith-Ryan AE, Janse de Jonge XAK, Hirsch KR, et al.',
   2023, 'J Int Soc Sports Nutr', '10.1080/15502783.2023.2204066', '37221858',
   'guia_oficial', 'B',
   'Atletas femeninas',
   'Los umbrales de disponibilidad energetica son modelos conceptuales derivados de estudios de laboratorio controlados; el propio documento aclara que no se han establecido guias especificas. Descritos en mujeres: trasladarlos a hombres es una extrapolacion.',
   null, true, true, '2026-07-29'),

  ('10000000-0000-4000-8000-000000000008',
   'Energy requirements of adults',
   'Shetty P',
   2005, 'Public Health Nutr', '10.1079/phn2005792', '16277816',
   'revision_sistematica', 'B',
   'Adultos en libertad, medidos con agua doblemente marcada',
   'Valida el nivel de actividad fisica como indice POBLACIONAL. Aplicarlo a un individuo concreto es otra afirmacion, con error mucho mayor.',
   null, false, false, '2026-07-28'),

  ('10000000-0000-4000-8000-000000000009',
   'Dietary Reference Intakes for Energy, Carbohydrate, Fiber, Fat, Fatty Acids, Cholesterol, Protein, and Amino Acids',
   'Institute of Medicine',
   2005, 'National Academies Press', '10.17226/10490', null,
   'guia_oficial', 'B',
   'Poblacion adulta general de Estados Unidos y Canada',
   'La cifra de fibra es una Ingesta Adecuada, no un Requerimiento Medio Estimado: sale de asociacion observacional con riesgo coronario, no de un requerimiento demostrado.',
   null, false, false, '2026-07-28')
on conflict (id) do nothing;

-- =========================================================================
-- Primeras formulas versionadas
-- =========================================================================

insert into public.formula_versions
  (id, key, version, value, unit, claim_ref, evidence_grade,
   is_product_parameter, rationale, limitations)
values
  ('20000000-0000-4000-8000-000000000001',
   'bmr_equation', 1, '"mifflin_st_jeor"'::jsonb, null,
   'NUT-001', 'A', false,
   'Ecuacion con menor error de prediccion del gasto en reposo en adultos sanos sin datos de composicion corporal.',
   'Estimacion de grupo aplicada a un individuo. No usa composicion corporal, asi que subestima en personas con mucha masa magra, que es el perfil del usuario que entrena fuerza.'),

  ('20000000-0000-4000-8000-000000000002',
   'energy_availability_thresholds', 1,
   '{"low": 30, "optimal": 45}'::jsonb, 'kcal/kg masa libre de grasa/dia',
   'NUT-008', 'B', false,
   'Umbral bajo: valor en el cual y por debajo del cual se describen hormonas metabolicas suprimidas y reduccion de la pulsatilidad de la hormona luteinizante en tan poco como 5 dias. Umbral optimo: funcion fisiologica y mantenimiento del peso.',
   'Modelos conceptuales, no guias establecidas. Descritos en mujeres. Requieren masa libre de grasa medida y gasto de ejercicio: sin ambos no se puede calcular y no debe estimarse.'),

  ('20000000-0000-4000-8000-000000000003',
   'fiber_g_per_1000_kcal', 1, '14'::jsonb, 'g/1000 kcal',
   'NUT-006', 'B', false,
   'Ingesta Adecuada de las Dietary Reference Intakes, asociada a menor riesgo de enfermedad coronaria.',
   'Es una Ingesta Adecuada, no un requerimiento: objetivo de salud a largo plazo, no una necesidad diaria. Escalar con las calorias baja el objetivo en deficit, justo cuando la saciedad mas importa.'),

  ('20000000-0000-4000-8000-000000000004',
   'water_ml_per_kg', 1, '35'::jsonb, 'ml/kg',
   'NUT-007', 'D', true,
   'Regla practica de uso clinico. NO procede de ninguna guia: las autoridades expresan la ingesta como total diario por sexo, incluyendo el agua de los alimentos.',
   'Ignora ejercicio y clima, que es lo que mas pesa. Para una persona sana, la sed y el color de la orina orientan mejor.')
on conflict (id) do nothing;

insert into public.formula_version_sources (formula_version_id, research_source_id, role, note)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'sustenta', 'Estudio original de derivacion.'),
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'sustenta', 'Revision comparativa que la situa como la de menor error.'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000007', 'sustenta', 'Publica los umbrales de 30 y 45.'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000009', 'sustenta', 'Fuente original de la cifra.')
on conflict do nothing;
