/**
 * Rellena lo que hace falta para medir en algo más que gramos.
 *
 *   npm run unidades                 # escribe
 *   npm run unidades -- --seco       # sólo informa
 *   npm run unidades -- --solo=usda  # o --solo=off
 *
 * USDA (genéricos ya traducidos): sus porciones caseras medidas («1 cup =
 * 202 g») pasan a `food_portions` en español, y de las de volumen sale la
 * densidad. Con ella la app puede ofrecer tazas y cucharadas sin inventar
 * cuánto pesan.
 *
 * Open Food Facts: si el envase se mide en volumen (355 ml, 1 l), los valores
 * de la etiqueta son por 100 ml, y se marca `nutrition_basis = '100ml'`. La
 * porción declarada y el envase entero se guardan como porciones.
 *
 * Los valores nutricionales NO se tocan.
 *
 * IDEMPOTENTE: borra y reescribe las porciones de su propia fuente; las que
 * escribió una persona (`source = 'usuario'`) no se tocan nunca.
 */
import { Resolver } from "node:dns";
import https from "node:https";
import { createClient } from "@supabase/supabase-js";
import { densidadDe, traducirPorcion } from "./datos/porciones.mjs";

const SECO = process.argv.includes("--seco");
const SOLO = process.argv.find((a) => a.startsWith("--solo="))?.split("=")[1];
const USDA_KEY = process.env.USDA_API_KEY;
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const USER_AGENT =
  "PancisHub/0.1 (nutrition tracker; https://github.com/adrianmasiss/pancis-hub)";

/* Si el resolvedor del sistema falla con un dominio (pasó con
   api.nal.usda.gov el 13 oct 2026: `nslookup` lo resolvía y `fetch` no), se
   pregunta a un DNS público y se conecta a esa IP con el nombre original, así
   que el certificado se sigue validando. */
const publico = new Resolver();
publico.setServers(["1.1.1.1", "8.8.8.8"]);
async function pedirJson(url, init = {}) {
  try {
    const r = await fetch(url, init);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } catch (error) {
    const codigo = error?.cause?.code;
    if (codigo !== "ENOTFOUND" && codigo !== "EAI_AGAIN") throw error;
    const u = new URL(url);
    const [ip] = await new Promise((ok, mal) =>
      publico.resolve4(u.hostname, (e, a) => (e ? mal(e) : ok(a))),
    );
    return new Promise((ok, mal) => {
      const req = https.request(
        {
          host: ip,
          servername: u.hostname,
          path: u.pathname + u.search,
          method: init.method ?? "GET",
          headers: { Host: u.hostname, ...(init.headers ?? {}) },
          timeout: 30000,
        },
        (res) => {
          let cuerpo = "";
          res.on("data", (c) => (cuerpo += c));
          res.on("end", () =>
            res.statusCode >= 400
              ? mal(new Error(`HTTP ${res.statusCode}`))
              : ok(JSON.parse(cuerpo)),
          );
        },
      );
      req.on("error", mal);
      if (init.body) req.write(init.body);
      req.end();
    });
  }
}

async function todos(filtro) {
  const filas = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await filtro(
      db.from("foods").select("id, name, external_id, external_name"),
    ).range(desde, desde + 999);
    if (error) throw error;
    filas.push(...data);
    if (data.length < 1000) break;
  }
  return filas;
}

async function escribirPorciones(fuente, porFood) {
  const ids = [...porFood.keys()];
  if (SECO || ids.length === 0) return;
  const { error: e1 } = await db
    .from("food_portions")
    .delete()
    .in("food_id", ids)
    .eq("source", fuente);
  if (e1) throw e1;
  const filas = [...porFood].flatMap(([food_id, lista]) =>
    lista.map((p) => ({
      food_id,
      label: p.rotulo.slice(0, 60),
      grams: Math.round(p.gramos * 10) / 10,
      household_measure: p.original?.slice(0, 60) ?? null,
      source: fuente,
    })),
  );
  if (filas.length === 0) return;
  const { error: e2 } = await db.from("food_portions").insert(filas);
  if (e2) throw e2;
}

