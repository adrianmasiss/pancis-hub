"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";
import { recordChange } from "@/lib/audit";
import type { FoodCorrection } from "@/features/foods/lib/corrections";

const t = messages.foods;

const optionalMacro = (max: number) =>
  z.number().min(0).max(max).nullable().optional();

const correctionSchema = z.object({
  foodId: z.uuid(),
  name: z.string().trim().min(1).max(80).nullable().optional(),
  calories: optionalMacro(900),
  proteinG: optionalMacro(100),
  carbohydrateG: optionalMacro(100),
  fatG: optionalMacro(100),
  fiberG: optionalMacro(100),
  cookedState: z.enum(["crudo", "cocido"]).nullable().optional(),
  reason: z.string().trim().max(200).nullable().optional(),
});

export type CorrectionResult = { error: string } | { success: true };

/**
 * Guarda (o actualiza) la correccion del usuario sobre un alimento del
 * catalogo. NO toca el alimento original: la correccion es una capa
 * propia que se aplica al leer (requisito 7.5).
 */
export async function saveFoodCorrection(
  input: unknown,
): Promise<CorrectionResult> {
  const parsed = correctionSchema.safeParse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!parsed.success || !user) return { error: t.errors.failed };

  const { foodId, reason, ...fields } = parsed.data;

  const { data: original } = await supabase
    .from("foods")
    .select("name, calories, protein_g, carbohydrate_g, fat_g, fiber_g")
    .eq("id", foodId)
    .single();
  if (!original) return { error: t.errors.failed };

  const { error } = await supabase.from("food_user_corrections").upsert(
    {
      user_id: user.id,
      food_id: foodId,
      name: fields.name ?? null,
      calories: fields.calories ?? null,
      protein_g: fields.proteinG ?? null,
      carbohydrate_g: fields.carbohydrateG ?? null,
      fat_g: fields.fatG ?? null,
      fiber_g: fields.fiberG ?? null,
      cooked_state: fields.cookedState ?? null,
      reason: reason ?? null,
    },
    { onConflict: "user_id,food_id" },
  );
  if (error) return { error: t.errors.failed };

  await recordChange({
    actorUserId: user.id,
    action: "alimento_corregido",
    entity: "food_user_corrections",
    entityId: foodId,
    previousValues: {
      alimento: original.name,
      calorias: Number(original.calories),
      proteina_g: Number(original.protein_g),
      carbohidratos_g: Number(original.carbohydrate_g),
      grasas_g: Number(original.fat_g),
    },
    newValues: {
      alimento: fields.name ?? original.name,
      calorias: fields.calories ?? Number(original.calories),
      proteina_g: fields.proteinG ?? Number(original.protein_g),
      carbohidratos_g: fields.carbohydrateG ?? Number(original.carbohydrate_g),
      grasas_g: fields.fatG ?? Number(original.fat_g),
    },
    reason: reason ?? t.corrections.defaultReason,
    origin: "usuario",
  });

  revalidatePath("/nutricion/alimentos");
  revalidatePath("/nutricion");
  return { success: true };
}

/** Elimina la correccion: el alimento vuelve a mostrarse tal cual el catalogo. */
export async function removeFoodCorrection(
  input: unknown,
): Promise<CorrectionResult> {
  const parsed = z.object({ foodId: z.uuid() }).safeParse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!parsed.success || !user) return { error: t.errors.failed };

  const { error } = await supabase
    .from("food_user_corrections")
    .delete()
    .eq("user_id", user.id)
    .eq("food_id", parsed.data.foodId);
  if (error) return { error: t.errors.failed };

  revalidatePath("/nutricion/alimentos");
  revalidatePath("/nutricion");
  return { success: true };
}

/**
 * Correcciones del usuario indexadas por alimento. Se consulta una vez y
 * se aplica sobre cualquier lista de alimentos.
 */
export async function getUserFoodCorrections(
  userId: string,
): Promise<Map<string, FoodCorrection>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("food_user_corrections")
    .select(
      "food_id, name, calories, protein_g, carbohydrate_g, fat_g, fiber_g, cooked_state, reason",
    )
    .eq("user_id", userId);

  const numberOrNull = (value: unknown) =>
    value === null || value === undefined ? null : Number(value);

  return new Map(
    (data ?? []).map((row) => [
      row.food_id,
      {
        name: row.name,
        calories: numberOrNull(row.calories),
        proteinG: numberOrNull(row.protein_g),
        carbohydrateG: numberOrNull(row.carbohydrate_g),
        fatG: numberOrNull(row.fat_g),
        fiberG: numberOrNull(row.fiber_g),
        cookedState: row.cooked_state as "crudo" | "cocido" | null,
        reason: row.reason,
      },
    ]),
  );
}
