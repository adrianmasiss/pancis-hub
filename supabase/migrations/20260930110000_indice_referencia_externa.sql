-- `foods_external_ref_unique` era un índice PARCIAL
-- (`where external_source is not null`), y `ON CONFLICT (external_source,
-- external_id)` no puede apoyarse en un índice parcial salvo que la sentencia
-- repita el mismo predicado — cosa que el cliente de Supabase no emite. La
-- siembra del catálogo fallaba entera con «no unique or exclusion constraint
-- matching the ON CONFLICT specification».
--
-- Se sustituye por uno completo. No cambia nada en la práctica: en Postgres
-- los nulos son distintos entre sí dentro de un índice único, así que los
-- alimentos propios —que no tienen `external_source`— siguen pudiendo ser
-- muchos sin colisionar.

drop index if exists public.foods_external_ref_unique;

create unique index if not exists foods_external_ref_unique
  on public.foods (external_source, external_id);
