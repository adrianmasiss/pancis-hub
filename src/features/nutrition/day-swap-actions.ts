"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";

/**
 * Sustituciones del plan validas para un solo dia.
 *
 * Se separan a proposito de swapDietTemplateItem, que reescribe el plan. Aqui
 * el plan no se toca: se anota que hoy, en lugar de un alimento, va otro. Al
 * dia siguiente el plan reaparece como estaba.
 */

const daySwapSchema = z.object({
  templateItemId: z.uuid(),
  date: z.iso.date(),
  quantityG: z.number().positive().max(5000),
  /** Alimento de la biblioteca. Excluyente con el bloque externo. */
  foodId: z.uuid().optional(),
  /** Sustituto fuera de la biblioteca, con macros ya resueltos. */
  external: z
    .object({
      name: z.string().trim().min(1).max(120),
      calories: z.number().min(0),
      proteinG: z.number().min(0),
      carbohydrateG: z.number().min(0),
      fatG: z.number().min(0),
    })
    .optional(),
});

export type DaySwapInput = z.infer<typeof daySwapSchema>;

export async function swapDietItemForDay(
  input: DaySwapInput,
): Promise<{ error?: string }> {
  const parsed = daySwapSchema.safeParse(input);
  if (!parsed.success) return { error: messages.common.genericError };

  const { templateItemId, date, quantityG, foodId, external } = parsed.data;
  if (!foodId && !external) return { error: messages.common.genericError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: messages.common.genericError };

  // upsert sobre (user_id, template_item_id, date): sustituir dos veces el
  // mismo dia reemplaza la anterior en vez de acumular filas.
  const { error } = await supabase.from("diet_item_day_swaps").upsert(
    {
      user_id: user.id,
      template_item_id: templateItemId,
      date,
      quantity_g: quantityG,
      food_id: foodId ?? null,
      external_name: external?.name ?? null,
      external_calories: external?.calories ?? null,
      external_protein_g: external?.proteinG ?? null,
      external_carbohydrate_g: external?.carbohydrateG ?? null,
      external_fat_g: external?.fatG ?? null,
      source: foodId ? "biblioteca" : "asistente",
    },
    { onConflict: "user_id,template_item_id,date" },
  );

  if (error) return { error: messages.common.genericError };

  revalidatePath("/");
  revalidatePath("/nutricion");
  return {};
}

/** Deshace la sustitucion del dia y devuelve el alimento original al plan. */
export async function undoDietItemDaySwap(input: {
  templateItemId: string;
  date: string;
}): Promise<{ error?: string }> {
  const parsed = z
    .object({ templateItemId: z.uuid(), date: z.iso.date() })
    .safeParse(input);
  if (!parsed.success) return { error: messages.common.genericError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: messages.common.genericError };

  const { error } = await supabase
    .from("diet_item_day_swaps")
    .delete()
    .eq("user_id", user.id)
    .eq("template_item_id", parsed.data.templateItemId)
    .eq("date", parsed.data.date);

  if (error) return { error: messages.common.genericError };

  revalidatePath("/");
  revalidatePath("/nutricion");
  return {};
}
