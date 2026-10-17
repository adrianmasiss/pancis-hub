import { normalizeText } from "./classify";
import type { NormalizedFood } from "./types";

/**
 * Filtro de relevancia para los resultados externos.
 *
 * El buscador de USDA empareja PALABRAS, no platos. «gallo pinto» devolvía
 * 1.996 coincidencias y las primeras eran «PINTO BEANS», «PICO DE GALLO
 * TORTILLA» y «Beans, pinto, immature seeds»: ninguna es gallo pinto, pero
 * todas contienen una de las dos palabras. Doce tarjetas de ruido son peores
 * que ninguna, porque esconden que el alimento NO está y el usuario cree que
 * lo encontró.
 *
 * La regla: todas las palabras significativas de la búsqueda tienen que
 * aparecer en el texto del alimento. Con «gallo pinto», un resultado necesita
 * «gallo» Y «pinto». Así el vacío es verdad, y un vacío verdadero es lo que
 * permite ofrecer armarlo como receta.
 *
 * Se compara contra TODO el texto del alimento —nombre mostrable, nombre
 * original, marca y alias—, no sólo contra el nombre: un alimento que llega
 * en inglés con alias en español tiene que seguir pasando.
 */

/* Palabras que no distinguen un alimento de otro. Exigirlas descartaría
   resultados buenos: «arroz con leche» no debe pedir que aparezca «con». */
const VACIAS = new Set([
  "de",
  "del",
  "la",
  "las",
  "el",
  "los",
  "un",
  "una",
  "unos",
  "unas",
  "con",
  "sin",
  "y",
  "o",
  "en",
  "a",
  "al",
  "para",
  "por",
  "the",
  "of",
  "and",
  "with",
]);

/** Por debajo de tres letras una palabra empareja con casi todo. */
const MIN_LONGITUD = 3;

export function significantTokens(query: string): string[] {
  return normalizeText(query)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= MIN_LONGITUD && !VACIAS.has(token));
}

function haystack(food: NormalizedFood): string {
  return normalizeText(
    [food.name, food.externalName, food.brand ?? "", ...(food.aliases ?? [])]
      .join(" ")
      .replace(/[^\p{L}\p{N}]+/gu, " "),
  );
}

/**
 * Descarta lo que no empareja de verdad.
 *
 * Si la búsqueda no deja ninguna palabra significativa —«de la», un código,
 * dos letras— NO se filtra nada: sin criterio no se puede juzgar, y vaciar la
 * lista sería peor que dejarla pasar.
 */
export function filterByRelevance(
  query: string,
  foods: NormalizedFood[],
): NormalizedFood[] {
  const tokens = significantTokens(query);
  if (tokens.length === 0) return foods;
  return foods.filter((food) => {
    const texto = haystack(food);
    return tokens.every((token) => texto.includes(token));
  });
}
