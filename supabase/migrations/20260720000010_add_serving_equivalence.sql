-- Agregar columna serving_equivalence a diet_template_items y meal_items
-- Permite almacenar la porción o unidad original sugerida (ej. "3 huevos") junto con la cantidad en gramos.

ALTER TABLE public.diet_template_items 
ADD COLUMN serving_equivalence TEXT;

ALTER TABLE public.meal_items 
ADD COLUMN serving_equivalence TEXT;

COMMENT ON COLUMN public.diet_template_items.serving_equivalence IS 'Equivalencia de porción/unidad doméstica original sugerida por la IA o el usuario.';
COMMENT ON COLUMN public.meal_items.serving_equivalence IS 'Equivalencia de porción/unidad doméstica original sugerida por la IA o el usuario.';
