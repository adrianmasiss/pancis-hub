/**
 * Restricciones alimentarias duras (docs/spec/docs/14_SECURITY_PRIVACY_SAFETY.md).
 *
 * Sustituye a la coincidencia por subcadena que habia antes, que fallaba en
 * los dos sentidos:
 *   - "leche" marcaba "lechuga" como lacteo (falso positivo absurdo);
 *   - "lacteos" no marcaba "queso" (falso negativo peligroso).
 *
 * Aqui la comparacion es por PALABRA, no por subcadena, y una restriccion
 * puede declararse como grupo ("lacteos", "frutos secos") o como alimento
 * concreto ("leche"). Declarar el grupo excluye todos sus miembros.
 *
 * Sesgo deliberado: ante la duda se EXCLUYE. Una alternativa de mas que no
 * aparece es una molestia; un alergeno que se cuela es un dano. Por eso
 * terminos ambiguos como "crema" viven dentro del grupo de lacteos aunque
 * "crema de mani" quede fuera de la lista de sugerencias.
 *
 * Esto no sustituye la revision del usuario ni la lectura de la etiqueta, y
 * la UI debe decirlo.
 */

export type AllergenGroup =
  | "lacteos"
  | "huevo"
  | "gluten"
  | "frutos_secos"
  | "mani"
  | "soja"
  | "mariscos"
  | "pescado";

/**
 * Terminos por grupo, en singular y sin tildes. La normalizacion se encarga
 * de los plurales, asi que no hay que listarlos salvo cuando son irregulares
 * y la regla no los alcanza.
 */
const GROUP_TERMS: Record<AllergenGroup, string[]> = {
  lacteos: [
    "lacteo", "leche", "queso", "yogur", "yogurt", "mantequilla", "natilla",
    "crema", "nata", "requeson", "cuajada", "suero", "caseina", "lactosa",
    "kefir", "ricotta", "mozzarella", "parmesano", "cheddar", "ghee",
  ],
  huevo: ["huevo", "clara", "yema", "ovoalbumina", "mayonesa"],
  gluten: [
    "gluten", "trigo", "cebada", "centeno", "espelta", "malta", "harina",
    "pan", "pasta", "galleta", "semola", "cuscus", "avena",
  ],
  frutos_secos: [
    "nuez", "almendra", "avellana", "pistacho", "macadamia", "pecana",
    "castana", "anacardo", "maranon",
  ],
  mani: ["mani", "cacahuate", "cacahuete"],
  soja: ["soja", "soya", "tofu", "edamame", "tempeh", "miso"],
  mariscos: [
    "marisco", "camaron", "langostino", "langosta", "cangrejo", "almeja",
    "mejillon", "ostra", "calamar", "pulpo",
  ],
  pescado: [
    "pescado", "atun", "salmon", "tilapia", "sardina", "bacalao", "trucha",
    "anchoa",
  ],
};

/** Como puede escribir el usuario el nombre de un grupo. */
const GROUP_ALIASES: Record<AllergenGroup, string[]> = {
  lacteos: ["lacteo", "lactea", "leche y derivados", "derivados de la leche"],
  huevo: ["huevo"],
  gluten: ["gluten", "celiaco", "celiaca", "sin gluten"],
  frutos_secos: ["fruto seco", "frutos secos", "nuez"],
  mani: ["mani", "cacahuate", "cacahuete"],
  soja: ["soja", "soya"],
  mariscos: ["marisco", "crustaceo", "molusco"],
  pescado: ["pescado"],
};

/** Quita tildes y pasa a minusculas. */
function stripAccents(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Lleva una palabra a su forma singular aproximada, para que "nueces" y
 * "nuez" comparen igual sin tener que listar cada plural.
 */
export function singularize(word: string): string {
  if (word.length <= 3) return word;
  // nueces -> nuez, lombrices -> lombriz
  if (word.endsWith("ces")) return `${word.slice(0, -3)}z`;
  // camarones -> camaron, panes -> pan
  if (word.endsWith("es") && word.length > 4) return word.slice(0, -2);
  // huevos -> huevo
  if (word.endsWith("s")) return word.slice(0, -1);
  return word;
}

/** Palabras sin carga semantica que no deben participar de la comparacion. */
const STOP_WORDS = new Set([
  "de", "del", "la", "el", "los", "las", "con", "sin", "en", "y", "a", "al",
]);

/** Descompone un texto en palabras normalizadas y singularizadas. */
export function tokenize(value: string): string[] {
  return stripAccents(value)
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 0 && !STOP_WORDS.has(word))
    .map(singularize);
}

/**
 * true si la secuencia de `term` aparece completa y contigua dentro de
 * `tokens`. Para un termino de una palabra equivale a "es una de las
 * palabras", que es justo lo que evita el caso leche/lechuga.
 */
function containsSequence(tokens: string[], term: string[]): boolean {
  if (term.length === 0 || term.length > tokens.length) return false;
  for (let start = 0; start <= tokens.length - term.length; start += 1) {
    let hit = true;
    for (let offset = 0; offset < term.length; offset += 1) {
      if (tokens[start + offset] !== term[offset]) {
        hit = false;
        break;
      }
    }
    if (hit) return true;
  }
  return false;
}

const GROUPS = Object.keys(GROUP_TERMS) as AllergenGroup[];

/**
 * Resuelve lo que el usuario declaro a la lista de terminos que hay que
 * vigilar. Si nombro un grupo, se vigilan todos sus miembros; si nombro un
 * alimento concreto, solo ese.
 */
export function resolveRestrictionTerms(restriction: string): string[][] {
  const declared = tokenize(restriction);
  if (declared.length === 0) return [];

  for (const group of GROUPS) {
    const isGroup = GROUP_ALIASES[group].some((alias) => {
      const aliasTokens = tokenize(alias);
      return (
        aliasTokens.length === declared.length &&
        aliasTokens.every((token, index) => token === declared[index])
      );
    });
    if (isGroup) return GROUP_TERMS[group].map(tokenize);
  }

  // No es un grupo conocido: se vigila tal cual lo escribio el usuario.
  return [declared];
}

export type RestrictionMatch = {
  /** La restriccion tal como la declaro el usuario. */
  restriction: string;
  /** El termino concreto que la disparo, para poder explicarlo. */
  matchedTerm: string;
};

/**
 * Primera restriccion que excluye a este alimento, o null si ninguna aplica.
 * Devuelve el termino que disparo para que la UI pueda decir POR QUE se
 * excluyo en vez de esconder la alternativa sin explicacion.
 */
export function findRestrictionMatch(
  foodName: string,
  restrictions: readonly string[],
): RestrictionMatch | null {
  const tokens = tokenize(foodName);
  if (tokens.length === 0) return null;

  for (const restriction of restrictions) {
    const trimmed = restriction.trim();
    if (trimmed.length < 2) continue;

    for (const term of resolveRestrictionTerms(trimmed)) {
      if (containsSequence(tokens, term)) {
        return { restriction: trimmed, matchedTerm: term.join(" ") };
      }
    }
  }

  return null;
}

/** Version booleana, para filtrar candidatos. */
export function matchesRestriction(
  foodName: string,
  restrictions: readonly string[],
): boolean {
  return findRestrictionMatch(foodName, restrictions) !== null;
}
