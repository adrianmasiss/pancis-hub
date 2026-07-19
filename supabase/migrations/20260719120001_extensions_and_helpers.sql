-- Extensiones y funciones auxiliares compartidas.

create extension if not exists pgcrypto;

-- Trigger generico para mantener updated_at.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Rol admin futuro: se lee del JWT (app_metadata.role = 'admin').
-- Ninguna politica RLS consulta tablas de usuario, evitando recursion.
create or replace function public.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;
