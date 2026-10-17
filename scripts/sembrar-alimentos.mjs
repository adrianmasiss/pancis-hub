/**
 * Siembra la biblioteca de alimentos desde las fuentes abiertas.
 *
 *   npm run alimentos                 # siembra de verdad
 *   npm run alimentos -- --seco       # solo informa, no escribe
 *   npm run alimentos -- --solo=usda  # una sola fuente
 *   npm run alimentos -- --solo=cruce # pregunta a USDA por códigos ya guardados
 *   npm run alimentos -- --limite=200 # tope por fuente, para probar
 *
 * QUÉ TRAE
 *
 *   USDA FoodData Central — 13.615 alimentos medidos en laboratorio:
 *     Foundation (394), SR Legacy (7.793) y Survey/FNDDS (5.428, que son
 *     platos preparados). Es obra del gobierno de EE. UU.: dominio público,
 *     sin condiciones para copiar ni redistribuir.
 *
 *   Open Food Facts — los 2.791 productos de Costa Rica. Aquí está la comida
 *     tica que USDA no conoce. Licencia ODbL: obliga a atribuir y, si algún
 *     día se publica una base derivada, a compartirla igual. Por eso cada
 *     fila guarda su `external_source`: lo que viene de OFF queda
 *     identificable y separable.
 *
 * EL COTEJO ENTRE FUENTES
 *
 * Cuando dos fuentes describen el mismo alimento NO se promedia. El promedio
 * es un valor que no aparece en ningún informe, y la app tiene que poder
 * responder de dónde sale cada número. Se conserva el de la fuente más
 * fiable —USDA antes que Open Food Facts, por ser laboratorio frente a
 * aportación de comunidad— y lo que dijo la otra se apunta en
 * `food_source_values`. Con eso se muestra «365 kcal, USDA, corroborado por
 * OFF (362, difiere 0,8 %)» sin inventar nada.
 *
 * Si la diferencia pasa del umbral, el alimento queda marcado con su
 * `max_divergence_pct` para revisarlo. El caso típico no es una discrepancia
 * real sino un error de carga: alguien metió el valor por porción en la
 * casilla de por 100 g.
 *
 * IDEMPOTENTE: las filas se escriben por (external_source, external_id), que
 * tiene índice único. Volver a correrlo actualiza, no duplica.
 */
import { createClient } from "@supabase/supabase-js";
import { traducir } from "./datos/traductor.mjs";

const SECO = process.argv.includes("--seco");
const SOLO = process.argv.find((a) => a.startsWith("--solo="))?.split("=")[1];
const LIMITE = Number(
  process.argv.find((a) => a.startsWith("--limite="))?.split("=")[1] ??
    Infinity,
);

/** Por encima de esto, dos fuentes no se parecen y hay que mirar. */
const UMBRAL_DIVERGENCIA = 15;

