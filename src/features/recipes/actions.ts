"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";
import { fetchAndStoreFoodImage } from "@/lib/images/food-image";
import { scaleMacros } from "@/features/nutrition/lib/macros";
import { parseCommaList } from "@/features/onboarding/schemas";
import {
  addIngredientSchema,
  addRecipeToPlanSchema,
  ingredientIdSchema,
  recipeFormSchema,
  recipeIdSchema,
  updateIngredientSchema,
  updateRecipeSchema,
} from "@/features/recipes/schemas";

const t = messages.recipes;

export type RecipesActionResult = { error: string } | { success: true };

const fail: RecipesActionResult = { error: t.actionFailed };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createRecipe(
  input: unknown,
): Promise<RecipesActionResult> {
  const parsed = recipeFormSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { data: created, error } = await supabase
    .from("recipes")
    .insert({
      owner_user_id: user.id,
      name: parsed.data.name,
      description: parsed.data.description || null,
      servings: parsed.data.servings,
      preparation_minutes: parsed.data.preparationMinutes ?? null,
      difficulty: parsed.data.difficulty ?? null,
      instructions: parsed.data.instructions || null,
      tags: parseCommaList(parsed.data.tags),
      allergens: parseCommaList(parsed.data.allergens),
    })
    .select("id")
    .single();
  if (error || !created) return fail;

  const imageUrl = await fetchAndStoreFoodImage({
    query: parsed.data.name,
    pathPrefix: "recipes",
    id: created.id,
  });
  if (imageUrl) {
    await supabase
      .from("recipes")
      .update({ image_url: imageUrl })
      .eq("id", created.id);
  }

  revalidatePath("/recetas");
  redirect(`/recetas/${created.id}`);
}

export async function updateRecipe(
  input: unknown,
): Promise<RecipesActionResult> {
  const parsed = updateRecipeSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { error } = await supabase
    .from("recipes")
    .update({
      name: parsed.data.name,
      description: parsed.data.description || null,
      servings: parsed.data.servings,
      preparation_minutes: parsed.data.preparationMinutes ?? null,
      difficulty: parsed.data.difficulty ?? null,
      instructions: parsed.data.instructions || null,
      tags: parseCommaList(parsed.data.tags),
      allergens: parseCommaList(parsed.data.allergens),
    })
    .eq("id", parsed.data.recipeId)
    .eq("owner_user_id", user.id);
  if (error) return fail;

  revalidatePath("/recetas");
  revalidatePath(`/recetas/${parsed.data.recipeId}`);
  return { success: true };
}

export async function deleteRecipe(
  input: unknown,
): Promise<RecipesActionResult> {
  const parsed = recipeIdSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { error } = await supabase
    .from("recipes")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.recipeId)
    .eq("owner_user_id", user.id);
  if (error) return fail;

  revalidatePath("/recetas");
  redirect("/recetas");
}

export async function duplicateRecipe(
  input: unknown,
): Promise<RecipesActionResult> {
  const parsed = recipeIdSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { data: recipe } = await supabase
    .from("recipes")
    .select(
      "name, description, servings, instructions, preparation_minutes, difficulty, tags, allergens, recipe_ingredients(food_id, quantity_g)",
    )
    .eq("id", parsed.data.recipeId)
    .is("deleted_at", null)
    .single();
  if (!recipe) return fail;

  const { data: created, error } = await supabase
    .from("recipes")
    .insert({
      owner_user_id: user.id,
      name: `${recipe.name} (copia)`,
      description: recipe.description,
      servings: recipe.servings,
      instructions: recipe.instructions,
      preparation_minutes: recipe.preparation_minutes,
      difficulty: recipe.difficulty,
      tags: recipe.tags,
      allergens: recipe.allergens,
    })
    .select("id")
    .single();
  if (error || !created) return fail;

  if ((recipe.recipe_ingredients ?? []).length > 0) {
    const { error: ingredientsError } = await supabase
      .from("recipe_ingredients")
      .insert(
        (recipe.recipe_ingredients ?? []).map((ingredient) => ({
          recipe_id: created.id,
          food_id: ingredient.food_id,
          quantity_g: ingredient.quantity_g,
        })),
      );
    if (ingredientsError) return fail;
  }
  revalidatePath("/recetas");
  redirect(`/recetas/${created.id}`);
}

