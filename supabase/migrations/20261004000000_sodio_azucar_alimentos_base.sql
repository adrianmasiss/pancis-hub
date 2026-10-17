-- Sodio y azucar de los alimentos base, desde USDA FoodData Central.
--
-- Cada fila cita su ficha SR Legacy (fdcId). La ficha se eligio porque sus
-- calorias por 100 g coinciden con las del alimento base (diferencia de
-- 0 kcal salvo el pan integral: 252 frente a 247, la misma ficha revisada).
-- Consultado el 2026-10-03 y 2026-10-04 con la API publica de USDA.
--
-- Fuera a proposito:
--   · Tortilla de maiz: su ficha (218 kcal, con sal) no se pudo consultar
--     por el limite de la API. Sin dato es mejor que un dato adivinado.
--   · Avena: USDA no publica azucares para esa ficha; se deja null.
--   · Queso fresco: se usa la ficha de queso fresco (172223). OJO: los
--     macros actuales del alimento (264 kcal) son los de queso feta; eso se
--     corrige aparte si el usuario lo confirma.
--
-- Solo rellena huecos: no pisa un sodio/azucar que alguien ya haya puesto.

-- Aceite de oliva: FDC 171413 «Oil, olive, salad or cooking»
update public.foods set sodium_mg = coalesce(sodium_mg, 2.0), sugar_g = coalesce(sugar_g, 0.0) where id = '00000000-0000-4000-8000-000000000014';
-- Aguacate: FDC 171705 «Avocados, raw, all commercial varieties»
update public.foods set sodium_mg = coalesce(sodium_mg, 7.0), sugar_g = coalesce(sugar_g, 0.66) where id = '00000000-0000-4000-8000-000000000015';
-- Almendras: FDC 170567 «Nuts, almonds»
update public.foods set sodium_mg = coalesce(sodium_mg, 1.0), sugar_g = coalesce(sugar_g, 4.35) where id = '00000000-0000-4000-8000-000000000019';
-- Arroz blanco (cocido): FDC 168878 «Rice, white, long-grain, regular, enriched, cooked»
update public.foods set sodium_mg = coalesce(sodium_mg, 1.0), sugar_g = coalesce(sugar_g, 0.05) where id = '00000000-0000-4000-8000-000000000002';
-- Arroz blanco (crudo): FDC 168877 «Rice, white, long-grain, regular, raw, enriched»
update public.foods set sodium_mg = coalesce(sodium_mg, 5.0), sugar_g = coalesce(sugar_g, 0.12) where id = '00000000-0000-4000-8000-000000000003';
-- Atun en agua: FDC 171986 «Fish, tuna, light, canned in water, without salt, drained solids»
update public.foods set sodium_mg = coalesce(sodium_mg, 50.0), sugar_g = coalesce(sugar_g, 0.0) where id = '00000000-0000-4000-8000-000000000007';
-- Avena en hojuelas: FDC 169705 «Oats»
update public.foods set sodium_mg = coalesce(sodium_mg, 2.0), sugar_g = coalesce(sugar_g, null) where id = '00000000-0000-4000-8000-000000000004';
-- Banano: FDC 173944 «Bananas, raw»
update public.foods set sodium_mg = coalesce(sodium_mg, 1.0), sugar_g = coalesce(sugar_g, 12.2) where id = '00000000-0000-4000-8000-000000000010';
-- Brocoli: FDC 169967 «Broccoli, cooked, boiled, drained, without salt»
update public.foods set sodium_mg = coalesce(sodium_mg, 41.0), sugar_g = coalesce(sugar_g, 1.39) where id = '00000000-0000-4000-8000-000000000021';
-- Camote: FDC 168483 «Sweet potato, cooked, baked in skin, flesh, without salt»
update public.foods set sodium_mg = coalesce(sodium_mg, 36.0), sugar_g = coalesce(sugar_g, 6.48) where id = '00000000-0000-4000-8000-000000000013';
-- Clara de huevo: FDC 172183 «Egg, white, raw, fresh»
update public.foods set sodium_mg = coalesce(sodium_mg, 166.0), sugar_g = coalesce(sugar_g, 0.71) where id = '00000000-0000-4000-8000-000000000006';
-- Frijoles negros: FDC 173735 «Beans, black, mature seeds, cooked, boiled, without salt»
update public.foods set sodium_mg = coalesce(sodium_mg, 1.0), sugar_g = coalesce(sugar_g, 0.32) where id = '00000000-0000-4000-8000-000000000008';
-- Huevo entero: FDC 173424 «Egg, whole, cooked, hard-boiled»
update public.foods set sodium_mg = coalesce(sodium_mg, 124.0), sugar_g = coalesce(sugar_g, 1.12) where id = '00000000-0000-4000-8000-000000000005';
-- Leche descremada: FDC 171269 «Milk, nonfat, fluid, with added vitamin A and vitamin D»
update public.foods set sodium_mg = coalesce(sodium_mg, 42.0), sugar_g = coalesce(sugar_g, 5.09) where id = '00000000-0000-4000-8000-000000000017';
-- Lentejas: FDC 172421 «Lentils, mature seeds, cooked, boiled, without salt»
update public.foods set sodium_mg = coalesce(sodium_mg, 2.0), sugar_g = coalesce(sugar_g, 1.8) where id = '00000000-0000-4000-8000-000000000020';
-- Manzana: FDC 171688 «Apples, raw, with skin»
update public.foods set sodium_mg = coalesce(sodium_mg, 1.0), sugar_g = coalesce(sugar_g, 10.4) where id = '00000000-0000-4000-8000-000000000011';
-- Pan integral: FDC 172688 «Bread, whole-wheat, commercially prepared»
update public.foods set sodium_mg = coalesce(sodium_mg, 455.0), sugar_g = coalesce(sugar_g, 4.34) where id = '00000000-0000-4000-8000-000000000022';
-- Papa: FDC 170438 «Potatoes, boiled, cooked in skin, flesh, without salt»
update public.foods set sodium_mg = coalesce(sodium_mg, 4.0), sugar_g = coalesce(sugar_g, 0.91) where id = '00000000-0000-4000-8000-000000000012';
-- Pechuga de pollo: FDC 171477 «Chicken, broilers or fryers, breast, meat only, cooked, roasted»
update public.foods set sodium_mg = coalesce(sodium_mg, 74.0), sugar_g = coalesce(sugar_g, 0.0) where id = '00000000-0000-4000-8000-000000000001';
-- Queso fresco: FDC 172223 «Cheese, fresh, queso fresco»
update public.foods set sodium_mg = coalesce(sodium_mg, 751.0), sugar_g = coalesce(sugar_g, 2.32) where id = '00000000-0000-4000-8000-000000000018';
-- Yogur griego natural: FDC 170894 «Yogurt, Greek, plain, nonfat»
update public.foods set sodium_mg = coalesce(sodium_mg, 36.0), sugar_g = coalesce(sugar_g, 3.24) where id = '00000000-0000-4000-8000-000000000016';

-- Lo ya registrado que salio de estos alimentos tenia sodio y azucar en
-- null porque el dato no existia al registrarlo. Se completa a partir de la
-- cantidad registrada; lo que ya tenia valor no se toca.
update public.meal_items item
set sodium_snapshot_mg = round(food.sodium_mg * item.quantity_g / 100, 1)
from public.foods food
where food.id = item.food_id
  and item.sodium_snapshot_mg is null
  and food.sodium_mg is not null
  and food.id in (
    select id from public.foods where owner_user_id is null and external_source is null
  );

update public.meal_items item
set sugar_snapshot_g = round(food.sugar_g * item.quantity_g / 100, 1)
from public.foods food
where food.id = item.food_id
  and item.sugar_snapshot_g is null
  and food.sugar_g is not null
  and food.id in (
    select id from public.foods where owner_user_id is null and external_source is null
  );
