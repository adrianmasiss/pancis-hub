-- Seed de desarrollo de Pancis Hub.
-- Datos FICTICIOS para demostracion; no contienen informacion personal real.
-- Los valores nutricionales son aproximados y demostrativos: el contenido
-- cientifico no verificado se marca como tal y las referencias pendientes
-- usan el placeholder "Referencia pendiente de verificacion.".

-- =========================================================================
-- Usuario demo (solo entorno local): demo@pancis.local / demo12345
-- =========================================================================

-- Los tokens van como cadena vacia (no NULL): GoTrue falla al escanear NULL.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'demo@pancis.local',
  crypt('demo12345', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Demo Pancis"}',
  now(),
  now(),
  '', '', '', '', '', '', '', ''
);

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider,
  last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(),
  '11111111-1111-4111-8111-111111111111',
  '11111111-1111-4111-8111-111111111111',
  '{"sub":"11111111-1111-4111-8111-111111111111","email":"demo@pancis.local","email_verified":true}',
  'email',
  now(),
  now(),
  now()
);

-- El trigger handle_new_user ya creo el perfil; se completa el onboarding.
update public.profiles set
  display_name = 'Demo Pancis',
  birth_date = '1996-03-15',
  biological_sex = 'femenino',
  height_cm = 165,
  timezone = 'America/Costa_Rica',
  unit_system = 'metric',
  primary_goal = 'recomposicion',
  experience_level = 'intermedio',
  training_days_per_week = 4,
  training_type = 'Fuerza e hipertrofia',
  activity_level = 'moderado',
  daily_steps = 8000,
  meals_per_day = 4,
  usual_training_time = '18:00',
  onboarding_completed_at = now()
where id = '11111111-1111-4111-8111-111111111111';

insert into public.dietary_preferences (user_id, preference_type, value, severity) values
  ('11111111-1111-4111-8111-111111111111', 'alergia', 'mani', 'moderada'),
  ('11111111-1111-4111-8111-111111111111', 'alimento_no_deseado', 'higado', null);

-- Objetivos estimados con Mifflin-St Jeor (70 kg, 165 cm, 30 anos, moderado,
-- recomposicion): BMR 1420, TDEE 2201, ajuste -5 %.
insert into public.nutrition_targets (
  user_id, effective_from, calories, protein_g, carbohydrate_g, fat_g,
  fiber_g, water_ml, source, status
) values (
  '11111111-1111-4111-8111-111111111111',
  current_date - 21, 2091, 126, 271, 56, 29, 2450, 'estimacion_inicial', 'active'
);

-- =========================================================================
-- Catalogo de alimentos (valores por 100 g, aproximados y demostrativos)
-- =========================================================================

