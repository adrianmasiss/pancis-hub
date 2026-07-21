/**
 * USDA FoodData Central. API gratuita, requiere una clave sin costo
 * (https://fdc.nal.usda.gov/api-key-signup.html).
 *
 * Es la mejor fuente para alimentos genericos (pollo, arroz, huevo) porque
 * sus datos de laboratorio ya vienen por 100 g, que es justo la unidad del
 * catalogo local.
 */
import type { FoodGroup } from "@/features/foods/schemas";
import {
  deriveAliases,
  inferCookedState,
  inferFoodGroup,
} from "@/lib/food-providers/classify";
import {
  isPlausibleFood,
  type FoodProvider,
  type NormalizedFood,
  type NormalizedPortion,
} from "@/lib/food-providers/types";

const BASE_URL = "https://api.nal.usda.gov/fdc/v1";
const TIMEOUT_MS = 8000;

/** Identificadores de nutriente en FoodData Central. */
const NUTRIENT_IDS = {
  energyKcal: 1008,
  energyKj: 1062,
  protein: 1003,
  fat: 1004,
  carbohydrate: 1005,
  fiber: 1079,
  sugar: 2000,
  sodium: 1093,
} as const;

type UsdaNutrient = {
  nutrientId?: number;
  value?: number;
  amount?: number;
  nutrient?: { id?: number };
};

type UsdaFood = {
  fdcId?: number;
  description?: string;
  dataType?: string;
  brandName?: string | null;
  brandOwner?: string | null;
  gtinUpc?: string | null;
  publishedDate?: string | null;
  publicationDate?: string | null;
  foodCategory?: string | { description?: string } | null;
  servingSize?: number | null;
  servingSizeUnit?: string | null;
  householdServingFullText?: string | null;
  foodNutrients?: UsdaNutrient[];
  foodPortions?: {
    amount?: number;
    gramWeight?: number;
    modifier?: string | null;
    measureUnit?: { name?: string | null } | null;
  }[];
};

/** Lee un nutriente soportando la forma de /search y la de /food/{id}. */
function readNutrient(
  nutrients: UsdaNutrient[],
  id: number,
): number | undefined {
  const match = nutrients.find(
    (nutrient) => (nutrient.nutrientId ?? nutrient.nutrient?.id) === id,
  );
  if (!match) return undefined;
  const value = match.value ?? match.amount;
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function categoryOf(food: UsdaFood): string | null {
  if (typeof food.foodCategory === "string") return food.foodCategory;
  return food.foodCategory?.description ?? null;
}

function portionsOf(food: UsdaFood): NormalizedPortion[] {
  const portions: NormalizedPortion[] = [];

  for (const portion of food.foodPortions ?? []) {
    const grams = portion.gramWeight;
    if (typeof grams !== "number" || grams <= 0) continue;
    const unit = portion.measureUnit?.name;
    const label = [portion.amount, unit, portion.modifier]
      .filter((part) => part !== null && part !== undefined && part !== "")
      .join(" ")
      .trim();
    if (!label) continue;
    portions.push({ label, grams, householdMeasure: portion.modifier ?? null });
  }

  // Los alimentos de marca no traen foodPortions, pero si una porcion
  // declarada en la etiqueta.
  if (
    portions.length === 0 &&
    typeof food.servingSize === "number" &&
    food.servingSize > 0 &&
    food.servingSizeUnit?.toLowerCase() === "g"
  ) {
    portions.push({
      label: food.householdServingFullText?.trim() || "1 porcion",
      grams: food.servingSize,
      householdMeasure: food.householdServingFullText ?? null,
    });
  }

  return portions.slice(0, 8);
}

export function normalizeUsdaFood(raw: unknown): NormalizedFood | null {
  const food = raw as UsdaFood;
  if (!food || typeof food !== "object") return null;
  if (typeof food.fdcId !== "number") return null;

  const name = food.description?.trim();
  if (!name) return null;

  const nutrients = food.foodNutrients ?? [];

  // Si no hay kcal directas se convierten desde kJ (1 kcal = 4.184 kJ).
  const kcal = readNutrient(nutrients, NUTRIENT_IDS.energyKcal);
  const kj = readNutrient(nutrients, NUTRIENT_IDS.energyKj);
  const calories = kcal ?? (kj !== undefined ? kj / 4.184 : undefined);
  if (calories === undefined) return null;

  const round1 = (value: number) => Math.round(value * 10) / 10;
  const per100g = {
    calories: Math.round(calories),
    proteinG: round1(readNutrient(nutrients, NUTRIENT_IDS.protein) ?? 0),
    carbohydrateG: round1(
      readNutrient(nutrients, NUTRIENT_IDS.carbohydrate) ?? 0,
    ),
    fatG: round1(readNutrient(nutrients, NUTRIENT_IDS.fat) ?? 0),
    fiberG: round1(readNutrient(nutrients, NUTRIENT_IDS.fiber) ?? 0),
  };

  const sugar = readNutrient(nutrients, NUTRIENT_IDS.sugar);
  const sodium = readNutrient(nutrients, NUTRIENT_IDS.sodium);
  const category = categoryOf(food);

  const normalized: NormalizedFood = {
    source: "usda",
    externalId: String(food.fdcId),
    name,
    externalName: name,
    brand: food.brandName?.trim() || food.brandOwner?.trim() || null,
    barcode: food.gtinUpc?.trim() || null,
    // USDA no publica imagenes; la foto la resuelve el pipeline propio.
    imageUrl: null,
    foodGroup: inferFoodGroup(name, category, per100g) as FoodGroup,
    cookedState: inferCookedState(name),
    per100g,
    sugarG: sugar !== undefined ? round1(sugar) : null,
    sodiumMg: sodium !== undefined ? round1(sodium) : null,
    sourceUpdatedAt: food.publishedDate ?? food.publicationDate ?? null,
    portions: portionsOf(food),
    aliases: deriveAliases(name),
  };

  return isPlausibleFood(normalized) ? normalized : null;
}

async function requestJson(
  path: string,
  params: Record<string, string>,
  signal?: AbortSignal,
): Promise<unknown | null> {
  const apiKey = process.env.USDA_API_KEY;
  if (!apiKey) return null;

  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("api_key", apiKey);

  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const combined = signal
    ? AbortSignal.any([signal, timeout])
    : (timeout as AbortSignal);

  try {
    const response = await fetch(url, {
      signal: combined,
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return null;
    return (await response.json()) as unknown;
  } catch {
    // Red caida, timeout o cuota agotada: el buscador sigue con lo local.
    return null;
  }
}

export const usdaFoodProvider: FoodProvider = {
  source: "usda",
  label: "USDA FoodData Central",

  isAvailable() {
    return Boolean(process.env.USDA_API_KEY);
  },

  async searchFoods(query, signal) {
    const data = await requestJson(
      "/foods/search",
      {
        query,
        pageSize: "20",
        // Foundation y SR Legacy son datos de laboratorio; Branded aporta
        // productos empacados con codigo de barras.
        dataType: "Foundation,SR Legacy,Branded",
      },
      signal,
    );
    const foods = (data as { foods?: unknown[] } | null)?.foods ?? [];
    return foods
      .map(normalizeUsdaFood)
      .filter((food): food is NormalizedFood => food !== null);
  },

  async getFoodById(externalId, signal) {
    if (!/^\d+$/.test(externalId)) return null;
    const data = await requestJson(`/food/${externalId}`, {}, signal);
    return data ? normalizeUsdaFood(data) : null;
  },
};
