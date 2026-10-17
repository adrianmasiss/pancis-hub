/**
 * Porciones caseras en español a partir de las de USDA y Open Food Facts,
 * y la densidad que se desprende de ellas.
 *
 * Igual que con los nombres: una porción cuyo rótulo no se entiende entero
 * no se guarda. «1 taza» con su peso medido vale; «1 cup, NLEA serving» a
 * medio traducir no.
 */

/** Mililitros de cada medida de volumen de EE. UU., la que usa USDA. */
export const ML = {
  taza: 236.588,
  cucharada: 14.787,
  cucharadita: 4.929,
  "onza líquida": 29.574,
};

/* [singular, plural, género] — el género decide «1 taza picada» frente a
   «1 trozo picado». */
const UNIDADES = {
  cup: ["taza", "tazas", "f"],
  cups: ["taza", "tazas", "f"],
  tablespoon: ["cucharada", "cucharadas", "f"],
  tablespoons: ["cucharada", "cucharadas", "f"],
  tbsp: ["cucharada", "cucharadas", "f"],
  teaspoon: ["cucharadita", "cucharaditas", "f"],
  teaspoons: ["cucharadita", "cucharaditas", "f"],
  tsp: ["cucharadita", "cucharaditas", "f"],
  "fl oz": ["onza líquida", "onzas líquidas", "f"],
  oz: ["onza", "onzas", "f"],
  lb: ["libra", "libras", "f"],
  slice: ["rebanada", "rebanadas", "f"],
  slices: ["rebanada", "rebanadas", "f"],
  "slice/chunk": ["trozo", "trozos", "m"],
  piece: ["trozo", "trozos", "m"],
  pieces: ["trozo", "trozos", "m"],
  chunk: ["trozo", "trozos", "m"],
  each: ["unidad", "unidades", "f"],
  item: ["unidad", "unidades", "f"],
  fruit: ["unidad", "unidades", "f"],
  whole: ["unidad entera", "unidades enteras", "f"],
  medium: ["unidad mediana", "unidades medianas", "f"],
  large: ["unidad grande", "unidades grandes", "f"],
  small: ["unidad pequeña", "unidades pequeñas", "f"],
  "extra large": ["unidad extra grande", "unidades extra grandes", "f"],
  jumbo: ["unidad jumbo", "unidades jumbo", "f"],
  stalk: ["tallo", "tallos", "m"],
  spear: ["tallo", "tallos", "m"],
  leaf: ["hoja", "hojas", "f"],
  leaves: ["hoja", "hojas", "f"],
  clove: ["diente", "dientes", "m"],
  can: ["lata", "latas", "f"],
  bottle: ["botella", "botellas", "f"],
  container: ["envase", "envases", "m"],
  package: ["paquete", "paquetes", "m"],
  packet: ["sobre", "sobres", "m"],
  bar: ["barra", "barras", "f"],
  stick: ["barra", "barras", "f"],
  serving: ["porción", "porciones", "f"],
  patty: ["torta", "tortas", "f"],
  breast: ["pechuga", "pechugas", "f"],
  "breast, bone and skin removed": [
    "pechuga sin hueso ni piel",
    "pechugas sin hueso ni piel",
    "f",
  ],
  thigh: ["muslo", "muslos", "m"],
  drumstick: ["pierna", "piernas", "f"],
  wing: ["ala", "alas", "f"],
  steak: ["bistec", "bistecs", "m"],
  fillet: ["filete", "filetes", "m"],
  strip: ["tira", "tiras", "f"],
  link: ["unidad", "unidades", "f"],
  egg: ["huevo", "huevos", "m"],
  tortilla: ["tortilla", "tortillas", "f"],
  cookie: ["galleta", "galletas", "f"],
  cracker: ["galleta", "galletas", "f"],
  muffin: ["unidad", "unidades", "f"],
  roll: ["unidad", "unidades", "f"],
  bun: ["pan", "panes", "m"],
  wedge: ["gajo", "gajos", "m"],
  sprig: ["ramita", "ramitas", "f"],
  bunch: ["manojo", "manojos", "m"],
  head: ["cabeza", "cabezas", "f"],
  ear: ["mazorca", "mazorcas", "f"],
  pod: ["vaina", "vainas", "f"],
  scoop: ["cucharón", "cucharones", "m"],
  pat: ["porción individual", "porciones individuales", "f"],
};

