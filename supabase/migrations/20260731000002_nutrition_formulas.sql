-- Constantes nutricionales restantes, y primera correccion de valor de la
-- fase 3: NUT-002, los factores de actividad.
--
-- Aprobado por el usuario el 2026-07-31.

insert into public.research_sources
  (id, title, authors, year, journal, doi, pmid, source_type, evidence_grade,
   population, limitations, is_open_access, full_text_read, verified_at)
values
  ('10000000-0000-4000-8000-000000000010',
   'Physical activity and human energy expenditure',
   'Westerterp KR, Plasqui G',
   2004, 'Curr Opin Clin Nutr Metab Care', '10.1097/00075197-200411000-00004', '15534427',
   'revision_sistematica', 'B',
   'Adultos medidos con agua doblemente marcada',
   'Confirma un techo del indice de actividad en torno a 2.5. En adultos, lo que determina el nivel es el tiempo en actividades de intensidad baja y moderada: la actividad de alta intensidad no aporta gran cosa al gasto diario.',
   false, false, '2026-07-28')
on conflict (id) do nothing;

insert into public.formula_versions
  (id, key, version, value, unit, claim_ref, evidence_grade,
   is_product_parameter, rationale, limitations, approved_by, approved_at)
values
  -- NUT-002: CAMBIO DE VALOR. Antes 1.2 / 1.375 / 1.55 / 1.725.
  --
  -- Esos escalones de tres decimales son convencion heredada de las
  -- calculadoras derivadas de Harris-Benedict, no proceden de la literatura
  -- primaria, y comunican una exactitud que no existe: la validez demostrada
  -- del nivel de actividad fisica es POBLACIONAL, no individual. Se redondean
  -- porque la diferencia esta muy por debajo del error del metodo.
  ('20000000-0000-4000-8000-000000000005',
   'activity_factors', 1,
   '{"sedentario": 1.2, "ligero": 1.4, "moderado": 1.6, "alto": 1.75}'::jsonb,
   'multiplicador del metabolismo basal',
   'NUT-002', 'C', false,
   'El marco del nivel de actividad fisica esta validado y sus limites (1.2 a 2.5) estan medidos con agua doblemente marcada. Los valores se redondean: mantener tres decimales aparentaba una precision que el metodo no tiene.',
   'Validado para poblaciones, no para acertar con un individuo. Depende de que el usuario se autoclasifique, y la autopercepcion de actividad es poco fiable. La correccion honesta a largo plazo es calibrar con la tendencia real de peso.',
   'Adrian', now()),

  ('20000000-0000-4000-8000-000000000006',
   'goal_adjustments', 1,
   '{"perdida_grasa": 0.85, "recomposicion": 0.95, "mantenimiento": 1, "ganancia_muscular": 1.1}'::jsonb,
   'multiplicador del gasto total',
   'NUT-004', 'B', true,
   'Valores de partida. NUT-004 establece que el anclaje correcto es la tasa de cambio de peso (0.5 a 1 %/semana), no un multiplicador fijo; queda pendiente de implementar ese cambio estructural.',
   'Un multiplicador fijo produce tasas semanales distintas segun el tamano de la persona. El lado del superavit esta bastante peor respaldado que el del deficit.',
   null, null),

  ('20000000-0000-4000-8000-000000000007',
   'protein_g_per_kg', 1, '1.8'::jsonb, 'g/kg de peso corporal',
   'NUT-003', 'A', false,
   'Valor unico de partida, por encima del punto de quiebre de Morton 2018. NUT-003 establece que debe pasar a rango por objetivo; queda pendiente ese cambio estructural.',
   'Un numero fijo para todos es lo que la literatura no respalda: la necesidad cambia con objetivo, deficit, edad y nivel de entrenamiento. El 1.62 g/kg que se cita como umbral NO es significativo (p = 0.079, IC 1.03 a 2.20).',
   null, null),

  ('20000000-0000-4000-8000-000000000008',
   'min_fat_g_per_kg', 1, '0.8'::jsonb, 'g/kg de peso corporal',
   'NUT-005', 'C', false,
   'Piso de grasa. La literatura lo expresa como porcentaje de calorias (15 a 30 %), no en g/kg; para un caso tipico ambos coinciden, pero por casualidad.',
   'El argumento hormonal con el que se justifica es debil: efectos pequenos (0.30 a 0.38), 6 estudios, 206 participantes, solo varones, intervalo que casi toca el cero, y los autores piden confirmacion. Hay ademas una errata de 2026 sin leer.',
   null, null),

  ('20000000-0000-4000-8000-000000000009',
   'safety_floor_factor', 1, '1.1'::jsonb, 'multiplicador del metabolismo basal',
   'NUT-008', 'D', true,
   'Guarda cruda. NO es un piso de seguridad: no descuenta el gasto del ejercicio. El piso correcto es la disponibilidad energetica y necesita masa libre de grasa medida.',
   'Falla mas cuanto mas entrena la persona, que es al reves de lo que deberia. Se conserva solo porque en el onboarding todavia no hay composicion corporal.',
   null, null)
on conflict (id) do nothing;

insert into public.formula_version_sources (formula_version_id, research_source_id, role, note)
values
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000008', 'sustenta', 'Valida el nivel de actividad fisica como indice poblacional.'),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000010', 'matiza', 'Situa el techo del indice en torno a 2.5 y muestra que la alta intensidad aporta poco al gasto diario.'),
  ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000005', 'matiza', 'Ancla el deficit en 0.5 a 1 %/semana, no en un multiplicador.'),
  ('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000003', 'sustenta', 'Punto de quiebre en 1.62 g/kg, no significativo.'),
  ('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000004', 'matiza', 'En deficit sostiene ingestas superiores.'),
  ('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000006', 'sustenta', 'Posicion oficial con recomendacion por comida.'),
  ('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000005', 'sustenta', 'Banda de 15 a 30 % de las calorias.'),
  ('20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000007', 'contradice', 'El constructo correcto es la disponibilidad energetica, que resta el gasto del ejercicio. Este multiplicador no lo hace.')
on conflict do nothing;
