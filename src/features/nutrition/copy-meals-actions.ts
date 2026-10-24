"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const FALLO = "No se pudieron copiar las comidas.";

export type DayMealSummary = {
  id: string;
  mealType: string;
  name: string | null;
  time: string | null;
  calories: number;
  foods: string[];
};

async function usuario() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Las comidas registradas de un dia, para elegir cuales copiar. */
export async function getDayMeals(
  input: unknown,
): Promise<{ error: string } | { meals: DayMealSummary[] }> {
  const parsed = z.object({ date: z.iso.date() }).safeParse(input);
  const { supabase, user } = await usuario();
  if (!parsed.success || !user) return { error: FALLO };

  const { data, error } = await supabase
    .from("meals")
    .select(
      "id, meal_type, name, scheduled_time, created_at, meal_items(quantity_g, calories_snapshot, foods(name))",
    )
    .eq("user_id", user.id)
    .eq("date", parsed.data.date)
    .is("deleted_at", null)
    .order("scheduled_time", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: true });
  if (error) return { error: FALLO };

  return {
    meals: (data ?? []).map((m) => ({
      id: m.id,
      mealType: m.meal_type,
      name: m.name,
      time: m.scheduled_time?.slice(0, 5) ?? null,
      calories: (m.meal_items ?? []).reduce(
        (t, i) => t + Number(i.calories_snapshot ?? 0),
        0,
      ),
      foods: (m.meal_items ?? [])
        .map((i) => i.foods?.name)
        .filter((n): n is string => Boolean(n)),
    })),
  };
}

/**
 * Copia las comidas elegidas (con sus items y snapshots) a otra fecha.
 * Devuelve los ids creados para poder deshacer. Si una comida venia del plan
 * y ese dia ya tiene registrada esa misma comida del plan, la copia queda
 * como extra: el plan admite un registro por comida y dia.
 */
export async function copyMealsToDate(
  input: unknown,
): Promise<{ error: string } | { created: string[] }> {
  const parsed = z
    .object({
      mealIds: z.array(z.uuid()).min(1).max(20),
      toDate: z.iso.date(),
    })
    .safeParse(input);
  const { supabase, user } = await usuario();
  if (!parsed.success || !user) return { error: FALLO };

  const [{ data: meals }, { data: yaEnDestino }] = await Promise.all([
    supabase
      .from("meals")
      .select(
        "id, meal_type, name, status, scheduled_time, source_template_meal_id, meal_items(*)",
      )
      .eq("user_id", user.id)
      .in("id", parsed.data.mealIds)
      .is("deleted_at", null),
    supabase
      .from("meals")
      .select("source_template_meal_id")
      .eq("user_id", user.id)
      .eq("date", parsed.data.toDate)
      .is("deleted_at", null)
      .not("source_template_meal_id", "is", null),
  ]);
  if (!meals || meals.length === 0) return { error: FALLO };

  const ocupadas = new Set(
    (yaEnDestino ?? []).map((m) => m.source_template_meal_id),
  );
  const created: string[] = [];
  for (const meal of meals) {
    const plan =
      meal.source_template_meal_id &&
      !ocupadas.has(meal.source_template_meal_id)
        ? meal.source_template_meal_id
        : null;
    if (plan) ocupadas.add(plan);
    const { data: nueva, error } = await supabase
      .from("meals")
      .insert({
        user_id: user.id,
        date: parsed.data.toDate,
        meal_type: meal.meal_type,
        name: meal.name,
        status: meal.status,
        scheduled_time: meal.scheduled_time,
        source_template_meal_id: plan,
      })
      .select("id")
      .single();
    if (error || !nueva) break;
    created.push(nueva.id);

    if ((meal.meal_items ?? []).length > 0) {
      const { error: itemsError } = await supabase.from("meal_items").insert(
        (meal.meal_items ?? []).map((item) => ({
          meal_id: nueva.id,
          food_id: item.food_id,
          quantity_g: item.quantity_g,
          calories_snapshot: item.calories_snapshot,
          protein_snapshot: item.protein_snapshot,
          carbohydrate_snapshot: item.carbohydrate_snapshot,
          fat_snapshot: item.fat_snapshot,
          fiber_snapshot: item.fiber_snapshot,
          sodium_snapshot_mg: item.sodium_snapshot_mg,
          sugar_snapshot_g: item.sugar_snapshot_g,
        })),
      );
      if (itemsError) break;
    }
  }

  revalidatePath("/nutricion");
  revalidatePath("/");
  if (created.length < meals.length) {
    // A medias no sirve: se quita lo que alcanzo a copiarse.
    await undoCopiedMeals({ mealIds: created });
    return { error: FALLO };
  }
  return { created };
}

/** Deshace una copia: borra (suave) las comidas que se acababan de crear. */
export async function undoCopiedMeals(
  input: unknown,
): Promise<{ error?: string }> {
  const parsed = z
    .object({ mealIds: z.array(z.uuid()).max(20) })
    .safeParse(input);
  const { supabase, user } = await usuario();
  if (!parsed.success || !user) return { error: FALLO };
  if (parsed.data.mealIds.length === 0) return {};

  const { error } = await supabase
    .from("meals")
    .update({ deleted_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .in("id", parsed.data.mealIds);
  revalidatePath("/nutricion");
  revalidatePath("/");
  return error ? { error: "No se pudo deshacer." } : {};
}
