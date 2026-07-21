/**
 * Importa imagenes de ejercicios desde free-exercise-db
 * (https://github.com/yuhonas/free-exercise-db, dominio publico).
 *
 * Descarga la posicion inicial y la final de cada ejercicio, las sube al
 * bucket exercise-images y guarda las URLs en exercise_catalog.
 *
 * El mapeo nombre-en-espanol -> ejercicio-de-la-fuente es EXPLICITO a
 * proposito: una coincidencia difusa acabaria asignando la imagen
 * equivocada, y en un modulo de biomecanica eso desinforma sobre la
 * tecnica. Si un ejercicio nuevo no esta en el mapa, se reporta y se
 * omite, nunca se adivina.
 *
 * Uso: node --env-file=.env.local scripts/import-exercise-images.mjs
 * Requiere: SUPABASE_SERVICE_ROLE_KEY. No usa ninguna API de pago.
 */
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  (() => {
    throw new Error("Define SUPABASE_SERVICE_ROLE_KEY");
  })();

const DATASET_URL =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMAGES_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises";
const BUCKET = "exercise-images";

/** Nombre en el catalogo -> nombre exacto en free-exercise-db. */
const EXERCISE_MAP = {
  "Sentadilla con barra": "Barbell Squat",
  "Peso muerto convencional": "Barbell Deadlift",
  "Press de banca": "Barbell Bench Press - Medium Grip",
  "Press militar": "Standing Military Press",
  "Remo con barra": "Bent Over Barbell Row",
  Dominadas: "Pullups",
  "Jalon al pecho": "Wide-Grip Lat Pulldown",
  Zancadas: "Dumbbell Lunges",
  "Hip thrust": "Barbell Hip Thrust",
  "Curl de biceps": "Dumbbell Bicep Curl",
  "Extension de triceps en polea": "Triceps Pushdown",
  "Elevaciones laterales": "Side Lateral Raise",
  "Prensa de pierna": "Leg Press",
  "Curl femoral": "Lying Leg Curls",
  Plancha: "Plank",
};

// Aviso explicito del destino: ambos scripts se ejecutan con
// --env-file=.env.local, que apunta a la base LOCAL. Es facil creer que
// se esta poblando produccion y estar escribiendo en Docker.
const isLocal = URL.includes("127.0.0.1") || URL.includes("localhost");
console.log(`Destino: ${URL} ${isLocal ? "(LOCAL)" : "(REMOTO)"}\n`);

const admin = createClient(URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function uploadImage(sourcePath, destinationPath) {
  const response = await fetch(`${IMAGES_BASE}/${sourcePath}`);
  if (!response.ok) {
    console.error(`  ! no se pudo descargar ${sourcePath}`, response.status);
    return null;
  }
  const buffer = await response.arrayBuffer();

  const { error } = await admin.storage
    .from(BUCKET)
    .upload(destinationPath, buffer, {
      contentType: "image/jpeg",
      upsert: true,
    });
  if (error) {
    console.error(`  ! no se pudo subir ${destinationPath}`, error.message);
    return null;
  }

  return admin.storage.from(BUCKET).getPublicUrl(destinationPath).data
    .publicUrl;
}

async function main() {
  console.log("Descargando catalogo de free-exercise-db…");
  const datasetResponse = await fetch(DATASET_URL);
  if (!datasetResponse.ok) {
    throw new Error(`No se pudo descargar el dataset: ${datasetResponse.status}`);
  }
  const dataset = await datasetResponse.json();
  const byName = new Map(dataset.map((item) => [item.name, item]));

  const { data: exercises, error } = await admin
    .from("exercise_catalog")
    .select("id, name, image_url")
    .is("deleted_at", null);
  if (error) throw error;

  let imported = 0;
  let skipped = 0;

  for (const exercise of exercises) {
    if (exercise.image_url) {
      console.log(`- ${exercise.name}: ya tiene imagen, se omite`);
      continue;
    }

    const sourceName = EXERCISE_MAP[exercise.name];
    if (!sourceName) {
      console.warn(`- ${exercise.name}: SIN MAPEO, se omite (agregalo a EXERCISE_MAP)`);
      skipped += 1;
      continue;
    }

    const source = byName.get(sourceName);
    if (!source?.images?.length) {
      console.warn(`- ${exercise.name}: "${sourceName}" no existe o no tiene imagenes`);
      skipped += 1;
      continue;
    }

    const startUrl = await uploadImage(
      source.images[0],
      `${exercise.id}/inicio.jpg`,
    );
    // La segunda imagen es opcional: algunos ejercicios solo traen una.
    const endUrl = source.images[1]
      ? await uploadImage(source.images[1], `${exercise.id}/fin.jpg`)
      : null;

    if (!startUrl) {
      skipped += 1;
      continue;
    }

    const { error: updateError } = await admin
      .from("exercise_catalog")
      .update({ image_url: startUrl, image_end_url: endUrl })
      .eq("id", exercise.id);
    if (updateError) {
      console.error(`  ! no se pudo actualizar ${exercise.name}`, updateError.message);
      skipped += 1;
      continue;
    }

    console.log(`- ${exercise.name}: importado desde "${sourceName}"`);
    imported += 1;
  }

  console.log(`\nListo. Importados: ${imported}. Omitidos: ${skipped}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
