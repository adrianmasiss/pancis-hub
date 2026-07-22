-- Horarios de comida (docs/02_PRODUCT_REQUIREMENTS.md 4.1).
--
-- El tipo de comida ("desayuno", "snack") no dice a que hora toca, y con
-- dos o tres snacks al dia la etiqueta deja de distinguirlos. El horario
-- es lo que permite ordenar el dia como ocurre de verdad y saber que
-- viene despues.
--
-- Se usa `time` y no `timestamptz`: es una hora del dia recurrente
-- ("07:30 cada dia"), no un instante concreto. Guardarlo con zona horaria
-- lo desplazaria al viajar o al cambiar el horario de verano.
--
-- Opcional a proposito: registrar una comida sin hora sigue siendo
-- valido, y esas comidas se ordenan al final.

alter table public.meals
  add column scheduled_time time;

alter table public.diet_template_meals
  add column scheduled_time time;

comment on column public.meals.scheduled_time is
  'Hora del dia planificada. Null = sin horario definido.';

-- El orden habitual es por hora dentro de un mismo dia.
create index meals_user_date_time_idx
  on public.meals (user_id, date, scheduled_time);
