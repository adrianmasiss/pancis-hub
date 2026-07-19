-- Buckets privados para fotografias de progreso y archivos InBody.
-- Convencion de ruta: <user_id>/<archivo>; el primer segmento debe ser
-- el uid del propietario. El acceso de lectura en la app usa URLs firmadas.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'progress-photos',
    'progress-photos',
    false,
    10485760, -- 10 MB
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
  ),
  (
    'inbody-files',
    'inbody-files',
    false,
    20971520, -- 20 MB
    array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
  )
on conflict (id) do nothing;

create policy "progress_photos_select_own" on storage.objects
  for select to authenticated using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "progress_photos_insert_own" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "progress_photos_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "progress_photos_delete_own" on storage.objects
  for delete to authenticated using (
    bucket_id = 'progress-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "inbody_files_select_own" on storage.objects
  for select to authenticated using (
    bucket_id = 'inbody-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "inbody_files_insert_own" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'inbody-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "inbody_files_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'inbody-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'inbody-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "inbody_files_delete_own" on storage.objects
  for delete to authenticated using (
    bucket_id = 'inbody-files'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
