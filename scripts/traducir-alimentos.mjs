/**
 * Pone en español los nombres de los alimentos genéricos de USDA.
 *
 *   npm run traducir                  # escribe
 *   npm run traducir -- --seco        # sólo informa: cobertura y muestras
 *   npm run traducir -- --faltantes   # segmentos que más alimentos frenan
 *
 * POR QUÉ
 *
 * 27.073 de los 28.140 alimentos vienen de USDA con el nombre en inglés.
 * Quien busca «arroz» encontraba 38 filas; quien busca «rice», 198. El
 * catálogo era bueno y estaba escondido detrás del idioma.
 *
 * QUÉ HACE
 *
 * Traduce por segmentos con el diccionario de `datos/usda-es.mjs` (la regla
 * está allí: si un segmento no se conoce, el alimento no se traduce). Por
 * cada alimento traducido:
 *
 *   - `name` pasa a ser el nombre en español; `external_name` conserva el
 *     de USDA, que es el que permite rastrear el dato hasta su fuente.
 *   - Se guardan alias: el nombre en inglés (locale «en»), para que buscar
 *     «chicken» siga funcionando, y los sinónimos regionales (locale «es»)
 *     de la tabla SINONIMOS: banano/guineo, chile dulce/pimiento…
 *
 * Los valores nutricionales NO se tocan. Sólo cambia cómo se llama.
 *
 * IDEMPOTENTE: siempre traduce desde `external_name`, así que volver a
 * correrlo con el diccionario ampliado sólo añade y corrige.
 */
import { createClient } from "@supabase/supabase-js";
import { sinonimosDe, traducir } from "./datos/traductor.mjs";

const SECO = process.argv.includes("--seco");
const FALTANTES = process.argv.includes("--faltantes");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

async function todosLosGenericos() {
  const filas = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await db
      .from("foods")
      .select("id, name, external_name")
      .eq("external_source", "usda")
      .is("barcode", null)
      .order("id")
      .range(desde, desde + 999);
    if (error) throw error;
    filas.push(...data);
    if (data.length < 1000) break;
  }
  return filas;
}

const filas = await todosLosGenericos();
const faltan = [];
const traducidos = [];
for (const fila of filas) {
  const original = fila.external_name ?? fila.name;
  const es = traducir(original, faltan);
  if (es) traducidos.push({ ...fila, original, es });
}
console.log(
  `· ${traducidos.length} de ${filas.length} genéricos tienen traducción completa`,
);

if (FALTANTES) {
  const cuenta = new Map();
  for (const f of faltan) cuenta.set(f, (cuenta.get(f) ?? 0) + 1);
  for (const [seg, n] of [...cuenta].sort((a, b) => b[1] - a[1]).slice(0, 150))
    console.log(`${String(n).padStart(5)}  ${seg}`);
  process.exit(0);
}

if (SECO) {
  for (const t of traducidos.sort(() => Math.random() - 0.5).slice(0, 60))
    console.log(
      `${t.original}\n    → ${t.es}  [${sinonimosDe(t.es).join(", ")}]`,
    );
  process.exit(0);
}

/* Escritura por lotes. Los alias se reescriben enteros por alimento: así un
   sinónimo retirado del diccionario también se retira de la base. */
let hechos = 0;
for (let i = 0; i < traducidos.length; i += 200) {
  const lote = traducidos.slice(i, i + 200);
  await Promise.all(
    lote.map((t) =>
      db
        .from("foods")
        .update({ name: t.es.slice(0, 160), external_name: t.original })
        .eq("id", t.id)
        .then(({ error }) => {
          if (error) throw new Error(`${t.original}: ${error.message}`);
        }),
    ),
  );
  const ids = lote.map((t) => t.id);
  const { error: borrar } = await db
    .from("food_aliases")
    .delete()
    .in("food_id", ids);
  if (borrar) throw borrar;
  const alias = lote.flatMap((t) => [
    { food_id: t.id, alias: t.original.slice(0, 200), locale: "en" },
    ...sinonimosDe(t.es).map((a) => ({
      food_id: t.id,
      alias: a,
      locale: "es",
    })),
  ]);
  const { error: insertar } = await db.from("food_aliases").insert(alias);
  if (insertar) throw insertar;
  hechos += lote.length;
  process.stdout.write(`\r· escritos ${hechos}/${traducidos.length}   `);
}
console.log("\n· listo");
