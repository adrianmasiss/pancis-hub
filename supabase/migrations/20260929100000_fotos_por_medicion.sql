-- Las fotos de progreso pasan a colgar de una medición.
--
-- El trío ya estaba en el modelo: `view_type` sólo admite frontal, lateral y
-- posterior. Lo que faltaba era a QUÉ medición pertenecen, para poder verlas
-- junto a sus números en el historial en vez de en una lista aparte.
--
-- El enlace es OPCIONAL a propósito:
--
--  * Una foto sin báscula delante sigue valiendo. Obligar a registrar una
--    medición para poder subir una foto convertiría un gesto de diez segundos
--    en un formulario.
--  * `on delete set null` y no `cascade`: borrar una medición no puede
--    llevarse por delante las fotos. El número se puede volver a tomar; la
--    foto de ese día, no.

alter table public.progress_photos
  add column measurement_id uuid
    references public.body_measurements (id) on delete set null;

comment on column public.progress_photos.measurement_id is
  'Medición a la que acompaña la foto. Nulo si se subió suelta.';

-- Índice por medición: la vista de historial pide las fotos de cada fila.
create index if not exists progress_photos_measurement_idx
  on public.progress_photos (measurement_id)
  where measurement_id is not null;

-- Retrollenado: las fotos que ya existen se enganchan a la medición del MISMO
-- día y del MISMO usuario. Es el criterio que la gente ya usaba de hecho —se
-- pesa y se hace la foto a la vez—, y si no hubo medición ese día la foto se
-- queda suelta, que es un estado válido.
update public.progress_photos p
set measurement_id = m.id
from public.body_measurements m
where p.measurement_id is null
  and m.user_id = p.user_id
  and m.measured_at = p.captured_at;
