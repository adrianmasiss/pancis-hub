/** Dietly public read API. Called only by server queries/actions. */
import { z } from "zod";
import { deriveAliases, inferCookedState, inferFoodGroup } from "./classify";
import {
  isPlausibleFood,
  type FoodProvider,
  type NormalizedFood,
} from "./types";

const nutrient = z.number().finite().nonnegative().nullable().catch(null);
export const dietlyFoodSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().trim().min(1).max(500),
  brand: z.string().nullable().catch(null),
  barcode: z.string().nullable().catch(null),
  category: z.string().nullable().catch(null),
  calories_kcal: nutrient,
  protein_g: nutrient,
  carbs_g: nutrient,
  fat_g: nutrient,
  fiber_g: nutrient,
  sugar_g: nutrient,
  sodium_mg: nutrient,
  serving_size_g: nutrient,
  serving_desc: z.string().nullable().catch(null),
  image_url: z.string().nullable().catch(null),
  image_thumb_url: z.string().nullable().catch(null),
  source: z.enum(["off", "usda", "community", "claude"]),
  confidence: z.number().min(0).max(1).nullable().catch(null),
});
export type DietlyFood = z.infer<typeof dietlyFoodSchema>;
export type DietlyStatus = "ok" | "unavailable" | "limited";
export const DIETLY_SOURCE_LABELS = {
  off: "Open Food Facts",
  usda: "USDA",
  community: "Comunidad",
  claude: "Estimación IA",
} as const;

export function dietlyImage(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" &&
      [
        "api.getdietly.com",
        "images.openfoodfacts.org",
        "www.getdietly.com",
      ].includes(parsed.hostname)
      ? parsed.href
      : null;
  } catch {
    return null;
  }
}

export function normalizeDietlyFood(input: unknown): NormalizedFood | null {
  const parsed = dietlyFoodSchema.safeParse(input);
  if (!parsed.success) return null;
  const f = parsed.data;
  // The local catalog requires complete numeric macros. Never replace a missing nutrient with zero.
  if (
    f.calories_kcal === null ||
    f.protein_g === null ||
    f.carbs_g === null ||
    f.fat_g === null ||
    f.fiber_g === null ||
    f.source === "claude"
  )
    return null;
  const per100g = {
    calories: f.calories_kcal,
    proteinG: f.protein_g,
    carbohydrateG: f.carbs_g,
    fatG: f.fat_g,
    fiberG: f.fiber_g,
  };
  const food: NormalizedFood = {
    source: "dietly",
    externalId: String(f.id),
    name: f.name,
    externalName: f.name,
    brand: f.brand,
    barcode: f.barcode,
    imageUrl: dietlyImage(f.image_url),
    foodGroup: inferFoodGroup(f.name, f.category, per100g),
    cookedState: inferCookedState(f.name),
    per100g,
    sugarG: f.sugar_g,
    sodiumMg: f.sodium_mg,
    sourceUpdatedAt: null,
    portions:
      f.serving_size_g && f.serving_size_g <= 5000
        ? [
            {
              label: f.serving_desc ?? "Porción",
              grams: f.serving_size_g,
              householdMeasure: f.serving_desc,
            },
          ]
        : [],
    aliases: deriveAliases(f.name),
    provenance: `Dietly · ${DIETLY_SOURCE_LABELS[f.source]}`,
  };
  return isPlausibleFood(food) ? food : null;
}

async function request(
  path: string,
  signal?: AbortSignal,
): Promise<{ data: unknown; status: DietlyStatus }> {
  try {
    const key = process.env.DIETLY_API_KEY;
    const response = await fetch(`https://api.getdietly.com${path}`, {
      headers: key ? { Authorization: `Bearer ${key}` } : {},
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(8000)])
        : AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    });
    if (!response.ok)
      return {
        data: null,
        status: response.status === 429 ? "limited" : "unavailable",
      };
    return { data: await response.json(), status: "ok" };
  } catch {
    return { data: null, status: "unavailable" };
  }
}

export async function getDietlyCatalogue(
  query?: string,
): Promise<{ foods: DietlyFood[]; status: DietlyStatus }> {
  const params = new URLSearchParams({ limit: "48" });
  if (query) params.set("q", query.slice(0, 80));
  else params.set("has_image", "true");
  const result = await request(
    `${query ? "/search" : "/foods/popular"}?${params}`,
  );
  if (!Array.isArray(result.data))
    return {
      foods: [],
      status: result.status === "ok" ? "unavailable" : result.status,
    };
  const foods = result.data.flatMap((row) => {
    const parsed = dietlyFoodSchema.safeParse(row);
    return parsed.success ? [parsed.data] : [];
  });
  return { foods, status: result.status };
}

export const dietlyProvider: FoodProvider = {
  source: "dietly",
  label: "Dietly",
  isAvailable: () => true,
  async searchFoods(query) {
    const { foods } = await getDietlyCatalogue(query);
    return foods.flatMap((row) => {
      const food = normalizeDietlyFood(row);
      return food ? [food] : [];
    });
  },
  async getFoodById(id, signal) {
    if (!/^\d{1,15}$/.test(id)) return null;
    return normalizeDietlyFood((await request(`/food/${id}`, signal)).data);
  },
  async getFoodByBarcode(code, signal) {
    if (!/^\d{8,14}$/.test(code)) return null;
    return normalizeDietlyFood(
      (await request(`/barcode/${code}`, signal)).data,
    );
  },
};
