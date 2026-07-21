/**
 * Mezcla de resultados de varios proveedores.
 *
 * Dos proveedores pueden traer el mismo producto (USDA importa parte del
 * catalogo de marcas y Open Food Facts tambien lo tiene). Se deduplica por
 * codigo de barras y, a falta de codigo, por nombre+marca normalizados.
 */
import { normalizeText } from "@/lib/food-providers/classify";
import type { NormalizedFood, ProviderSource } from "@/lib/food-providers/types";

/**
 * Prioridad al elegir el superviviente de un duplicado. USDA gana porque
 * sus datos son de laboratorio y no comunitarios.
 */
const SOURCE_PRIORITY: Record<ProviderSource, number> = {
  usda: 0,
  openfoodfacts: 1,
};

function dedupeKey(food: NormalizedFood): string {
  if (food.barcode) return `barcode:${food.barcode}`;
  return `name:${normalizeText(food.name)}|${normalizeText(food.brand ?? "")}`;
}

/**
 * Clave para casi-duplicados: mismo nombre y marca con macros identicos.
 *
 * Un producto suele tener un codigo de barras por presentacion (Nutella de
 * 350 g, 750 g y 1 kg son tres codigos), y la busqueda los devuelve todos.
 * Como el catalogo solo guarda valores por 100 g, para Pancis Hub son el
 * mismo alimento y mostrarlos repetidos solo estorba.
 */
function nearDuplicateKey(food: NormalizedFood): string {
  const { calories, proteinG, carbohydrateG, fatG } = food.per100g;
  return [
    normalizeText(food.name),
    normalizeText(food.brand ?? ""),
    calories,
    proteinG,
    carbohydrateG,
    fatG,
  ].join("|");
}

/**
 * Completa huecos del ganador con datos del duplicado descartado: si USDA
 * gana pero no trae imagen y Open Food Facts si, se aprovecha la imagen.
 */
function mergeInto(
  winner: NormalizedFood,
  other: NormalizedFood,
): NormalizedFood {
  return {
    ...winner,
    imageUrl: winner.imageUrl ?? other.imageUrl,
    barcode: winner.barcode ?? other.barcode,
    sugarG: winner.sugarG ?? other.sugarG,
    sodiumMg: winner.sodiumMg ?? other.sodiumMg,
    portions: winner.portions.length > 0 ? winner.portions : other.portions,
    aliases: [...new Set([...winner.aliases, ...other.aliases])].slice(0, 8),
  };
}

/**
 * Relevancia frente a lo que el usuario escribio. Menor = mas relevante.
 * Se premia la coincidencia exacta y el prefijo, y se penaliza el ruido:
 * los nombres larguisimos de USDA suelen ser variantes muy especificas.
 */
export function relevanceScore(food: NormalizedFood, query: string): number {
  const name = normalizeText(food.name);
  const needle = normalizeText(query);
  if (needle.length === 0) return 100;

  let score = 100;
  if (name === needle) score = 0;
  else if (name.startsWith(needle)) score = 10;
  else if (name.includes(needle)) score = 25;
  else if (food.aliases.some((alias) => alias.includes(needle))) score = 40;

  // Cada 20 caracteres extra de nombre suma una penalizacion leve.
  score += Math.min(10, Math.floor(name.length / 20));
  // Sin imagen es peor resultado en una lista visual.
  if (!food.imageUrl) score += 1;
  return score;
}

export function mergeProviderResults(
  results: NormalizedFood[],
  query: string,
  maxResults = 20,
): NormalizedFood[] {
  const byKey = new Map<string, NormalizedFood>();

  for (const food of results) {
    const key = dedupeKey(food);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, food);
      continue;
    }
    const existingWins =
      SOURCE_PRIORITY[existing.source] <= SOURCE_PRIORITY[food.source];
    byKey.set(
      key,
      existingWins ? mergeInto(existing, food) : mergeInto(food, existing),
    );
  }

  // Segunda pasada: colapsa presentaciones distintas del mismo producto.
  const byNearKey = new Map<string, NormalizedFood>();
  for (const food of byKey.values()) {
    const key = nearDuplicateKey(food);
    const existing = byNearKey.get(key);
    if (!existing) {
      byNearKey.set(key, food);
      continue;
    }
    const existingWins =
      SOURCE_PRIORITY[existing.source] <= SOURCE_PRIORITY[food.source];
    byNearKey.set(
      key,
      existingWins ? mergeInto(existing, food) : mergeInto(food, existing),
    );
  }

  return [...byNearKey.values()]
    .sort((a, b) => relevanceScore(a, query) - relevanceScore(b, query))
    .slice(0, maxResults);
}

/**
 * Marca los resultados externos que ya existen en el catalogo local para
 * no ofrecer importar dos veces lo mismo.
 */
export function markAlreadyImported(
  results: NormalizedFood[],
  importedKeys: Set<string>,
): (NormalizedFood & { alreadyImported: boolean })[] {
  return results.map((food) => ({
    ...food,
    alreadyImported: importedKeys.has(`${food.source}:${food.externalId}`),
  }));
}