insert into public.foods (id, name, food_group, cooked_state, calories, protein_g, carbohydrate_g, fat_g, fiber_g, verified, source) values
  ('00000000-0000-4000-8000-000000000001', 'Pechuga de pollo', 'proteina', 'cocido', 165, 31, 0, 3.6, 0, false, 'Datos demostrativos'),
  ('00000000-0000-4000-8000-000000000002', 'Arroz blanco', 'carbohidrato', 'cocido', 130, 2.7, 28, 0.3, 0.4, false, 'Datos demostrativos'),
  ('00000000-0000-4000-8000-000000000003', 'Arroz blanco', 'carbohidrato', 'crudo', 365, 7.1, 80, 0.7, 1.3, false, 'Datos demostrativos'),
  ('00000000-0000-4000-8000-000000000004', 'Avena en hojuelas', 'carbohidrato', 'crudo', 389, 16.9, 66, 6.9, 10.6, false, 'Datos demostrativos'),
  ('00000000-0000-4000-8000-000000000005', 'Huevo entero', 'proteina', 'cocido', 155, 13, 1.1, 11, 0, false, 'Datos demostrativos'),
  ('00000000-0000-4000-8000-000000000006', 'Clara de huevo', 'proteina', 'cocido', 52, 11, 0.7, 0.2, 0, false, 'Datos demostrativos'),
  ('00000000-0000-4000-8000-000000000007', 'Atun en agua', 'proteina', 'cocido', 116, 26, 0, 1, 0, false, 'Datos demostrativos'),
  ('00000000-0000-4000-8000-000000000008', 'Frijoles negros', 'legumbre', 'cocido', 132, 8.9, 24, 0.5, 8.7, false, 'Datos demostrativos'),
  ('00000000-0000-4000-8000-000000000009', 'Tortilla de maiz', 'carbohidrato', 'cocido', 218, 5.7, 45, 2.9, 6.3, false, 'Datos demostrativos'),
  ('00000000-0000-4000-8000-000000000010', 'Banano', 'fruta', null, 89, 1.1, 23, 0.3, 2.6, false, 'Datos demostrativos'),
  ('00000000-0000-4000-8000-000000000011', 'Manzana', 'fruta', null, 52, 0.3, 14, 0.2, 2.4, false, 'Datos demostrativos'),
  ('00000000-0000-4000-8000-000000000012', 'Papa', 'carbohidrato', 'cocido', 87, 1.9, 20, 0.1, 1.8, false, 'Datos demostrativos'),
  ('00000000-0000-4000-8000-000000000013', 'Camote', 'carbohidrato', 'cocido', 90, 2, 21, 0.2, 3.3, false, 'Datos demostrativos'),
  ('00000000-0000-4000-8000-000000000014', 'Aceite de oliva', 'grasa', null, 884, 0, 0, 100, 0, false, 'Datos demostrativos'),
  ('00000000-0000-4000-8000-000000000015', 'Aguacate', 'grasa', null, 160, 2, 8.5, 14.7, 6.7, false, 'Datos demostrativos'),
  ('00000000-0000-4000-8000-000000000016', 'Yogur griego natural', 'lacteo', null, 59, 10, 3.6, 0.4, 0, false, 'Datos demostrativos'),
  ('00000000-0000-4000-8000-000000000017', 'Leche descremada', 'lacteo', null, 34, 3.4, 5, 0.1, 0, false, 'Datos demostrativos'),
  ('00000000-0000-4000-8000-000000000018', 'Queso fresco', 'lacteo', null, 264, 18, 3.4, 20, 0, false, 'Datos demostrativos'),
  ('00000000-0000-4000-8000-000000000019', 'Almendras', 'grasa', null, 579, 21, 22, 50, 12.5, false, 'Datos demostrativos'),
  ('00000000-0000-4000-8000-000000000020', 'Lentejas', 'legumbre', 'cocido', 116, 9, 20, 0.4, 7.9, false, 'Datos demostrativos'),
  ('00000000-0000-4000-8000-000000000021', 'Brocoli', 'verdura', 'cocido', 35, 2.4, 7.2, 0.4, 3.3, false, 'Datos demostrativos'),
  ('00000000-0000-4000-8000-000000000022', 'Pan integral', 'carbohidrato', null, 247, 13, 41, 3.4, 7, false, 'Datos demostrativos');

insert into public.food_portions (food_id, label, grams, household_measure) values
  ('00000000-0000-4000-8000-000000000005', '1 unidad', 50, '1 huevo mediano'),
  ('00000000-0000-4000-8000-000000000009', '1 unidad', 30, '1 tortilla'),
  ('00000000-0000-4000-8000-000000000010', '1 unidad', 120, '1 banano mediano'),
  ('00000000-0000-4000-8000-000000000014', '1 cucharada', 14, '1 cda'),
  ('00000000-0000-4000-8000-000000000022', '1 rebanada', 32, '1 rebanada'),
  ('00000000-0000-4000-8000-000000000002', '1 taza', 158, '1 taza cocida'),
  ('00000000-0000-4000-8000-000000000016', '1 envase', 170, '1 envase individual');

-- =========================================================================
-- Catalogo de ejercicios
-- =========================================================================

