-- El cron no avisaba (nov 2026) aunque la ruta en Vercel acepta el secreto.
-- Lo que se pega en Vault a mano trae a veces un salto de linea o un espacio
-- al final, y la URL una barra final ("…vercel.app/" + "/api/…" redirige y
-- pg_net no sigue redirecciones). Se limpian ambos antes de llamar.

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
  select btrim(decrypted_secret, E' \t\r\n') into url
    from vault.decrypted_secrets where name = 'recordatorios_url';
  select btrim(decrypted_secret, E' \t\r\n') into secreto
    from vault.decrypted_secrets where name = 'cron_secret';
  if url is null or url = '' or secreto is null or secreto = '' then
    return;
  end if;
  perform net.http_get(
    url := rtrim(url, '/') || '/api/cron/recordatorios',
    headers := jsonb_build_object('Authorization', 'Bearer ' || secreto),
    timeout_milliseconds := 60000
  );
end;
$$;

revoke all on function private.enviar_recordatorios() from public, anon, authenticated;
