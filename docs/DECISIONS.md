# Decisiones tecnicas

## 2026-07-19 - Documentacion como fuente de verdad

La documentacion existente en raiz se mueve a `docs/` porque el README ya declara esa estructura. No se elimina contenido valido.

## 2026-07-19 - Implementacion por fases

El alcance completo del prompt excede un cambio unico seguro. El proyecto se construira por fases: arquitectura, fundamentos, datos/auth, modulos MVP y calidad.

## 2026-07-19 - Supabase como backend oficial

Se adopta Supabase para Auth, PostgreSQL, Storage y Row Level Security porque coincide con los requisitos del producto y cubre el modelo multiusuario.

## 2026-07-19 - Offline limitado por privacidad

La PWA no almacenara datos corporales sensibles sin proteccion en `localStorage`. El soporte offline priorizara shell de aplicacion, contenido no sensible y sincronizacion controlada.

## 2026-07-19 - Asistente deterministico inicial

Mientras no exista una API de IA configurada, el asistente usara reglas deterministicas y respuestas demo claramente identificadas. Las claves reales nunca se expondran en frontend.

## 2026-07-19 - Evidencia cientifica

No se inventaran estudios, autores, DOI ni citas. Cuando una referencia no este verificada se usara el placeholder `Referencia pendiente de verificacion.`.

## 2026-07-19 - npm como gestor de paquetes

Se fija npm porque ya esta instalado en el entorno de desarrollo y Vercel lo soporta de forma nativa. No se usara pnpm ni bun.

## 2026-07-19 - Tailwind CSS v4

Se adopta la version que genera `create-next-app@latest` (v4, tokens CSS en `globals.css`). shadcn/ui la soporta. No se hara downgrade a v3.

## 2026-07-19 - Supabase local con CLI

El desarrollo usa Supabase CLI + Docker en local, sin proyecto cloud. Las migraciones quedan preparadas para `supabase link` y `supabase db push` cuando exista un proyecto remoto.

## 2026-07-19 - Tema con next-themes

Modo claro/oscuro/sistema con `next-themes` (`attribute="class"`, default `system`, persistencia en localStorage). El fondo oscuro no sera negro puro. Se respetara `prefers-reduced-motion`.

## 2026-07-19 - Auth SSR con @supabase/ssr

Se usa `@supabase/ssr` (clientes de navegador y servidor + middleware de sesion). `auth-helpers` esta deprecada y no se usara.

## 2026-07-19 - i18n con modulo TypeScript plano

Los textos viven en `src/i18n/es-419.ts` como objeto tipado, sin libreria de i18n. El tipado estricto da autocompletado y la estructura por claves permite migrar a una libreria (por ejemplo next-intl) sin reescribir componentes.

## 2026-07-19 - Migraciones por dominio

Siete migraciones ordenadas por dominio (helpers, identidad, catalogos, nutricion, entrenamiento, progreso/diario, storage) en lugar de una migracion gigante o una por tabla. Respeta dependencias de claves foraneas y facilita revision.

## 2026-07-19 - Sin tabla de roles en el MVP

Los catalogos (`foods`, `food_portions`, `exercise_catalog`, `articles`, `article_references`) son de solo lectura para usuarios autenticados; la escritura se hace con service role (seed o procesos administrativos). Se crea un helper `is_admin()` que lee `app_metadata.role` del JWT para habilitar un rol admin futuro sin migrar datos.

## 2026-07-19 - Enums como text + CHECK

Los valores enumerados se modelan como `text` con constraint `CHECK` en SQL, espejados por enums Zod en la aplicacion. Los enums nativos de PostgreSQL complican las migraciones.

## 2026-07-19 - Politica de soft delete

