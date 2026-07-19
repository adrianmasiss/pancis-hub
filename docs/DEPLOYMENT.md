# Despliegue

## Objetivo

Desplegar Pancis Hub en Vercel con Supabase como backend administrado.

## Ambientes

- Desarrollo local.
- Preview por rama o pull request.
- Produccion.

## Vercel

Variables requeridas previstas:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`

Variables opcionales:

- `OPENAI_API_KEY`

## Supabase

Antes de produccion:

- aplicar migraciones;
- habilitar RLS;
- configurar politicas;
- crear buckets privados;
- verificar URLs firmadas;
- ejecutar seed solo en desarrollo o ambientes controlados.

## Checklist pre-produccion

- `npm run typecheck` sin errores criticos.
- `npm run lint` aprobado.
- Pruebas unitarias criticas aprobadas.
- Playwright del flujo minimo aprobado.
- No hay secretos commiteados.
- RLS revisado en tablas privadas.
- PWA instalable.
- Lighthouse y accesibilidad revisados.
- Aviso educativo visible donde corresponda.

## Rollback

El rollback debe usar versiones de Vercel y migraciones reversibles o compensatorias. Las migraciones destructivas requieren plan explicito de respaldo.
