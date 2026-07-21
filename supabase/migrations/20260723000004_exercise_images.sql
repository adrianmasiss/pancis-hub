-- Imagenes de ejercicios (docs/02_PRODUCT_REQUIREMENTS.md 10 y 21).
--
-- Fuente: free-exercise-db (https://github.com/yuhonas/free-exercise-db),
-- dominio publico (Unlicense), sin clave ni atribucion obligatoria.
--
-- Se descartaron las fotos de stock genericas: buscar "Plancha" en un
-- banco de imagenes devuelve ensalada de papa, y "Prensa de pierna"
-- devuelve aceite de CBD. Una foto que no corresponde al ejercicio
-- desinforma sobre la tecnica, que es justo lo contrario de lo que busca
-- el modulo de biomecanica.
--
-- Cada ejercicio guarda DOS imagenes: posicion inicial y posicion final.
-- Juntas comunican el movimiento, que una sola foto no logra.

alter table public.exercise_catalog
  add column image_end_url text;

comment on column public.exercise_catalog.image_url is
  'Posicion inicial del movimiento.';
comment on column public.exercise_catalog.image_end_url is
  'Posicion final del movimiento.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'exercise-images',
  'exercise-images',
  true,
  2097152, -- 2 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Bucket publico de solo lectura para usuarios autenticados; la escritura
-- la hace el script de importacion con el service role.
create policy "exercise_images_select_all" on storage.objects
  for select to authenticated using (bucket_id = 'exercise-images');
