/**
 * Genera la migración con los micronutrientes de los alimentos genéricos de
 * USDA (SR Legacy, Survey/FNDDS y Foundation).
 *
 * FUENTE: las descargas públicas de FoodData Central, dominio público y sin
 * clave de API (https://fdc.nal.usda.gov/download-datasets). Por eso no se
 * llama a la API: con DEMO_KEY serían 600 peticiones a 50 por día.
 *
 *   node scripts/micronutrientes-usda.mjs <json>... > supabase/migrations/X.sql
 *
 * Se escribe como migración y no contra la base porque así llega a
 * producción con el mismo `db push` que el resto, sin claves de servicio.
 * Sólo toca `foods.micronutrients` de filas con external_source = 'usda' y
 * el fdcId correspondiente; lo que no está en el catálogo no hace nada.
 *
 * Valores por 100 g, como todo el catálogo. Una clave ausente = USDA no lo
 * midió, no cero.
 */

import fs from "node:fs";

/** id de nutriente de FDC -> clave en el jsonb. */
const NUTRIENTES = {
  1258: "sat_fat_g",
  1253: "cholesterol_mg",
  1087: "calcium_mg",
  1089: "iron_mg",
  1090: "magnesium_mg",
  1092: "potassium_mg",
  1095: "zinc_mg",
  1106: "vit_a_ug",
  1162: "vit_c_mg",
  1114: "vit_d_ug",
  1178: "vit_b12_ug",
  1190: "folate_ug",
};
// Folato: el DFE (1190) es el que se compara con la recomendación; si sólo
// está el total (1177), sirve igual para alimentos sin ácido fólico añadido.
const FOLATO_TOTAL = 1177;

const filas = new Map();
for (const ruta of process.argv.slice(2)) {
  const json = JSON.parse(fs.readFileSync(ruta, "utf8"));
  const alimentos = Object.values(json)[0];
  for (const alimento of alimentos.filter(Boolean)) {
    const valores = {};
    let folatoTotal = null;
    for (const n of alimento.foodNutrients ?? []) {
      const id = n.nutrient?.id;
      if (typeof n.amount !== "number" || !Number.isFinite(n.amount)) continue;
      if (id === FOLATO_TOTAL) folatoTotal = n.amount;
      const clave = NUTRIENTES[id];
      if (clave) valores[clave] = Math.round(n.amount * 100) / 100;
    }
    if (valores.folate_ug === undefined && folatoTotal !== null)
      valores.folate_ug = Math.round(folatoTotal * 100) / 100;
    if (Object.keys(valores).length > 0)
      filas.set(String(alimento.fdcId), valores);
  }
  console.error(`${ruta}: ${alimentos.length} alimentos`);
}

const sql = (s) => `'${s.replace(/'/g, "''")}'`;
const valores = [...filas]
  .map(([id, v]) => `(${sql(id)},${sql(JSON.stringify(v))})`)
  .join(",\n");

process.stdout.write(`-- Micronutrientes de los genéricos de USDA (por 100 g).
-- Generado por scripts/micronutrientes-usda.mjs a partir de las descargas
-- públicas de FoodData Central. ${filas.size} alimentos de la fuente.

alter table public.foods
  add column if not exists micronutrients jsonb;

alter table public.foods disable trigger foods_set_updated_at;

update public.foods f
set micronutrients = v.datos::jsonb
from (values
${valores}
) as v(fdc_id, datos)
where f.external_source = 'usda' and f.external_id = v.fdc_id;

alter table public.foods enable trigger foods_set_updated_at;
`);
console.error(`${filas.size} filas`);
