"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";
import { recordChange } from "@/lib/audit";
import {
  diffSnapshots,
  isIdenticalSnapshot,
  snapshotCalories,
  snapshotItemCount,
  type DietSnapshot,
  type DietVersionSummary,
  type VersionDifference,
} from "@/features/nutrition/lib/diet-versions";

const t = messages.nutrition.versions;

const templateIdSchema = z.object({
  templateId: z.uuid(),
  reason: z.string().trim().max(200).optional(),
});

const versionIdSchema = z.object({ versionId: z.uuid() });

export type VersionActionResult =
  | { error: string }
  | { success: true; version?: number };

/**
 * Arma la foto del plan tal como esta ahora, incluidos nombres y macros
 * del momento: la version debe seguir siendo legible aunque el catalogo
 * cambie despues.
 */
async function buildSnapshot(
  userId: string,
  templateId: string,
): Promise<DietSnapshot | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("diet_templates")
    .select(
      "name, target_calories, target_protein, target_carbs, target_fat, diet_template_meals(name, meal_type, order_index, scheduled_time, diet_template_items(food_id, quantity_g, serving_equivalence, foods(name, calories, protein_g, carbohydrate_g, fat_g, fiber_g)))",
    )
    .eq("id", templateId)
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;

  return {
    name: data.name,
    targets: {
      calories: Number(data.target_calories),
      proteinG: Number(data.target_protein),
      carbohydrateG: Number(data.target_carbs),
      fatG: Number(data.target_fat),
    },
    meals: [...(data.diet_template_meals ?? [])]
      .sort((a, b) => a.order_index - b.order_index)
      .map((meal) => ({
        name: meal.name,
        mealType: meal.meal_type,
        orderIndex: meal.order_index,
        scheduledTime: meal.scheduled_time,
        items: (meal.diet_template_items ?? []).map((item) => ({
          foodId: item.food_id,
          foodName: item.foods?.name ?? "",
          quantityG: Number(item.quantity_g),
          servingEquivalence: item.serving_equivalence,
          per100g: {
            calories: Number(item.foods?.calories ?? 0),
            proteinG: Number(item.foods?.protein_g ?? 0),
            carbohydrateG: Number(item.foods?.carbohydrate_g ?? 0),
            fatG: Number(item.foods?.fat_g ?? 0),
            fiberG: Number(item.foods?.fiber_g ?? 0),
          },
        })),
      })),
  };
}

/** Guarda una version de la dieta actual. */
export async function saveDietVersion(
  input: unknown,
): Promise<VersionActionResult> {
  const parsed = templateIdSchema.safeParse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!parsed.success || !user) return { error: t.failed };

  const snapshot = await buildSnapshot(user.id, parsed.data.templateId);
  if (!snapshot) return { error: t.failed };

  const { data: latest } = await supabase
    .from("diet_template_versions")
    .select("version, snapshot")
    .eq("template_id", parsed.data.templateId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Guardar una version identica a la anterior solo ensucia el historial.
  if (latest && isIdenticalSnapshot(latest.snapshot as DietSnapshot, snapshot)) {
    return { error: t.noChanges };
  }

  const version = (latest?.version ?? 0) + 1;

  const { error } = await supabase.from("diet_template_versions").insert({
    user_id: user.id,
    template_id: parsed.data.templateId,
    version,
    name: snapshot.name,
    snapshot: snapshot as never,
    reason: parsed.data.reason ?? null,
  });
  if (error) return { error: t.failed };

  await recordChange({
    actorUserId: user.id,
    action: "dieta_versionada",
    entity: "diet_templates",
    entityId: parsed.data.templateId,
    newValues: {
      version,
      comidas: snapshot.meals.length,
      alimentos: snapshotItemCount(snapshot),
      calorias: snapshotCalories(snapshot),
    },
    reason: parsed.data.reason ?? t.defaultReason,
    origin: "usuario",
  });

  revalidatePath("/nutricion/dieta");
  return { success: true, version };
}

/**
 * Restaura una version anterior sobre la plantilla viva.
 *
 * Antes de sobrescribir se guarda una version del estado ACTUAL, asi que
 * restaurar nunca pierde nada: siempre se puede volver a lo que habia.
 */
