"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";
import { recordChange } from "@/lib/audit";
import { scaleMacros } from "@/features/nutrition/lib/macros";
import {
  addMealItemSchema,
  createMealSchema,
  duplicateDaySchema,
  itemIdSchema,
  mealIdSchema,
  searchFoodsSchema,
  updateMealItemSchema,
  updateMealNotesSchema,
  updateMealStatusSchema,
  updateMealTimeSchema,
} from "@/features/nutrition/schemas";

const t = messages.nutrition;

export type NutritionActionResult = { error: string } | { success: true };

type FoodSearchResult = {
  id: string;
  name: string;
  brand: string | null;
  foodGroup: string;
  cookedState: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  portions: { id: string; label: string; grams: number }[];
  imageUrl: string | null;
  defaultServingAmount: number;
  defaultServingUnit: string;
};

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

const fail: NutritionActionResult = { error: t.actionFailed };

export async function createMeal(
  input: unknown,
): Promise<NutritionActionResult> {
  const parsed = createMealSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { error } = await supabase.from("meals").insert({
    user_id: user.id,
    date: parsed.data.date,
    meal_type: parsed.data.mealType,
    name: parsed.data.name || null,
    scheduled_time: parsed.data.scheduledTime ?? null,
  });
  if (error) return fail;
  revalidatePath("/nutricion");
  return { success: true };
}

export async function updateMealStatus(
  input: unknown,
): Promise<NutritionActionResult> {
  const parsed = updateMealStatusSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { data: previous } = await supabase
    .from("meals")
    .select("status, name, meal_type")
    .eq("id", parsed.data.mealId)
    .eq("user_id", user.id)
    .single();

  const { error } = await supabase
    .from("meals")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.mealId)
    .eq("user_id", user.id);
  if (error) return fail;

  await recordChange({
    actorUserId: user.id,
    action: "comida_estado_cambiado",
    entity: "meals",
    entityId: parsed.data.mealId,
    previousValues: previous ? { estado: previous.status } : null,
    newValues: {
      estado: parsed.data.status,
      comida: previous?.name ?? previous?.meal_type ?? null,
    },
    origin: "usuario",
  });

  revalidatePath("/nutricion");
  return { success: true };
}

/** Cambia (o borra) el horario de una comida ya registrada. */
export async function updateMealTime(
  input: unknown,
): Promise<NutritionActionResult> {
  const parsed = updateMealTimeSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { error } = await supabase
    .from("meals")
    .update({ scheduled_time: parsed.data.scheduledTime ?? null })
    .eq("id", parsed.data.mealId)
    .eq("user_id", user.id);
  if (error) return fail;
  revalidatePath("/nutricion");
  revalidatePath("/");
  return { success: true };
}

export async function updateMealNotes(
  input: unknown,
): Promise<NutritionActionResult> {
  const parsed = updateMealNotesSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { error } = await supabase
    .from("meals")
    .update({ notes: parsed.data.notes || null })
    .eq("id", parsed.data.mealId)
    .eq("user_id", user.id);
  if (error) return fail;
  revalidatePath("/nutricion");
  return { success: true };
}

/** Soft delete de la comida (conserva historicos referenciados). */
export async function deleteMeal(
  input: unknown,
): Promise<NutritionActionResult> {
  const parsed = mealIdSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { error } = await supabase
    .from("meals")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.mealId)
    .eq("user_id", user.id);
  if (error) return fail;
  revalidatePath("/nutricion");
  return { success: true };
}

export async function addMealItem(
  input: unknown,
): Promise<NutritionActionResult> {
  const parsed = addMealItemSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  // El snapshot se calcula en servidor desde el catalogo actual.
  const { data: food } = await supabase
    .from("foods")
    .select("calories, protein_g, carbohydrate_g, fat_g, fiber_g")
    .eq("id", parsed.data.foodId)
    .single();
  if (!food) return fail;

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

  const { error } = await supabase.from("meal_items").insert({
    meal_id: parsed.data.mealId,
    food_id: parsed.data.foodId,
    quantity_g: parsed.data.quantityG,
    calories_snapshot: snapshot.calories,
    protein_snapshot: snapshot.proteinG,
    carbohydrate_snapshot: snapshot.carbohydrateG,
    fat_snapshot: snapshot.fatG,
    fiber_snapshot: snapshot.fiberG,
  });
  if (error) return fail;
  revalidatePath("/nutricion");
  return { success: true };
}

