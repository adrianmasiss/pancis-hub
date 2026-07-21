-- Fotos de alimentos y recetas (Pexels, buscadas una sola vez al crear y
-- guardadas de forma permanente en un bucket propio, sin costo recurrente).

alter table public.foods add column image_url text;

-- image_storage_path nunca se uso en codigo: se reutiliza como image_url en
-- vez de agregar una columna redundante.
alter table public.recipes rename column image_storage_path to image_url;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'food-images',
  'food-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Bucket publico de solo lectura para usuarios autenticados: la escritura la
-- hacen las Server Actions con el cliente admin (service role), que evade RLS.
create policy "food_images_select_all" on storage.objects
  for select to authenticated using (bucket_id = 'food-images');