Soft delete (`deleted_at`) en `foods`, `recipes`, `workout_plans`, `articles` y `meals`, porque otros registros historicos los referencian. Delete duro en datos correctivos del propio usuario (`meal_items`, `workout_sets`, `body_measurements`, `daily_checkins`, `progress_photos` con borrado del objeto en Storage). `nutrition_targets` nunca se borra: se archiva con `status`.

## 2026-07-19 - Calculo inicial de objetivos nutricionales

BMR con Mifflin-St Jeor, TDEE con factores de actividad 1.2 a 1.725, ajuste por objetivo (perdida de grasa -15 %, recomposicion -5 %, ganancia +10 %). Proteina 1.8 g/kg, grasa minima 0.8 g/kg, resto carbohidratos; fibra 14 g por 1000 kcal; agua 35 ml/kg. Piso de seguridad: nunca por debajo de BMR x 1.1. El resultado se guarda con `source = 'estimacion_inicial'` y se presenta siempre como estimacion editable, nunca como valor exacto.

## 2026-07-19 - Playwright diferido a Fase E

En Fases B y C solo se usa Vitest + React Testing Library. Playwright y los flujos end-to-end se agregan en la fase de calidad, cuando exista el MVP completo que probar.

## 2026-07-19 - proxy.ts en lugar de middleware.ts

Next.js 16 renombro la convencion `middleware` a `proxy`. La proteccion de
rutas y el refresco de sesion viven en `src/proxy.ts` + `src/lib/supabase/proxy.ts`.
El gate de onboarding se resuelve en layouts de servidor para no consultar
la base de datos en cada request del proxy.

## 2026-07-19 - GRANT explicitos ademas de RLS

El stack local no otorga por defecto privilegios de datos a `authenticated`.
La migracion `20260719120008_grants.sql` concede `select/insert/update/delete`
sobre `public` a `authenticated` (y todo a `service_role`), incluyendo
default privileges para tablas futuras. `anon` no recibe privilegios: la
autorizacion fila a fila sigue siendo responsabilidad de RLS.

## 2026-07-19 - Numeros de formulario con setValueAs

Los inputs numericos se registran en react-hook-form con
`setValueAs: toOptionalNumber` (src/lib/forms.ts): cadena vacia pasa a
`undefined` antes de validar. Se evito `z.preprocess`, que rompe la
inferencia de tipos entre react-hook-form y zodResolver.

## 2026-07-19 - Usuario demo sembrado en auth.users

El seed inserta el usuario demo directamente en `auth.users` con los campos
de token como cadena vacia (GoTrue falla con NULL). Es un patron valido solo
para el stack local; en cloud los usuarios se crean via Auth API.

## 2026-07-19 - Formula del motor de equivalencias

Puntaje de similitud (menor = mas similar), implementado en
`src/features/foods/lib/equivalence.ts`:

```
score = 1  x |dif calorias (kcal)|
      + 10 x |dif proteina (g)|
      + 4  x |dif carbohidratos (g)|
      + 6  x |dif grasas (g)|
      + 2  x |dif fibra (g)|
      + 120 si el grupo alimentario es distinto
      + 15  si el estado crudo/cocido es distinto
      - 12  si la alternativa es favorita del usuario
      - 6   si la alternativa fue usada recientemente
```

La cantidad sugerida iguala el "macro ancla" del grupo del alimento
original (carbohidratos para carbohidratos/frutas/legumbres, proteina
para proteinas, grasas para grasas, calorias para el resto), redondeada
a multiplos de 5 g y acotada a 5-1500 g. Si la alternativa casi no
aporta el macro ancla, se iguala por calorias. Las alergias,
restricciones y alimentos no deseados declarados se excluyen por
coincidencia de nombre (conservador y visible). Los intercambios se
presentan siempre como aproximaciones con sus diferencias visibles,
nunca como equivalencias exactas.

## 2026-07-19 - Service worker conservador

El SW nunca cachea peticiones a Supabase ni datos personales: red
primero con fallback a /offline en navegaciones y cache primero solo
para estaticos inmutables (_next/static, iconos, logos). Se registra
solo en produccion. Cumple el principio de no exponer datos corporales
sensibles en caches del navegador.

