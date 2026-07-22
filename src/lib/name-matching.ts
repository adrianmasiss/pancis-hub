/**
 * Emparejamiento de nombres escritos por una persona contra un catalogo.
 *
 * Nacio para el importador de dietas (reconocer que "Claras de huevo" es
 * la "Clara de huevo" que ya existe) y lo reutiliza el importador de
 * rutinas para los ejercicios. Comparar por prefijo o subcadena fallaba
 * con plurales y acentos, y cada fallo creaba un duplicado permanente.
 */

/** Palabras sin valor discriminante al comparar nombres de alimentos. */
const STOPWORDS = new Set([
  "de",
  "del",
  "la",
  "el",
  "los",
  "las",
  "en",
  "con",
  "sin",
  "al",
  "y",
  "o",
  "a",
]);

/** Minusculas, sin acentos y sin puntuacion. */
export function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Singular aproximado en espanol. No pretende ser gramatica completa:
 * solo necesita que "claras" y "clara" caigan en la misma forma.
 */
export function singularize(word: string): string {
  if (word.length <= 3) return word;
  // "frijoles" -> "frijol", "papeles" -> "papel"
  if (word.endsWith("es") && word.length > 4) return word.slice(0, -2);
  // "claras" -> "clara", "huevos" -> "huevo"
  if (word.endsWith("s")) return word.slice(0, -1);
  return word;
}

/** Palabras significativas del nombre, normalizadas y en singular. */
export function significantTokens(value: string): string[] {
  return normalizeName(value)
    .split(" ")
    .filter((word) => word.length > 0 && !STOPWORDS.has(word))
    .map(singularize);
}

export type MatchCandidate = { id: string; name: string };

/**
 * Similitud 0-1 entre dos nombres.
 *
 * Se mide por palabras significativas compartidas sobre el total de
 * palabras distintas (indice de Jaccard), con bono por coincidencia
 * exacta. Comparar por palabras evita que "Huevo" empareje con
 * "Huevos revueltos con jamon" solo por compartir el prefijo.
 */
export function nameSimilarity(a: string, b: string): number {
  const tokensA = new Set(significantTokens(a));
  const tokensB = new Set(significantTokens(b));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  // Misma frase normalizada: no hay nada mejor.
  if (
    [...tokensA].sort().join(" ") === [...tokensB].sort().join(" ")
  ) {
    return 1;
  }

  let shared = 0;
  for (const token of tokensA) if (tokensB.has(token)) shared += 1;
  if (shared === 0) return 0;

  const union = new Set([...tokensA, ...tokensB]).size;
  return shared / union;
}

/**
 * Umbral para aceptar una sugerencia automatica. Deliberadamente alto:
 * una sugerencia equivocada hace que el usuario registre otro alimento
 * sin darse cuenta, que es peor que no sugerir nada.
 */
export const MIN_MATCH_SCORE = 0.5;

export type ScoredMatch<T extends MatchCandidate> = {
  candidate: T;
  score: number;
};

/**
 * Mejor coincidencia del catalogo para un nombre, o null si ninguna
 * supera el umbral. Ante empate gana el nombre mas corto, que suele ser
 * la entrada generica del catalogo ("Clara de huevo") frente a una
 * variante mas especifica.
 */
export function pickBestMatch<T extends MatchCandidate>(
  name: string,
  candidates: T[],
  minScore = MIN_MATCH_SCORE,
): ScoredMatch<T> | null {
  let best: ScoredMatch<T> | null = null;

  for (const candidate of candidates) {
    const score = nameSimilarity(name, candidate.name);
    if (score < minScore) continue;
    if (
      !best ||
      score > best.score ||
      (score === best.score && candidate.name.length < best.candidate.name.length)
    ) {
      best = { candidate, score };
    }
  }

  return best;
}
