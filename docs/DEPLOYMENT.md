# Despliegue

Objetivo: Vercel (aplicacion) + Supabase Cloud (base de datos, auth y
storage). Ambos tienen plan gratuito suficiente para uso personal.

## 1. Supabase Cloud

1. Crear cuenta y proyecto en https://supabase.com (region cercana).
2. Enlazar el repositorio local y aplicar las migraciones:

```bash
supabase login
supabase link --project-ref <ref-del-proyecto>
supabase db push          # aplica supabase/migrations/ en orden
```

3. En el dashboard del proyecto:
   - Authentication → URL Configuration: `Site URL` = URL de produccion
     (https://<app>.vercel.app) y agregarla a `Redirect URLs`.
   - Authentication → Providers → Email: confirmaciones segun preferencia
     (si se activan, configurar plantillas en espanol).
4. NO ejecutar `supabase/seed.sql` en produccion tal cual: el usuario
   demo es solo para desarrollo local. Los catalogos (alimentos,
   ejercicios, articulos) pueden cargarse ejecutando solo esas secciones
   del seed desde el SQL Editor.

## 2. Vercel

1. Crear cuenta en https://vercel.com e importar el repositorio de GitHub
   (`git push` previo de `main`).
2. Variables de entorno del proyecto (Production y Preview):
   - `NEXT_PUBLIC_SUPABASE_URL` → Project URL del dashboard de Supabase.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → anon key.
   - `SUPABASE_SERVICE_ROLE_KEY` → service role key (solo si algun
     proceso del servidor la necesita; jamas llega al cliente).
   - `NEXT_PUBLIC_SITE_URL` → https://<app>.vercel.app
3. Deploy. Vercel detecta Next.js automaticamente (build `next build`).

## 3. Verificacion post-despliegue

- Registro + onboarding completos con una cuenta nueva.
- RLS: dos cuentas distintas no ven datos ajenos.
- Storage: subir foto de progreso y abrirla (URL firmada).
- PWA: instalar desde el navegador del telefono (Agregar a pantalla de
  inicio); `manifest.webmanifest` y `sw.js` responden 200.
- Modo claro/oscuro y responsive.

## Checklist de seguridad previa a produccion

- [ ] RLS habilitado en todas las tablas (las migraciones lo garantizan).
- [ ] Buckets privados; sin politicas publicas de storage.
- [ ] Variables de entorno solo en Vercel/Supabase, nunca commiteadas.
- [ ] Usuario demo NO sembrado en produccion.
- [ ] `Site URL` y `Redirect URLs` correctas en Supabase Auth.