const USDA_KEY = process.env.USDA_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const normalizar = (t) =>
  (t ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/* ── Clasificación mínima ──────────────────────────────────────────────── */
/* No se adivina más de lo que se puede: ante la duda, «otro». Un grupo
   inventado desordena los filtros sin aportar nada. */
const GRUPOS = [
  [
    /pollo|pavo|res|cerdo|carne|pescado|atun|huevo|jamon|chicken|beef|pork|fish|egg/,
    "proteina",
  ],
  [
    /arroz|pan|pasta|avena|tortilla|cereal|harina|rice|bread|oat|flour/,
    "carbohidrato",
  ],
  [/aceite|mantequilla|manteca|oil|butter|nuez|almendra|nut/, "grasa"],
  [/leche|queso|yogur|natilla|milk|cheese|yogurt|cream/, "lacteo"],
  [
    /manzana|banano|naranja|fresa|mango|piña|fruta|apple|banana|fruit|berry/,
    "fruta",
  ],
  [
    /lechuga|tomate|zanahoria|brocoli|espinaca|verdura|lettuce|carrot|broccoli|spinach/,
    "verdura",
  ],
  [/frijol|lenteja|garbanzo|bean|lentil|chickpea/, "legumbre"],
  [/agua|jugo|refresco|cafe|te |soda|juice|coffee|drink|beverage/, "bebida"],
];
function grupoDe(nombre) {
  const n = normalizar(nombre);
  for (const [patron, grupo] of GRUPOS) if (patron.test(n)) return grupo;
  return "otro";
}

/* ── USDA ──────────────────────────────────────────────────────────────── */
const NUTRIENTES = {
  1008: "calories",
  1003: "protein_g",
  1005: "carbohydrate_g",
  1004: "fat_g",
  1079: "fiber_g",
  2000: "sugar_g",
  1093: "sodium_mg",
};

function deUsda(f) {
  const valores = {};
  for (const n of f.foodNutrients ?? []) {
    const clave = NUTRIENTES[n.nutrientId ?? n.nutrient?.id];
    if (clave) valores[clave] = n.value ?? n.amount ?? null;
  }
  // Sin energía ni macros no sirve para un plan. Nunca se rellena con cero:
  // un cero inventado se suma a los totales del día como si fuera medido.
  if (
    valores.calories == null ||
    valores.protein_g == null ||
    valores.carbohydrate_g == null ||
    valores.fat_g == null
  )
    return null;
  const nombre = (f.description ?? "").trim();
  if (!nombre) return null;
  return {
    external_source: "usda",
    external_id: String(f.fdcId),
    external_name: nombre,
    /* Los genéricos se siembran ya en español (ver traducir-alimentos.mjs).
       Los de marca no: «CHICKEN BREAST» de una marca es un producto, y
       traducirlo le quitaría el nombre con el que se vende. */
    name: (!f.gtinUpc && traducir(nombre)) || nombre,
    brand: f.brandName ?? f.brandOwner ?? null,
    barcode: f.gtinUpc ?? null,
    food_group: grupoDe(nombre),
    calories: valores.calories,
    protein_g: valores.protein_g,
    carbohydrate_g: valores.carbohydrate_g,
    fat_g: valores.fat_g,
    fiber_g: valores.fiber_g ?? 0,
    sugar_g: valores.sugar_g ?? null,
    sodium_mg: valores.sodium_mg ?? null,
    source: "USDA FoodData Central",
    verified: true,
  };
}

async function traerUsda() {
  if (!USDA_KEY) {
    console.log("· USDA omitido: falta USDA_API_KEY");
    return [];
  }
  const salida = [];
  /* Los tres primeros son genéricos de laboratorio. «Branded» se añade porque
   es el ÚNICO de USDA que trae código de barras (`gtinUpc`), y el código de
   barras es lo único que permite afirmar que un producto de USDA y uno de Open
   Food Facts son el mismo: los nombres no sirven —aquí vienen en inglés y allá
   en español— y el parecido de nombres no es identidad. Sin Branded, el cotejo
   entre fuentes no tenía por dónde dispararse. */
  for (const tipo of ["Foundation", "SR Legacy", "Survey (FNDDS)", "Branded"]) {
    // Branded tiene cientos de miles de filas y aquí se quiere por el código
    // de barras, no por volumen: se le pone techo propio.
    const techo = tipo === "Branded" ? Math.min(LIMITE, 15000) : LIMITE;
    const antes = salida.length;
    let pagina = 1;
    for (;;) {
      if (salida.length >= LIMITE) break;
      if (salida.length - antes >= techo) break;
      const u = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
      u.searchParams.set("api_key", USDA_KEY);
      u.searchParams.set("query", "*");
      u.searchParams.set("dataType", tipo);
      u.searchParams.set("pageSize", "200");
      u.searchParams.set("pageNumber", String(pagina));
      const r = await fetch(u, { signal: AbortSignal.timeout(30000) });
      if (!r.ok) {
        console.log(`  ! ${tipo} pagina ${pagina}: HTTP ${r.status}`);
        // Una página mala no es el fin del tipo: se salta y se sigue.
        pagina += 1;
        if (pagina > 400) break;
        await dormir(2000);
        continue;
      }
      const j = await r.json();
      const lote = (j.foods ?? []).map(deUsda).filter(plausible);
      salida.push(...lote);
      process.stdout.write(`\r· USDA ${tipo}: ${salida.length}   `);
      if ((j.foods ?? []).length < 200) break;
      pagina += 1;
      await dormir(400); // La cuota es por hora; no hay prisa.
    }
  }
  console.log();
  return salida.slice(0, LIMITE);
}

/* ── Cruce dirigido por código de barras ───────────────────────────────── */
/**
 * Le pregunta a USDA por los códigos de barras que ya están en la base.
 *
 * Sembrar las dos fuentes por separado no las cruza nunca, y no por un fallo:
 * se midió. De 30 códigos ticos tomados al azar, USDA conocía 0 — el prefijo
 * `744` es el código de país de Costa Rica y una base estadounidense no lleva
 * registro tico. Pero 1 de cada 3 productos de aquí trae prefijo
 * estadounidense (`074`, `076`, `087`): son marcas importadas, y de ESAS USDA
 * sí puede tener su propia medición.
 *
 * Así que en vez de descargar más catálogo a ciegas esperando que algo
 * coincida, se pregunta por los códigos concretos que ya se tienen. Lo que
 * vuelva se agrupa por código de barras —identidad, no parecido— y queda como
 * corroboración del valor que ya había, o como discrepancia a revisar.
 *
 * Se salta el prefijo 744 a propósito: ya se sabe que no está, y gastar media
 * cuota diaria en preguntarlo sería tirar peticiones.
 */
async function cruzarPorCodigo() {
  if (!USDA_KEY) {
    console.log("· cruce omitido: falta USDA_API_KEY");
    return [];
  }
  const codigos = [];
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await db
      .from("foods")
      .select("barcode")
      .not("barcode", "is", null)
      .neq("external_source", "usda")
      .range(desde, desde + 999);
    if (error || !data?.length) break;
    codigos.push(...data.map((f) => f.barcode));
    if (data.length < 1000) break;
  }

  const porPreguntar = [
    ...new Set(
      codigos.filter((c) => !String(c).padStart(13, "0").startsWith("744")),
    ),
  ].slice(0, LIMITE === Infinity ? 1500 : LIMITE);

  console.log(
    `· cruce: ${porPreguntar.length} códigos por preguntar ` +
      `(de ${new Set(codigos).size}; los de prefijo 744 se saltan)`,
  );

  const salida = [];
  for (const [i, codigo] of porPreguntar.entries()) {
    const u = new URL("https://api.nal.usda.gov/fdc/v1/foods/search");
    u.searchParams.set("api_key", USDA_KEY);
    u.searchParams.set("query", codigo);
    u.searchParams.set("dataType", "Branded");
    u.searchParams.set("pageSize", "5");
    try {
      const r = await fetch(u, { signal: AbortSignal.timeout(20000) });
      if (r.ok) {
        const j = await r.json();
        // Sólo el que coincide EXACTO: el buscador de USDA es léxico y un
        // código parecido no es el mismo producto.
        const exacto = (j.foods ?? []).find(
          (x) => codigoNormal(x.gtinUpc ?? "") === codigoNormal(codigo),
        );
        const fila = exacto ? deUsda(exacto) : null;
        if (plausible(fila)) salida.push(fila);
      }
    } catch {
      /* Un código perdido no vale detener el cruce. */
    }
    if (i % 10 === 0)
      process.stdout.write(
        `\r· cruce: ${i + 1}/${porPreguntar.length}, hallados ${salida.length}   `,
      );
    await dormir(260);
  }
  console.log();
  return salida;
}