## 2026-07-19 - Fechas por defecto en cliente con zona local

`toISOString().slice(0,10)` da la fecha UTC y cerca de medianoche es
"manana" local (bug encontrado por la suite E2E). Todo valor por defecto
de fecha en formularios cliente usa `todayLocalISO()` (src/lib/dates.ts).

## 2026-07-19 - Buckets privados

`progress-photos` e `inbody-files`, ambos privados, con limite de tamano y validacion MIME, rutas con prefijo `user_id/` y politicas de storage por propietario. Acceso de lectura mediante URLs firmadas de corta duracion.

## 2026-07-21 - Proveedores externos de alimentos: solo gratuitos

Se integran USDA FoodData Central (clave gratuita) y Open Food Facts
(sin clave). Edamam queda descartado pese a aparecer en el prompt
original: su plan util es de pago y el proyecto solo usa servicios
gratuitos.

Reglas de la integracion:

- **Todo por 100 g.** Cada proveedor normaliza a `NormalizedFood` antes
  de tocar la app; ningun modulo conoce la forma cruda de una respuesta.
  Coincide con la unidad del catalogo local.
- **Local primero.** La busqueda externa complementa al catalogo, nunca
  lo reemplaza. Cachea en `external_food_cache` (TTL 7 dias) porque las
  APIs gratuitas tienen limites de uso; nunca se cachea una respuesta
  vacia, para no congelar el resultado de un fallo.
- **Catalogo compartido.** Lo importado entra con `owner_user_id` null y
  un indice unico `(external_source, external_id)`: la deduplicacion es
  global y nadie reimporta lo que otro ya trajo. La escritura la hace el
  cliente service role, igual que las imagenes.
- **El cliente no manda macros.** `importExternalFood` recibe solo
  `(source, externalId)` y vuelve a pedir el dato al proveedor. Un
  usuario puede decir "importa el fdcId 12345", nunca "importa esto con
  estos valores": el catalogo compartido no se puede envenenar.
- **Importado != verificado.** Nada externo se marca `verified`; la UI
  lo muestra como fuente externa sin revisar.
- **Clasificacion por palabras completas.** El grupo alimentario se
  infiere de categoria y nombre y, si no alcanza, del macro dominante.
  La comparacion es por token y no por subcadena: con subcadenas, "res"
  coincidia dentro de "preserves" y clasificaba Nutella como proteina.
- **Deduplicacion en dos pasadas.** Primero por codigo de barras o
  nombre+marca; despues se colapsan las presentaciones distintas del
  mismo producto (mismo nombre, marca y macros), porque cada envase
  tiene su propio codigo y el catalogo solo guarda valores por 100 g.
- **Degradacion silenciosa.** Timeout de 8 s, 429 y respuestas no JSON
  devuelven vacio y quedan registradas: la busqueda local nunca se cae
  por un proveedor externo.

## 2026-07-21 - Compatibilidad 0-10, reajuste del dia y comidas modificadas

**Puntuacion de compatibilidad.** Cada sustitucion muestra una nota 0-10
global y por macro. Por macro se mide el error relativo contra el aporte
original, con un piso por macro (40 kcal, 5 g de proteina, 5 g de
carbohidratos, 3 g de grasa, 2 g de fibra) para no castigar diferencias
irrelevantes: sin ese piso, pasar de 1 g a 2 g de fibra contaria como un
100 % de error. La nota global es el promedio ponderado (proteina 0.35,
calorias 0.25, carbohidratos 0.15, grasas 0.15, fibra 0.10) menos
penalizaciones por cambiar de grupo (1.5) o mezclar crudo con cocido
(0.5), acotada a 0-10.

