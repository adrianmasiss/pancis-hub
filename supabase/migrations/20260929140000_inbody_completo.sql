-- Lo que faltaba del informe InBody.
--
-- La versión anterior guardaba las cifras sueltas pero no los RANGOS que el
-- aparato imprime junto a cada una —«40,3 (35,7~43,7)»—, y ese paréntesis es
-- justo lo que convierte un número en un juicio. Sin él, «10,9 kg de
-- proteína» no le dice nada a nadie.
--
-- Los rangos van en `jsonb` y no en veinticuatro columnas por dos razones:
-- son pares min/max de una docena de métricas, y dependen de altura, sexo y
-- edad, así que cambian con la persona y con el modelo de aparato. Guardar
-- lo que IMPRIMIÓ el informe es fiel; recalcularlos aquí sería inventarlos.

alter table public.body_measurements
  add column if not exists bmi numeric(4, 1) check (bmi > 0),
  add column if not exists ideal_weight_kg numeric(5, 2)
    check (ideal_weight_kg > 0),
  -- Los tres «control» vienen firmados: negativo es «baja», positivo «sube».
  add column if not exists weight_control_kg numeric(5, 2),
  add column if not exists fat_control_kg numeric(5, 2),
  add column if not exists muscle_control_kg numeric(5, 2),
  add column if not exists waist_hip_ratio numeric(4, 2)
    check (waist_hip_ratio > 0),
  -- { "weightKg": [54.0, 73.1], "proteinKg": [9.6, 11.7], ... }
  add column if not exists reference_ranges jsonb;

comment on column public.body_measurements.reference_ranges is
  'Rangos normales tal como los imprimió el informe, por métrica: [min, max]. No se recalculan.';

comment on column public.body_measurements.weight_control_kg is
  'Cuánto sugiere el informe mover el peso. Negativo = bajar.';