/* ── Open Food Facts (Costa Rica) ──────────────────────────────────────── */
const CAMPOS = [
  "code",
  "product_name",
  "product_name_es",
  "brands",
  "image_front_url",
  "nutriments",
].join(",");

/** La marca principal, venga como lista o como texto con comas. */
function primeraMarca(brands) {
  const primera = Array.isArray(brands)
    ? brands[0]
    : String(brands ?? "").split(",")[0];
  return primera?.trim() || null;
}

function deOff(p) {
  const nombre = (p.product_name_es || p.product_name || "").trim();
  if (!nombre) return null;
  const n = p.nutriments ?? {};
  const kcal = n["energy-kcal_100g"];
  const prot = n.proteins_100g;
  const carb = n.carbohydrates_100g;
  const gras = n.fat_100g;
  if (kcal == null || prot == null || carb == null || gras == null) return null;
  // Un alimento de más de 900 kcal/100 g no existe: el máximo teórico es
  // grasa pura, 900. Por encima, el dato está mal cargado.
  if (kcal > 900 || kcal < 0) return null;
  return {
    external_source: "openfoodfacts",
    external_id: String(p.code),
    external_name: nombre,
    name: nombre,
    // El buscador viejo daba «Dos Pinos, Dos Pinos CR»; el nuevo da una lista.
    brand: primeraMarca(p.brands),
    barcode: String(p.code),
    image_url: p.image_front_url ?? null,
    food_group: grupoDe(nombre),
    calories: kcal,
    protein_g: prot,
    carbohydrate_g: carb,
    fat_g: gras,
    fiber_g: n.fiber_100g ?? 0,
    sugar_g: n.sugars_100g ?? null,
    sodium_mg: n.sodium_100g != null ? n.sodium_100g * 1000 : null,
    source: "Open Food Facts (ODbL)",
    verified: false,
  };
}