La nota es independiente del `score` de ordenamiento (distancia
ponderada): ese sigue decidiendo el orden y esta es solo para leerse. La
UI siempre la acompana de la advertencia de que es una aproximacion
orientativa y no una equivalencia exacta.

**Reajuste del dia.** Tras aceptar una sustitucion se calcula lo que
resta del objetivo y se redactan sugerencias priorizadas sobre las
comidas AUN pendientes. Umbrales para no generar ruido: media a partir
de 100 kcal / 10 g de proteina / 15 g de carbohidratos / 8 g de grasa /
6 g de fibra, y alta al 2.5x de eso. A igual severidad manda la
proteina. Si no hay desviaciones se dice explicitamente que el dia
cuadra, porque el silencio no comunica lo mismo. El motor NUNCA modifica
otra comida: solo describe. La hoja de intercambio deja de cerrarse al
confirmar para que el usuario vea como quedo el dia.

**Comidas completadas con cambios.** Nuevo estado
`completada_con_cambios` con su `modified_reason`. Suma al consumo igual
que `completada` (la agregacion solo excluye `omitida`), pero deja
registro de que el dia se desvio del plan. Solo se aplica a comidas ya
completadas: sustituir algo en una comida planificada no la completa
sola. El plan original nunca se sobrescribe.

## 2026-07-21 - Composicion corporal longitudinal (InBody)

Cada medicion se compara contra la anterior y contra la linea base, con
deltas y porcentaje de cambio acumulado.

- **Masa grasa y masa magra derivadas.** Se calculan desde el peso y el
  porcentaje de grasa (grasa_kg = peso x %grasa / 100). Es la lectura que
  hace util un InBody: el peso solo no distingue perder grasa de perder
  musculo.
- **Umbral de ruido por metrica** (0.3 kg de peso, 0.4 % de grasa, 0.5 de
  grasa visceral, 0.5 cm de cintura...). Por debajo de eso el cambio se
  declara estable: la bioimpedancia y la cinta metrica tienen error, y
  presentarlo como progreso seria falsa precision.
- **Solo se califica lo inequivoco.** Bajar grasa, grasa visceral o
  cintura es favorable; subir musculo o masa magra es favorable. El PESO
  depende del objetivo del usuario (perdida_grasa vs ganancia_muscular) y
  en recomposicion o mantenimiento queda neutro, porque por si solo no
  dice nada. El agua corporal siempre es neutra: depende de hidratacion,
  sodio y hora del dia.
- **Una medicion no es una tendencia.** Con un solo registro no se emite
  ninguna comparacion ni conclusion; se dice explicitamente que hace
  falta la siguiente.
- **Recomposicion.** Bajar masa grasa y subir musculo a la vez se
  destaca, exigiendo que AMBOS cambios superen su umbral de ruido para no
  anunciarla por decimas.

## 2026-07-21 - Biomecanica: atributos guardados, valoraciones calculadas

El catalogo guarda los atributos INTRINSECOS del ejercicio (articulaciones,
perfil de resistencia, punto mas dificil, estabilidad, rango, demanda
tecnica, fatiga sistemica, facilidad de progresion, errores comunes y
recomendaciones tecnicas, todo en escalas 1-10 donde aplica).

Las valoraciones que ve el usuario NO se guardan: se calculan segun su
objetivo, experiencia y la posicion del ejercicio en la sesion. La misma
caracteristica cambia de signo segun el contexto:

- Un ejercicio inestable penaliza a un principiante (el esfuerzo se va en
  estabilizar) y apenas afecta a un avanzado.
- Una maquina muy estable pero dificil de progresar rinde mas para
  resistencia que para fuerza.
- Un ejercicio muy fatigante colocado en la posicion 4 o posterior se
  penaliza: se llega cansado y la calidad de las series baja.

**Ninguna puntuacion se muestra sin motivo.** Cada valoracion incluye la
razon por la que salio ese numero, y la UI aclara que son orientativas y
que la anatomia y la movilidad individuales pueden cambiar la respuesta.

