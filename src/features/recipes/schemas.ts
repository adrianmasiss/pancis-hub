import { z } from "zod";

export const recipeFormSchema = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
  servings: z.number().positive().max(50),
  preparationMinutes: z.number().int().positive().max(600).optional(),
  difficulty: z.enum(["facil", "media", "dificil"]).optional(),
  instructions: z.string().trim().max(4000).optional(),
  tags: z.string().trim().max(200).optional(),
  allergens: z.string().trim().max(200).optional(),
});

export const updateRecipeSchema = recipeFormSchema.extend({
  recipeId: z.uuid(),
});

export const recipeIdSchema = z.object({ recipeId: z.uuid() });

export const addIngredientSchema = z.object({
  recipeId: z.uuid(),
  foodId: z.uuid(),
  quantityG: z.number().positive().max(5000),
});

export const updateIngredientSchema = z.object({
  ingredientId: z.uuid(),
  quantityG: z.number().positive().max(5000),
});

export const ingredientIdSchema = z.object({ ingredientId: z.uuid() });

export const addRecipeToPlanSchema = z.object({
  recipeId: z.uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  mealType: z.enum(["desayuno", "almuerzo", "cena", "snack", "otro"]),
  servings: z.number().positive().max(20),
});

export type RecipeFormInput = z.infer<typeof recipeFormSchema>;
