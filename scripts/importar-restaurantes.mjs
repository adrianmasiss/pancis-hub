/** Importa el informe CR del 06/11/2026 sin reemplazar registros existentes.
 * node --env-file=.env.local scripts/importar-restaurantes.mjs [--aplicar]
 * Publicado no significa verificado: se conserva la revisión pendiente.
 */
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
const restaurants = JSON.parse(
  await readFile(
    new URL(
      "../src/features/restaurants/data/costa-rica-2026-11-06.json",
      import.meta.url,
    ),
  ),
);
const items = JSON.parse(
  await readFile(
    new URL("./datos/restaurantes-costa-rica-2026-11-06.json", import.meta.url),
  ),
);
const apply = process.argv.includes("--aplicar");
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error("Falta la configuración de Supabase.");
const db = createClient(url, key, { auth: { persistSession: false } });
const normalize = (name) =>
  name
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]/g, "");
async function checked(request) {
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return data;
}
const existing = await checked(
  db.from("restaurants").select("id, name, country"),
);
let addedRestaurants = 0,
  addedItems = 0,
  skipped = 0;
for (const restaurant of restaurants) {
  let found = existing.find(
    (r) => normalize(r.name) === normalize(restaurant.name),
  );
  if (found && found.country !== "CR")
    throw new Error(`País incompatible: ${restaurant.name}`);
  if (!found) {
    addedRestaurants++;
    if (apply)
      found = await checked(
        db
          .from("restaurants")
          .insert({
            name: restaurant.name,
            country: "CR",
            category: restaurant.category,
          })
          .select("id")
          .single(),
      );
  }
  const prior = found
    ? await checked(
        db
          .from("restaurant_items")
          .select("name")
          .eq("restaurant_id", found.id),
      )
    : [];
  const names = new Set(prior.map((i) => normalize(i.name)));
  const pending = items
    .filter((i) => i.restaurant === restaurant.name)
    .filter((i) => {
      if (names.has(normalize(i.name))) {
        skipped++;
        return false;
      }
      return true;
    });
  addedItems += pending.length;
  if (apply && pending.length) {
    await checked(
      db.from("restaurant_items").insert(
        pending.map((record) => {
          const item = { ...record, restaurant_id: found.id };
          delete item.restaurant;
          delete item.published;
          return item;
        }),
      ),
    );
  }
}
console.log(
  JSON.stringify({
    mode: apply ? "aplicado" : "simulación",
    restaurants: addedRestaurants,
    items: addedItems,
    existingItemsPreserved: skipped,
  }),
);
