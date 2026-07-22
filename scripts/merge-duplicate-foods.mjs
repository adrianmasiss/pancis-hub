/**
 * Fusiona alimentos personalizados que duplican una entrada del catalogo.
 *
 * Los creo el importador de dietas con IA cuando su emparejamiento fallaba
 * con plurales y acentos ("Claras de huevo" no encontraba "Clara de
 * huevo"). El emparejador ya esta corregido; esto limpia lo que quedo.
 *
 * Que hace con cada duplicado:
 *   1. Repunta comidas, plantillas y recetas al alimento del catalogo.
 *   2. Marca el duplicado como eliminado (soft delete).
 *   3. Registra el cambio en audit_logs con origen "sistema".
 *
 * Que NO hace:
 *   - No toca los snapshots de macros ya registrados: lo que comiste
 *     conserva los valores con los que se registro (requisito 22).
 *   - No borra filas fisicamente.
 *   - No fusiona alimentos del catalogo entre si: "Arroz blanco" crudo y
 *     cocido son entradas distintas a proposito.
 *
 * Uso:
 *   node --env-file=.env.production.local scripts/merge-duplicate-foods.mjs
 *   node --env-file=.env.production.local scripts/merge-duplicate-foods.mjs --apply
 *
 * Sin --apply solo simula y muestra lo que haria.
 */
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  (() => {
    throw new Error("Define SUPABASE_SERVICE_ROLE_KEY");
  })();

const APPLY = process.argv.includes("--apply");

const isLocal = URL.includes("127.0.0.1") || URL.includes("localhost");
console.log(`Destino: ${URL} ${isLocal ? "(LOCAL)" : "(REMOTO)"}`);
console.log(APPLY ? "Modo: APLICAR CAMBIOS\n" : "Modo: simulacion (sin --apply no se escribe nada)\n");

const admin = createClient(URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const STOPWORDS = new Set([
  "de", "del", "la", "el", "los", "las", "en", "con", "sin", "al", "y", "o", "a",
]);

function normalize(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function singularize(word) {
  if (word.length <= 3) return word;
  if (word.endsWith("es") && word.length > 4) return word.slice(0, -2);
  if (word.endsWith("s")) return word.slice(0, -1);
  return word;
}

/** Clave de identidad: mismas palabras significativas, en singular. */
function identityKey(name) {
  return normalize(name)
    .split(" ")
    .filter((word) => word && !STOPWORDS.has(word))
    .map(singularize)
    .sort()
    .join(" ");
}

/** Repunta las referencias de una tabla al alimento del catalogo. */
async function repoint(table, column, fromId, toId) {
  const { data, error } = await admin
    .from(table)
    .update({ [column]: toId })
    .eq(column, fromId)
    .select("id");
  if (error) {
    console.error(`    ! ${table}: ${error.message}`);
    return 0;
  }
  return data?.length ?? 0;
}

async function main() {
  const { data: foods, error } = await admin
    .from("foods")
    .select("id, name, owner_user_id, calories, protein_g")
    .is("deleted_at", null);
  if (error) throw error;

  const catalog = foods.filter((food) => !food.owner_user_id);
  const custom = foods.filter((food) => food.owner_user_id);

  const byKey = new Map();
  for (const food of catalog) {
    const key = identityKey(food.name);
    // Si el catalogo ya tiene dos entradas con la misma clave (crudo y
    // cocido), no se fusiona nada contra ellas: seria ambiguo.
    byKey.set(key, byKey.has(key) ? "ambiguo" : food);
  }

  let merged = 0;

  for (const duplicate of custom) {
    const target = byKey.get(identityKey(duplicate.name));
    if (!target || target === "ambiguo") continue;

    console.log(
      `- "${duplicate.name}" (${duplicate.calories}kcal) -> "${target.name}" (${target.calories}kcal)`,
    );

    if (!APPLY) {
      merged += 1;
      continue;
    }

    const meals = await repoint("meal_items", "food_id", duplicate.id, target.id);
    const templates = await repoint(
      "diet_template_items",
      "food_id",
      duplicate.id,
      target.id,
    );
    const recipes = await repoint(
      "recipe_ingredients",
      "food_id",
      duplicate.id,
      target.id,
    );
    console.log(
      `    referencias repuntadas: ${meals} comidas, ${templates} plantillas, ${recipes} recetas`,
    );

    const { error: deleteError } = await admin
      .from("foods")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", duplicate.id);
    if (deleteError) {
      console.error(`    ! no se pudo marcar como eliminado: ${deleteError.message}`);
      continue;
    }

    await admin.from("audit_logs").insert({
      actor_user_id: duplicate.owner_user_id,
      action: "alimento_sustituido",
      entity: "foods",
      entity_id: duplicate.id,
      previous_values: { alimento: duplicate.name, calorias: duplicate.calories },
      new_values: { alimento: target.name, calorias: target.calories },
      reason: "Duplicado fusionado con la entrada del catalogo.",
      origin: "sistema",
    });

    merged += 1;
  }

  console.log(
    `\n${APPLY ? "Fusionados" : "Se fusionarian"}: ${merged}. Catalogo: ${catalog.length}, personalizados: ${custom.length}.`,
  );
  if (!APPLY && merged > 0) {
    console.log("Volve a ejecutarlo con --apply para aplicarlo.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