/**
 * Open Food Facts, productos vendidos en Costa Rica.
 *
 * Usa `search.openfoodfacts.org` —su buscador nuevo— y no el
 * `/api/v2/search` de siempre. No es capricho: el viejo devuelve 503 en las
 * páginas profundas de esta consulta (la 11 y la 20 fallaron en todos los
 * intentos, y la 12 contestó 401), así que paginarlo entero es imposible y se
 * quedaba en 583 de los productos. El nuevo contestó 200 en todas, incluidas
 * las profundas, y entrega los mismos campos con los mismos nombres.
 */
async function traerOff() {
  const salida = [];
  let total = null;
  for (let pagina = 1; pagina <= 60; pagina += 1) {
    if (salida.length >= LIMITE) break;
    const u = new URL("https://search.openfoodfacts.org/search");
    u.searchParams.set("q", 'countries_tags:"en:costa-rica"');
    u.searchParams.set("page_size", "100");
    u.searchParams.set("page", String(pagina));
    u.searchParams.set("fields", CAMPOS);
    // Aun con el buscador bueno, un fallo suelto no debe costar la página.
    let j = null;
    for (let intento = 1; intento <= 3 && !j; intento += 1) {
      try {
        const r = await fetch(u, {
          headers: { "User-Agent": "PancisHub/1.0 (siembra de catalogo)" },
          signal: AbortSignal.timeout(30000),
        });
        if (r.ok) {
          j = await r.json();
          break;
        }
        if (intento === 3)
          console.log(`\n  ! OFF pagina ${pagina}: HTTP ${r.status}`);
      } catch (e) {
        if (intento === 3)
          console.log(`\n  ! OFF pagina ${pagina}: ${String(e).slice(0, 60)}`);
      }
      await dormir(intento * 2000);
    }
    if (!j) continue; // Página perdida; las siguientes pueden ir bien.

    if (total == null) total = j.count ?? null;
    const productos = j.hits ?? [];
    salida.push(...productos.map(deOff).filter(plausible));
    process.stdout.write(
      `\r· Open Food Facts (CR): ${salida.length}${total ? ` de ${total}` : ""}   `,
    );
    if (productos.length === 0) break;
    await dormir(700);
  }
  console.log();
  return salida.slice(0, LIMITE);
}

