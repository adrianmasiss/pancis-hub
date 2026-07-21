-- Estado "completada con cambios" para las comidas.
--
-- El plan y lo realmente consumido deben poder diferenciarse: una comida
-- que se completo tal cual no es lo mismo que una donde el usuario
-- sustituyo alimentos. Ambas suman al consumo del dia, pero solo la
-- segunda explica por que el dia no cuadra con el plan
-- (docs/02_PRODUCT_REQUIREMENTS.md 4.2).

alter table public.meals
  drop constraint meals_status_check;

alter table public.meals
  add constraint meals_status_check check (
    status in ('planificada', 'completada', 'completada_con_cambios', 'omitida')
  );

-- Marca de que la comida se desvio del plan y por que. Se llena cuando el
-- usuario acepta una sustitucion; el plan original nunca se sobrescribe.
alter table public.meals
  add column modified_reason text;
