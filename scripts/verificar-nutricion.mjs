/**
 * Verifica que los valores nutricionales del catálogo sean coherentes y
 * coincidan con una tabla oficial.
 *
 *   npm run verificar                      # resumen en consola
 *   npm run verificar -- --json=salida.json  # además, el detalle completo
 *
 * TRES PRUEBAS
 *
 * A. Coherencia interna, sobre TODO el catálogo. La energía de un alimento
 *    sale de sus macronutrientes: 4 kcal por gramo de proteína y de
 *    carbohidrato, 9 por gramo de grasa (factores de Atwater). Si las kcal
 *    declaradas se alejan mucho de eso, una de las cifras está mal: el caso
 *    típico es una etiqueta con el valor por porción en la casilla de 100 g.
 *    También se marcan los imposibles: más de 100 g de macros en 100 g, o
 *    más de 900 kcal (la grasa pura).
 *
 *    La tolerancia es amplia a propósito: 20 % y al menos 20 kcal. Los
 *    factores de Atwater son generales; USDA usa factores específicos por
 *    alimento, la fibra aporta menos de 4 kcal/g y el alcohol 7. Una
 *    diferencia pequeña es método, no error.
 *
 * B. Contraste con la Tabla de Composición de Alimentos de Centroamérica
 *    (INCAP/OPS, 2.ª ed., 3.ª reimpresión 2012), para alimentos básicos que se
 *    comen en Costa Rica, incluidos los de la dieta de demostración. Los
 *    valores de INCAP van escritos aquí con su código, copiados de la tabla
 *    (parte II, «Composición de alimentos en 100 gramos de porción
 *    comestible»), para que la prueba no dependa de descargar el PDF.
 *    Ojo: INCAP toma parte de sus datos de USDA SR18, así que para algunos
 *    alimentos el acuerdo no es independiente; para los centroamericanos
 *    (tortilla, chayote, yuca, plátano…) sí trae análisis propios.
 *
 * C. Productos de Costa Rica (código 744) de Open Food Facts: la prueba A
 *    aplicada a lo que la comunidad copió de las etiquetas.
 *
 * Sólo lee. No corrige nada: una cifra marcada se revisa contra su fuente.
 */
import { writeFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const JSON_OUT = process.argv
  .find((a) => a.startsWith("--json="))
  ?.split("=")[1];
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const TOLERANCIA_PCT = 20;
const TOLERANCIA_KCAL = 20;

/* [código INCAP, nombre INCAP, kcal, proteína, grasa, carbohidratos] y con
   qué fila del catálogo se compara: `usda` es el nombre original de USDA
   (external_name), `demo` el nombre del alimento de demostración. */
const INCAP = [
  [
    1015,
    "Leche de vaca, íntegra, fluida (3,25 % grasa)",
    60,
    3.22,
    3.25,
    4.52,
    { usda: "Milk, whole, 3.25% milkfat, with added vitamin D" },
  ],
  [
    1010,
    "Leche de vaca, semidescremada (2 % grasa), fluida",
    50,
    3.3,
    1.97,
    4.68,
    {
      usda: "Milk, reduced fat, fluid, 2% milkfat, with added vitamin A and vitamin D",
    },
  ],
  [
    1029,
    "Queso blanco fresco, leche íntegra",
    264,
    17.5,
    20.1,
    3.3,
    { demo: "Queso fresco" },
  ],
  [
    2002,
    "Huevo de gallina, entero, crudo",
    147,
    12.58,
    9.94,
    0.77,
    { usda: "Egg, whole, raw, fresh" },
  ],
  [
    2004,
    "Huevo de gallina, clara fresca",
    52,
    10.9,
    0.17,
    0.73,
    { usda: "Egg, white, raw, fresh" },
  ],
  [
    2004,
    "Huevo de gallina, clara fresca",
    52,
    10.9,
    0.17,
    0.73,
    { demo: "Clara de huevo" },
  ],
  [
    21038,
    "Huevos, cocidos o duros",
    155,
    12.58,
    10.61,
    1.12,
    { demo: "Huevo entero" },
  ],
  [
    3023,
    "Pollo, carne sin piel, cruda",
    119,
    21.39,
    3.08,
    0,
    { usda: "Chicken, broilers or fryers, meat only, raw" },
  ],
  [
    3038,
    "Pollo, pechuga con piel, cruda",
    172,
    20.85,
    9.25,
    0,
    { usda: "Chicken, broilers or fryers, breast, meat and skin, raw" },
  ],
  [
    3039,
    "Pollo, pechuga sin piel, cocida",
    151,
    28.98,
    3.03,
    0,
    { usda: "Chicken, broilers or fryers, breast, meat only, cooked, roasted" },
  ],
  [
    3039,
    "Pollo, pechuga sin piel, cocida",
    151,
    28.98,
    3.03,
    0,
    { demo: "Pechuga de pollo" },
  ],
  [
    3036,
    "Pollo, muslo sin piel, cocido",
    195,
    25.0,
    9.79,
    0,
    { usda: "Chicken, broilers or fryers, thigh, meat only, cooked, roasted" },
  ],
  [
    8020,
    "Atún enlatado en agua, sólidos",
    128,
    23.62,
    2.97,
    0,
    { demo: "Atun en agua" },
  ],
  [
    9035,
    "Frijol rojo, cocido sin sal",
    127,
    8.67,
    0.5,
    22.8,
    { usda: "Beans, kidney, red, mature seeds, cooked, boiled, without salt" },
  ],
  [
    11005,
    "Aguacate",
    160,
    2.0,
    14.66,
    8.53,
    { usda: "Avocados, raw, all commercial varieties" },
  ],
  [11005, "Aguacate", 160, 2.0, 14.66, 8.53, { demo: "Aguacate" }],
  [11027, "Brócoli crudo", 34, 2.82, 0.37, 6.64, { usda: "Broccoli, raw" }],
  [
    11028,
    "Brócoli cocido sin sal, escurrido",
    35,
    2.38,
    0.41,
    7.18,
    { demo: "Brocoli" },
  ],
  [11047, "Chayote crudo", 31, 0.9, 0.2, 7.7, { usda: "Chayote, fruit, raw" }],
  [
    11048,
    "Chayote cocido sin sal, escurrido",
    24,
    0.62,
    0.48,
    5.09,
    { usda: "Chayote, fruit, cooked, boiled, drained, without salt" },
  ],
  [
    11071,
    "Ejotes/vainicas, crudos",
    31,
    1.82,
    0.12,
    7.13,
    { usda: "Beans, snap, green, raw" },
  ],
  [
    11034,
    "Camote anaranjado cocido, sin cáscara, sin sal",
    76,
    1.37,
    0.14,
    17.72,
    { usda: "Sweet potato, cooked, boiled, without skin" },
  ],
  [
    11034,
    "Camote anaranjado cocido, sin cáscara, sin sal",
    76,
    1.37,
    0.14,
    17.72,
    { demo: "Camote" },
  ],
  [
    11075,
    "Elote, amarillo dulce, crudo",
    86,
    3.22,
    1.18,
    19.02,
    { usda: "Corn, sweet, yellow, raw" },
  ],
  [
    11150,
    "Repollo común, crudo",
    24,
    1.21,
    0.18,
    5.37,
    { usda: "Cabbage, raw" },
  ],
  [
    11167,
    "Yuca o mandioca, raíz",
    160,
    1.36,
    0.28,
    38.06,
    { usda: "Cassava, raw" },
  ],
  [
    11112,
    "Malanga/otoe, raíz cruda",
    132,
    1.7,
    0.3,
    30.9,
    { usda: "Taro, raw" },
  ],
  [
    11125,
    "Palmito sin corteza",
    26,
    2.2,
    0.2,
    5.2,
    { usda: "Hearts of palm, raw" },
  ],
  [
    12010,
    "Banano/guineo, maduro",
    89,
    1.09,
    0.33,
    22.84,
    { usda: "Bananas, raw" },
  ],
  [12010, "Banano/guineo, maduro", 89, 1.09, 0.33, 22.84, { demo: "Banano" }],
  [
    12052,
    "Guayaba madura",
    51,
    0.8,
    0.6,
    11.9,
    { usda: "Guavas, common, raw" },
  ],
  [12080, "Mango maduro", 59, 0.5, 0.2, 15.4, { usda: "Mangos, raw" }],
  [
    12112,
    "Papaya madura, pulpa",
    39,
    0.61,
    0.14,
    9.81,
    { usda: "Papayas, raw" },
  ],
  [
    12159,
    "Piña, toda variedad",
    48,
    0.54,
    0.12,
    12.63,
    { usda: "Pineapple, raw, all varieties" },
  ],
  [
    12130,
    "Plátano maduro",
    122,
    1.3,
    0.37,
    31.89,
    { usda: "Plantains, yellow, raw" },
  ],
  [
    12131,
    "Plátano verde",
    132,
    1.2,
    0.1,
    35.3,
    { usda: "Plantains, green, raw" },
  ],
  [12134, "Sandía", 30, 0.61, 0.15, 7.55, { usda: "Watermelon, raw" }],
  [
    12086,
    "Manzana importada, con cáscara",
    52,
    0.26,
    0.17,
    13.81,
    { demo: "Manzana" },
  ],
  [
    13002,
    "Arroz blanco, pulido, enriquecido",
    360,
    6.61,
    0.58,
    79.34,
    { demo: "Arroz blanco", estado: "crudo" },
  ],
  [
    13008,
    "Avena en hojuelas sin fortificar",
    389,
    16.89,
    6.9,
    66.27,
    { usda: "Cereals, oats, regular and quick, not fortified, dry" },
  ],
  [
    13008,
    "Avena en hojuelas sin fortificar",
    389,
    16.89,
    6.9,
    66.27,
    { demo: "Avena en hojuelas" },
  ],
  [
    14074,
    "Tortilla de maíz blanco, Costa Rica, casera",
    175,
    4.8,
    0.7,
    43.8,
    { demo: "Tortilla de maiz" },
  ],
  [
    14075,
    "Tortilla de maíz blanco, Costa Rica, industrial",
    193,
    5.1,
    1.1,
    47.7,
    { usda: "Tortillas, ready-to-bake or -fry, corn" },
  ],
  [
    14040,
    "Pan integral, de rodaja, suave",
    246,
    9.7,
    4.2,
    46.1,
    { demo: "Pan integral" },
  ],
  [10001, "Almendra, seca", 581, 21.94, 50.62, 19.94, { demo: "Almendras" }],
  [
    15001,
    "Azúcar blanca, granulada",
    384,
    0,
    0,
    99.1,
    { usda: "Sugars, granulated" },
  ],
];

const atwater = (f) => 4 * f.p + 4 * f.c + 9 * f.g;
function revisar(f) {
  const motivos = [];
  if (f.kcal > 900) motivos.push("más de 900 kcal por 100");
  if (f.p + f.c + f.g > 102) motivos.push("más de 100 g de macros por 100");
  const esperado = atwater(f);
  const dif = Math.abs(f.kcal - esperado);
  const pct = (dif / Math.max(f.kcal, esperado, 1)) * 100;
  if (dif > TOLERANCIA_KCAL && pct > TOLERANCIA_PCT)
    motivos.push(
      `energía ${Math.round(f.kcal)} kcal frente a ${Math.round(esperado)} por macros (${Math.round(pct)} %)`,
    );
  return motivos;
}

async function catalogo() {
  const filas = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await db
      .from("foods")
      .select(
        "id, name, external_name, external_source, barcode, source, cooked_state, calories, protein_g, carbohydrate_g, fat_g",
      )
      .is("deleted_at", null)
      .order("id")
      .range(desde, desde + 999);
    if (error) throw error;
    filas.push(...data);
    if (data.length < 1000) break;
  }
  return filas.map((f) => ({
    ...f,
    kcal: Number(f.calories),
    p: Number(f.protein_g),
    c: Number(f.carbohydrate_g),
    g: Number(f.fat_g),
    fuente:
      f.external_source === "usda"
        ? f.barcode
          ? "USDA marca"
          : "USDA genérico"
        : f.external_source === "openfoodfacts"
          ? "Open Food Facts"
          : (f.source ?? "Propio"),
  }));
}

