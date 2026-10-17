/**
 * El traductor de nombres de USDA, compartido por `traducir-alimentos.mjs`
 * (que traduce lo ya sembrado) y `sembrar-alimentos.mjs` (que siembra ya
 * traducido). Con uno solo, volver a sembrar no puede devolver el catálogo
 * al inglés.
 */
import { CABEZAS, MODIFICADORES } from "./usda-es.mjs";

/* Sinónimos que se buscan en Costa Rica y en el resto de la región. La
   clave es una palabra del nombre en español; si aparece, se añaden los
   alias. Se busca por subcadena, así que «frijol» ya encuentra «Frijoles» y
   no hace falta repetir singulares. */
export const SINONIMOS = {
  banano: ["guineo", "cambur", "plátano de seda"],
  "chile dulce": ["pimiento", "pimentón", "morrón"],
  "chile picante": ["ají"],
  vainica: ["ejote", "judía verde", "habichuela"],
  frijoles: ["porotos", "caraotas", "habichuelas"],
  aguacate: ["palta"],
  ayote: ["calabaza", "zapallo"],
  zucchini: ["zapallito", "calabacín", "zuchini"],
  elote: ["choclo", "mazorca", "maíz tierno"],
  camote: ["batata", "boniato"],
  papa: ["patata"],
  maní: ["cacahuate", "cacahuete"],
  "marañón (semilla)": ["anacardo", "cajú", "nuez de la India"],
  tocineta: ["tocino", "bacon", "beicon"],
  culantro: ["cilantro"],
  natilla: ["crema agria", "sour cream"],
  "refresco gaseoso": ["gaseosa", "soda", "fresco"],
  "café chorreado": ["café filtrado", "café negro"],
  guisantes: ["arvejas", "petit pois", "chícharos"],
  piña: ["ananá"],
  "posta de res": ["bistec", "round"],
  "carne molida": ["carne picada"],
  "pechuga de pollo": ["pollo pechuga"],
  "pierna de pollo": ["muslo inferior", "drumstick"],
  fresas: ["frutillas"],
  moras: ["zarzamoras"],
  "jugo de": ["zumo de"],
  "bebida de soya": ["leche de soya", "leche de soja"],
  "bebida de almendra": ["leche de almendra", "leche de almendras"],
  "bebida de avena": ["leche de avena"],
  "bebida de arroz": ["leche de arroz"],
  soya: ["soja"],
  mandarina: ["tangerina"],
  toronja: ["pomelo"],
  melocotón: ["durazno"],
  albaricoque: ["damasco", "chabacano"],
  repollo: ["col"],
  remolacha: ["betabel", "betarraga"],
  "malanga (taro)": ["tiquizque", "ñampí", "taro"],
  "hojas de malanga": ["hojas de tiquizque"],
  hongos: ["champiñones", "setas"],
  "kale (col rizada)": ["col rizada", "berza"],
  "salsa de tomate (ketchup)": ["ketchup", "catsup"],
  "torreja (pan francés)": ["tostada francesa"],
  "agua de pipa": ["agua de coco"],
  maracuyá: ["parchita", "fruta de la pasión"],
  guanábana: ["catuche"],
  plátano: ["plátano macho", "banano de cocinar"],
  "plátano maduro": ["maduro"],
  yuca: ["mandioca", "casava"],
};

/* Corta por comas que no estén dentro de paréntesis: «Chickpeas (garbanzo
   beans, bengal gram), mature seeds» son dos segmentos, no tres. */
export function segmentos(nombre) {
  const salida = [];
  let actual = "";
  let nivel = 0;
  for (const c of nombre) {
    if (c === "(") nivel += 1;
    if (c === ")") nivel = Math.max(0, nivel - 1);
    if (c === "," && nivel === 0) {
      salida.push(actual);
      actual = "";
    } else actual += c;
  }
  salida.push(actual);
  return salida
    .map((s) => s.replace(/\s+/g, " ").trim().toLowerCase())
    .filter(Boolean);
}

const FORMAS = {
  "@": { ms: "o", fs: "a", mp: "os", fp: "as" },
  "#": { ms: "", fs: "", mp: "s", fp: "s" },
  // «^» y no «%»: el porcentaje aparece literal en los nombres (2 %, 100 %).
  "^": { ms: "", fs: "", mp: "es", fp: "es" },
};
const concordar = (texto, genero, numero) =>
  texto.replace(/[@#^]/g, (marca) => FORMAS[marca][genero + numero]);

/** El nombre en español, o null si algún segmento no se conoce. */
export function traducir(nombreUsda, faltan) {
  // Una nota administrativa de USDA, no parte del alimento.
  const s = segmentos(
    nombreUsda.replace(
      /\s*\(includes foods for usda's food distribution program\)/i,
      "",
    ),
  );
  let cabeza = null;
  let resto = [];
  for (const n of [3, 2, 1]) {
    if (s.length < n) continue;
    const clave = s.slice(0, n).join(", ");
    if (CABEZAS[clave]) {
      cabeza = CABEZAS[clave];
      resto = s.slice(n);
      break;
    }
  }
  if (!cabeza) {
    faltan?.push(`cabeza: ${s[0]}`);
    return null;
  }
  const [nombre, genero, numero] = cabeza;
  const partes = [nombre];
  for (const seg of resto) {
    const mod = MODIFICADORES[seg];
    if (mod === undefined) {
      faltan?.push(seg);
      return null;
    }
    if (mod === "") continue;
    const texto = concordar(mod, genero, numero);
    // Dos segmentos de USDA pueden decir lo mismo en español («boiled» tras
    // «Potatoes, boiled»): no se repite.
    if (!partes.some((p) => p.toLowerCase() === texto.toLowerCase()))
      partes.push(texto);
  }
  return partes.join(", ");
}

export function sinonimosDe(nombreEs) {
  const n = nombreEs.toLowerCase();
  const alias = new Set();
  for (const [clave, lista] of Object.entries(SINONIMOS)) {
    // Palabra entera: «chayote» contiene «ayote» y no es una calabaza.
    const palabra = new RegExp(
      `(^|[^\\p{L}])${clave.replace(/[()]/g, "\\$&")}($|[^\\p{L}])`,
      "u",
    );
    if (palabra.test(n)) for (const a of lista) alias.add(a);
  }
  return [...alias];
}
