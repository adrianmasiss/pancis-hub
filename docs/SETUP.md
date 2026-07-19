# Setup

## Estado actual

El repositorio esta preparado documentalmente. La aplicacion Next.js se creara en Fase B.

## Requisitos previstos

- Node.js 20 LTS o superior.
- Gestor de paquetes definido en `package.json` cuando exista.
- Supabase CLI para desarrollo local de base de datos.
- Cuenta de Supabase.
- Cuenta de Vercel.

## Variables de entorno

Crear un archivo `.env.local` basado en `.env.example`.

No commitear `.env.local` ni secretos reales.

## Flujo previsto de desarrollo

Cuando exista la aplicacion:

```bash
npm install
npm run dev
```

Validaciones esperadas:

```bash
npm run typecheck
npm run lint
npm run test
```

## Supabase local

Cuando existan migraciones reales:

```bash
supabase start
supabase db reset
```

## Convenciones

- Trabajar en ramas por fase o modulo.
- Mantener el proyecto ejecutable despues de cada fase.
- Documentar decisiones tecnicas en `docs/DECISIONS.md`.
- Actualizar documentos cuando cambien reglas de negocio o arquitectura.
