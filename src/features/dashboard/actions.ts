"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";
import { scaleMacros } from "@/features/nutrition/lib/macros";
import {
  rankAlternatives,
  type EquivalenceFood,
  type SwapCandidate,
} from "@/features/foods/lib/equivalence";
import { getFavoriteFoodIds, getRecentFoodIds } from "@/features/foods/queries";
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

const logMealSchema = z.object({ templateMealId: z.uuid(), date: z.string() });

/**
 * Registra una comida de la dieta activa como una comida REAL de hoy
 * (con snapshots), para que descuente de tus macros consumidos y quede
 * en tu historial — igual que registrar una receta o una comida manual.
 */
export async function logDietTemplateMeal(
  input: unknown,
): Promise<DashboardActionResult> {
  const parsed = logMealSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return { error: t.uploadCta };

  const { data: templateMeal } = await supabase
    .from("diet_template_meals")
    .select(
      "id, name, meal_type, diet_template_items(quantity_g, foods(id, calories, protein_g, carbohydrate_g, fat_g, fiber_g))",
    )
    .eq("id", parsed.data.templateMealId)
    .single();
  if (!templateMeal || (templateMeal.diet_template_items ?? []).length === 0) {
    return { error: messages.nutrition.actionFailed };
  }

  const { data: meal, error: mealError } = await supabase
    .from("meals")
    .insert({
      user_id: user.id,
      date: parsed.data.date,
      meal_type: templateMeal.meal_type,
      name: templateMeal.name,
      status: "completada",
    })
    .select("id")
    .single();
  if (mealError || !meal) return { error: messages.nutrition.actionFailed };

  const items = (templateMeal.diet_template_items ?? []).map((item) => {
    const snapshot = scaleMacros(
      {
        calories: Number(item.foods?.calories ?? 0),
        proteinG: Number(item.foods?.protein_g ?? 0),
        carbohydrateG: Number(item.foods?.carbohydrate_g ?? 0),
        fatG: Number(item.foods?.fat_g ?? 0),
        fiberG: Number(item.foods?.fiber_g ?? 0),
      },
      Number(item.quantity_g),
    );
    return {
      meal_id: meal.id,
      food_id: item.foods?.id,
      quantity_g: item.quantity_g,
      calories_snapshot: snapshot.calories,
      protein_snapshot: snapshot.proteinG,
      carbohydrate_snapshot: snapshot.carbohydrateG,
      fat_snapshot: snapshot.fatG,
      fiber_snapshot: snapshot.fiberG,
    };
  });

  const { error: itemsError } = await supabase.from("meal_items").insert(items);
  if (itemsError) return { error: messages.nutrition.actionFailed };

  revalidatePath("/");
  revalidatePath("/nutricion");
  return { success: true };
}

// ------------------------------------------------- intercambio por comida

const swapSuggestionsSchema = z.object({ templateItemId: z.uuid() });
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

  const [candidatesResult, preferencesResult, favoriteIds, recentIds] =
    await Promise.all([
      supabase
        .from("foods")
        .select(
          "id, name, food_group, cooked_state, calories, protein_g, carbohydrate_g, fat_g, fiber_g",
        )
        .is("deleted_at", null)
        .limit(300),
      supabase
        .from("dietary_preferences")
        .select("value")
        .eq("user_id", user.id)
        .in("preference_type", [
          "alergia",
          "restriccion",
          "alimento_no_deseado",
        ]),
      getFavoriteFoodIds(user.id),
      getRecentFoodIds(user.id),
    ]);

  const source = toEquivalenceFood(item.foods as DbFood);
  const alternatives = rankAlternatives({
    source,
    sourceQuantityG: Number(item.quantity_g),
    candidates: (candidatesResult.data ?? []).map((food) =>
      toEquivalenceFood(food as DbFood),
    ),
    favoriteIds,
    recentIds: new Set(recentIds),
    restrictions: (preferencesResult.data ?? []).map((row) => row.value),
  });

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
