"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";
import {
  rankAlternatives,
  type EquivalenceFood,
  type SwapCandidate,
} from "@/features/foods/lib/equivalence";
import { scaleMacros } from "@/features/nutrition/lib/macros";
import { getFavoriteFoodIds, getRecentFoodIds } from "@/features/foods/queries";
import type { FoodGroup } from "@/features/foods/schemas";
import { z } from "zod";

const t = messages.swap;

const swapSuggestionsSchema = z.object({ itemId: z.uuid() });

const swapItemSchema = z.object({
  itemId: z.uuid(),
  foodId: z.uuid(),
  quantityG: z.number().positive().max(5000),
});

export type SwapSuggestions = {
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

export async function getSwapSuggestions(
  input: unknown,
): Promise<{ error: string } | SwapSuggestions> {
  const parsed = swapSuggestionsSchema.safeParse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!parsed.success || !user) return { error: t.failed };

  const { data: item } = await supabase
    .from("meal_items")
    .select(
      "quantity_g, foods(id, name, food_group, cooked_state, calories, protein_g, carbohydrate_g, fat_g, fiber_g)",
    )
    .eq("id", parsed.data.itemId)
    .single();
  if (!item?.foods) return { error: t.failed };

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
        .select("preference_type, value")
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

/** Reemplaza el alimento del item recalculando el snapshot desde el catalogo. */
export async function swapMealItem(
  input: unknown,
): Promise<{ error: string } | { success: true }> {
  const parsed = swapItemSchema.safeParse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!parsed.success || !user) return { error: t.failed };

  const { data: food } = await supabase
    .from("foods")
    .select("calories, protein_g, carbohydrate_g, fat_g, fiber_g")
    .eq("id", parsed.data.foodId)
    .single();
  if (!food) return { error: t.failed };

  const snapshot = scaleMacros(
    {
      calories: Number(food.calories),
      proteinG: Number(food.protein_g),
      carbohydrateG: Number(food.carbohydrate_g),
      fatG: Number(food.fat_g),
      fiberG: Number(food.fiber_g),
    },
    parsed.data.quantityG,
  );

  const { error } = await supabase
    .from("meal_items")
    .update({
      food_id: parsed.data.foodId,
      quantity_g: parsed.data.quantityG,
      calories_snapshot: snapshot.calories,
      protein_snapshot: snapshot.proteinG,
      carbohydrate_snapshot: snapshot.carbohydrateG,
      fat_snapshot: snapshot.fatG,
      fiber_snapshot: snapshot.fiberG,
    })
    .eq("id", parsed.data.itemId);
  if (error) return { error: t.failed };

  revalidatePath("/nutricion");
  return { success: true };
}