export async function updateMealItemQuantity(
  input: unknown,
): Promise<NutritionActionResult> {
  const parsed = updateMealItemSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  // Reescala el snapshot conservando la proporcion registrada
  // (el snapshot es la fuente historica, no el catalogo actual).
  const { data: item } = await supabase
    .from("meal_items")
    .select(
      "quantity_g, calories_snapshot, protein_snapshot, carbohydrate_snapshot, fat_snapshot, fiber_snapshot",
    )
    .eq("id", parsed.data.itemId)
    .single();
  if (!item) return fail;

  const per100: Parameters<typeof scaleMacros>[0] = {
    calories: (Number(item.calories_snapshot) / Number(item.quantity_g)) * 100,
    proteinG: (Number(item.protein_snapshot) / Number(item.quantity_g)) * 100,
    carbohydrateG:
      (Number(item.carbohydrate_snapshot) / Number(item.quantity_g)) * 100,
    fatG: (Number(item.fat_snapshot) / Number(item.quantity_g)) * 100,
    fiberG: (Number(item.fiber_snapshot) / Number(item.quantity_g)) * 100,
  };
  const snapshot = scaleMacros(per100, parsed.data.quantityG);

  const { error } = await supabase
    .from("meal_items")
    .update({
      quantity_g: parsed.data.quantityG,
      calories_snapshot: snapshot.calories,
      protein_snapshot: snapshot.proteinG,
      carbohydrate_snapshot: snapshot.carbohydrateG,
      fat_snapshot: snapshot.fatG,
      fiber_snapshot: snapshot.fiberG,
    })
    .eq("id", parsed.data.itemId);
  if (error) return fail;
  revalidatePath("/nutricion");
  return { success: true };
}

export async function deleteMealItem(
  input: unknown,
): Promise<NutritionActionResult> {
  const parsed = itemIdSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { error } = await supabase
    .from("meal_items")
    .delete()
    .eq("id", parsed.data.itemId);
  if (error) return fail;
  revalidatePath("/nutricion");
  return { success: true };
}

/** Duplica una comida con sus items (snapshots incluidos) en el mismo dia. */
export async function copyMeal(input: unknown): Promise<NutritionActionResult> {
  const parsed = mealIdSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { data: meal } = await supabase
    .from("meals")
    .select("date, meal_type, name, meal_items(*)")
    .eq("id", parsed.data.mealId)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();
  if (!meal) return fail;

  const { data: created, error: mealError } = await supabase
    .from("meals")
    .insert({
      user_id: user.id,
      date: meal.date,
      meal_type: meal.meal_type,
      name: meal.name,
    })
    .select("id")
    .single();
  if (mealError || !created) return fail;

  if ((meal.meal_items ?? []).length > 0) {
    const { error: itemsError } = await supabase.from("meal_items").insert(
      (meal.meal_items ?? []).map((item) => ({
        meal_id: created.id,
        food_id: item.food_id,
        quantity_g: item.quantity_g,
        calories_snapshot: item.calories_snapshot,
        protein_snapshot: item.protein_snapshot,
        carbohydrate_snapshot: item.carbohydrate_snapshot,
        fat_snapshot: item.fat_snapshot,
        fiber_snapshot: item.fiber_snapshot,
      })),
    );
    if (itemsError) return fail;
  }
  revalidatePath("/nutricion");
  return { success: true };
}

/** Copia todas las comidas (con items) de un dia a otro. */
export async function duplicateDay(
  input: unknown,
): Promise<NutritionActionResult> {
  const parsed = duplicateDaySchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { data: meals } = await supabase
    .from("meals")
    .select("meal_type, name, meal_items(*)")
    .eq("user_id", user.id)
    .eq("date", parsed.data.fromDate)
    .is("deleted_at", null);
  if (!meals || meals.length === 0) {
    return { error: t.duplicateYesterdayEmpty };
  }

  for (const meal of meals) {
    const { data: created, error: mealError } = await supabase
      .from("meals")
      .insert({
        user_id: user.id,
        date: parsed.data.toDate,
        meal_type: meal.meal_type,
        name: meal.name,
      })
      .select("id")
      .single();
    if (mealError || !created) return fail;

    if ((meal.meal_items ?? []).length > 0) {
      const { error: itemsError } = await supabase.from("meal_items").insert(
        (meal.meal_items ?? []).map((item) => ({
          meal_id: created.id,
          food_id: item.food_id,
          quantity_g: item.quantity_g,
          calories_snapshot: item.calories_snapshot,
          protein_snapshot: item.protein_snapshot,
          carbohydrate_snapshot: item.carbohydrate_snapshot,
          fat_snapshot: item.fat_snapshot,
          fiber_snapshot: item.fiber_snapshot,
        })),
      );
      if (itemsError) return fail;
    }
  }
  revalidatePath("/nutricion");
  return { success: true };
}

/** Busqueda de alimentos del catalogo con sus porciones domesticas. */
export async function searchFoods(
  input: unknown,
): Promise<{ error: string } | { results: FoodSearchResult[] }> {
  const parsed = searchFoodsSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return { error: t.actionFailed };

  const { data, error } = await supabase
    .from("foods")
    .select(
      "id, name, brand, food_group, cooked_state, calories, protein_g, image_url, serving_amount, serving_unit, food_portions(id, label, grams)",
    )
    .ilike("name", `%${parsed.data.term}%`)
    .is("deleted_at", null)
    .order("name")
    .limit(20);
  if (error) return { error: t.actionFailed };

  return {
    results: (data ?? []).map((food) => ({
      id: food.id,
      name: food.name,
      brand: food.brand,
      foodGroup: food.food_group,
      cookedState: food.cooked_state,
      caloriesPer100g: Number(food.calories),
      proteinPer100g: Number(food.protein_g),
      portions: (food.food_portions ?? []).map((portion) => ({
        id: portion.id,
        label: portion.label,
        grams: Number(portion.grams),
      })),
      imageUrl: food.image_url,
      defaultServingAmount: Number(food.serving_amount ?? 100),
      defaultServingUnit: food.serving_unit ?? "g",
    })),
  };
}