const filas = await catalogo();

/* A ─────────────────────────────────────────────────────────────────────── */
const porFuente = new Map();
const marcados = [];
for (const f of filas) {
  const motivos = revisar(f);
  const r = porFuente.get(f.fuente) ?? { total: 0, marcados: 0 };
  r.total += 1;
  if (motivos.length) {
    r.marcados += 1;
    marcados.push({
      id: f.id,
      nombre: f.name,
      fuente: f.fuente,
      barcode: f.barcode,
      kcal: f.kcal,
      p: f.p,
      c: f.c,
      g: f.g,
      motivos,
    });
  }
  porFuente.set(f.fuente, r);
}
console.log("\nA. Coherencia energía/macros (tolerancia 20 % y 20 kcal)");
for (const [fuente, r] of porFuente)
  console.log(
    `   ${fuente.padEnd(22)} ${String(r.total).padStart(6)} alimentos · ${String(r.marcados).padStart(5)} marcados (${((r.marcados / r.total) * 100).toFixed(1)} %)`,
  );

/* B ─────────────────────────────────────────────────────────────────────── */
const pares = [];
for (const [codigo, nombreIncap, kcal, p, g, c, destino] of INCAP) {
  const f = destino.usda
    ? filas.find((x) => x.external_name === destino.usda && !x.barcode)
    : filas.find(
        (x) =>
          x.name === destino.demo &&
          x.source === "Datos demostrativos" &&
          (!destino.estado || x.cooked_state === destino.estado),
      );
  if (!f) {
    console.log(
      `   ! sin pareja en el catálogo: ${destino.usda ?? destino.demo}`,
    );
    continue;
  }
  const d = (a, b) => a - b;
  const pct = (a, b) =>
    Math.max(Math.abs(a), Math.abs(b)) < 1e-9 ? 0 : ((a - b) / b) * 100;
  pares.push({
    incap: { codigo, nombre: nombreIncap, kcal, p, g, c },
    pancis: {
      nombre: f.name,
      fuente: destino.usda ? "USDA" : "Demostración",
      kcal: f.kcal,
      p: f.p,
      g: f.g,
      c: f.c,
    },
    difKcalPct: pct(f.kcal, kcal),
    difP: d(f.p, p),
    difG: d(f.g, g),
    difC: d(f.c, c),
  });
}
/* Un par coincide si las kcal difieren ≤ 10 % y cada macro ≤ 2 g (o ≤ 10 %
   cuando el valor es grande). Es más estricto que la prueba A: aquí se
   compara el mismo alimento medido por dos laboratorios. */