insert into public.exercise_catalog (id, name, primary_muscle, secondary_muscles, movement_pattern, equipment, difficulty) values
  ('00000000-0000-4000-8000-000000000101', 'Sentadilla con barra', 'cuadriceps', '{gluteos,isquiotibiales,core}', 'sentadilla', 'barra', 'intermedio'),
  ('00000000-0000-4000-8000-000000000102', 'Peso muerto convencional', 'isquiotibiales', '{gluteos,espalda baja,trapecio}', 'bisagra de cadera', 'barra', 'intermedio'),
  ('00000000-0000-4000-8000-000000000103', 'Press de banca', 'pecho', '{triceps,hombro anterior}', 'empuje horizontal', 'barra', 'intermedio'),
  ('00000000-0000-4000-8000-000000000104', 'Press militar', 'hombros', '{triceps,core}', 'empuje vertical', 'barra', 'intermedio'),
  ('00000000-0000-4000-8000-000000000105', 'Remo con barra', 'espalda', '{biceps,hombro posterior}', 'traccion horizontal', 'barra', 'intermedio'),
  ('00000000-0000-4000-8000-000000000106', 'Dominadas', 'espalda', '{biceps,core}', 'traccion vertical', 'peso corporal', 'avanzado'),
  ('00000000-0000-4000-8000-000000000107', 'Jalon al pecho', 'espalda', '{biceps}', 'traccion vertical', 'polea', 'principiante'),
  ('00000000-0000-4000-8000-000000000108', 'Zancadas', 'cuadriceps', '{gluteos,isquiotibiales}', 'zancada', 'mancuernas', 'principiante'),
  ('00000000-0000-4000-8000-000000000109', 'Hip thrust', 'gluteos', '{isquiotibiales}', 'bisagra de cadera', 'barra', 'principiante'),
  ('00000000-0000-4000-8000-000000000110', 'Curl de biceps', 'biceps', '{}', 'flexion de codo', 'mancuernas', 'principiante'),
  ('00000000-0000-4000-8000-000000000111', 'Extension de triceps en polea', 'triceps', '{}', 'extension de codo', 'polea', 'principiante'),
  ('00000000-0000-4000-8000-000000000112', 'Elevaciones laterales', 'hombros', '{}', 'abduccion de hombro', 'mancuernas', 'principiante'),
  ('00000000-0000-4000-8000-000000000113', 'Prensa de pierna', 'cuadriceps', '{gluteos}', 'sentadilla', 'maquina', 'principiante'),
  ('00000000-0000-4000-8000-000000000114', 'Curl femoral', 'isquiotibiales', '{}', 'flexion de rodilla', 'maquina', 'principiante'),
  ('00000000-0000-4000-8000-000000000115', 'Plancha', 'core', '{hombros}', 'antiextension', 'peso corporal', 'principiante');

-- =========================================================================
-- Datos biomecanicos del catalogo (defecto D-001)
-- =========================================================================
--
-- Estos valores los poblaba la migracion 20260723000002 con sentencias
-- `update ... where id = ...`. Pero las filas de exercise_catalog las crea
-- ESTE archivo, y el seed corre DESPUES de todas las migraciones: en una base
-- recien reseteada la migracion actualizaba cero filas y el catalogo quedaba
-- sin biomecanica. No fallaba ni avisaba, porque rateExercise cae a su valor
-- por defecto (5) cuando no hay dato, y seguia redactando razones como si lo
-- tuviera.
--
-- Se replican aqui para que un `supabase db reset` deje la base correcta. La
-- migracion se conserva intacta porque es la que arreglo las bases que ya
-- existian, incluida produccion. A partir de ahora, este archivo es el sitio
-- donde se editan estos valores.
--
-- ATENCION: los valores de stability, technical_demand, systemic_fatigue,
-- progression_ease y range_of_motion estan GENERADOS y sin procedencia. Ver
-- docs/investigacion/claims/BIO-002-valores-del-catalogo.md. La fase 3 los
-- sustituye por categorias con fuente. Se mantienen aqui solo para que el
-- comportamiento sea reproducible mientras tanto.

update public.exercise_catalog set
  joints = '{cadera,rodilla,tobillo}',
  resistance_profile = 'ascendente',
  hardest_point = 'Salida del punto mas profundo, justo al invertir el movimiento.',
  stability = 4, range_of_motion = 9, technical_demand = 7,
  systemic_fatigue = 9, progression_ease = 8, is_unilateral = false,
  common_errors = '{"Dejar que las rodillas colapsen hacia adentro","Perder la neutralidad lumbar en la parte baja","Levantar los talones del suelo","Adelantar el torso mas de lo que permite la movilidad de tobillo"}',
  technique_cues = '{"Reparte el peso en todo el pie","Empuja el suelo con los talones al subir","Manten el torso firme y las costillas abajo"}',
  setup_notes = 'Barra apoyada en la parte alta de la espalda, pies al ancho de hombros y puntas ligeramente hacia afuera.',
  execution_notes = 'Baja controlando cadera y rodillas a la vez hasta donde tu movilidad lo permita sin perder la postura, y sube empujando el suelo.'
where id = '00000000-0000-4000-8000-000000000101';