/* ── USDA ──────────────────────────────────────────────────────────────── */
function textoDePorcion(p) {
  // FNDDS describe la porción entera en `portionDescription` y usa
  // `modifier` para un código numérico interno.
  if (p.portionDescription) return p.portionDescription;
  const unidad = p.measureUnit?.name;
  const base =
    unidad && unidad !== "undetermined"
      ? `${p.amount ?? 1} ${unidad}${p.modifier ? `, ${p.modifier}` : ""}`
      : `${p.amount ?? 1} ${p.modifier ?? ""}`;
  return base.trim();
}

async function usda() {
  if (!USDA_KEY) return console.log("· USDA omitido: falta USDA_API_KEY");
  // Sólo los traducidos: son los que se encuentran buscando en español, y
  // una porción en español junto a un nombre en inglés no ayuda a nadie.
  const filas = (
    await todos((q) =>
      q.eq("external_source", "usda").is("barcode", null).order("id"),
    )
  ).filter((f) => f.external_name && f.name !== f.external_name);
  console.log(`· USDA: ${filas.length} genéricos traducidos`);
  let conPorcion = 0;
  let conDensidad = 0;
  for (let i = 0; i < filas.length; i += 20) {
    const lote = filas.slice(i, i + 20);
    const porId = new Map(lote.map((f) => [Number(f.external_id), f]));
    let respuesta;
    for (let intento = 1; ; intento += 1) {
      try {
        respuesta = await pedirJson(
          `https://api.nal.usda.gov/fdc/v1/foods?api_key=${USDA_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fdcIds: [...porId.keys()], format: "full" }),
          },
        );
        break;
      } catch (error) {
        if (intento === 3) {
          console.log(`\n  ! lote ${i}: ${error.message}`);
          respuesta = [];
          break;
        }
        await dormir(3000 * intento);
      }
    }
    const porFood = new Map();
    const densidades = [];
    for (const f of respuesta ?? []) {
      const fila = porId.get(f.fdcId);
      if (!fila) continue;
      const vistas = new Set();
      const lista = [];
      for (const p of f.foodPortions ?? []) {
        if (!(p.gramWeight > 0)) continue;
        const original = textoDePorcion(p);
        const t = traducirPorcion(original);
        if (!t || vistas.has(t.rotulo)) continue;
        vistas.add(t.rotulo);
        lista.push({ ...t, gramos: p.gramWeight, original });
      }
      porFood.set(fila.id, lista.slice(0, 8));
      if (lista.length) conPorcion += 1;
      const d = densidadDe(lista);
      if (d) {
        conDensidad += 1;
        densidades.push({ id: fila.id, d });
      }
    }
    await escribirPorciones("usda", porFood);
    if (!SECO)
      await Promise.all(
        densidades.map(({ id, d }) =>
          db.from("foods").update({ density_g_per_ml: d }).eq("id", id),
        ),
      );
    process.stdout.write(
      `\r· USDA ${Math.min(i + 20, filas.length)}/${filas.length} · con porciones ${conPorcion} · con densidad ${conDensidad}   `,
    );
    await dormir(350);
  }
  console.log();
}

/* ── Open Food Facts ───────────────────────────────────────────────────── */
/* «355 ml», «1 l», «3.785L», «12 fl oz». */
function volumen(texto) {
  const m = String(texto ?? "")
    .toLowerCase()
    .replace(",", ".")
    .match(/(\d+(?:\.\d+)?)\s*(ml|cl|lt|l|litros?|fl\.?\s?oz)\b/);
  if (!m) return null;
  const n = Number(m[1]);
  const factor = {
    ml: 1,
    cl: 10,
    l: 1000,
    lt: 1000,
    litro: 1000,
    litros: 1000,
  };
  const ml = m[2].startsWith("fl") ? n * 29.574 : n * (factor[m[2]] ?? 1);
  return ml > 0 ? ml : null;
}
function masa(texto) {
  const m = String(texto ?? "")
    .toLowerCase()
    .replace(",", ".")
    .match(/(\d+(?:\.\d+)?)\s*(g|gr|kg)\b/);
  if (!m) return null;
  return Number(m[1]) * (m[2] === "kg" ? 1000 : 1);
}
const redondo = (n) => new Intl.NumberFormat("es-CR").format(Math.round(n));

async function off() {
  const filas = await todos((q) =>
    q.eq("external_source", "openfoodfacts").order("id"),
  );
  console.log(`· Open Food Facts: ${filas.length} productos`);
  let enVolumen = 0;
  let conPorcion = 0;
  for (let i = 0; i < filas.length; i += 50) {
    const lote = filas.slice(i, i + 50);
    const porCodigo = new Map(lote.map((f) => [f.external_id, f]));
    const u = new URL("https://search.openfoodfacts.org/search");
    u.searchParams.set("q", `code:(${[...porCodigo.keys()].join(" OR ")})`);
    u.searchParams.set("page_size", "100");
    u.searchParams.set(
      "fields",
      "code,quantity,product_quantity_unit,serving_size,serving_quantity,serving_quantity_unit,categories_tags",
    );
    let hits = [];
    try {
      hits = (await pedirJson(u, { headers: { "User-Agent": USER_AGENT } }))
        .hits;
    } catch (error) {
      console.log(`\n  ! lote ${i}: ${error.message}`);
    }
    const porFood = new Map();
    const liquidos = [];
    for (const h of hits ?? []) {
      const fila = porCodigo.get(h.code);
      if (!fila) continue;
      const ml =
        h.product_quantity_unit === "ml"
          ? (volumen(`${h.quantity}`) ?? volumen(`${h.quantity} ml`))
          : volumen(h.quantity);
      /* Muchos productos ticos no traen cantidad. Entonces decide la
         categoría: una bebida o una leche se etiqueta por 100 ml, salvo las
         que se venden en polvo, condensadas o concentradas. Si el envase
         dice gramos, manda el envase. */
      const cats = h.categories_tags ?? [];
      const bebida =
        cats.some((c) =>
          /^en:(beverages|milks|plant-based-milks|drinks)/.test(c),
        ) &&
        !cats.some((c) =>
          /powder|condensed|dried|instant|concentrate|syrup|mix/.test(c),
        );
      const liquido =
        ml !== null ||
        h.product_quantity_unit === "ml" ||
        (bebida && masa(h.quantity) === null);
      if (liquido) liquidos.push(fila.id);
      const lista = [];
      /* La porción de la etiqueta. En una bebida viene en ml y se guarda
         como gramos a 1 g/ml; la ficha lo dice con «≈». */
      const porcion = Number(h.serving_quantity);
      if (porcion > 0 && porcion < 2000) {
        const unidad = liquido ? "ml" : "g";
        lista.push({
          rotulo: `1 porción (${redondo(porcion)} ${unidad})`,
          gramos: porcion,
          original: h.serving_size ?? null,
        });
      }
      /* El envase entero, si es de los que se comen o beben de una vez. Un
         galón de leche no es una porción. */
      const envase = liquido ? ml : masa(h.quantity);
      if (envase && envase <= 1000 && envase !== porcion)
        lista.push({
          rotulo: `1 envase (${redondo(envase)} ${liquido ? "ml" : "g"})`,
          gramos: envase,
          original: h.quantity ?? null,
        });
      porFood.set(fila.id, lista);
      if (lista.length) conPorcion += 1;
    }
    enVolumen += liquidos.length;
    await escribirPorciones("openfoodfacts", porFood);
    if (!SECO && liquidos.length) {
      const { error } = await db
        .from("foods")
        .update({ nutrition_basis: "100ml" })
        .in("id", liquidos);
      if (error) throw error;
    }
    process.stdout.write(
      `\r· OFF ${Math.min(i + 50, filas.length)}/${filas.length} · por 100 ml ${enVolumen} · con porciones ${conPorcion}   `,
    );
    await dormir(1500);
  }
  console.log();
}

if (!SOLO || SOLO === "usda") await usda();
if (!SOLO || SOLO === "off") await off();
console.log(SECO ? "· en seco: nada escrito" : "· listo");