**Las sustituciones se explican, no se listan.** compareExercises()
redacta en que se parecen dos ejercicios, que se gana, que cambia y que
se pierde, con una compatibilidad 0-10 donde lo que mas pesa es compartir
musculo principal y patron. Si el musculo principal cambia, se dice
explicitamente que no es un sustituto.

Se elimino rankExerciseAlternatives (lib/alternatives.ts), que ordenaba
sin explicar: mantener dos motores de sustitucion competiendo habria sido
deuda tecnica inmediata.

## 2026-07-21 - Prescripcion y analisis de rutina

**Prescripcion (requisito 13).** El requisito prohibe explicitamente
repetir un esquema fijo tipo "4x12 para todo", asi que el esquema se
deriva de: si el ejercicio es compuesto o de aislamiento (deducido de
articulaciones y fatiga, no de una lista de nombres), el objetivo, la
experiencia, la demanda tecnica, la posicion en la sesion, la fatiga
sistemica y el volumen semanal que ya acumula ese musculo.

Efectos concretos: un principiante recibe mas RIR y menos series (la
tecnica se degrada antes que el musculo); un ejercicio tecnico exige mas
descanso y no llegar al fallo; a partir de la posicion 4 se recorta una
serie; un musculo con ~20 series semanales deja de sumar. Los unilaterales
avisan de que las series son POR LADO.

La prescripcion se muestra APARTE con sus motivos y no modifica la rutina:
aplicarla es siempre decision del usuario.

**Analisis de rutina (requisito 14).** Volumen semanal por musculo
(contando secundarios a la mitad, porque el estimulo es parcial),
frecuencia, patrones cubiertos y ausentes, redundancia por dia, orden
(ejercicios muy fatigantes al final) y ejercicios sin prescripcion.

Los hallazgos se clasifican en alta / mejora / opcional / observacion /
sin cambios, y siempre explican por que se emiten. Las referencias de
volumen (~6 series semanales como piso, ~22 como techo) son orientaciones
generales, no limites exactos, y el texto lo dice. Si no hay nada que
corregir se afirma explicitamente: el silencio no comunica lo mismo.

## 2026-07-21 - Historial de cambios y bienestar diario

**Historial (requisito 22).** Se completa audit_logs con
previous_values, new_values, reason y origin (usuario / ia / sistema /
importacion) en vez de crear una tabla paralela.

La asimetria de permisos es deliberada: el usuario puede LEER su propio
historial (policy por actor_user_id), pero la escritura no tiene policy y
solo ocurre con el cliente service role desde Server Actions. Si el
navegador pudiera insertar, el historial dejaria de ser un registro
confiable de lo que realmente paso.

recordChange() nunca lanza: un fallo registrando el historial no puede
tumbar la accion que lo origino. Se registra en consola y se sigue. Los
valores previos se leen ANTES de actualizar, porque despues del update ya
no existen. Nada se borra automaticamente.

Registrado hoy: sustitucion de alimento, cambio de estado de comida y
sustitucion de ejercicio.

**Bienestar diario (requisito 19).** El sueno, el estres, la energia, el
dolor muscular y el animo vuelven tras retirarse el modulo "diario", pero
ahora viven DENTRO de /progreso en vez de en una seccion propia: son parte
de como se lee el progreso junto a las mediciones, no un diario aparte.
Un registro por dia (indice unico user_id+date, upsert), con la fecha
local del usuario y no UTC.

## 2026-07-21 - El asistente usa los motores, no los reemplaza

El asistente conocia la dieta y los alimentos, pero no el entrenamiento
ni como quedaba el dia. Ahora recibe el resultado de los motores
deterministas ya calculados: alternativas de alimentos, alternativas de
ejercicio (`rankComparisons`), esquema sugerido (`recommendPrescription`)
y el analisis de la rutina activa (`analyzeRoutine`).

