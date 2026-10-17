-- Add Dietly without changing existing food identities or nutrition values.
alter table public.foods drop constraint if exists foods_external_source_check;
alter table public.foods add constraint foods_external_source_check
  check (external_source in ('usda', 'openfoodfacts', 'dietly'));
alter table public.external_food_cache drop constraint if exists external_food_cache_source_check;
alter table public.external_food_cache add constraint external_food_cache_source_check
  check (source in ('usda', 'openfoodfacts', 'dietly'));
