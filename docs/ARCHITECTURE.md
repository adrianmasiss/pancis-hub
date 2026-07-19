# Arquitectura tecnica

## Objetivo

Definir una base mantenible para construir Pancis Hub como PWA multiusuario, segura y preparada para evolucionar hacia un producto comercial.

## Principios

- Separar UI, logica de negocio, validaciones y acceso a datos.
- Mantener datos personales bajo control de propietario.
- Preferir calculos puros testeables para nutricion, equivalencias, recetas y progreso.
- Evitar decisiones automaticas irreversibles sobre objetivos del usuario.
- Conservar historicos cuando cambien alimentos, objetivos o planes.
- Implementar primero versiones simples, reales y seguras antes de ampliar automatizacion.

## Stack

- Next.js App Router.
- React con TypeScript estricto.
- Tailwind CSS y componentes shadcn/ui compatibles.
- Supabase Auth, PostgreSQL y Storage privado.
- Server Actions o Route Handlers para operaciones sensibles.
- Zod para validacion compartida.
- React Hook Form para formularios.
- Recharts para visualizaciones.
- Vitest, React Testing Library y Playwright.

## Capas

### Presentacion

Componentes visuales reutilizables en `src/components/`. No deben contener consultas complejas ni reglas de negocio extensas.

### Dominio

Cada modulo vive en `src/features/<dominio>/` con sus componentes, acciones, schemas, tipos y utilidades locales.

Dominios iniciales:

- `auth`
- `onboarding`
- `dashboard`
- `nutrition`
- `foods`
- `recipes`
- `training`
- `progress`
- `checkins`
- `academy`
- `assistant`
- `settings`

### Librerias compartidas

`src/lib/` contendra utilidades transversales:

- cliente Supabase de navegador y servidor;
- calculos de macros;
- formula de equivalencias;
- tendencias y promedios moviles;
- sanitizacion y errores;
- helpers de PWA;
- formatos de fecha, unidades e i18n.

### Datos

El acceso a Supabase debe pasar por funciones tipadas. Las mutaciones privadas se ejecutaran en servidor cuando sea necesario para validar propietario y reglas de negocio.

## Autenticacion y autorizacion

- Supabase Auth sera la fuente de identidad.
- Las tablas privadas tendran `user_id` y politicas RLS.
- Las tablas de catalogo podran ser publicas de lectura y restringidas para escritura administrativa.
- La UI nunca debe asumir autorizacion solo por ocultar controles.

## Internacionalizacion

La primera version usara `es-419`. La arquitectura debe dejar textos centralizables, formatos regionales y unidades editables, pero no se implementaran traducciones completas en el MVP.

## PWA y offline

La aplicacion debe ser instalable. El soporte offline sera limitado:

- cache de shell de aplicacion y recursos estaticos;
- lectura de contenido no sensible previamente cacheado;
- estado claro de conexion;
- cola de sincronizacion solo para datos permitidos;
- no almacenar fotografias, mediciones corporales o diarios sensibles en `localStorage`.

## Asistente contextual

El asistente tendra una interfaz y una capa de abstraccion:

- `AssistantProvider` o servicio equivalente;
- proveedor deterministico demo mientras no exista API real;
- prompts o reglas con limites explicitos;
- respuestas con observacion, interpretacion, confianza, accion, alternativa, motivo y reevaluacion;
- ninguna clave expuesta en frontend.

## Observabilidad y auditoria

El MVP debe registrar eventos administrativos y cambios relevantes cuando corresponda en `audit_logs`. Los errores del usuario deben mostrarse sin filtrar detalles internos ni secretos.

## Fases

1. Documentacion y arquitectura.
2. Fundamentos de aplicacion.
3. Supabase, RLS, auth, perfil y onboarding.
4. Modulos MVP.
5. Calidad, PWA, accesibilidad, rendimiento y despliegue.
