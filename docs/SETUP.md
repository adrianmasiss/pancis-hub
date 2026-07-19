# Setup

## Requisitos

- Node.js 20 LTS o superior (probado con Node 26).
- npm.
- Docker Desktop (para Supabase local).
- Supabase CLI (`brew install supabase/tap/supabase`).

## Primer arranque

```bash
git clone <repo>
cd pancis-hub
npm install

# Levantar Supabase local (Docker debe estar corriendo)
supabase start

# Aplicar migraciones + seed
supabase db reset
```

Crear `.env.local` a partir de `.env.example` con los valores que imprime
`supabase status`:

```bash
supabase status -o env | grep -E "API_URL|ANON_KEY|SERVICE_ROLE_KEY"
```

- `NEXT_PUBLIC_SUPABASE_URL` = API_URL (http://127.0.0.1:54321)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = ANON_KEY
- `SUPABASE_SERVICE_ROLE_KEY` = SERVICE_ROLE_KEY
- `NEXT_PUBLIC_SITE_URL` = http://localhost:3000

Arrancar la aplicacion:

```bash
npm run dev
```

## Usuario demo

Con el seed aplicado (solo entorno local):

- Correo: `demo@pancis.local`
- Contrasena: `demo12345`

Los correos del stack local (por ejemplo recuperacion de contrasena) se ven
en Mailpit: http://localhost:54324. Supabase Studio: http://localhost:54323.

## Validaciones

```bash
npm run typecheck
npm run lint
npm run test
npm run build

# RLS contra el stack local
set -a && source .env.local && set +a
node scripts/verify-rls.mjs
```

## Conectar un proyecto cloud (futuro)

```bash
supabase link --project-ref <ref>
supabase db push
```

## Convenciones

- Trabajar en ramas por fase o modulo; merge a main con `--no-ff`.
- Mantener el proyecto ejecutable despues de cada fase.
- Documentar decisiones tecnicas en `docs/DECISIONS.md`.
- Regenerar `src/types/database.ts` tras cambiar el esquema.
- Actualizar documentos cuando cambien reglas de negocio o arquitectura.
