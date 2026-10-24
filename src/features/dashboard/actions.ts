"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";
import {
  attachHouseholdEquivalence,
  buildPortionsMap,
  rankAlternatives,
  SWAP_FILTERS,
  type EquivalenceFood,
  type SwapCandidate,
} from "@/features/foods/lib/equivalence";
import { getFavoriteFoodIds, getRecentFoodIds } from "@/features/foods/queries";
import { getPantryFoodIds } from "@/features/pantry/queries";
import type { FoodGroup } from "@/features/foods/schemas";

const t = messages.nutrition.dietPlan;
const swapT = messages.swap;

export type DashboardActionResult = { error: string } | { success: true };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

const logMealSchema = z.object({
  templateMealId: z.uuid(),
  date: z.iso.date(),
});

/**
 * Registra una comida de la dieta activa como una comida REAL de hoy
 * (con snapshots), para que descuente de tus macros consumidos y quede
 * en tu historial — igual que registrar una receta o una comida manual.
 */
export async function logDietTemplateMeal(
  input: unknown,
): Promise<DashboardActionResult & { alreadyLogged?: boolean }> {
  const parsed = logMealSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return { error: t.logFailed };

  // La funcion de base de datos hace una sola transaccion: autentica por RLS,
  // evita duplicados y congela exactamente los sustitutos visibles ese dia.
  const { data, error } = await supabase.rpc("log_diet_template_meal", {
    p_template_meal_id: parsed.data.templateMealId,
    p_date: parsed.data.date,
  });
  if (error || !data) return { error: t.logFailed };

  const result = data as { created?: boolean };

  revalidatePath("/");
  revalidatePath("/nutricion");
  return { success: true, alreadyLogged: result.created === false };
}

// ------------------------------------------------- intercambio por comida

const swapSuggestionsSchema = z.object({
  templateItemId: z.uuid(),
  filter: z.enum(SWAP_FILTERS).optional(),
  query: z.string().trim().max(100).optional(),
  sameGroupOnly: z.boolean().optional(),
  date: z.iso.date().optional(),
});
const swapItemSchema = z.object({
  templateItemId: z.uuid(),
  foodId: z.uuid(),
  quantityG: z.number().positive().max(5000),
});

export type DietSwapSuggestions = {
  sourceName: string;
  sourceQuantityG: number;
  alternatives: SwapCandidate[];
};

type DbFood = {
  id: string;
  name: string;
  food_group: string;
  cooked_state: string | null;
  image_url?: string | null;
  calories: number;
  protein_g: number;
  carbohydrate_g: number;
  fat_g: number;
  fiber_g: number;
};

function toEquivalenceFood(food: DbFood): EquivalenceFood {
  return {
    id: food.id,
    name: food.name,
    foodGroup: food.food_group as FoodGroup,
    imageUrl: food.image_url,
    cookedState: food.cooked_state as "crudo" | "cocido" | null,
    per100g: {
      calories: Number(food.calories),
      proteinG: Number(food.protein_g),
      carbohydrateG: Number(food.carbohydrate_g),
      fatG: Number(food.fat_g),
      fiberG: Number(food.fiber_g),
    },
  };
}