/* Lo que va tras la coma. «@» concuerda con la unidad. */
const DETALLES = {
  chopped: "picad@",
  cubes: "en cubos",
  pureed: "en puré",
  thin: "fin@",
  medium: "median@",
  large: "grande",
  small: "pequeñ@",
  "cooked, diced": "cocid@, en cubos",
  diced: "en cubos",
  sliced: "en rodajas",
  mashed: "en puré",
  shredded: "rallad@",
  grated: "rallad@",
  cubed: "en cubos",
  pieces: "en trozos",
  "chopped or diced": "picad@",
  cooked: "cocid@",
  raw: "crud@",
  drained: "escurrid@",
  packed: "compactad@",
  "loosely packed": "sin compactar",
  "not packed": "sin compactar",
  halves: "en mitades",
  whole: "enter@",
  "with bone": "con hueso",
  "without bone": "sin hueso",
  "bone removed": "sin hueso",
  "with skin": "con piel",
  "without skin": "sin piel",
  "skin removed": "sin piel",
  "with liquid": "con líquido",
  melted: "derretid@",
  fluid: "líquid@",
  "liquid oil": "",
  ground: "molid@",
  crumbled: "desmenuzad@",
  flaked: "desmenuzad@",
  boneless: "sin hueso",
  pitted: "sin semilla",
  unpacked: "sin compactar",
  "cut up": "en trozos",
  "in pieces": "en trozos",
  "nlea serving": "porción de etiqueta",
};

const FRACCIONES = { 0.25: "¼", 0.5: "½", 0.75: "¾", 0.33: "⅓", 0.67: "⅔" };
function cantidad(n) {
  const entero = Math.floor(n);
  const resto = Math.round((n - entero) * 100) / 100;
  const frac = FRACCIONES[resto];
  if (resto === 0) return String(entero);
  if (frac) return entero > 0 ? `${entero} ${frac}` : frac;
  return String(n).replace(".", ",");
}

function leerNumero(texto) {
  const t = texto.trim();
  const mixto = t.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixto) return Number(mixto[1]) + Number(mixto[2]) / Number(mixto[3]);
  const frac = t.match(/^(\d+)\/(\d+)$/);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  const n = Number(t.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

const concordar = (texto, genero) =>
  texto.replace(/@/g, genero === "f" ? "a" : "o");

/**
 * «1 cup, chopped» → { rotulo: "1 taza, picada", unidad: "taza", cantidad: 1 }.
 * null si algo no se entiende.
 */
export function traducirPorcion(texto) {
  if (!texto) return null;
  // Las medidas entre paréntesis («(7" to 7-7/8" long)») son pulgadas de
  // un tamaño: se omiten, el peso ya dice cuánto es.
  const limpio = texto
    .replace(/\([^)]*\)/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  if (!limpio || /yield|not specified|guideline|nfs/.test(limpio)) return null;
  const [principal, ...resto] = limpio.split(",").map((s) => s.trim());
  const m = principal.match(/^([\d\s/.,]+)?\s*(.+)$/);
  if (!m) return null;
  const n = m[1] ? leerNumero(m[1]) : 1;
  if (n === null || n <= 0) return null;
  /* «1 medium drumstick»: el tamaño delante del sustantivo. Se dice al
     revés en español y concuerda con él: «1 pierna mediana». */
  const nombre = m[2].trim();
  const tam = nombre.match(/^(small|medium|large|extra large)\s+(.+)$/);
  let unidad = UNIDADES[nombre];
  if (
    !unidad &&
    tam &&
    UNIDADES[tam[2]] &&
    !/^unidad/.test(UNIDADES[tam[2]][0])
  ) {
    const [s1, p1, g1] = UNIDADES[tam[2]];
    const adj = {
      small: "pequeñ@",
      medium: "median@",
      large: "grande",
      "extra large": "extra grande",
    }[tam[1]];
    const sg = concordar(adj, g1);
    unidad = [`${s1} ${sg}`, `${p1} ${sg}s`, g1];
  }
  if (!unidad) return null;
  const [sing, plur, genero] = unidad;
  const partes = [`${cantidad(n)} ${n > 1 ? plur : sing}`];
  for (const seg of resto) {
    const detalle = DETALLES[seg];
    if (detalle === undefined) return null;
    if (detalle) partes.push(concordar(detalle, genero));
  }
  return { rotulo: partes.join(", "), unidad: sing, cantidad: n };
}

/**
 * Gramos por mililitro a partir de las porciones de volumen sin detalle
 * («1 taza», no «1 taza, picada»: picado cabe más o menos según el corte).
 * Se prefiere la taza: con más volumen, el redondeo del peso pesa menos.
 */
export function densidadDe(porciones) {
  for (const unidad of ["taza", "onza líquida", "cucharada", "cucharadita"]) {
    const p = porciones.find(
      (x) => x.unidad === unidad && !x.rotulo.includes(","),
    );
    if (p) {
      const d = p.gramos / (p.cantidad * ML[unidad]);
      // Fuera de esto no es un alimento, es un dato mal cargado.
      if (d > 0.1 && d < 2.5) return Math.round(d * 1000) / 1000;
    }
  }
  return null;
}
