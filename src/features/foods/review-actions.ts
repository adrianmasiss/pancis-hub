"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";
import { recordChange } from "@/lib/audit";
import {
  formatDivergence,
  sourceName,
} from "@/features/foods/lib/source-agreement";
import type { ProviderSource } from "@/lib/food-providers/types";

const t = messages.foods;

const schema = z.object({
  foodId: z.uuid(),
  source: z.enum(["usda", "openfoodfacts", "dietly"]),
  externalId: z.string().trim().min(1).max(120),
});

export type ReviewResult = { error: string } | { success: true };

/**
 * Resuelve una discrepancia tomando el valor de la fuente elegida.
 *
 * No toca `foods`. El catálogo es compartido y editarlo cambiaría el alimento
 * para todos; la corrección vive en la capa por usuario que ya existe y se
 * superpone al leer, igual que cualquier corrección hecha a mano. Si mañana el
 * proveedor arregla su dato, el resto de la gente se beneficia sin que nadie
 * haya tenido que deshacer nada.
 *
 * Y queda escrito POR QUÉ: el motivo guarda el desacuerdo que lo motivó, así
 * que dentro de seis meses el número sigue teniendo de dónde venir.
 */
export async function resolveWithSource(input: unknown): Promise<ReviewResult> {
  const parsed = schema.safeParse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!parsed.success || !user) return { error: t.errors.failed };
  const { foodId, source, externalId } = parsed.data;

  const [{ data: food }, { data: reading }] = await Promise.all([
    supabase
      .from("foods")
      .select(
        "name, calories, protein_g, carbohydrate_g, fat_g, fiber_g, max_divergence_pct",
      )
      .eq("id", foodId)
      .single(),
    supabase
      .from("food_source_values")
      .select("calories, protein_g, carbohydrate_g, fat_g, fiber_g")
      .eq("food_id", foodId)
      .eq("source", source)
      .eq("external_id", externalId)
      .maybeSingle(),
  ]);
  if (!food || !reading) return { error: t.errors.failed };

  /* Un macronutriente que la fuente elegida no midió se deja sin corregir: en
     la capa de correcciones, null significa «no lo toqué» y el alimento sigue
     heredando el catálogo. Escribir un cero sería inventar una medición. */
  const numeroONulo = (valor: unknown) =>
    valor === null || valor === undefined ? null : Number(valor);

  const divergencia = numeroONulo(food.max_divergence_pct);
  const motivo = divergencia
    ? `Las fuentes discrepaban ${formatDivergence(divergencia)}; se toma el valor de ${sourceName(source as ProviderSource)}.`
    : `Se toma el valor de ${sourceName(source as ProviderSource)}.`;

  const { error } = await supabase.from("food_user_corrections").upsert(
    {
      user_id: user.id,
      food_id: foodId,
      name: null,
      calories: numeroONulo(reading.calories),
      protein_g: numeroONulo(reading.protein_g),
      carbohydrate_g: numeroONulo(reading.carbohydrate_g),
      fat_g: numeroONulo(reading.fat_g),
      fiber_g: numeroONulo(reading.fiber_g),
      cooked_state: null,
      reason: motivo,
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
      alimento: food.name,
      calorias: Number(food.calories),
      proteina_g: Number(food.protein_g),
      carbohidratos_g: Number(food.carbohydrate_g),
      grasas_g: Number(food.fat_g),
    },
    newValues: {
      alimento: food.name,
      calorias: numeroONulo(reading.calories) ?? Number(food.calories),
      proteina_g: numeroONulo(reading.protein_g) ?? Number(food.protein_g),
      carbohidratos_g:
        numeroONulo(reading.carbohydrate_g) ?? Number(food.carbohydrate_g),
      grasas_g: numeroONulo(reading.fat_g) ?? Number(food.fat_g),
    },
    reason: motivo,
    origin: "usuario",
  });

  revalidatePath("/nutricion/alimentos");
  revalidatePath("/nutricion/alimentos/revisar");
  revalidatePath("/nutricion");
  return { success: true };
}