**Los motores mandan sobre el modelo.** Los numeros se calculan siempre
en codigo y se le pasan a Gemini ya resueltos, con instruccion explicita
de citarlos tal cual y no recalcular. Asi el asistente y las pantallas
nunca se contradicen: el 8.2/10 que dice el chat es el mismo que muestra
la hoja de sustitucion.

Al verificar en navegador aparecio que la ruta de Gemini (la que se usa
cuando hay clave) recibia solo `foodAlternatives`: los motores nuevos
alimentaban unicamente al proveedor deterministico de respaldo, que en
produccion casi nunca corre. Corregido pasando todo por ambas rutas.

**Busqueda tolerante de ejercicios.** Lo que el usuario escribe no coincide
literal con el catalogo ("cuantas series de sentadilla hago" deja
"sentadilla hago"). `findCatalogExercise` prueba la frase completa y va
soltando palabras del final hasta encontrar coincidencia.

**Acceso desde cualquier pantalla** (requisito 15) mediante boton
flotante, oculto en la propia pagina del asistente y por encima de la
barra inferior en movil.

## 2026-07-21 - Imagenes de ejercicios: free-exercise-db, no fotos de stock

Se descarto el banco de fotos generico que ya se usa para alimentos. Las
pruebas contra la API real fueron concluyentes: buscar "Plancha" devuelve
ensalada de papa y "Prensa de pierna" devuelve aceite de CBD, porque el
indice esta en ingles y varios nombres en espanol son ambiguos. Traducir
las consultas mejora poco: devuelve gimnasios genericos que no muestran
el movimiento.

Para un modulo de biomecanica una imagen que no corresponde al ejercicio
DESINFORMA sobre la tecnica, que es lo contrario de lo que se busca. Una
foto bonita pero equivocada es peor que ninguna foto.

Fuente elegida: free-exercise-db (github.com/yuhonas/free-exercise-db),
dominio publico (Unlicense), sin clave ni cuota, con 873 ejercicios y dos
imagenes por ejercicio. Se guardan AMBAS (posicion inicial y final):
juntas comunican el movimiento, que una sola foto no logra.

El mapeo nombre-en-espanol -> ejercicio-de-la-fuente es explicito en
scripts/import-exercise-images.mjs. Una coincidencia difusa acabaria
asignando la imagen equivocada; si un ejercicio nuevo no esta en el mapa
se reporta y se omite, nunca se adivina. Las imagenes se copian al bucket
propio exercise-images para no depender de que GitHub siga sirviendolas.

## 2026-07-21 - Emparejamiento de alimentos al importar dietas

El importador de dietas con IA tomaba la primera palabra del alimento y
hacia `ilike`, quedandose con el primer resultado. Fallaba con plurales
("Claras" no encontraba "Clara de huevo") y con acentos ("atún" no
encontraba "Atun en agua"), y cada fallo creaba un alimento personalizado
duplicado. En produccion habia 3 duplicados asi, uno de ellos con macros
identicos al del catalogo.

Ahora se traen los candidatos una vez y se puntuan en memoria
(`pickBestMatch`): nombres normalizados sin acentos, singularizados y
comparados por PALABRAS compartidas (Jaccard), no por prefijo. Comparar
por palabras evita que "Huevo" empareje con "Huevos revueltos con jamon".

El umbral (0.5) es deliberadamente alto y ante la duda no se sugiere
nada: una sugerencia equivocada se registra sin que el usuario lo note,
que es peor que pedirle que elija.

**Fusion de duplicados existentes** con scripts/merge-duplicate-foods.mjs:
repunta comidas, plantillas y recetas al alimento del catalogo, marca el
duplicado con soft delete y lo registra en audit_logs con origen
"sistema". No toca los snapshots ya registrados (requisito 22) ni fusiona
entradas del catalogo entre si: "Arroz blanco" crudo y cocido son
distintas a proposito, y ante esa ambiguedad no fusiona nada. Simula por
defecto; solo escribe con --apply.