const coincide = (x) =>
  Math.abs(x.difKcalPct) <= 10 &&
  [
    ["p", x.difP],
    ["g", x.difG],
    ["c", x.difC],
  ].every(
    ([k, dif]) => Math.abs(dif) <= Math.max(2, Math.abs(x.incap[k]) * 0.1),
  );
for (const x of pares) x.coincide = coincide(x);
console.log(
  `\nB. Contra INCAP: ${pares.filter((x) => x.coincide).length} de ${pares.length} pares coinciden (kcal ≤ 10 %, macros ≤ 2 g o 10 %)`,
);
for (const x of pares.filter((y) => !y.coincide))
  console.log(
    `   ✗ ${x.pancis.nombre} (${x.pancis.fuente}) ${x.pancis.kcal} kcal / INCAP ${x.incap.codigo} ${x.incap.kcal} kcal · P ${x.difP.toFixed(1)} G ${x.difG.toFixed(1)} C ${x.difC.toFixed(1)}`,
  );

/* C ─────────────────────────────────────────────────────────────────────── */
const ticos = filas.filter((f) => f.barcode?.startsWith("744"));
const ticosMarcados = marcados.filter((m) => m.barcode?.startsWith("744"));
console.log(
  `\nC. Productos con código de Costa Rica (744): ${ticos.length}, marcados ${ticosMarcados.length} (${((ticosMarcados.length / ticos.length) * 100).toFixed(1)} %)`,
);
for (const m of ticosMarcados.slice(0, 15))
  console.log(`   · ${m.nombre}: ${m.motivos.join("; ")}`);

if (JSON_OUT) {
  writeFileSync(
    JSON_OUT,
    JSON.stringify(
      {
        fecha: new Date().toISOString(),
        tolerancia: { pct: TOLERANCIA_PCT, kcal: TOLERANCIA_KCAL },
        porFuente: Object.fromEntries(porFuente),
        marcados,
        pares,
        ticos: { total: ticos.length, marcados: ticosMarcados },
      },
      null,
      1,
    ),
  );
  console.log(`\n· detalle en ${JSON_OUT}`);
}
