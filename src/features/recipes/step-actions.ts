"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";

const t = messages.recipes.steps;

export type StepActionResult = { error: string } | { success: true };

const addStepSchema = z.object({
  recipeId: z.uuid(),
  instruction: z.string().trim().min(1).max(500),
});

const stepIdSchema = z.object({ stepId: z.uuid() });

const updateStepSchema = z.object({
  stepId: z.uuid(),
  instruction: z.string().trim().min(1).max(500),
});

const moveStepSchema = z.object({
  stepId: z.uuid(),
  direction: z.enum(["arriba", "abajo"]),
});

const notesSchema = z.object({
  recipeId: z.uuid(),
  storageNotes: z.string().trim().max(500).optional(),
  mealPrepNotes: z.string().trim().max(500).optional(),
});

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function addRecipeStep(input: unknown): Promise<StepActionResult> {
  const parsed = addStepSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return { error: t.failed };

  const { data: last } = await supabase
    .from("recipe_steps")
    .select("position")
    .eq("recipe_id", parsed.data.recipeId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("recipe_steps").insert({
    recipe_id: parsed.data.recipeId,
    position: (last?.position ?? 0) + 1,
    instruction: parsed.data.instruction,
  });
  if (error) return { error: t.failed };

  revalidatePath(`/recetas/${parsed.data.recipeId}`);
  return { success: true };
}

export async function updateRecipeStep(
  input: unknown,
): Promise<StepActionResult> {
  const parsed = updateStepSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return { error: t.failed };

  const { data, error } = await supabase
    .from("recipe_steps")
    .update({ instruction: parsed.data.instruction })
    .eq("id", parsed.data.stepId)
    .select("recipe_id")
    .single();
  if (error || !data) return { error: t.failed };

  revalidatePath(`/recetas/${data.recipe_id}`);
  return { success: true };
}

export async function removeRecipeStep(
  input: unknown,
): Promise<StepActionResult> {
  const parsed = stepIdSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return { error: t.failed };

  const { data: step } = await supabase
    .from("recipe_steps")
    .select("recipe_id, position")
    .eq("id", parsed.data.stepId)
    .single();
  if (!step) return { error: t.failed };

  const { error } = await supabase
    .from("recipe_steps")
    .delete()
    .eq("id", parsed.data.stepId);
  if (error) return { error: t.failed };

  // Se cierran los huecos para que la numeracion siga siendo 1, 2, 3.
  const { data: remaining } = await supabase
    .from("recipe_steps")
    .select("id, position")
    .eq("recipe_id", step.recipe_id)
    .order("position");

  for (const [index, row] of (remaining ?? []).entries()) {
    if (row.position !== index + 1) {
      await supabase
        .from("recipe_steps")
        .update({ position: index + 1 })
        .eq("id", row.id);
    }
  }

  revalidatePath(`/recetas/${step.recipe_id}`);
  return { success: true };
}

/**
 * Mueve un paso una posicion. Se intercambian las posiciones de los dos
 * pasos implicados en vez de renumerar toda la lista.
 */
export async function moveRecipeStep(
  input: unknown,
): Promise<StepActionResult> {
  const parsed = moveStepSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return { error: t.failed };

  const { data: step } = await supabase
    .from("recipe_steps")
    .select("id, recipe_id, position")
    .eq("id", parsed.data.stepId)
    .single();
  if (!step) return { error: t.failed };

  const targetPosition =
    parsed.data.direction === "arriba" ? step.position - 1 : step.position + 1;
  if (targetPosition < 1) return { success: true };

  const { data: neighbour } = await supabase
    .from("recipe_steps")
    .select("id, position")
    .eq("recipe_id", step.recipe_id)
    .eq("position", targetPosition)
    .maybeSingle();
  // Ya esta en un extremo: no es un error, simplemente no se mueve.
  if (!neighbour) return { success: true };

  // Posicion temporal para no chocar mientras se intercambian.
  await supabase
    .from("recipe_steps")
    .update({ position: 0 })
    .eq("id", step.id);
  await supabase
    .from("recipe_steps")
    .update({ position: step.position })
    .eq("id", neighbour.id);
  await supabase
    .from("recipe_steps")
    .update({ position: targetPosition })
    .eq("id", step.id);

  revalidatePath(`/recetas/${step.recipe_id}`);
  return { success: true };
}

/** Notas de conservacion y de meal prep (requisito 8). */
export async function updateRecipeNotes(
  input: unknown,
): Promise<StepActionResult> {
  const parsed = notesSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return { error: t.failed };

  const { error } = await supabase
    .from("recipes")
    .update({
      storage_notes: parsed.data.storageNotes || null,
      meal_prep_notes: parsed.data.mealPrepNotes || null,
    })
    .eq("id", parsed.data.recipeId)
    .eq("owner_user_id", user.id);
  if (error) return { error: t.failed };

  revalidatePath(`/recetas/${parsed.data.recipeId}`);
  return { success: true };
}
