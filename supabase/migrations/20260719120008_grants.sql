-- Privilegios de tabla para los roles de la API.
-- Los GRANT son la primera capa; RLS sigue decidiendo fila por fila.
-- anon no recibe privilegios sobre datos: solo puede autenticarse.

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete
  on all tables in schema public
  to authenticated;

grant all on all tables in schema public to service_role;

-- Tablas futuras creadas por el rol de migraciones heredan los mismos grants.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;

alter default privileges in schema public
  grant all on tables to service_role;

grant execute on all functions in schema public to authenticated, service_role;

alter default privileges in schema public
  grant execute on functions to authenticated, service_role;