update public.exercise_catalog set
  joints = '{cadera,rodilla,columna}',
  resistance_profile = 'descendente',
  hardest_point = 'Despegue desde el suelo y paso por las rodillas.',
  stability = 3, range_of_motion = 8, technical_demand = 9,
  systemic_fatigue = 10, progression_ease = 7, is_unilateral = false,
  common_errors = '{"Redondear la zona lumbar al despegar","Subir la cadera antes que el pecho","Alejar la barra del cuerpo","Hiperextender la espalda al bloquear"}',
  technique_cues = '{"Manten la barra pegada a las piernas","Tensa la espalda antes de despegar","Termina de pie sin echarte hacia atras"}',
  setup_notes = 'Pies bajo la barra al ancho de cadera, manos por fuera de las piernas, pecho alto y espalda tensa.',
  execution_notes = 'Empuja el suelo y extiende cadera y rodillas juntas; baja acompanando la barra por el mismo camino.'
where id = '00000000-0000-4000-8000-000000000102';

update public.exercise_catalog set
  joints = '{hombro,codo}',
  resistance_profile = 'ascendente',
  hardest_point = 'Primeros centimetros al despegar la barra del pecho.',
  stability = 6, range_of_motion = 8, technical_demand = 6,
  systemic_fatigue = 7, progression_ease = 9, is_unilateral = false,
  common_errors = '{"Abrir los codos a 90 grados respecto al torso","Rebotar la barra en el pecho","Perder el apoyo de los pies","Despegar los gluteos del banco"}',
  technique_cues = '{"Junta las escapulas y mantenlas fijas","Lleva la barra a la linea del pecho, no al cuello","Codos a unos 45 grados del torso"}',
  setup_notes = 'Acostado con escapulas retraidas, pies firmes en el suelo y agarre algo mas ancho que los hombros.',
  execution_notes = 'Baja la barra controlada hasta el pecho y empuja hacia arriba y ligeramente atras, sin bloquear con brusquedad.'
where id = '00000000-0000-4000-8000-000000000103';

update public.exercise_catalog set
  joints = '{hombro,codo}',
  resistance_profile = 'ascendente',
  hardest_point = 'Zona media, cuando la barra pasa por delante de la cabeza.',
  stability = 4, range_of_motion = 8, technical_demand = 7,
  systemic_fatigue = 7, progression_ease = 7, is_unilateral = false,
  common_errors = '{"Arquear la zona lumbar para compensar falta de movilidad","Empujar la barra hacia adelante en vez de hacia arriba","No pasar la cabeza al final del recorrido"}',
  technique_cues = '{"Aprieta gluteos y abdomen para no arquear","Saca la cabeza cuando la barra la supere","Termina con la barra sobre la mitad del pie"}',
  setup_notes = 'De pie, barra a la altura de las claviculas, manos algo mas anchas que los hombros y core firme.',
  execution_notes = 'Empuja la barra en linea recta hacia arriba; al superar la cabeza, avanza el torso ligeramente para terminar alineado.'
where id = '00000000-0000-4000-8000-000000000104';

update public.exercise_catalog set
  joints = '{hombro,codo,columna}',
  resistance_profile = 'en_campana',
  hardest_point = 'Contraccion final, con la barra cerca del abdomen.',
  stability = 4, range_of_motion = 7, technical_demand = 7,
  systemic_fatigue = 7, progression_ease = 7, is_unilateral = false,
  common_errors = '{"Usar impulso de cadera en cada repeticion","Redondear la espalda al fatigarse","Encoger los hombros en vez de llevar los codos atras"}',
  technique_cues = '{"Lleva los codos hacia atras, no las manos","Manten el torso quieto durante la serie","Aprieta la espalda al final del tiron"}',
  setup_notes = 'Torso inclinado hacia adelante con la espalda neutra y rodillas ligeramente flexionadas.',
  execution_notes = 'Tira de la barra hacia el abdomen manteniendo el torso estable y baja con control.'
where id = '00000000-0000-4000-8000-000000000105';

update public.exercise_catalog set
  joints = '{hombro,codo}',
  resistance_profile = 'descendente',
  hardest_point = 'Inicio desde el colgado completo, con los brazos extendidos.',
  stability = 5, range_of_motion = 9, technical_demand = 7,
  systemic_fatigue = 6, progression_ease = 4, is_unilateral = false,
  common_errors = '{"Balancearse para ganar impulso","No completar la extension de los brazos abajo","Encoger los hombros al inicio del tiron"}',
  technique_cues = '{"Baja los hombros antes de tirar","Lleva el pecho hacia la barra","Controla la bajada, no te sueltes"}',
  setup_notes = 'Colgado con agarre algo mas ancho que los hombros y el cuerpo sin balanceo.',
  execution_notes = 'Tira llevando los codos hacia abajo y atras hasta pasar la barbilla, y baja controlando hasta extender.'
