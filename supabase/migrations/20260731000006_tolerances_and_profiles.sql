-- EQ-002 y EQ-003. Aprobado por el usuario el 2026-07-31.
--
-- Las tolerancias del doc 01 estaban descritas como configurables por el
-- usuario y NO EXISTIAN en el codigo. Consecuencia: la metrica North Star del
-- producto ("porcentaje de sustituciones confirmadas que mantienen el plan
-- dentro de la tolerancia definida por el usuario") no se podia calcular.

alter table public.profiles
  add column if not exists tolerance_calories_pct numeric(4,1) not null default 5
    check (tolerance_calories_pct between 1 and 50),
  add column if not exists tolerance_protein_pct numeric(4,1) not null default 10
    check (tolerance_protein_pct between 1 and 50),
  add column if not exists tolerance_carbs_pct numeric(4,1) not null default 10
    check (tolerance_carbs_pct between 1 and 50),
  add column if not exists tolerance_fat_pct numeric(4,1) not null default 15
    check (tolerance_fat_pct between 1 and 50);

comment on column public.profiles.tolerance_calories_pct is
  'Preferencia del usuario, no limite cientifico. Ver EQ-003.';

insert into public.formula_versions
  (id, key, version, value, unit, claim_ref, evidence_grade,
   is_product_parameter, rationale, limitations, approved_by, approved_at)
values
  ('20000000-0000-4000-8000-000000000016',
   'compatibility_profiles', 1,
   '{"proteico":     {"calories":0.25,"proteinG":0.35,"carbohydrateG":0.15,"fatG":0.20,"fiberG":0.05},
     "carbohidrato": {"calories":0.25,"proteinG":0.15,"carbohydrateG":0.35,"fatG":0.15,"fiberG":0.10},
     "comida":       {"calories":0.25,"proteinG":0.30,"carbohydrateG":0.20,"fatG":0.15,"fiberG":0.10}}'::jsonb,
   'peso relativo',
   'EQ-002', null, true,
   'Tres perfiles segun el papel del alimento en el plan, como define el doc 05. El codigo implementaba uno solo: al cambiar arroz por pasta ponderaba la proteina por encima de los carbohidratos, al reves del rol de ese alimento.',
   'Parametros de producto a calibrar con el uso real, no conclusiones cientificas. El propio doc 05 lo dice.',
   'Adrian', now()),

  ('20000000-0000-4000-8000-000000000017',
   'macro_tolerances_pct', 1,
   '{"calories": 5, "protein": 10, "carbs": 10, "fat": 15, "fiber": null}'::jsonb,
   '% de desviacion respecto a lo planificado',
   'EQ-003', null, true,
   'Valores por defecto del doc 01, ahora configurables por usuario. La fibra queda como advertencia y nunca como bloqueo, coherente con que es un objetivo de salud a largo plazo (NUT-006).',
   'Son preferencias del usuario, no limites cientificos universales. La redaccion importa: "te avisamos si te alejas mas de un 10 %" es una preferencia; "no debes exceder el 10 %" seria una afirmacion falsa.',
   'Adrian', now())
on conflict (id) do nothing;