export async function restoreDietVersion(
  input: unknown,
): Promise<VersionActionResult> {
  const parsed = versionIdSchema.safeParse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!parsed.success || !user) return { error: t.failed };

  const { data: target } = await supabase
    .from("diet_template_versions")
    .select("template_id, version, name, snapshot")
    .eq("id", parsed.data.versionId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!target) return { error: t.failed };

  const templateId = target.template_id;
  const snapshot = target.snapshot as DietSnapshot;

  // Red de seguridad: el estado actual queda guardado antes de perderse.
  await saveDietVersion({ templateId, reason: t.autoBeforeRestore });

  const { data: currentMeals } = await supabase
    .from("diet_template_meals")
    .select("id")
    .eq("template_id", templateId);

  // Los items caen en cascada al borrar sus comidas.
  if (currentMeals && currentMeals.length > 0) {
    const { error: deleteError } = await supabase
      .from("diet_template_meals")
      .delete()
      .in(
        "id",
        currentMeals.map((meal) => meal.id),
      );
    if (deleteError) return { error: t.failed };
  }

  for (const meal of snapshot.meals) {
    const { data: createdMeal, error: mealError } = await supabase
      .from("diet_template_meals")
      .insert({
        template_id: templateId,
        name: meal.name,
        meal_type: meal.mealType,
        order_index: meal.orderIndex,
        scheduled_time: meal.scheduledTime,
      })
      .select("id")
      .single();
    if (mealError || !createdMeal) return { error: t.failed };

    if (meal.items.length === 0) continue;

    const { error: itemsError } = await supabase
      .from("diet_template_items")
      .insert(
        meal.items.map((item) => ({
          template_meal_id: createdMeal.id,
          food_id: item.foodId,
          quantity_g: item.quantityG,
          serving_equivalence: item.servingEquivalence,
        })),
      );
    // Un alimento borrado del catalogo haria fallar la insercion completa;
    // se informa en vez de dejar la plantilla a medias.
    if (itemsError) return { error: t.restoreIncomplete };
  }

  await supabase
    .from("diet_templates")
    .update({
      name: snapshot.name,
      target_calories: snapshot.targets.calories,
      target_protein: snapshot.targets.proteinG,
      target_carbs: snapshot.targets.carbohydrateG,
      target_fat: snapshot.targets.fatG,
    })
    .eq("id", templateId)
    .eq("user_id", user.id);

  // El estado restaurado se versiona tambien. Sin esto, la version mas
  // reciente seria el respaldo previo a la restauracion, y la pagina
  // reportaria "cambios sin guardar" justo despues de restaurar.
  await saveDietVersion({
    templateId,
    reason: t.restoreReason.replace("{version}", String(target.version)),
  });

  await recordChange({
    actorUserId: user.id,
    action: "dieta_restaurada",
    entity: "diet_templates",
    entityId: templateId,
    newValues: { version_restaurada: target.version, nombre: target.name },
    reason: t.restoreReason.replace("{version}", String(target.version)),
    origin: "usuario",
  });

  revalidatePath("/nutricion/dieta");
  revalidatePath("/nutricion");
  revalidatePath("/");
  return { success: true, version: target.version };
}

export type DietVersionList = {
  versions: DietVersionSummary[];
  /** Diferencias entre la version mas reciente y el plan actual. */
  pendingChanges: VersionDifference | null;
};

/** Versiones guardadas de una dieta, de la mas reciente a la mas antigua. */
export async function listDietVersions(
  templateId: string,
): Promise<DietVersionList> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { versions: [], pendingChanges: null };

  const { data } = await supabase
    .from("diet_template_versions")
    .select("id, version, name, reason, created_at, snapshot")
    .eq("template_id", templateId)
    .eq("user_id", user.id)
    .order("version", { ascending: false });

  const versions: DietVersionSummary[] = (data ?? []).map((row) => {
    const snapshot = row.snapshot as DietSnapshot;
    return {
      id: row.id,
      version: row.version,
      name: row.name,
      reason: row.reason,
      createdAt: row.created_at,
      mealCount: snapshot.meals.length,
      itemCount: snapshotItemCount(snapshot),
      totalCalories: snapshotCalories(snapshot),
    };
  });

  // Que cambio desde la ultima version guardada, para saber si conviene
  // guardar una nueva.
  const latest = data?.[0]?.snapshot as DietSnapshot | undefined;
  const current = await buildSnapshot(user.id, templateId);
  const pendingChanges =
    latest && current ? diffSnapshots(latest, current) : null;

  return { versions, pendingChanges };
}