where id = '00000000-0000-4000-8000-000000000106';

update public.exercise_catalog set
  joints = '{hombro,codo}',
  resistance_profile = 'constante',
  hardest_point = 'Tramo final, con la barra cerca del pecho.',
  stability = 8, range_of_motion = 8, technical_demand = 3,
  systemic_fatigue = 4, progression_ease = 9, is_unilateral = false,
  common_errors = '{"Echar el torso muy atras y convertirlo en remo","Tirar con los brazos sin usar la espalda","Rango incompleto por exceso de carga"}',
  technique_cues = '{"Baja primero los hombros","Lleva la barra al pecho alto","Manten el torso casi vertical"}',
  setup_notes = 'Sentado con los muslos fijos bajo el soporte y agarre algo mas ancho que los hombros.',
  execution_notes = 'Tira de la barra hacia el pecho alto manteniendo el torso estable y regresa controlando hasta extender los brazos.'
where id = '00000000-0000-4000-8000-000000000107';

update public.exercise_catalog set
  joints = '{cadera,rodilla,tobillo}',
  resistance_profile = 'ascendente',
  hardest_point = 'Salida desde la posicion baja con la pierna adelantada.',
  stability = 3, range_of_motion = 9, technical_demand = 6,
  systemic_fatigue = 7, progression_ease = 6, is_unilateral = true,
  common_errors = '{"Dar un paso demasiado corto y cargar solo la rodilla","Inclinar el torso sin control","Perder el equilibrio lateral"}',
  technique_cues = '{"Da un paso largo y baja en vertical","Manten el torso alto","Empuja con el talon de la pierna adelantada"}',
  setup_notes = 'De pie con una mancuerna en cada mano y el core firme.',
  execution_notes = 'Da un paso al frente y baja hasta que la rodilla trasera casi toque el suelo; empuja para volver.'
where id = '00000000-0000-4000-8000-000000000108';

update public.exercise_catalog set
  joints = '{cadera}',
  resistance_profile = 'ascendente',
  hardest_point = 'Bloqueo final, con la cadera completamente extendida.',
  stability = 7, range_of_motion = 6, technical_demand = 4,
  systemic_fatigue = 5, progression_ease = 9, is_unilateral = false,
  common_errors = '{"Hiperextender la zona lumbar en vez de extender la cadera","Rango corto sin llegar al bloqueo","Empujar con las puntas de los pies"}',
  technique_cues = '{"Termina el movimiento apretando los gluteos","Manten las costillas abajo","Apoya el peso en los talones"}',
  setup_notes = 'Espalda alta apoyada en un banco, barra sobre la cadera y pies al ancho de hombros.',
  execution_notes = 'Extiende la cadera hasta alinear torso y muslos, manten un instante arriba y baja controlando.'
where id = '00000000-0000-4000-8000-000000000109';

update public.exercise_catalog set
  joints = '{codo}',
  resistance_profile = 'en_campana',
  hardest_point = 'Mitad del recorrido, con el antebrazo paralelo al suelo.',
  stability = 7, range_of_motion = 7, technical_demand = 2,
  systemic_fatigue = 2, progression_ease = 7, is_unilateral = true,
  common_errors = '{"Balancear el torso para subir la mancuerna","Mover el codo hacia adelante","No extender del todo abajo"}',
  technique_cues = '{"Manten el codo pegado al costado","Sube sin mover el torso","Controla la bajada"}',
  setup_notes = 'De pie o sentado, con una mancuerna en cada mano y los brazos extendidos.',
  execution_notes = 'Flexiona el codo llevando la mancuerna hacia el hombro y baja controlando hasta extender.'
where id = '00000000-0000-4000-8000-000000000110';

