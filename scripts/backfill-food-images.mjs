/**
 * Backfill de fotos (Pexels) para alimentos del catalogo y recetas publicas
 * que no tienen imagen todavia (ej. los ~79 alimentos sembrados en
 * supabase/seed.sql, creados antes de que existiera este flujo).
 *
 * Uso: node --env-file=.env.local scripts/backfill-food-images.mjs
 * Requiere: SUPABASE_SERVICE_ROLE_KEY, PEXELS_API_KEY.
 * Un solo uso manual, no forma parte del build/CI.
 */
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  (() => {
    throw new Error("Define SUPABASE_SERVICE_ROLE_KEY");
  })();
const PEXELS_API_KEY =
  process.env.PEXELS_API_KEY ??
  (() => {
    throw new Error("Define PEXELS_API_KEY");
  })();

const BUCKET = "food-images";
// Limite gratuito de Pexels: ~200 req/hora. Una pausa conservadora evita
// agotarlo si el catalogo crece.
const DELAY_MS = 1200;

const admin = createClient(URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function searchPexelsPhoto(query) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=square`;
  const response = await fetch(url, {
    headers: { Authorization: PEXELS_API_KEY },
  });
  if (!response.ok) return null;
  const data = await response.json();
  const mediumUrl = data.photos?.[0]?.src?.medium;
  return mediumUrl ?? null;
}

async function storeImage(pathPrefix, id, query) {
  const photoUrl = await searchPexelsPhoto(query);
  if (!photoUrl) return null;

  const imageResponse = await fetch(photoUrl);
  if (!imageResponse.ok) return null;
  const buffer = await imageResponse.arrayBuffer();

  const path = `${pathPrefix}/${id}.jpg`;
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: "image/jpeg", upsert: true });
  if (error) {
    console.error(`  [FAIL upload] ${query}:`, error.message);
    return null;
  }

  const { data } = admin.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function backfillFoods() {
  const { data: foods, error } = await admin
    .from("foods")
    .select("id, name")
    .is("image_url", null)
    .is("deleted_at", null);
  if (error) throw error;

  console.log(`Alimentos sin imagen: ${foods.length}`);
  let done = 0;
  for (const food of foods) {
    const imageUrl = await storeImage("foods", food.id, `${food.name} comida`);
    if (imageUrl) {
      await admin.from("foods").update({ image_url: imageUrl }).eq("id", food.id);
      done += 1;
      console.log(`  [OK] ${food.name}`);
    } else {
      console.log(`  [sin match] ${food.name}`);
    }
    await sleep(DELAY_MS);
  }
  console.log(`Alimentos actualizados: ${done}/${foods.length}`);
}

async function backfillRecipes() {
  const { data: recipes, error } = await admin
    .from("recipes")
    .select("id, name")
    .is("image_url", null)
    .is("deleted_at", null)
    .eq("visibility", "public");
  if (error) throw error;

  console.log(`Recetas publicas sin imagen: ${recipes.length}`);
  let done = 0;
  for (const recipe of recipes) {
    const imageUrl = await storeImage("recipes", recipe.id, recipe.name);
    if (imageUrl) {
      await admin
        .from("recipes")
        .update({ image_url: imageUrl })
        .eq("id", recipe.id);
      done += 1;
      console.log(`  [OK] ${recipe.name}`);
    } else {
      console.log(`  [sin match] ${recipe.name}`);
    }
    await sleep(DELAY_MS);
  }
  console.log(`Recetas actualizadas: ${done}/${recipes.length}`);
}

await backfillFoods();
await backfillRecipes();
