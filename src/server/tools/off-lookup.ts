import { openFoodFactsProvider } from "@/lib/food-providers";
import {
  filterByRelevance,
  significantTokens,
} from "@/lib/food-providers/relevance";
import type { NormalizedFood } from "@/lib/food-providers/types";
import { normalizeFoodName } from "@/features/foods/lib/web-food";

/**
 * Open Food Facts antes que la web.
 *
 * Medido el 2026-11-08 con dos productos de Costa Rica: la busqueda web con
 * Gemini tardo 11-12 s, gasto cuota del unico modelo gratuito que busca, y
 * trajo solo calorias (las tablas de los supermercados son imagenes). Open
 * Food Facts devolvio la etiqueta completa en menos de un segundo y sin IA.
 *
 * Es una base comunitaria, asi que tampoco se marca como verificada, y cuando
 * dos fichas del mismo producto no coinciden no se elige por la persona.
 */
export type OffMatch =
  | { kind: "one"; food: NormalizedFood }
  | { kind: "choices"; foods: NormalizedFood[] }
  | { kind: "none" };

/** Diferencias por debajo de esto son redondeos de la etiqueta, no otra ficha. */
const SAME_KCAL = 0.05;
const SAME_GRAMS = 1.5;

function agree(a: NormalizedFood, b: NormalizedFood): boolean {
  if ((a.nutritionBasis ?? "100g") !== (b.nutritionBasis ?? "100g"))
    return false;
  const kcal =
    Math.abs(a.per100g.calories - b.per100g.calories) /
    Math.max(a.per100g.calories, b.per100g.calories, 1);
  return (
    kcal <= SAME_KCAL &&
    (["proteinG", "carbohydrateG", "fatG"] as const).every(
      (key) => Math.abs(a.per100g[key] - b.per100g[key]) <= SAME_GRAMS,
    )
  );
}

/**
 * Las calorias tienen que cuadrar con los macros (4/4/9, y 2 la fibra) con un
 * margen del 20 %: una ficha comunitaria con una cifra mal tecleada no cuadra.
 */
/**
 * Snacks secos por debajo de 250 kcal por 100 g son casi siempre la porcion
 * cargada como si fuera 100 g ("Maria Pozuelo", 90 kcal, 2026-11-08).
 */
const DRY_SNACK =
  /\b(galleta|galletas|cracker|chips|papas|tosty|nachos|granola|cereal|chocolate|barra|wafer)\b/;

function isCoherent(food: NormalizedFood): boolean {
  const { calories, proteinG, carbohydrateG, fatG, fiberG } = food.per100g;
  const text = `${food.name} ${food.externalName}`
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const isDrySnack =
    DRY_SNACK.test(text) ||
    (food.foodGroup === "carbohidrato" && /\bmaria\b/.test(text));
  if (isDrySnack && calories < 250) return false;
  if (calories < 20) return true;
  const fromMacros = 4 * proteinG + 4 * carbohydrateG + 9 * fatG + 2 * fiberG;
  return Math.abs(fromMacros - calories) / calories <= 0.2;
}

/**
 * Sin huecos en los macros. La unica excepcion es la fibra con 5 g de
 * carbohidratos o menos: la leche y las bebidas casi nunca la publican porque
 * es 0, y la fibra no puede pasar de los carbohidratos, asi que el 0 que guarda
 * el catalogo no se aleja de la etiqueta.
 */
export function isCompleteOffFood(food: NormalizedFood): boolean {
  if (!isCoherent(food)) return false;
  const missing = food.missingNutrients ?? [];
  if (!missing.length) return true;
  return (
    missing.length === 1 &&
    missing[0] === "fiberG" &&
    food.per100g.carbohydrateG <= 5
  );
}

/**
 * Lo que la persona escribe trae mas palabras que el nombre en OFF: pide
 * "galletas Chiky Pozuelo" y la ficha se llama "Chiky", sin marca. Si ninguna
 * ficha contiene todas sus palabras, vale una cuyo nombre entero este dentro
 * de lo que pidio. "Chiky Vanilla" no entra: "vanilla" no lo pidio nadie.
 */
/** Palabras que describen el tipo de producto, no cual es. */
const CATEGORY_WORDS = new Set([
  "galleta",
  "galletas",
  "bebida",
  "cereal",
  "snack",
  "paquete",
  "producto",
  "barra",
  "barrita",
  "marca",
]);

function relevantFoods(query: string, foods: NormalizedFood[]) {
  const strict = filterByRelevance(query, foods);
  if (strict.length) return strict;
  const asked = new Set(significantTokens(query));
  return foods.filter((food) => {
    const name = significantTokens(food.name);
    if (!name.length || !name.every((token) => asked.has(token))) return false;
    // Lo que sobra de la busqueda tiene que ser la marca de la ficha o una
    // palabra de categoria: "galletas Maria Pozuelo" no es la Maria de Marilan,
    // ni una "Galletas Maria" sin marca. Ante la duda, sigue la web.
    const brand = new Set(significantTokens(food.brand ?? ""));
    return [...asked].every(
      (token) =>
        name.includes(token) || CATEGORY_WORDS.has(token) || brand.has(token),
    );
  });
}

export function pickOffMatch(query: string, foods: NormalizedFood[]): OffMatch {
  // Ficha completa: un hueco en OFF se ve como 0 y no se puede guardar solo.
  const usable = relevantFoods(query, foods).filter(isCompleteOffFood);
  if (!usable.length) return { kind: "none" };

  // Solo compiten las que se llaman igual que la primera: "Chiky" y
  // "Chiky Vanilla" son productos distintos, no fichas en conflicto.
  const top = usable[0]!;
  const sameName = usable.filter(
    (food) => normalizeFoodName(food.name) === normalizeFoodName(top.name),
  );
  if (sameName.every((food) => agree(food, top)))
    return { kind: "one", food: top };
  return { kind: "choices", foods: sameName.slice(0, 4) };
}

export async function findOnOpenFoodFacts(query: string): Promise<OffMatch> {
  try {
    const foods = await openFoodFactsProvider.searchFoods(
      query,
      AbortSignal.timeout(8_000),
    );
    return pickOffMatch(query, foods);
  } catch {
    // Sin respuesta de OFF se sigue con la web; no es un error para la persona.
    return { kind: "none" };
  }
}

export function offProductUrl(barcode: string) {
  return `https://world.openfoodfacts.org/product/${barcode}`;
}
