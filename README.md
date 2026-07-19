# Pancis Hub

Pancis Hub es una aplicacion web progresiva para mejorar la composicion corporal mediante nutricion, entrenamiento, educacion y seguimiento personalizado basado en evidencia cientifica.

El objetivo inicial del producto es ayudar a personas hispanohablantes que entrenan fuerza o hipertrofia a conservar o aumentar masa muscular, reducir grasa corporal progresivamente, mejorar adherencia y comprender sus datos sin recurrir a metodos extremos.

> Pancis Hub es una herramienta educativa y de seguimiento. No sustituye la evaluacion, el diagnostico ni el tratamiento de profesionales de la salud.

## Estado del proyecto

El repositorio esta en Fase A: auditoria, arquitectura y preparacion documental.

Todavia no contiene la aplicacion Next.js. La implementacion se hara por fases para mantener el proyecto ejecutable y revisable despues de cada cambio importante.

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

Estos requisitos aplicaran a partir de Fase B, cuando se cree la aplicacion:

- Node.js 20 LTS o superior.
- npm como gestor de paquetes.
- Cuenta de Supabase.
- Proyecto de Vercel para despliegue.

## Variables de entorno

Usa `.env.example` como referencia. No se deben commitear secretos reales.

Variables previstas:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `AI_PROVIDER_API_KEY`, opcional para una futura integracion de IA real detras de la capa de abstraccion del asistente.

## Instalacion

La aplicacion aun no esta creada. El flujo esperado para Fase B sera:

```bash
npm install
npm run dev
```

## Migraciones y seeds

La base Supabase vivira en `supabase/migrations/` y `supabase/seed.sql`.

Flujo esperado cuando existan migraciones reales:

```bash
supabase db reset
supabase db push
```

Los datos de desarrollo deben ser ficticios y marcar el contenido cientifico no verificado como demostrativo o pendiente de verificacion.

## Pruebas

La estrategia objetivo incluye:

- Unitarias para calculos, validaciones, equivalencias, recetas, tendencias y permisos.
- Integracion para autenticacion, onboarding, comidas, intercambios, entrenamientos, mediciones y diario.
- End-to-end para el flujo minimo completo de usuario.

Comandos esperados en Fase B/E:

```bash
npm run typecheck
npm run lint
npm run test
npm run test:e2e
```

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