**Nota sobre archivos .env:** las credenciales de produccion para scripts
viven en `.env.scripts`, NO en `.env.production.local`. Ese nombre lo
carga Next.js automaticamente al construir en modo produccion, y hacia
que la app local apuntara a la base de la nube con la clave anon local
("Invalid API key"), rompiendo la suite e2e.

## 2026-07-22 - Horarios de comida

`meals` y `diet_template_meals` guardan `scheduled_time`. Se usa `time` y
no `timestamptz` porque es una hora del dia recurrente ("07:30 cada dia"),
no un instante: con zona horaria se desplazaria al viajar o con el horario
de verano.

**El horario manda sobre el tipo de comida** al ordenar el dia. La
etiqueta no alcanza: con dos o tres snacks, "snack" no dice cual va antes.
Las comidas sin hora conservan el orden por tipo.

**Sin hora se ordena al FINAL, no al principio.** Sin horario no se puede
afirmar que una comida ocurra primero, y colocarla arriba desordenaria un
dia bien planificado. El campo es opcional a proposito: registrar una
comida rapida sin pensar en la hora sigue siendo valido.

## 2026-07-22 - Correcciones de alimentos por usuario

Los alimentos importados entran al catalogo COMPARTIDO, asi que un
usuario no puede editarlos: cambiarlos afectaria a todos. Pero los datos
comunitarios de Open Food Facts a veces vienen mal, y quedarse con un dato
equivocado sin poder tocarlo se siente como un defecto de la aplicacion.

`food_user_corrections` es una capa POR USUARIO que se superpone al leer,
sin alterar el dato original (el requisito 7.5 lo pide explicitamente).

- **Solo se guardan los campos corregidos.** Los que quedan en null
  heredan el catalogo, asi que si la fuente arregla su dato mas adelante
  el usuario se beneficia en todo lo que no haya tocado. Por eso los
  campos del formulario arrancan vacios, mostrando debajo el valor del
  catalogo como referencia.
- **null significa "no lo toque", no "borralo".** Distinguirlo importa
  para el estado crudo/cocido y para poder corregir un macro a 0, que es
  un valor legitimo.
- **Se registra el valor corregido, no el del catalogo.** Al agregar un
  alimento a una comida o al aceptar una sustitucion, el snapshot toma la
  correccion: registrar algo distinto de lo que el usuario ve seria
  incoherente. Los snapshots ya guardados no cambian nunca.
- Una sola correccion por alimento y usuario: se edita, no se acumula. Se
  puede quitar para volver al dato del catalogo.

## 2026-07-22 - Escaneo de codigo de barras sin dependencias

Se usa `BarcodeDetector`, la API nativa del navegador, en vez de una
libreria de terceros: no agrega peso al bundle y no hay que mantenerla.

**La entrada manual del codigo esta SIEMPRE disponible**, no como plan B
escondido. BarcodeDetector no existe en todos los navegadores (Safari es
el caso notable), y sin la alternativa manual la funcion seria inutil
justo en iPhone. Se detecta el soporte y se explica en pantalla en vez de
mostrar una camara que nunca va a funcionar.

**El digito verificador se valida antes de consultar.** EAN-13, EAN-8 y
UPC-A lo llevan calculado desde los demas digitos. Comprobarlo evita
gastar peticiones de Open Food Facts en lecturas erroneas y, sobre todo,
distingue "el escaner leyo mal" de "el producto no esta en la base", que
para el usuario son problemas muy distintos. Los formatos sin verificador
estandar se aceptan por longitud: rechazar lo que no sabemos validar
seria peor que consultarlo.

Un UPC-A de 12 digitos se normaliza a EAN-13 con un cero delante, que es
la forma que indexa Open Food Facts.

