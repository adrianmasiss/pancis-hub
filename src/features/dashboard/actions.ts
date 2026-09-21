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

  const [
    candidatesResult,
    preferencesResult,
    favoriteIds,
    recentIds,
    pantryIds,
  ] = await Promise.all([
    supabase
      .from("foods")
      .select(
        "id, name, food_group, cooked_state, calories, protein_g, carbohydrate_g, fat_g, fiber_g, food_portions(label, grams)",
      )
      .is("deleted_at", null)
      .limit(300),
    supabase
      .from("dietary_preferences")
      .select("value")
      .eq("user_id", user.id)
      .in("preference_type", ["alergia", "restriccion", "alimento_no_deseado"]),
    getFavoriteFoodIds(user.id),
    getRecentFoodIds(user.id),
    getPantryFoodIds(user.id),
  ]);

  const candidateRows = candidatesResult.data ?? [];
  const portionsByFoodId = buildPortionsMap(candidateRows);

  const source = toEquivalenceFood(item.foods as DbFood);
  const alternatives = attachHouseholdEquivalence(
    rankAlternatives({
      source,
      sourceQuantityG: Number(item.quantity_g),
      candidates: candidateRows.map((food) =>
        toEquivalenceFood(food as DbFood),
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
    sourceQuantityG: Number(item.quantity_g),
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
    .update({ food_id: parsed.data.foodId, quantity_g: parsed.data.quantityG })
    .eq("id", parsed.data.templateItemId);
  if (error) return { error: swapT.failed };

  revalidatePath("/");
  return { success: true };
}
