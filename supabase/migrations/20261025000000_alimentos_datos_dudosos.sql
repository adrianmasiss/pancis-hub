-- Alimentos con datos que no se sostienen.
--
-- Medido el 24 oct 2026 sobre 28.140 alimentos. Los genéricos de USDA salen
-- bien aunque sus kcal no cuadren con 4/4/9: USDA usa factores propios por
-- alimento (alcohol a 7 kcal/g, fibra, especias, polioles). Los que fallan son
-- etiquetas de productos de marca (USDA Branded, Open Food Facts): valor por
-- porción escrito en la casilla de 100 g, kJ por kcal, carbohidratos de 2.940 g.
--
-- No se corrigen: no hay forma de saber cuál de los números es el malo, y
-- adivinar sería peor que avisar. Se marcan, la biblioteca y las sugerencias
-- los dejan fuera, y la ficha avisa si alguien llega por código de barras.
--
--   macros_imposibles  proteína + carbohidratos + grasa > 102 g por 100 g, o
--                      más de 950 kcal (la grasa pura tiene 900).
--   kcal_incoherentes  sólo etiquetas: kcal fuera de lo que dan los macros,
--                      contando la fibra a 2 kcal/g, con 25 % y 20 kcal de
--                      margen.

alter table public.foods
  add column if not exists data_issue text
  check (data_issue in ('macros_imposibles', 'kcal_incoherentes'));

create or replace function public.food_data_issue(
  p_calories numeric,
  p_protein numeric,
  p_carbs numeric,
  p_fat numeric,
  p_fiber numeric,
  p_is_label boolean
) returns text
language sql
immutable
as $$
  select case
    when p_protein + p_carbs + p_fat > 102 or p_calories > 950
      then 'macros_imposibles'
    when p_is_label and (
      p_calories > (4 * p_protein + 4 * p_carbs + 9 * p_fat) * 1.25 + 20
      or p_calories < (4 * p_protein + 4 * greatest(p_carbs - p_fiber, 0)
                       + 2 * p_fiber + 9 * p_fat) * 0.75 - 20
    ) then 'kcal_incoherentes'
    else null
  end
$$;

-- Etiqueta = trae código de barras. Los alimentos propios también se revisan,
-- pero la biblioteca no se los oculta a su dueño.
create or replace function public.foods_set_data_issue()
returns trigger
language plpgsql
as $$
begin
  new.data_issue := public.food_data_issue(
    new.calories, new.protein_g, new.carbohydrate_g, new.fat_g,
    new.fiber_g, new.barcode is not null
  );
  return new;
end
$$;

drop trigger if exists foods_set_data_issue on public.foods;
create trigger foods_set_data_issue
  before insert or update of calories, protein_g, carbohydrate_g, fat_g,
    fiber_g, barcode
  on public.foods
  for each row execute function public.foods_set_data_issue();

-- Las filas que ya están. Sin tocar updated_at: el dato no cambió.
alter table public.foods disable trigger foods_set_updated_at;
update public.foods
set data_issue = public.food_data_issue(
  calories, protein_g, carbohydrate_g, fat_g, fiber_g, barcode is not null
)
where data_issue is distinct from public.food_data_issue(
  calories, protein_g, carbohydrate_g, fat_g, fiber_g, barcode is not null
);
alter table public.foods enable trigger foods_set_updated_at;

create index if not exists foods_data_issue_idx
  on public.foods (data_issue) where data_issue is not null;
