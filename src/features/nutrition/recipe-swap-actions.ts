"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";
import { recordChange } from "@/lib/audit";
import { applyCorrection } from "@/features/foods/lib/corrections";
import { getUserFoodCorrections } from "@/features/foods/correction-actions";
import { scaleMacros, sumMacros, type MacroSet } from "@/features/nutrition/lib/macros";
import {
  rankRecipeMatches,
  type RecipeMatch,
  type RecipeOption,
} from "@/features/nutrition/lib/recipe-swap";

const t = messages.nutrition.recipeSwap;

const mealIdSchema = z.object({ mealId: z.uuid() });

const replaceSchema = z.object({
  mealId: z.uuid(),
  recipeId: z.uuid(),
  servings: z.number().positive().max(10),
});

export type RecipeSwapSuggestions = {
  mealName: string;
  mealMacros: MacroSet;
  matches: RecipeMatch[];
};

type IngredientRow = {
  food_id: string;
  quantity_g: number;
  foods: {
    id: string;
    name: string;
    calories: number;
    protein_g: number;
    carbohydrate_g: number;
    fat_g: number;
    fiber_g: number;
    cooked_state: string | null;
  } | null;
};

/**
 * Recetas que podrian sustituir a una comida, ordenadas por que tan cerca
 * quedan de lo planificado (requisito 5.2).
 */
export async function getRecipeSwapSuggestions(
  input: unknown,
): Promise<{ error: string } | RecipeSwapSuggestions> {
  const parsed = mealIdSchema.safeParse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!parsed.success || !user) return { error: t.failed };

  const [{ data: meal }, { data: recipes }, corrections] = await Promise.all([
    supabase
      .from("meals")
      .select(
        "name, meal_type, meal_items(calories_snapshot, protein_snapshot, carbohydrate_snapshot, fat_snapshot, fiber_snapshot)",
      )
      .eq("id", parsed.data.mealId)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("recipes")
      .select(
        "id, name, servings, image_url, recipe_ingredients(food_id, quantity_g, foods(id, name, calories, protein_g, carbohydrate_g, fat_g, fiber_g, cooked_state))",
      )
      .is("deleted_at", null)
      .limit(100),
    getUserFoodCorrections(user.id),
  ]);
  if (!meal) return { error: t.failed };

  const mealMacros = sumMacros(
    (meal.meal_items ?? []).map((item) => ({
      calories: Number(item.calories_snapshot),
      proteinG: Number(item.protein_snapshot),
      carbohydrateG: Number(item.carbohydrate_snapshot),
      fatG: Number(item.fat_snapshot),
      fiberG: Number(item.fiber_snapshot),
    })),
  );

  const options: RecipeOption[] = (recipes ?? [])
    .map((recipe) => {
      const ingredients = (recipe.recipe_ingredients ?? []) as IngredientRow[];
      const totals = sumMacros(
        ingredients
          .filter((ingredient) => ingredient.foods)
          .map((ingredient) => {
            // Las correcciones del usuario tambien valen dentro de una receta.
            const corrected = applyCorrection(
              {
                id: ingredient.foods!.id,
                name: ingredient.foods!.name,
                calories: Number(ingredient.foods!.calories),
                proteinG: Number(ingredient.foods!.protein_g),
                carbohydrateG: Number(ingredient.foods!.carbohydrate_g),
                fatG: Number(ingredient.foods!.fat_g),
                fiberG: Number(ingredient.foods!.fiber_g),
                cookedState: ingredient.foods!.cooked_state as
                  | "crudo"
                  | "cocido"
                  | null,
              },
              corrections.get(ingredient.foods!.id),
            );
            return scaleMacros(corrected, Number(ingredient.quantity_g));
          }),
      );

      const servings = Math.max(1, Number(recipe.servings));
      return {
        id: recipe.id,
        name: recipe.name,
        imageUrl: recipe.image_url,
        perServing: {
          calories: Math.round(totals.calories / servings),
          proteinG: Math.round((totals.proteinG / servings) * 10) / 10,
          carbohydrateG: Math.round((totals.carbohydrateG / servings) * 10) / 10,
          fatG: Math.round((totals.fatG / servings) * 10) / 10,
          fiberG: Math.round((totals.fiberG / servings) * 10) / 10,
        },
      };
    });

  return {
    mealName: meal.name || messages.nutrition.mealTypes[
      meal.meal_type as keyof typeof messages.nutrition.mealTypes
    ],
    mealMacros,
    matches: rankRecipeMatches(mealMacros, options),
  };
}

