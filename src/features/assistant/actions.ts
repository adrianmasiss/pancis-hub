"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";
import { windowDifference, trendDirection } from "@/lib/trends";
import {
  rankAlternatives,
  type EquivalenceFood,
} from "@/features/foods/lib/equivalence";
import { getFavoriteFoodIds, getRecentFoodIds } from "@/features/foods/queries";
import type { FoodGroup } from "@/features/foods/schemas";
import {
  detectIntent,
  deterministicProvider,
} from "@/features/assistant/lib/rules";
import type {
  AssistantContext,
  AssistantReply,
  FoodAlternativeSuggestion,
} from "@/features/assistant/types";

const askSchema = z.object({ message: z.string().trim().min(1).max(500) });

function todayInTimezone(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

async function buildContext(userId: string): Promise<AssistantContext> {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, primary_goal, timezone")
    .eq("id", userId)
    .single();
  const today = todayInTimezone(profile?.timezone ?? "UTC");
  const since60 = new Date(Date.now() - 60 * 86400000)
    .toISOString()
    .slice(0, 10);

  const [targetsResult, mealsResult, weightsResult, checkinResult, planResult] =
    await Promise.all([
      supabase
        .from("nutrition_targets")
        .select("calories, protein_g, carbohydrate_g, fat_g")
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle(),
      supabase
        .from("meals")
        .select(
          "status, meal_items(calories_snapshot, protein_snapshot, carbohydrate_snapshot, fat_snapshot)",
        )
        .eq("user_id", userId)
        .eq("date", today)
        .is("deleted_at", null),
      supabase
        .from("body_measurements")
        .select("measured_at, weight_kg")
        .eq("user_id", userId)
        .gte("measured_at", since60)
        .not("weight_kg", "is", null)
        .order("measured_at"),
      supabase
        .from("daily_checkins")
        .select("sleep_hours")
        .eq("user_id", userId)
        .eq("date", today)
        .maybeSingle(),
      supabase
        .from("workout_plans")
        .select("name")
        .eq("user_id", userId)
        .eq("active", true)
        .is("deleted_at", null)
        .maybeSingle(),
    ]);

  const consumed = { calories: 0, proteinG: 0, carbohydrateG: 0, fatG: 0 };
  for (const meal of mealsResult.data ?? []) {
    if (meal.status === "omitida") continue;
    for (const item of meal.meal_items ?? []) {
      consumed.calories += Number(item.calories_snapshot);
      consumed.proteinG += Number(item.protein_snapshot);
      consumed.carbohydrateG += Number(item.carbohydrate_snapshot);
      consumed.fatG += Number(item.fat_snapshot);
    }
  }

  const series = (weightsResult.data ?? []).map((row) => ({
    date: row.measured_at,
    value: Number(row.weight_kg),
  }));
  const weeklyChange = windowDifference(series, 7);

  return {
    displayName: profile?.display_name ?? "",
    primaryGoal: profile?.primary_goal ?? null,
    targets: targetsResult.data
      ? {
          calories: targetsResult.data.calories,
          proteinG: Number(targetsResult.data.protein_g),
          carbohydrateG: Number(targetsResult.data.carbohydrate_g),
          fatG: Number(targetsResult.data.fat_g),
        }
      : null,
    consumedToday: consumed,
    weightWeeklyChange: weeklyChange,
    weightTrend: trendDirection(weeklyChange),
    sleepHoursToday:
      checkinResult.data?.sleep_hours !== null && checkinResult.data !== null
        ? Number(checkinResult.data.sleep_hours)
        : null,
    activePlanName: planResult.data?.name ?? null,
  };
}

/** Busca el alimento mencionado y calcula alternativas reales del catalogo. */
async function findFoodAlternatives(
  userId: string,
  foodName: string,
): Promise<FoodAlternativeSuggestion[]> {
  const supabase = await createClient();
  const { data: matches } = await supabase
    .from("foods")
    .select(
      "id, name, food_group, cooked_state, calories, protein_g, carbohydrate_g, fat_g, fiber_g",
    )
    .ilike("name", `%${foodName}%`)
    .is("deleted_at", null)
    .limit(1);
  const source = matches?.[0];
  if (!source) return [];

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
        .eq("user_id", userId)
        .in("preference_type", [
          "alergia",
          "restriccion",
          "alimento_no_deseado",
        ]),
      getFavoriteFoodIds(userId),
      getRecentFoodIds(userId),
    ]);

  const toEquivalence = (food: typeof source): EquivalenceFood => ({
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
  });

  return rankAlternatives({
    source: toEquivalence(source),
    sourceQuantityG: 100,
    candidates: (candidatesResult.data ?? []).map(toEquivalence),
    favoriteIds,
    recentIds: new Set(recentIds),
    restrictions: (preferencesResult.data ?? []).map((row) => row.value),
    maxResults: 2,
  }).map((candidate) => ({
    name: candidate.food.name,
    suggestedQuantityG: candidate.suggestedQuantityG,
    caloriesDiff: candidate.diff.calories,
  }));
}

export async function askAssistant(
  input: unknown,
): Promise<{ error: string } | { reply: AssistantReply }> {
  const parsed = askSchema.safeParse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!parsed.success || !user) {
    return { error: messages.assistant.actionFailed };
  }

  const intent = detectIntent(parsed.data.message);
  const context = await buildContext(user.id);
  const foodAlternatives =
    intent.kind === "foodMissing"
      ? await findFoodAlternatives(user.id, intent.foodName)
      : undefined;

  return {
    reply: deterministicProvider.generateReply({
      context,
      intent,
      foodAlternatives,
    }),
  };
}