export async function addRecipeIngredient(
  input: unknown,
): Promise<RecipesActionResult> {
  const parsed = addIngredientSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { error } = await supabase.from("recipe_ingredients").insert({
    recipe_id: parsed.data.recipeId,
    food_id: parsed.data.foodId,
    quantity_g: parsed.data.quantityG,
  });
  if (error) return fail;
  revalidatePath(`/recetas/${parsed.data.recipeId}`);
  return { success: true };
}

export async function updateRecipeIngredient(
  input: unknown,
): Promise<RecipesActionResult> {
  const parsed = updateIngredientSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { error } = await supabase
    .from("recipe_ingredients")
    .update({ quantity_g: parsed.data.quantityG })
    .eq("id", parsed.data.ingredientId);
  if (error) return fail;
  revalidatePath("/recetas", "layout");
  return { success: true };
}

export async function removeRecipeIngredient(
  input: unknown,
): Promise<RecipesActionResult> {
  const parsed = ingredientIdSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { error } = await supabase
    .from("recipe_ingredients")
    .delete()
    .eq("id", parsed.data.ingredientId);
  if (error) return fail;
  revalidatePath("/recetas", "layout");
  return { success: true };
}

/**
 * Agrega la receta al plan del dia como una comida con sus ingredientes
 * escalados a las porciones elegidas; los snapshots se toman del catalogo.
 */
export async function addRecipeToPlan(
  input: unknown,
): Promise<RecipesActionResult> {
  const parsed = addRecipeToPlanSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { data: recipe } = await supabase
    .from("recipes")
    .select(
      "name, servings, recipe_ingredients(food_id, quantity_g, foods(calories, protein_g, carbohydrate_g, fat_g, fiber_g))",
    )
    .eq("id", parsed.data.recipeId)
    .is("deleted_at", null)
    .single();
  if (!recipe || (recipe.recipe_ingredients ?? []).length === 0) return fail;

  const { data: meal, error: mealError } = await supabase
    .from("meals")
    .insert({
      user_id: user.id,
      date: parsed.data.date,
      meal_type: parsed.data.mealType,
      name: recipe.name,
    })
    .select("id")
    .single();
  if (mealError || !meal) return fail;

  const factor = parsed.data.servings / Number(recipe.servings);
  const items = (recipe.recipe_ingredients ?? []).map((ingredient) => {
    const quantity =
      Math.round(Number(ingredient.quantity_g) * factor * 10) / 10;
    const snapshot = scaleMacros(
      {
        calories: Number(ingredient.foods?.calories ?? 0),
        proteinG: Number(ingredient.foods?.protein_g ?? 0),
        carbohydrateG: Number(ingredient.foods?.carbohydrate_g ?? 0),
        fatG: Number(ingredient.foods?.fat_g ?? 0),
        fiberG: Number(ingredient.foods?.fiber_g ?? 0),
      },
      quantity,
    );
    return {
      meal_id: meal.id,
      food_id: ingredient.food_id,
      quantity_g: quantity,
      calories_snapshot: snapshot.calories,
      protein_snapshot: snapshot.proteinG,
      carbohydrate_snapshot: snapshot.carbohydrateG,
      fat_snapshot: snapshot.fatG,
      fiber_snapshot: snapshot.fiberG,
    };
  });

  const { error: itemsError } = await supabase.from("meal_items").insert(items);
  if (itemsError) return fail;

  revalidatePath("/nutricion");
  return { success: true };
}
