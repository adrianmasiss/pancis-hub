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