update public.exercise_catalog set
  joints = '{codo}',
  resistance_profile = 'constante',
  hardest_point = 'Extension final, con el codo completamente estirado.',
  stability = 8, range_of_motion = 7, technical_demand = 2,
  systemic_fatigue = 2, progression_ease = 8, is_unilateral = false,
  common_errors = '{"Separar los codos del costado","Usar el peso del torso para bajar la barra","Rango incompleto arriba"}',
  technique_cues = '{"Fija los codos a los costados","Solo se mueve el antebrazo","Extiende sin bloquear con fuerza"}',
  setup_notes = 'De pie frente a la polea alta, codos pegados al torso y agarre comodo.',
  execution_notes = 'Extiende los codos hasta abajo manteniendo los brazos quietos y regresa controlando.'
where id = '00000000-0000-4000-8000-000000000111';

update public.exercise_catalog set
  joints = '{hombro}',
  resistance_profile = 'ascendente',
  hardest_point = 'Tramo final, con los brazos cerca de la horizontal.',
  stability = 6, range_of_motion = 6, technical_demand = 3,
  systemic_fatigue = 2, progression_ease = 6, is_unilateral = true,
  common_errors = '{"Usar impulso de tronco","Subir por encima de la horizontal encogiendo el trapecio","Cargar demasiado peso y acortar el rango"}',
  technique_cues = '{"Sube hasta la altura del hombro","Lidera el movimiento con el codo","Manten los hombros abajo"}',
  setup_notes = 'De pie con una mancuerna en cada mano a los costados y una ligera flexion de codo.',
  execution_notes = 'Eleva los brazos hacia los lados hasta la altura de los hombros y baja controlando.'
where id = '00000000-0000-4000-8000-000000000112';

update public.exercise_catalog set
  joints = '{cadera,rodilla}',
  resistance_profile = 'constante',
  hardest_point = 'Salida desde la posicion de mayor flexion.',
  stability = 9, range_of_motion = 7, technical_demand = 3,
  systemic_fatigue = 5, progression_ease = 9, is_unilateral = false,
  common_errors = '{"Despegar la cadera del respaldo en la parte baja","Bloquear las rodillas de golpe","Rango muy corto por exceso de carga"}',
  technique_cues = '{"Manten la cadera apoyada en todo momento","Baja hasta donde la espalda siga apoyada","Empuja con toda la planta del pie"}',
  setup_notes = 'Sentado en la maquina con la espalda y la cadera apoyadas y los pies al ancho de hombros.',
  execution_notes = 'Baja la plataforma controlando y empuja sin bloquear las rodillas al final.'
where id = '00000000-0000-4000-8000-000000000113';

update public.exercise_catalog set
  joints = '{rodilla}',
  resistance_profile = 'en_campana',
  hardest_point = 'Mitad del recorrido de flexion.',
  stability = 9, range_of_motion = 7, technical_demand = 2,
  systemic_fatigue = 3, progression_ease = 8, is_unilateral = false,
  common_errors = '{"Despegar la cadera del banco","Usar impulso al iniciar la flexion","Rango incompleto al extender"}',
  technique_cues = '{"Manten la cadera pegada al apoyo","Controla especialmente la fase de bajada","Extiende del todo entre repeticiones"}',
  setup_notes = 'Tumbado o sentado en la maquina con el rodillo justo sobre el tendon de Aquiles.',
  execution_notes = 'Flexiona las rodillas llevando el rodillo hacia los gluteos y regresa controlando.'
where id = '00000000-0000-4000-8000-000000000114';

update public.exercise_catalog set
  joints = '{columna,hombro,cadera}',
  resistance_profile = 'constante',
  hardest_point = 'Sostener la posicion conforme avanza el tiempo.',
  stability = 7, range_of_motion = 2, technical_demand = 3,
  systemic_fatigue = 2, progression_ease = 5, is_unilateral = false,
  common_errors = '{"Dejar caer la cadera","Elevar demasiado los gluteos","Aguantar la respiracion"}',
  technique_cues = '{"Alinea cabeza, cadera y talones","Aprieta gluteos y abdomen","Respira de forma continua"}',
  setup_notes = 'Apoyo en antebrazos y puntas de los pies, con los codos bajo los hombros.',
  execution_notes = 'Manten el cuerpo alineado sin dejar caer ni elevar la cadera durante el tiempo objetivo.'
where id = '00000000-0000-4000-8000-000000000115';


-- =========================================================================
-- Academia (contenido demostrativo, referencias pendientes)
-- =========================================================================

