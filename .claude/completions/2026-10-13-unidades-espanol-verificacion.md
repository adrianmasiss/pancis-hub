# Unidades de medida, catálogo en español y verificación nutricional

**Fecha:** 2026-10-13 · sin commit (el usuario hace commit cuando lo pide)

## Unidades de medida

- Gramos siguen siendo la cantidad canónica (`quantity_g`): plan, registro e
  historial no cambian. Las unidades son entrada y lectura.
- Migración `20261013000000_unidades_de_medida.sql`: `foods.nutrition_basis`
  ('100g' | '100ml'), `foods.density_g_per_ml`, `food_portions.source` y
  `owner_user_id` (porciones propias), políticas ampliadas.
- `src/features/foods/lib/units.ts` (+ tests): g/kg/oz/lb siempre; ml/l para
  líquidos; taza/cda/cdta sólo con densidad medida (o líquidos); porciones
  medidas. Todo se cuenta en la base de la etiqueta; `approx` → «≈».
- `quantity-stepper.tsx` reemplaza a `grams-stepper.tsx`: decimales con coma,
  paso por unidad, la unidad dentro del disco es un `<select>` nativo
  transparente. La ficha recuerda la unidad por alimento (localStorage).
- `scripts/unidades-alimentos.mjs` (`npm run unidades`): 5.833 porciones USDA
  en español, densidad para 1.659 alimentos, 64 productos OFF por 100 ml y 315
  porciones OFF.
- Verificado: 1 taza de leche entera = 149 kcal (lo que publica USDA);
  1 manzana mediana = 95 kcal.

## Catálogo en español

- `scripts/datos/usda-es.mjs` (diccionario por segmentos con concordancia),
  `traductor.mjs` (compartido con `sembrar-alimentos.mjs`),
  `traducir-alimentos.mjs` (`npm run traducir`): 3.581 genéricos traducidos,
  ~5.000 alias (nombre inglés + sinónimos regionales). Nombre inglés queda en
  `external_name`.
- Orden de búsqueda: sin código de barras primero (genéricos antes que OFF).
- Open Food Facts: búsqueda con search.openfoodfacts.org, primero productos de
  Costa Rica, detección de bebidas por 100 ml.

## Verificación nutricional

- `scripts/verificar-nutricion.mjs` (`npm run verificar`) y
  `docs/investigacion/VERIFICACION_NUTRICIONAL.md`.
- 33/46 pares coinciden con INCAP; la tortilla de la demo (218 kcal) está muy
  por encima de la tortilla tica de INCAP (175).

## Pendiente

- Producción: aplicar la migración y correr `traducir`, `unidades` (y
  `verificar`) contra Supabase de producción.
- Fase 3 de unidades: guardar unidad elegida en registro y plan.
- Decidir: aviso en la ficha para alimentos que no pasan la prueba A; INCAP
  como fuente; corregir la tortilla de la demo.
