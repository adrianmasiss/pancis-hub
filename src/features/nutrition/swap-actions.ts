"use server";

import { revalidatePath } from "next/cache";
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
import { scaleMacros, type MacroSet } from "@/features/nutrition/lib/macros";
import {
  rebalanceDay,
  type RebalanceReport,
} from "@/features/nutrition/lib/rebalance";
import { recordChange } from "@/lib/audit";
import { applyCorrection } from "@/features/foods/lib/corrections";
import { getUserFoodCorrections } from "@/features/foods/correction-actions";
import { getFavoriteFoodIds, getRecentFoodIds } from "@/features/foods/queries";
import { getPantryFoodIds } from "@/features/pantry/queries";
import type { FoodGroup } from "@/features/foods/schemas";
import { z } from "zod";

const t = messages.swap;

const swapSuggestionsSchema = z.object({
  itemId: z.uuid(),
  filter: z.enum(SWAP_FILTERS).optional(),
});

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

  const [candidatesResult, preferencesResult, favoriteIds, recentIds, pantryIds] =
    await Promise.all([
      supabase
        .from("foods")
        .select(
          "id, name, food_group, cooked_state, calories, protein_g, carbohydrate_g, fat_g, fiber_g, food_portions(label, grams)",
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
      getPantryFoodIds(user.id),
    ]);

  const candidateRows = candidatesResult.data ?? [];
  const portionsByFoodId = buildPortionsMap(candidateRows);

  const source = toEquivalenceFood(item.foods as DbFood);
  const alternatives = attachHouseholdEquivalence(
    rankAlternatives({
      source,
      sourceQuantityG: Number(item.quantity_g),
      candidates: candidateRows.map((food) => toEquivalenceFood(food as DbFood)),
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

/** Reemplaza el alimento del item recalculando el snapshot desde el catalogo. */
export async function swapMealItem(
  input: unknown,
): Promise<
  { error: string } | { success: true; rebalance: RebalanceReport | null }
> {
  const parsed = swapItemSchema.safeParse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!parsed.success || !user) return { error: t.failed };

  // Se lee el estado anterior ANTES de actualizar: el historial necesita
  // los valores previos y despues del update ya no existen.
  const { data: previousItem } = await supabase
    .from("meal_items")
    .select(
      "quantity_g, calories_snapshot, protein_snapshot, carbohydrate_snapshot, fat_snapshot, foods(name)",
    )
    .eq("id", parsed.data.itemId)
    .single();

  const [{ data: food }, corrections] = await Promise.all([
    supabase
      .from("foods")
      .select("id, name, calories, protein_g, carbohydrate_g, fat_g, fiber_g, cooked_state")
      .eq("id", parsed.data.foodId)
      .single(),
    getUserFoodCorrections(user.id),
  ]);
  if (!food) return { error: t.failed };

  // Se registra el valor corregido por el usuario, que es el que vio al
  // aceptar la sustitucion.
  const corrected = applyCorrection(
    {
      id: food.id,
      name: food.name,
      calories: Number(food.calories),
      proteinG: Number(food.protein_g),
      carbohydrateG: Number(food.carbohydrate_g),
      fatG: Number(food.fat_g),
      fiberG: Number(food.fiber_g),
      cookedState: food.cooked_state as "crudo" | "cocido" | null,
    },
    corrections.get(food.id),
  );

  const snapshot = scaleMacros(
    {
      calories: corrected.calories,
      proteinG: corrected.proteinG,
      carbohydrateG: corrected.carbohydrateG,
      fatG: corrected.fatG,
      fiberG: corrected.fiberG,
    },
    parsed.data.quantityG,
  );

  const { data: updated, error } = await supabase
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
    .eq("id", parsed.data.itemId)
    .select("meal_id")
    .single();
  if (error || !updated) return { error: t.failed };

  // Una comida ya completada que se sustituye pasa a "completada con
  // cambios": sigue sumando al dia, pero deja registro de que se desvio
  // del plan. Una comida aun planificada no se completa sola.
  await supabase
    .from("meals")
    .update({ status: "completada_con_cambios", modified_reason: t.modifiedReason })
    .eq("id", updated.meal_id)
    .eq("user_id", user.id)
    .eq("status", "completada");

  await recordChange({
    actorUserId: user.id,
    action: "alimento_sustituido",
    entity: "meal_items",
    entityId: parsed.data.itemId,
    previousValues: previousItem
      ? {
          alimento: previousItem.foods?.name ?? null,
          cantidad_g: Number(previousItem.quantity_g),
          calorias: Number(previousItem.calories_snapshot),
          proteina_g: Number(previousItem.protein_snapshot),
          carbohidratos_g: Number(previousItem.carbohydrate_snapshot),
          grasas_g: Number(previousItem.fat_snapshot),
        }
      : null,
    newValues: {
      alimento: corrected.name,
      cantidad_g: parsed.data.quantityG,
      calorias: snapshot.calories,
      proteina_g: snapshot.proteinG,
      carbohidratos_g: snapshot.carbohydrateG,
      grasas_g: snapshot.fatG,
    },
    reason: t.modifiedReason,
    origin: "usuario",
  });

  revalidatePath("/nutricion");
  revalidatePath("/");

  // El dia dejo de cuadrar: se devuelve como queda para que el usuario
  // decida. No se toca ninguna otra comida (requisito 6).
  const rebalance = await buildRebalanceReport(user.id, updated.meal_id);
  return { success: true, rebalance };
}

/**
 * Estado del dia tras un cambio: objetivo vigente contra lo consumido,
 * mas las comidas que siguen pendientes. Si no hay objetivo definido no
 * hay nada contra que comparar y se omite el reporte.
 */
async function buildRebalanceReport(
  userId: string,
  mealId: string,
): Promise<RebalanceReport | null> {
  const supabase = await createClient();

  const { data: meal } = await supabase
    .from("meals")
    .select("date")
    .eq("id", mealId)
    .single();
  if (!meal) return null;

  const [targetResult, mealsResult] = await Promise.all([
    supabase
      .from("nutrition_targets")
      .select("calories, protein_g, carbohydrate_g, fat_g, fiber_g")
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle(),
    supabase
      .from("meals")
      .select(
        "status, meal_items(calories_snapshot, protein_snapshot, carbohydrate_snapshot, fat_snapshot, fiber_snapshot)",
      )
      .eq("user_id", userId)
      .eq("date", meal.date)
      .is("deleted_at", null),
  ]);

  const target = targetResult.data;
  if (!target) return null;

  const consumed: MacroSet = {
    calories: 0,
    proteinG: 0,
    carbohydrateG: 0,
    fatG: 0,
    fiberG: 0,
  };
  let pendingMeals = 0;

  for (const row of mealsResult.data ?? []) {
    if (row.status === "omitida") continue;
    if (row.status === "planificada") {
      pendingMeals += 1;
      continue;
    }
    // Solo lo ya consumido suma; lo planificado queda como pendiente.
    for (const item of row.meal_items ?? []) {
      consumed.calories += item.calories_snapshot ?? 0;
      consumed.proteinG += item.protein_snapshot ?? 0;
      consumed.carbohydrateG += item.carbohydrate_snapshot ?? 0;
      consumed.fatG += item.fat_snapshot ?? 0;
      consumed.fiberG += item.fiber_snapshot ?? 0;
    }
  }

  return rebalanceDay({
    target: {
      calories: Number(target.calories),
      proteinG: Number(target.protein_g),
      carbohydrateG: Number(target.carbohydrate_g),
      fatG: Number(target.fat_g),
      fiberG: Number(target.fiber_g ?? 0),
    },
    consumed,
    pendingMeals,
  });
}