insert into public.articles (id, title, slug, summary, body, category, level, reading_minutes, key_points, evidence_level, status, published_at, reviewed_at) values
  (
    '00000000-0000-4000-8000-000000000201',
    'Que es la recomposicion corporal',
    'que-es-recomposicion-corporal',
    'Perder grasa y conservar o ganar musculo al mismo tiempo: que significa y para quien es realista.',
    E'La recomposicion corporal consiste en reducir grasa corporal mientras se conserva o aumenta la masa muscular.\n\nSuele ser mas visible en personas principiantes, en quienes retoman el entrenamiento tras una pausa y en quienes ajustan por primera vez su nutricion. El progreso se evalua mejor con tendencias de varias semanas (peso promedio, medidas, fotos y rendimiento) que con el peso de un solo dia.\n\nEste contenido es educativo y demostrativo; no sustituye la evaluacion de profesionales de la salud.',
    'recomposicion corporal',
    'basico',
    4,
    '{"La recomposicion combina perdida de grasa con mantenimiento o ganancia muscular","El peso diario fluctua; evalua tendencias de varias semanas","El entrenamiento de fuerza y la proteina suficiente son la base"}',
    'demostrativo',
    'published',
    now(),
    now()
  ),
  (
    '00000000-0000-4000-8000-000000000202',
    'Proteina: cuanta necesitas',
    'proteina-cuanta-necesitas',
    'Rangos habituales de ingesta de proteina para entrenamiento de fuerza y como repartirla en el dia.',
    E'Para personas que entrenan fuerza, las recomendaciones habituales se ubican alrededor de 1.6 a 2.2 g de proteina por kilogramo de peso corporal al dia.\n\nRepartir la proteina en 3 a 5 comidas facilita alcanzar el total diario. La consistencia semanal importa mas que la precision de un dia aislado.\n\nEste contenido es educativo y demostrativo; no sustituye la evaluacion de profesionales de la salud.',
    'proteina',
    'basico',
    3,
    '{"Rango habitual: 1.6 a 2.2 g/kg/dia para entrenamiento de fuerza","Repartir en varias comidas facilita la adherencia","La consistencia semanal pesa mas que un dia perfecto"}',
    'demostrativo',
    'published',
    now(),
    now()
  );

insert into public.article_references (article_id, citation) values
  ('00000000-0000-4000-8000-000000000201', 'Referencia pendiente de verificacion.'),
  ('00000000-0000-4000-8000-000000000202', 'Referencia pendiente de verificacion.');

-- =========================================================================
-- Datos del usuario demo: mediciones, diario, rutina y comidas
-- =========================================================================

insert into public.body_measurements (user_id, measured_at, weight_kg, body_fat_percentage, waist_cm, source) values
  ('11111111-1111-4111-8111-111111111111', current_date - 21, 70.0, 28.5, 78.0, 'inbody'),
  ('11111111-1111-4111-8111-111111111111', current_date - 14, 69.6, null, null, 'manual'),
  ('11111111-1111-4111-8111-111111111111', current_date - 7, 69.4, null, 77.2, 'manual'),
  ('11111111-1111-4111-8111-111111111111', current_date - 1, 69.1, null, null, 'manual');

insert into public.daily_checkins (user_id, date, sleep_hours, sleep_quality, hunger, energy, stress, soreness, mood, nutrition_adherence, training_completed) values
  ('11111111-1111-4111-8111-111111111111', current_date - 3, 7.5, 4, 2, 4, 2, 2, 4, 4, true),
  ('11111111-1111-4111-8111-111111111111', current_date - 2, 6.0, 3, 3, 3, 3, 3, 3, 4, true),
  ('11111111-1111-4111-8111-111111111111', current_date - 1, 8.0, 5, 2, 4, 2, 1, 5, 5, false);

insert into public.workout_plans (id, user_id, name, objective, active) values (
  '00000000-0000-4000-8000-000000000301',
  '11111111-1111-4111-8111-111111111111',
  'Full body 3 dias',
  'Hipertrofia general con enfasis en tren inferior',
  true
);

insert into public.workout_plan_days (id, workout_plan_id, day_index, name) values
  ('00000000-0000-4000-8000-000000000311', '00000000-0000-4000-8000-000000000301', 1, 'Dia A'),
  ('00000000-0000-4000-8000-000000000312', '00000000-0000-4000-8000-000000000301', 2, 'Dia B');

