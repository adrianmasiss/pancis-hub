-- Datos biomecanicos del catalogo de ejercicios
-- (docs/02_PRODUCT_REQUIREMENTS.md 10-12).
--
-- Se guardan los atributos INTRINSECOS del ejercicio (que articulaciones
-- participan, como se comporta la resistencia, cuanta estabilidad exige).
-- Las valoraciones que ve el usuario NO se guardan aqui: se calculan
-- segun su objetivo, experiencia y equipo, porque una misma caracteristica
-- puede ser una ventaja o un inconveniente segun el contexto.

alter table public.exercise_catalog
  -- Articulaciones que participan, ej. {cadera,rodilla,tobillo}.
  add column joints text[] not null default '{}',

  -- Como se comporta la resistencia a lo largo del recorrido:
  --   ascendente  = mas dificil al final (ej. hip thrust en bloqueo)
  --   descendente = mas dificil al inicio (ej. dominadas desde muerto)
  --   constante   = pareja en todo el rango (ej. poleas)
  --   en_campana  = maxima a mitad de recorrido (ej. curl de biceps)
  add column resistance_profile text check (
    resistance_profile in ('ascendente', 'descendente', 'constante', 'en_campana')
  ),

  -- Punto del recorrido donde el ejercicio se vuelve mas dificil.
  add column hardest_point text,

  -- Escalas 1-10. Son orientativas y describen al ejercicio en si, no a
  -- una persona: la anatomia y la experiencia individual pueden cambiar
  -- la respuesta real.
  add column stability smallint check (stability between 1 and 10),
  add column range_of_motion smallint check (range_of_motion between 1 and 10),
  add column technical_demand smallint check (technical_demand between 1 and 10),
  add column systemic_fatigue smallint check (systemic_fatigue between 1 and 10),
  add column progression_ease smallint check (progression_ease between 1 and 10),

  -- Un ejercicio unilateral permite corregir asimetrias pero duplica el
  -- tiempo de la serie: afecta a las recomendaciones de volumen.
  add column is_unilateral boolean not null default false,

  add column common_errors text[] not null default '{}',
  add column technique_cues text[] not null default '{}',
  add column setup_notes text,
  add column execution_notes text,
  add column image_url text;

comment on column public.exercise_catalog.stability is
  'Cuanto sostiene la carga el entorno (maquina) frente al propio cuerpo. 10 = muy estable.';
comment on column public.exercise_catalog.systemic_fatigue is
  'Fatiga que deja para el resto de la sesion y de la semana. 10 = muy demandante.';

-- Datos biomecanicos del catalogo base. Son descripciones orientativas y
-- generales, no verdades universales: la estructura individual, la
-- movilidad y la tecnica modifican la respuesta de cada persona.

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