/* ── Lo que no puede ser verdad ────────────────────────────────────────── */
/**
 * Techos físicos por 100 g.
 *
 * No son preferencias: 100 g de grasa pura son 900 kcal, así que 3.000 kcal
 * por 100 g no es un alimento raro, es un error de carga —casi siempre el
 * valor por porción escrito en la casilla de por 100 g—. Y un macro no puede
 * pasar de 100 g en 100 g de comida. El tope del sodio es el de la sal pura,
 * unos 39.000 mg.
 *
 * Esto salió del catálogo «Branded» de USDA, que reventó la escritura entera
 * con «numeric field overflow» y se llevó por delante lotes de 500 filas
 * buenas. Descartar la fila es lo correcto y no recortarla al techo: un valor
 * ajustado a mano ya no es lo que dijo la fuente.
 */
const TECHOS = {
  calories: 1000,
  protein_g: 100,
  carbohydrate_g: 100,
  fat_g: 100,
  fiber_g: 100,
  sugar_g: 100,
  sodium_mg: 40000,
};

function plausible(fila) {
  if (!fila) return false;
  for (const [campo, techo] of Object.entries(TECHOS)) {
    const v = fila[campo];
    if (v == null) continue;
    if (!Number.isFinite(v) || v < 0 || v > techo) return false;
  }
  return true;
}

/* ── Cotejo ────────────────────────────────────────────────────────────── */
/**
 * Suelo por macro: por debajo de esto, la diferencia relativa miente.
 *
 * «Egg, white, dried» salía con 100 % de divergencia porque una fuente da
 * 0,0 g de grasa y otra 0,7 g. En porcentaje es el doble; en el plato no es
 * nada, y sus calorías sólo diferían un 1,6 %. Comparar porcentajes de
 * cantidades diminutas produce alarmas que no lo son y entierra las de
 * verdad.
 */
const SUELO = {
  calories: 20,
  protein_g: 2,
  carbohydrate_g: 2,
  fat_g: 2,
};

/**
 * Diferencia mínima para que un desacuerdo cambie algo.
 *
 * El suelo mira el valor mayor y no basta. «Cheese, Mexican blend» encabezaba
 * la cola de revisión con un 95,8 % que salía de 0,1 g contra 2,4 g de
 * carbohidratos: pasa el suelo (2,4 > 2) y en el plato no es nada. Sus
 * calorías difieren un 5,7 %, su proteína un 6,8 % y su grasa un 8,7 %, que es
 * la variación normal entre dos mediciones del mismo queso. El titular lo
 * producía el macro más pequeño, y una alarma así entierra las de verdad.
 *
 * Mismos valores que `src/features/foods/lib/source-agreement.ts`; si uno
 * cambia, el otro tiene que cambiar.
 */
const DIFERENCIA_MINIMA = {
  calories: 15,
  protein_g: 3,
  carbohydrate_g: 3,
  fat_g: 3,
};

/** Diferencia relativa entre dos valores, en por ciento. */
function divergencia(a, b, macro) {
  if (a == null || b == null) return null;
  const mayor = Math.max(Math.abs(a), Math.abs(b));
  if (mayor === 0) return 0;
  // Ambos pequeños: no hay desacuerdo que valga la pena mirar.
  if (mayor < (SUELO[macro] ?? 0)) return null;
  // Se parecen lo bastante como para que el porcentaje no importe.
  if (Math.abs(a - b) < (DIFERENCIA_MINIMA[macro] ?? 0)) return null;
  return (Math.abs(a - b) / mayor) * 100;
}

/**
 * Agrupa lo que es el mismo alimento.
 *
 * Por código de barras cuando lo hay: es identidad, no parecido.
 *
 * Si no lo hay, por nombre normalizado + grupo + MARCA. La marca no estaba y
 * tenía que estar: sin ella, el «Queso Crema» de una marca y el de otra caían
 * en el mismo grupo y salían con un 70 % de diferencia que no era desacuerdo
 * entre fuentes sino dos quesos distintos. Esa falsa fusión además elige mal
 * la fila canónica y ensucia la cola de revisión, que es justo lo que la cola
 * existe para no hacer. En los genéricos de USDA la marca es nula y el
 * agrupamiento queda como estaba.
 */