/** Alternativas para UN alimento dentro de una comida de la dieta. */
export async function getDietItemSwapSuggestions(
  input: unknown,
): Promise<{ error: string } | DietSwapSuggestions> {
  const parsed = swapSuggestionsSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return { error: swapT.failed };

  const { data: item } = await supabase
    .from("diet_template_items")
    .select(
      "quantity_g, foods(id, name, food_group, cooked_state, calories, protein_g, carbohydrate_g, fat_g, fiber_g)",
    )
    .eq("id", parsed.data.templateItemId)
    .single();
  if (!item?.foods) return { error: swapT.failed };

  /*
   * Sin busqueda, los candidatos eran los 1000 primeros por orden alfabetico
   * de 28.000: casi todos productos de marca en ingles que empiezan por un
   * numero («1 DOZEN FARM FRESH EGGS» como sustituto del huevo). Ahora son
   * los genericos del mismo grupo con calorias parecidas (±50 % por 100 g),
   * mas lo que el usuario ya usa (favoritos, recientes, despensa).
   */
  const CANDIDATE_COLUMNS =
    "id, name, food_group, cooked_state, calories, protein_g, carbohydrate_g, fat_g, fiber_g, image_url, food_portions(label, grams)";
  const sourceFood = item.foods as DbFood;
  const candidateQuery = () => {
    const base = supabase
      .from("foods")
      .select(CANDIDATE_COLUMNS)
      .is("deleted_at", null)
      .is("data_issue", null);
    if (parsed.data.query)
      return base
        .ilike("name", `%${parsed.data.query.replace(/[%_]/g, "")}%`)
        .order("name")
        .limit(100);
    const kcal = Number(sourceFood.calories);
    let generic = base.is("brand", null).is("barcode", null);
    if (sourceFood.food_group)
      generic = generic.eq("food_group", sourceFood.food_group);
    if (kcal > 0)
      generic = generic.gte("calories", kcal * 0.5).lte("calories", kcal * 1.5);
    return generic.order("name").limit(1500);
  };

  const [
    candidatesResult,
    preferencesResult,
    favoriteIds,
    recentIds,
    pantryIds,
  ] = await Promise.all([
    candidateQuery(),
    supabase
      .from("dietary_preferences")
      .select("value")
      .eq("user_id", user.id)
      .in("preference_type", ["alergia", "restriccion", "alimento_no_deseado"]),
    getFavoriteFoodIds(user.id),
    getRecentFoodIds(user.id),
    getPantryFoodIds(user.id),
  ]);

  if (candidatesResult.error || preferencesResult.error)
    return { error: "No pudimos cargar las alternativas. Inténtalo de nuevo." };
  const candidateRows = [...(candidatesResult.data ?? [])];
  if (!parsed.data.query) {
    const have = new Set(candidateRows.map((row) => row.id));
    const own = [
      ...new Set([...favoriteIds, ...recentIds, ...pantryIds]),
    ].filter((id) => !have.has(id));
    if (own.length) {
      const { data } = await supabase
        .from("foods")
        .select(CANDIDATE_COLUMNS)
        .in("id", own.slice(0, 300))
        .is("deleted_at", null);
      candidateRows.push(...(data ?? []));
    }
  }
  const portionsByFoodId = buildPortionsMap(candidateRows);

  let source = toEquivalenceFood(item.foods as DbFood);
  let sourceQuantityG = Number(item.quantity_g);
  if (parsed.data.date) {
    const { data: swap, error } = await supabase
      .from("diet_item_day_swaps")
      .select(
        "quantity_g, external_name, external_calories, external_protein_g, external_carbohydrate_g, external_fat_g, foods(id, name, food_group, cooked_state, calories, protein_g, carbohydrate_g, fat_g, fiber_g)",
      )
      .eq("user_id", user.id)
      .eq("template_item_id", parsed.data.templateItemId)
      .eq("date", parsed.data.date)
      .maybeSingle();
    if (error) return { error: swapT.failed };
    if (swap) {
      sourceQuantityG = Number(swap.quantity_g);
      source = swap.foods
        ? toEquivalenceFood(swap.foods as DbFood)
        : {
            ...source,
            name: swap.external_name ?? source.name,
            per100g: {
              calories: Number(swap.external_calories),
              proteinG: Number(swap.external_protein_g),
              carbohydrateG: Number(swap.external_carbohydrate_g),
              fatG: Number(swap.external_fat_g),
              fiberG: 0,
            },
          };
    }
  }
  const alternatives = attachHouseholdEquivalence(
    rankAlternatives({
      source,
      sourceQuantityG,
      candidates: candidateRows
        .map((food) => toEquivalenceFood(food as DbFood))
        .filter(
          (food) =>
            !parsed.data.sameGroupOnly || food.foodGroup === source.foodGroup,
        ),
      favoriteIds,
      recentIds: new Set(recentIds),
      pantryIds,
      restrictions: (preferencesResult.data ?? []).map((row) => row.value),
      filter: parsed.data.filter,
    }),
    portionsByFoodId,
  );

  return {
    sourceName: source.name,
    sourceQuantityG,
    alternatives,
  };
}

export async function swapDietTemplateItem(
  input: unknown,
): Promise<DashboardActionResult> {
  const parsed = swapItemSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return { error: swapT.failed };

  const { error } = await supabase
    .from("diet_template_items")
    .update({
      food_id: parsed.data.foodId,
      quantity_g: parsed.data.quantityG,
      serving_equivalence: null,
    })
    .eq("id", parsed.data.templateItemId);
  if (error) return { error: swapT.failed };

  revalidatePath("/");
  revalidatePath("/nutricion");
  return { success: true };
}
