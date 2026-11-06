-- Recordatorios push desde la propia base (nov 2026). Antes los disparaba
-- GitHub Actions cada «15 min», pero GitHub corria la tarea cada 5-7 horas
-- y la ruta solo mira los ultimos 20 min: casi todos los avisos se perdian.
-- pg_cron (gratis en Supabase) llama a la ruta cada 15 min puntual.
--
-- La URL de la app y el CRON_SECRET viven en Vault, no en el repositorio:
--   select vault.create_secret('https://…', 'recordatorios_url');
--   select vault.create_secret('<CRON_SECRET>', 'cron_secret');
-- Sin ellos (p. ej. en local) la tarea no hace nada.

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

create schema if not exists private;

create or replace function private.enviar_recordatorios()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  url text;
  secreto text;
begin
  select decrypted_secret into url
    from vault.decrypted_secrets where name = 'recordatorios_url';
  select decrypted_secret into secreto
    from vault.decrypted_secrets where name = 'cron_secret';
  if url is null or secreto is null then
    return;
  end if;
  perform net.http_get(
    url := url || '/api/cron/recordatorios',
    headers := jsonb_build_object('Authorization', 'Bearer ' || secreto),
    timeout_milliseconds := 60000
  );
end;
$$;

revoke all on function private.enviar_recordatorios() from public, anon, authenticated;

select cron.schedule(
  'recordatorios',
  '*/15 * * * *',
  'select private.enviar_recordatorios()'
);