/**
 * El mismo código escrito de las dos maneras.
 *
 * USDA guarda el UPC estadounidense de 12 cifras («012345678905») y Open Food
 * Facts el EAN de 13 con el cero delante («0012345678905»). Son el mismo
 * producto y como texto no coinciden, así que se comparan sin los ceros de la
 * izquierda.
 */
function codigoNormal(codigo) {
  return String(codigo).replace(/\D/g, "").replace(/^0+/, "");
}

function agrupar(filas) {
  const grupos = new Map();
  for (const fila of filas) {
    const clave = fila.barcode
      ? `b:${codigoNormal(fila.barcode)}`
      : `n:${normalizar(fila.name)}|${fila.food_group}|${normalizar(fila.brand ?? "")}`;
    const lista = grupos.get(clave) ?? [];
    lista.push(fila);
    grupos.set(clave, lista);
  }
  return [...grupos.values()];
}

const PRIORIDAD = { usda: 0, openfoodfacts: 1, dietly: 2 };
const MACROS = ["calories", "protein_g", "carbohydrate_g", "fat_g"];

function resolver(grupo) {
  // USDA primero: laboratorio antes que aportación de comunidad.
  const ordenado = [...grupo].sort(
    (a, b) =>
      // Lo ya guardado conserva su identidad; dentro de cada bloque, USDA
      // primero: laboratorio antes que aportación de comunidad.
      Number(Boolean(b._enBase)) - Number(Boolean(a._enBase)) ||
      PRIORIDAD[a.external_source] - PRIORIDAD[b.external_source],
  );
  const canonico = ordenado[0];
  let maxDiv = null;
  for (const otro of ordenado.slice(1)) {
    for (const macro of MACROS) {
      const d = divergencia(canonico[macro], otro[macro], macro);
      if (d != null && (maxDiv == null || d > maxDiv)) maxDiv = d;
    }
  }
  return { canonico, otros: ordenado.slice(1), maxDiv };
}

/* ── Escritura ─────────────────────────────────────────────────────────── */
async function escribir(resueltos) {
  let escritos = 0;
  let cotejos = 0;
  let marcados = 0;
  for (let i = 0; i < resueltos.length; i += 500) {
    const lote = resueltos.slice(i, i + 500);
    const filas = lote.map(({ canonico, maxDiv }) => {
      const fila = { ...canonico };
      delete fila._enBase; // marca interna del agrupamiento, no columna.
      fila.max_divergence_pct =
        maxDiv == null ? null : Math.round(maxDiv * 10) / 10;
      return fila;
    });
    const { data, error } = await db
      .from("foods")
      .upsert(filas, { onConflict: "external_source,external_id" })
      .select("id, external_source, external_id");
    if (error) {
      console.log("\n  ! al escribir:", error.message);
      continue;
    }
    escritos += data.length;

    const porRef = new Map(
      data.map((f) => [`${f.external_source}:${f.external_id}`, f.id]),
    );
    const valores = [];
    for (const { canonico, otros } of lote) {
      const foodId = porRef.get(
        `${canonico.external_source}:${canonico.external_id}`,
      );
      if (!foodId) continue;
      for (const fuente of [canonico, ...otros]) {
        valores.push({
          food_id: foodId,
          source: fuente.external_source,
          external_id: fuente.external_id,
          external_name: fuente.external_name,
          calories: fuente.calories,
          protein_g: fuente.protein_g,
          carbohydrate_g: fuente.carbohydrate_g,
          fat_g: fuente.fat_g,
          fiber_g: fuente.fiber_g,
        });
      }
    }
    if (valores.length) {
      const { error: e2 } = await db
        .from("food_source_values")
        .upsert(valores, { onConflict: "food_id,source,external_id" });
      if (e2) console.log("\n  ! al cotejar:", e2.message);
      else cotejos += valores.length;
    }
    marcados += lote.filter(
      ({ maxDiv }) => maxDiv != null && maxDiv > UMBRAL_DIVERGENCIA,
    ).length;
    process.stdout.write(`\r· escritos: ${escritos}   `);
  }
  console.log();
  return { escritos, cotejos, marcados };
}