/**
 * Reemplaza el contenido de la comida por la receta escalada.
 *
 * El plan original NO se toca: esto opera sobre la comida registrada del
 * dia. Los items anteriores se eliminan y se sustituyen por los
 * ingredientes de la receta, con sus propios snapshots.
 */
export async function replaceMealWithRecipe(
  input: unknown,
): Promise<{ error: string } | { success: true }> {
  const parsed = replaceSchema.safeParse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!parsed.success || !user) return { error: t.failed };

  const [{ data: meal }, { data: recipe }, corrections] = await Promise.all([
    supabase
      .from("meals")
      .select(
        "id, name, status, meal_items(calories_snapshot, protein_snapshot, foods(name))",
      )
      .eq("id", parsed.data.mealId)
      .eq("user_id", user.id)
      .single(),
    supabase
      .from("recipes")
      .select(
        "name, servings, recipe_ingredients(food_id, quantity_g, foods(id, name, calories, protein_g, carbohydrate_g, fat_g, fiber_g, cooked_state))",
      )
      .eq("id", parsed.data.recipeId)
      .is("deleted_at", null)
      .single(),
    getUserFoodCorrections(user.id),
  ]);
  if (!meal || !recipe) return { error: t.failed };

  const ingredients = (recipe.recipe_ingredients ?? []) as IngredientRow[];
  if (ingredients.length === 0) return { error: t.emptyRecipe };

  const previousItems = (meal.meal_items ?? []).map(
    (item) => item.foods?.name ?? "",
  );

  const factor = parsed.data.servings / Math.max(1, Number(recipe.servings));

  const newItems = ingredients
    .filter((ingredient) => ingredient.foods)
    .map((ingredient) => {
      const corrected = applyCorrection(
        {
          id: ingredient.foods!.id,
          name: ingredient.foods!.name,
          calories: Number(ingredient.foods!.calories),
          proteinG: Number(ingredient.foods!.protein_g),
          carbohydrateG: Number(ingredient.foods!.carbohydrate_g),
          fatG: Number(ingredient.foods!.fat_g),
          fiberG: Number(ingredient.foods!.fiber_g),
          cookedState: ingredient.foods!.cooked_state as
            | "crudo"
            | "cocido"
            | null,
        },
        corrections.get(ingredient.foods!.id),
      );
      const quantityG = Math.round(Number(ingredient.quantity_g) * factor);
      const snapshot = scaleMacros(corrected, quantityG);
      return {
        meal_id: parsed.data.mealId,
        food_id: ingredient.food_id,
        quantity_g: quantityG,
        calories_snapshot: snapshot.calories,
        protein_snapshot: snapshot.proteinG,
        carbohydrate_snapshot: snapshot.carbohydrateG,
        fat_snapshot: snapshot.fatG,
        fiber_snapshot: snapshot.fiberG,
      };
    })
    .filter((item) => item.quantity_g > 0);

  if (newItems.length === 0) return { error: t.emptyRecipe };

  const { error: deleteError } = await supabase
    .from("meal_items")
    .delete()
    .eq("meal_id", parsed.data.mealId);
  if (deleteError) return { error: t.failed };

  const { error: insertError } = await supabase
    .from("meal_items")
    .insert(newItems);
  if (insertError) return { error: t.failed };

  // Una comida ya completada que cambia de contenido queda marcada como
  // desviada del plan, igual que al sustituir un alimento.
  await supabase
    .from("meals")
    .update({
      name: recipe.name,
      ...(meal.status === "completada"
        ? { status: "completada_con_cambios", modified_reason: t.auditReason }
        : {}),
    })
    .eq("id", parsed.data.mealId)
    .eq("user_id", user.id);

  await recordChange({
    actorUserId: user.id,
    action: "comida_sustituida_por_receta",
    entity: "meals",
    entityId: parsed.data.mealId,
    previousValues: {
      comida: meal.name ?? "",
      alimentos: previousItems.join(", "),
    },
    newValues: {
      receta: recipe.name,
      porciones: parsed.data.servings,
    },
    reason: t.auditReason,
    origin: "usuario",
  });

  revalidatePath("/nutricion");
  revalidatePath("/");
  return { success: true };
}
