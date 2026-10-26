-- Extras ligados a una comida del plan.
--
-- «+ Agregar extra» en una comida del plan registra una comida aparte (el plan
-- no cambia), pero el usuario la quiere ver DENTRO de esa comida, como «Extra
-- de hoy». Esta columna dice de qué comida del plan es el extra. Si la comida
-- del plan desaparece, el extra queda como comida suelta del día.
alter table public.meals
  add column if not exists extra_of_template_meal_id uuid
    references public.diet_template_meals(id) on delete set null;

create index if not exists meals_extra_of_template_meal_id_idx
  on public.meals (extra_of_template_meal_id)
  where extra_of_template_meal_id is not null;