/* ── Lo que ya está en la base ─────────────────────────────────────────── */
/**
 * Trae el catálogo externo ya guardado para que entre en el cotejo.
 *
 * Antes la comparación sólo veía lo recogido en la misma corrida, así que
 * `--solo=off` informaba «con más de una fuente: 0» aunque los 7.830 de USDA
 * estuvieran ahí al lado. Cargarlos aquí es lo que permite sembrar por partes
 * y seguir cruzando fuentes.
 *
 * Estas filas se marcan con `_enBase` y tienen preferencia para ser la fila
 * canónica de su grupo: así una corrida nueva nunca desplaza la identidad de
 * un alimento que ya existe —ni crea un segundo registro del mismo— y lo que
 * aporta se guarda como valor de fuente.
 */
async function traerDeLaBase() {
  const salida = [];
  /* La fila entera, no una selección: cuando una ya guardada es la canónica
     se reescribe completa, y con media fila el upsert moría en «null value in
     column "verified"». Pedir todo es también lo que la deja a prueba de
     columnas nuevas. */
  const COLS = "*";
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await db
      .from("foods")
      .select(COLS)
      .not("external_source", "is", null)
      .range(desde, desde + 999);
    if (error) {
      console.log("  ! al leer la base:", error.message);
      break;
    }
    salida.push(
      ...data.map((f) => {
        const fila = { ...f, _enBase: true };
        /* Lo que pone la base por su cuenta se quita: el lote del upsert exige
           la misma forma en todos sus objetos, y una fila recién traída no
           tiene `id` —de ahí el «null value in column id» de antes—. */
        for (const columna of ["id", "created_at", "updated_at"])
          delete fila[columna];
        return fila;
      }),
    );
    process.stdout.write(`\r· ya en la base: ${salida.length}   `);
    if (data.length < 1000) break;
  }
  console.log();
  return salida;
}

/* ── Saneamiento ───────────────────────────────────────────────────────── */
/**
 * Recalcula `max_divergence_pct` de todos los alimentos a partir de lo
 * guardado en `food_source_values`.
 *
 * La divergencia es un hecho DERIVADO de los valores de fuente, y escribirla
 * sólo desde el agrupamiento de la corrida la volvía frágil en los dos
 * sentidos:
 *
 *  - Se borraba sola. Volver a sembrar OFF trae de nuevo el producto, pero no
 *    la fila de USDA —que vive en `food_source_values`, no en `foods`—, así
 *    que el grupo salía sin con qué comparar y el 63 % del Cap'n Crunch se
 *    perdía aunque las dos mediciones siguieran ahí.
 *  - Se quedaba de más. Una marca de una corrida anterior con criterios peores
 *    no se corregía nunca, porque el script sólo recalcula los grupos a los
 *    que llegó algo nuevo.
 *
 * Al leerlo de los valores guardados, el catálogo dice lo mismo sin importar
 * en qué orden ni a trozos se haya sembrado.
 */
async function recalcularDivergencias() {
  const paginar = async (tabla, cols) => {
    const filas = [];
    for (let desde = 0; ; desde += 1000) {
      const { data, error } = await db
        .from(tabla)
        .select(cols)
        .range(desde, desde + 999);
      if (error || !data?.length) break;
      filas.push(...data);
      if (data.length < 1000) break;
    }
    return filas;
  };

  const alimentos = await paginar(
    "foods",
    "id, external_source, external_id, max_divergence_pct",
  );
  const valores = await paginar(
    "food_source_values",
    "food_id, source, external_id, calories, protein_g, carbohydrate_g, fat_g",
  );

  const porAlimento = new Map();
  for (const v of valores) {
    const lista = porAlimento.get(v.food_id) ?? [];
    lista.push(v);
    porAlimento.set(v.food_id, lista);
  }

  const cambios = [];
  for (const alimento of alimentos) {
    const lista = porAlimento.get(alimento.id) ?? [];
    // Con una sola medición no hay desacuerdo posible, y un «difiere 17 %»
    // sin con qué diferir es un número que no se puede sostener.
    const ref =
      lista.find(
        (v) =>
          v.source === alimento.external_source &&
          v.external_id === alimento.external_id,
      ) ?? lista[0];
    let maxDiv = null;
    if (ref && lista.length > 1)
      for (const otro of lista) {
        if (otro === ref) continue;
        for (const macro of MACROS) {
          const d = divergencia(ref[macro], otro[macro], macro);
          if (d != null && (maxDiv == null || d > maxDiv)) maxDiv = d;
        }
      }
    const nuevo = maxDiv == null ? null : Math.round(maxDiv * 10) / 10;
    if (nuevo !== alimento.max_divergence_pct)
      cambios.push({ id: alimento.id, max_divergence_pct: nuevo });
  }

  for (const cambio of cambios)
    await db
      .from("foods")
      .update({ max_divergence_pct: cambio.max_divergence_pct })
      .eq("id", cambio.id);
  return cambios.length;
}

