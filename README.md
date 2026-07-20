# Pancis Hub

Pancis Hub es una aplicacion web progresiva para mejorar la composicion corporal mediante nutricion, entrenamiento, educacion y seguimiento personalizado basado en evidencia cientifica.

El objetivo inicial del producto es ayudar a personas hispanohablantes que entrenan fuerza o hipertrofia a conservar o aumentar masa muscular, reducir grasa corporal progresivamente, mejorar adherencia y comprender sus datos sin recurrir a metodos extremos.

> Pancis Hub es una herramienta educativa y de seguimiento. No sustituye la evaluacion, el diagnostico ni el tratamiento de profesionales de la salud.

## Estado del proyecto

**MVP completo (Fases A-E).** Todos los modulos funcionan con datos
reales por usuario:

- **Nucleo**: autenticacion, onboarding de 6 pasos con objetivos
  estimados (Mifflin-St Jeor), dashboard con datos reales.
- **Nutricion**: plan diario, biblioteca de alimentos (favoritos y
  personalizados), motor de equivalencias con formula ponderada
  documentada, recetas con macros desde ingredientes y lista de compras.
- **Entrenamiento**: rutinas por dias, sesion activa, historial con
  mejores marcas y frecuencia muscular, sustitucion de ejercicios.
- **Seguimiento**: mediciones completas + InBody manual con adjunto
  privado, fotos de progreso privadas, tendencias con promedios moviles.
- **Diario inteligente** con deteccion de patrones; **Academia** con
  niveles de evidencia; **Asistente** contextual deterministico (capa de
  abstraccion lista para IA real).
- **PWA instalable** con offline seguro, identidad visual propia,
  108 tests unitarios y suite E2E de Playwright en verde.

Pendiente: despliegue a Vercel + Supabase Cloud (guia en
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)).

## Principios del producto

- Evidencia antes que tendencias.
- Educacion antes que obediencia.
- Personalizacion sin rigidez.
- Privacidad por defecto.
- Progreso sostenible.
- Transparencia.
- Simplicidad operativa.
- Accesibilidad.
- Recomendaciones prudentes.

## Stack objetivo

- Next.js con App Router.
- React.
- TypeScript estricto.
- Tailwind CSS.
- shadcn/ui compatible.
- Lucide Icons.
- React Hook Form.
- Zod.
- Recharts.
- Supabase Auth, PostgreSQL y Storage.
- Row Level Security.
- Vitest, React Testing Library y Playwright.
- PWA instalable con soporte offline limitado y seguro.
- Vercel para despliegue.

## Estructura objetivo

```text
pancis-hub/
├── docs/
├── public/
├── src/
│   ├── app/
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── charts/
│   │   └── shared/
│   ├── features/
│   │   ├── auth/
│   │   ├── onboarding/
│   │   ├── dashboard/
│   │   ├── nutrition/
│   │   ├── foods/
│   │   ├── recipes/
│   │   ├── training/
│   │   ├── progress/
│   │   ├── checkins/
│   │   ├── academy/
│   │   ├── assistant/
│   │   └── settings/
│   ├── hooks/
│   ├── i18n/
│   ├── lib/
│   ├── tests/
│   └── types/
├── supabase/
│   ├── migrations/
│   └── seed.sql
├── .env.example
└── README.md
```

## Documentacion

- [Vision del producto](docs/01_PRODUCT_VISION.md)
- [Requisitos del producto](docs/02_PRODUCT_REQUIREMENTS.md)
- [Personas usuarias](docs/03_USER_PERSONAS.md)
- [Historias de usuario](docs/04_USER_STORIES.md)
- [Arquitectura de informacion](docs/05_INFORMATION_ARCHITECTURE.md)
- [Esquema inicial de base de datos](docs/06_DATABASE_SCHEMA.md)
- [Sistema de diseno](docs/07_DESIGN_SYSTEM.md)
- [Motor de inteligencia](docs/08_AI_ENGINE.md)
- [Roadmap](docs/09_ROADMAP.md)
- [Backlog](docs/10_BACKLOG.md)
- [Arquitectura tecnica](docs/ARCHITECTURE.md)
- [Setup](docs/SETUP.md)
- [Base de datos](docs/DATABASE.md)
- [Seguridad](docs/SECURITY.md)
- [Testing](docs/TESTING.md)
- [Decisiones](docs/DECISIONS.md)
- [Despliegue](docs/DEPLOYMENT.md)

## Requisitos

- Node.js 20 LTS o superior.
- npm como gestor de paquetes.
- Docker Desktop y Supabase CLI para el desarrollo local.
- Cuenta de Supabase y proyecto de Vercel solo para despliegue futuro.

## Variables de entorno

Usa `.env.example` como referencia. No se deben commitear secretos reales.

Variables previstas:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `AI_PROVIDER_API_KEY`, opcional para una futura integracion de IA real detras de la capa de abstraccion del asistente.

## Instalacion

```bash
npm install
supabase start        # requiere Docker corriendo
supabase db reset     # aplica migraciones + seed
npm run dev
```

Crea `.env.local` a partir de `.env.example` con los valores de
`supabase status`. Guia completa en [docs/SETUP.md](docs/SETUP.md).

Usuario demo local: `demo@pancis.local` / `demo12345`.

## Migraciones y seeds

La base vive en `supabase/migrations/` (8 migraciones por dominio con RLS)
y `supabase/seed.sql` (datos ficticios de desarrollo). Detalle en
[docs/DATABASE.md](docs/DATABASE.md).

```bash
supabase db reset     # local: recrea la base desde cero
supabase db push      # cloud: aplica migraciones al proyecto enlazado
```

Los datos de desarrollo son ficticios y el contenido cientifico no
verificado esta marcado como demostrativo o pendiente de verificacion.

## Pruebas

```bash
npm run typecheck
npm run lint
npm run test          # Vitest: calculos nutricionales, schemas, navegacion

# Verificacion de RLS contra el stack local
set -a && source .env.local && set +a
node scripts/verify-rls.mjs
```

```bash
npm run test:e2e      # Playwright: flujo completo (requiere supabase start)
```

Estrategia completa en [docs/TESTING.md](docs/TESTING.md).

## Despliegue

El despliegue objetivo sera Vercel + Supabase.

Antes de produccion se debe verificar:

- Variables de entorno configuradas.
- RLS habilitado en tablas privadas.
- Buckets privados para fotos y archivos.
- Migraciones reproducibles.
- PWA instalable.
- Pruebas criticas aprobadas.

## Fases de desarrollo

1. **Fase A: auditoria y arquitectura.** Reorganizar documentacion, documentar decisiones y preparar estructura base.
2. **Fase B: fundamentos.** Crear Next.js, TypeScript, Tailwind, componentes base, tema, validaciones y herramientas de calidad.
3. **Fase C: datos y autenticacion.** Implementar Supabase, migraciones, RLS, auth, perfil, onboarding y seed.
4. **Fase D: MVP funcional.** Construir dashboard, nutricion, alimentos, equivalencias, entrenamiento, progreso, diario, recetas, academia y asistente.
5. **Fase E: calidad y entrega.** Completar pruebas, accesibilidad, rendimiento, PWA, documentacion final y despliegue.

## Licencia

Trabajo propietario privado salvo que el propietario elija explicitamente otra licencia.
