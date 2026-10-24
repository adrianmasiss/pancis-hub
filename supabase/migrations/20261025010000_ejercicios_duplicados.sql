-- Ejercicios repetidos y músculos mal asignados en el catálogo importado.
--
-- El catálogo tiene dos importaciones: free-exercise-db (873, con dos fotos
-- cada uno) y una anterior de 1.324 sin fotos, identificada por un
-- external_id numérico. Muchas de la segunda son el mismo ejercicio con las
-- palabras en otro orden: «Kettlebell one arm floor press» y «One-Arm
-- Kettlebell Floor Press». Se emparejan por sus palabras ordenadas (sin
-- signos ni artículos) y se quedan las que tienen foto.
--
-- Lo que hace con cada repetido:
--   1. Repunta rutinas, sesiones, series, favoritos y cambios del día.
--   2. Lo marca como eliminado (soft delete); no borra filas.
-- Los registros de series conservan lo que se hizo; sólo cambia a qué ficha
-- apuntan.

create temporary table ej_clave as
select
  id,
  image_url is not null as con_foto,
  coalesce(external_id ~ '^[0-9]+$', false) as viejo,
  external_id,
  (
    select string_agg(t, ' ' order by t)
    from regexp_split_to_table(
      regexp_replace(lower(name), '[^a-z0-9 ]', ' ', 'g'), '\s+'
    ) t
    where t <> '' and t not in ('the', 'a', 'with', 'on', 'of', 'to', 'and')
  ) as clave
from public.exercise_catalog
where deleted_at is null and source = 'importado';

-- Viejo -> el de foto con la misma clave; si no hay, el viejo de menor id
-- con esa clave (dos viejos iguales entre sí).
create temporary table ej_fusion as
select distinct on (v.id) v.id as viejo_id, coalesce(n.id, w.id) as queda_id
from ej_clave v
left join ej_clave n
  on n.clave = v.clave and n.con_foto and not n.viejo
left join lateral (
  select w.id from ej_clave w
  where w.clave = v.clave and w.viejo and not w.con_foto
  order by w.external_id
  limit 1
) w on true
where v.viejo and not v.con_foto
order by v.id, n.id;

delete from ej_fusion where viejo_id = queda_id;

update public.workout_plan_exercises t set exercise_id = f.queda_id
from ej_fusion f where t.exercise_id = f.viejo_id;
update public.workout_sets t set exercise_id = f.queda_id
from ej_fusion f where t.exercise_id = f.viejo_id;
update public.workout_session_exercises t set original_exercise_id = f.queda_id
from ej_fusion f where t.original_exercise_id = f.viejo_id;
update public.workout_session_exercises t set performed_exercise_id = f.queda_id
from ej_fusion f where t.performed_exercise_id = f.viejo_id;
update public.exercise_day_swaps t set substitute_exercise_id = f.queda_id
from ej_fusion f where t.substitute_exercise_id = f.viejo_id;

-- Favoritos: la clave es (usuario, ejercicio), así que se copia y se borra.
insert into public.exercise_favorites (user_id, exercise_id)
select fav.user_id, f.queda_id
from public.exercise_favorites fav
join ej_fusion f on f.viejo_id = fav.exercise_id
on conflict do nothing;
delete from public.exercise_favorites fav
using ej_fusion f where fav.exercise_id = f.viejo_id;

update public.exercise_catalog c set deleted_at = now()
from ej_fusion f where c.id = f.viejo_id;

-- La importación vieja da glúteo como principal de sentadillas, zancadas y
-- prensas. El que más trabaja ahí es el cuádriceps; el glúteo pasa a
-- secundario. Sumo, cossack y curtsey sí cargan glúteo y aductores: quedan.
update public.exercise_catalog
set
  primary_muscle = 'cuadriceps',
  secondary_muscles = array(
    select distinct m
    from unnest(array_prepend('gluteos', secondary_muscles)) m
    where m <> 'cuadriceps'
  )
where deleted_at is null
  and primary_muscle = 'gluteos'
  and name ~* '(squat|lunge|leg press)'
  and name !~* '(sumo|cossack|curtsey|row)';

-- «Sled 45в° leg press»: un «°» leído con la codificación equivocada.
update public.exercise_catalog
set name = replace(name, 'в°', '°')
where name like '%в°%';

drop table ej_fusion;
drop table ej_clave;

-- Con foto primero: quedan 1.142 sin foto (no hay fuente libre que las
-- tenga) y no deben tapar a los que enseñan cómo se hace.
alter table public.exercise_catalog
  add column if not exists has_image boolean
  generated always as (image_url is not null) stored;