/* ── Principal ─────────────────────────────────────────────────────────── */
const fuentes = [];
if (SOLO === "cruce") fuentes.push(cruzarPorCodigo());
else {
  if (!SOLO || SOLO === "usda") fuentes.push(traerUsda());
  if (!SOLO || SOLO === "off") fuentes.push(traerOff());
}

const crudas = (await Promise.all(fuentes)).flat();
console.log(`\nRecogidos: ${crudas.length} alimentos de las fuentes.`);

const enBase = SECO ? [] : await traerDeLaBase();

/**
 * Funde cada fila con su propia copia guardada antes de agrupar.
 *
 * Sin esto, volver a recoger una fuente hacía que cada producto se cotejara
 * CONSIGO MISMO: el mismo (fuente, id) aparecía dos veces en el grupo, el
 * recuento de «más de una fuente» subía a casi todo lo recogido y el cotejo
 * moría en «ON CONFLICT DO UPDATE no puede afectar la misma fila dos veces».
 * Gana el valor recién traído —es el más reciente—, pero conserva la marca de
 * que ya estaba en la base, que es lo que le da preferencia como canónica.
 */
function fundirCopias(filas) {
  const porRef = new Map();
  for (const fila of filas) {
    const ref = `${fila.external_source}:${fila.external_id}`;
    const previa = porRef.get(ref);
    if (!previa) porRef.set(ref, fila);
    else if (previa._enBase && !fila._enBase)
      porRef.set(ref, { ...fila, _enBase: true });
  }
  return [...porRef.values()];
}

const grupos = agrupar(fundirCopias([...enBase, ...crudas]));
/* Un grupo en el que no llegó nada nuevo no se reescribe: ya está igual en la
   base y volcar las 8.000 filas intactas en cada corrida sólo cuesta tiempo. */
const resueltos = grupos.filter((g) => g.some((f) => !f._enBase)).map(resolver);
const conVarias = resueltos.filter((r) => r.otros.length > 0);
const discrepantes = conVarias.filter(
  (r) => r.maxDiv != null && r.maxDiv > UMBRAL_DIVERGENCIA,
);

console.log(`Alimentos distintos:   ${grupos.length}`);
console.log(`Con más de una fuente: ${conVarias.length}`);
console.log(
  `De esos, discrepan >${UMBRAL_DIVERGENCIA}%: ${discrepantes.length}`,
);
for (const d of discrepantes.slice(0, 5))
  console.log(
    `   · ${d.canonico.name.slice(0, 44)} — difiere ${d.maxDiv.toFixed(1)}%`,
  );

if (SECO) {
  console.log("\n(--seco: no se escribió nada)");
  process.exit(0);
}

const r = await escribir(resueltos);
const recalculados = await recalcularDivergencias();
if (recalculados)
  console.log(`Divergencias recalculadas de las fuentes: ${recalculados}`);
console.log(
  `\nListo. ${r.escritos} alimentos, ${r.cotejos} valores de fuente, ${r.marcados} marcados para revisar.`,
);
