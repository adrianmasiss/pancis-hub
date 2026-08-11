-- Con que datos se calculo cada objetivo nutricional.
--
-- `nutrition_targets` guardaba solo el resultado, asi que al detectar que el
-- objetivo activo ya no corresponde al peso de hoy la app podia avisar del
-- cambio pero no explicarlo. Con las entradas guardadas el aviso pasa de
-- "tu objetivo cambio" a "se calculo con 82 kg y hoy pesas 76".
--
-- Puramente aditiva y anulable: las filas anteriores se quedan sin entradas
-- y el aviso, para esas, se limita a las cifras.

alter table public.nutrition_targets
  add column calculation_inputs jsonb;

comment on column public.nutrition_targets.calculation_inputs is
  'Peso, altura, edad, nivel de actividad y objetivo usados en el calculo. Null en objetivos anteriores a 2026-08-05 y en los definidos a mano.';