insert into public.workout_plan_exercises (workout_plan_day_id, exercise_id, position, sets, target_reps_min, target_reps_max, target_rir, rest_seconds) values
  ('00000000-0000-4000-8000-000000000311', '00000000-0000-4000-8000-000000000101', 1, 4, 6, 8, 2, 150),
  ('00000000-0000-4000-8000-000000000311', '00000000-0000-4000-8000-000000000103', 2, 3, 8, 10, 2, 120),
  ('00000000-0000-4000-8000-000000000311', '00000000-0000-4000-8000-000000000105', 3, 3, 8, 12, 2, 120),
  ('00000000-0000-4000-8000-000000000312', '00000000-0000-4000-8000-000000000102', 1, 3, 5, 6, 2, 180),
  ('00000000-0000-4000-8000-000000000312', '00000000-0000-4000-8000-000000000104', 2, 3, 8, 10, 2, 120),
  ('00000000-0000-4000-8000-000000000312', '00000000-0000-4000-8000-000000000109', 3, 3, 10, 12, 1, 90);

-- Sesion de ejemplo completada hace 2 dias.
insert into public.workout_sessions (id, user_id, workout_plan_id, workout_plan_day_id, started_at, completed_at) values (
  '00000000-0000-4000-8000-000000000321',
  '11111111-1111-4111-8111-111111111111',
  '00000000-0000-4000-8000-000000000301',
  '00000000-0000-4000-8000-000000000311',
  now() - interval '2 days 1 hour',
  now() - interval '2 days'
);

insert into public.workout_sets (session_id, exercise_id, set_number, is_warmup, weight_kg, repetitions, rir) values
  ('00000000-0000-4000-8000-000000000321', '00000000-0000-4000-8000-000000000101', 1, true, 40, 8, 5),
  ('00000000-0000-4000-8000-000000000321', '00000000-0000-4000-8000-000000000101', 2, false, 60, 8, 2),
  ('00000000-0000-4000-8000-000000000321', '00000000-0000-4000-8000-000000000101', 3, false, 60, 7, 2),
  ('00000000-0000-4000-8000-000000000321', '00000000-0000-4000-8000-000000000103', 1, false, 35, 10, 2),
  ('00000000-0000-4000-8000-000000000321', '00000000-0000-4000-8000-000000000103', 2, false, 35, 9, 1),
  ('00000000-0000-4000-8000-000000000321', '00000000-0000-4000-8000-000000000105', 1, false, 40, 10, 2);

-- Comidas de ayer con snapshots calculados desde el catalogo.
insert into public.meals (id, user_id, date, meal_type, name, status) values
  ('00000000-0000-4000-8000-000000000401', '11111111-1111-4111-8111-111111111111', current_date, 'desayuno', 'Avena con banano', 'completada'),
  ('00000000-0000-4000-8000-000000000402', '11111111-1111-4111-8111-111111111111', current_date, 'almuerzo', 'Pollo con arroz y frijoles', 'completada');

-- Snapshots = cantidad x macros por 100 g del catalogo al momento del registro.
insert into public.meal_items (meal_id, food_id, quantity_g, calories_snapshot, protein_snapshot, carbohydrate_snapshot, fat_snapshot, fiber_snapshot) values
  ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000004', 60, 233.4, 10.1, 39.6, 4.1, 6.4),
  ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000010', 120, 106.8, 1.3, 27.6, 0.4, 3.1),
  ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000017', 200, 68.0, 6.8, 10.0, 0.2, 0.0),
  ('00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-000000000001', 150, 247.5, 46.5, 0.0, 5.4, 0.0),
  ('00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-000000000002', 200, 260.0, 5.4, 56.0, 0.6, 0.8),
  ('00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-000000000008', 100, 132.0, 8.9, 24.0, 0.5, 8.7);

-- Recomendacion demo con el formato estructurado del motor (docs/08_AI_ENGINE.md).
insert into public.recommendations (user_id, category, title, explanation, confidence, status, evidence_context) values (
  '11111111-1111-4111-8111-111111111111',
  'progreso',
  'Tu peso promedio semanal baja de forma gradual',
  'Observacion: tu promedio de peso de los ultimos 7 dias bajo unos 0.3 kg frente a la semana anterior. Interpretacion: el ritmo es compatible con una recomposicion sostenible. Accion sugerida: manten tus objetivos actuales. Alternativa: si el descenso se acelera, revisa tus calorias. Reevaluar: en 2 semanas. Esto es una estimacion demostrativa, no un diagnostico.',
  'media',
  'nueva',
  '{"tipo":"demo","ventana_dias":14}'
);
