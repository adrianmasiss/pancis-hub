import { createClient } from "@/lib/supabase/server";
import type { MacroSet } from "@/features/nutrition/lib/macros";
import { perServing, recipeTotals } from "@/features/recipes/lib/recipe-macros";

export type RecipeIngredientView = {
  id: string;
  foodId: string;
  foodName: string;
  cookedState: string | null;
  quantityG: number;
  per100g: MacroSet;
};

export type RecipeSummary = {
  id: string;
  name: string;
  description: string | null;
  servings: number;
  preparationMinutes: number | null;
  difficulty: string | null;
  tags: string[];
  allergens: string[];
  isOwn: boolean;
  isPublic: boolean;
  perServing: MacroSet;
  ingredientCount: number;
  imageUrl: string | null;
};

export type RecipeDetail = RecipeSummary & {
  instructions: string | null;
  totals: MacroSet;
  ingredients: RecipeIngredientView[];
};

type RecipeRow = {
  id: string;
  owner_user_id: string;
  name: string;
  description: string | null;
  servings: number;
  instructions: string | null;
  preparation_minutes: number | null;
  difficulty: string | null;
  tags: string[];
  allergens: string[];
  visibility: string;
  image_url: string | null;
  recipe_ingredients: {
    id: string;
    food_id: string;
    quantity_g: number;
    foods: {
      name: string;
      cooked_state: string | null;
      calories: number;
      protein_g: number;
      carbohydrate_g: number;
      fat_g: number;
      fiber_g: number;
    } | null;
  }[];
};

const RECIPE_SELECT =
  "id, owner_user_id, name, description, servings, instructions, preparation_minutes, difficulty, tags, allergens, visibility, image_url, recipe_ingredients(id, food_id, quantity_g, foods(name, cooked_state, calories, protein_g, carbohydrate_g, fat_g, fiber_g))";

function mapIngredients(row: RecipeRow): RecipeIngredientView[] {
  return row.recipe_ingredients.map((ingredient) => ({
    id: ingredient.id,
    foodId: ingredient.food_id,
    foodName: ingredient.foods?.name ?? "",
    cookedState: ingredient.foods?.cooked_state ?? null,
    quantityG: Number(ingredient.quantity_g),
    per100g: {
      calories: Number(ingredient.foods?.calories ?? 0),
      proteinG: Number(ingredient.foods?.protein_g ?? 0),
      carbohydrateG: Number(ingredient.foods?.carbohydrate_g ?? 0),
      fatG: Number(ingredient.foods?.fat_g ?? 0),
      fiberG: Number(ingredient.foods?.fiber_g ?? 0),
    },
  }));
}

function mapDetail(row: RecipeRow, userId: string): RecipeDetail {
  const ingredients = mapIngredients(row);
  const totals = recipeTotals(ingredients);
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    servings: Number(row.servings),
    preparationMinutes: row.preparation_minutes,
    difficulty: row.difficulty,
    tags: row.tags ?? [],
    allergens: row.allergens ?? [],
    isOwn: row.owner_user_id === userId,
    isPublic: row.visibility === "public",
    instructions: row.instructions,
    totals,
    perServing: perServing(totals, Number(row.servings)),
    ingredients,
    ingredientCount: ingredients.length,
    imageUrl: row.image_url,
  };
}

export type RecipeFilters = {
  query?: string;
  view: "all" | "mine" | "highProtein" | "quick";
};

export async function getRecipes(
  userId: string,
  filters: RecipeFilters,
): Promise<RecipeSummary[]> {
  const supabase = await createClient();

  let query = supabase
    .from("recipes")
    .select(RECIPE_SELECT)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(60);
  if (filters.query) query = query.ilike("name", `%${filters.query}%`);
  if (filters.view === "mine") query = query.eq("owner_user_id", userId);
  if (filters.view === "quick") query = query.lte("preparation_minutes", 20);

  const { data } = await query;
  let recipes = ((data ?? []) as unknown as RecipeRow[]).map((row) =>
    mapDetail(row, userId),
  );
  if (filters.view === "highProtein") {
    recipes = recipes.filter((recipe) => recipe.perServing.proteinG >= 20);
  }
  return recipes;
}

export async function getRecipeDetail(
  userId: string,
  recipeId: string,
): Promise<RecipeDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("recipes")
    .select(RECIPE_SELECT)
    .eq("id", recipeId)
    .is("deleted_at", null)
    .maybeSingle();
  return data ? mapDetail(data as unknown as RecipeRow, userId) : null;
}
