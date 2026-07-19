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

## 2026-07-19 - Buckets privados

`progress-photos` e `inbody-files`, ambos privados, con limite de tamano y validacion MIME, rutas con prefijo `user_id/` y politicas de storage por propietario. Acceso de lectura mediante URLs firmadas de corta duracion.