La camara se apaga al cerrar el dialogo y tambien si el componente
desaparece sin cerrarse: dejarla encendida seria un fallo grave.

## 2026-07-22 - Sustituir una comida completa por una receta

Cambiar toda la comida no es lo mismo que cambiar un alimento: hay que
decidir CUANTAS porciones de la receta se acercan a lo planificado.

`suggestServings` ancla en CALORIAS, no en un macro concreto. Una comida
completa mezcla fuentes, asi que ningun macro representa su papel del
modo en que la proteina representa a un filete. Se redondea a medias
porciones (un cuarto de receta rara vez es practico) dentro de un rango
de 0.5 a 4.

La compatibilidad usa el MISMO motor que los intercambios de alimento,
para que un 8/10 signifique lo mismo en las dos pantallas. No se aplican
las penalizaciones por grupo alimentario ni por crudo/cocido: una receta
no pertenece a un grupo ni tiene un estado unico.

Las correcciones del usuario tambien valen dentro de una receta: los
macros por porcion se calculan con los valores corregidos, no con los del
catalogo.

Solo se toca la comida registrada del dia; el plan original no cambia. Si
la comida ya estaba completada pasa a "completada con cambios", igual que
al sustituir un alimento suelto.

**Gotcha de UI:** el disparador debe ir dentro de `SheetTrigger`. Abrir la
hoja con `setOpen(true)` desde un boton externo NO pasa por
`onOpenChange`, asi que la carga de datos nunca se dispara y la hoja sale
vacia. Lo encontro la prueba e2e.

## 2026-07-22 - Versionado de dietas: snapshot inmutable

El historial ya registraba QUE cambio, pero no permitia volver atras.

**Modelo: foto completa en jsonb, no filas versionadas.** La plantilla
viva sigue siendo la que se edita a diario, sin columnas de version que
compliquen cada consulta del modulo. Versionar fila por fila con validez
temporal obligaria a filtrar por version en todas partes, a cambio de una
flexibilidad que aqui no se necesita.

**La foto guarda nombres y macros del momento**, no solo identificadores.
Si un alimento se elimina del catalogo o cambia sus valores, la version
sigue describiendo fielmente lo que el plan decia entonces.

**Sin UPDATE ni DELETE en la tabla de versiones.** Una version editable o
borrable deja de servir como respaldo de lo que hubo.

**Restaurar nunca destruye.** Antes de sobrescribir se guarda una version
del estado actual, y el estado restaurado tambien se versiona. Sin esta
segunda parte, la version mas reciente seria el respaldo previo y la
pagina reportaria "cambios sin guardar" justo despues de restaurar: lo
encontro la prueba e2e.

Las versiones identicas a la anterior se rechazan: solo ensuciarian el
historial.

Nota de pruebas: crear una dieta pasa por el flujo de IA (subir un PDF),
inviable en e2e, asi que la prueba la siembra con el rol de servicio
contra la base local (e2e/helpers/seed.ts). Nunca se usa con produccion.

## 2026-07-22 - Versionado de rutinas y componente comun

Las rutinas usan el mismo modelo que las dietas: foto inmutable en jsonb,
restaurar guarda el estado previo Y versiona el resultado, y no se
aceptan versiones identicas a la anterior.

Lo que cambia es el diff: en una rutina no interesa tanto la cantidad en
gramos como la PRESCRIPCION. Se comparan series, rango de repeticiones,
RIR y descanso campo por campo, y el texto dice "Sentadilla en Pierna:
series 3 -> 5". Un valor que pasa a estar vacio se muestra como guion, no
como cero: no son lo mismo.

La lista de versiones se extrajo a `components/shared/versions-card.tsx`
porque el comportamiento es identico en los dos modulos; solo cambian los
textos y de donde salen los datos. Cada dominio resume sus versiones y
redacta sus cambios pendientes, y el componente comun se encarga del
guardado, la confirmacion y la restauracion.
