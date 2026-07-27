"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";
import { importExternalFood } from "@/features/foods/external-actions";
import {
  addExternalPantryFoodSchema,
  addPantryFoodSchema,
  removePantryFoodSchema,
} from "@/features/pantry/schemas";

const t = messages.pantry;

export type PantryActionResult =
  | { error: string }
  | { success: true; alreadyInPantry?: boolean };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Revalida la despensa y los lugares donde el filtro "disponibles" aparece. */
function revalidatePantry() {
  revalidatePath("/despensa");
  revalidatePath("/nutricion");
  revalidatePath("/");
}

/**
 * Agrega un alimento del catalogo a la despensa. Si ya estaba pero fue
 * quitado antes, se reactiva; si sigue activo, no se duplica.
 */
export async function addPantryFood(input: unknown): Promise<PantryActionResult> {
  const parsed = addPantryFoodSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return { error: t.failed };

  const { data: existing } = await supabase
    .from("pantry_items")
    .select("id, deleted_at")
    .eq("user_id", user.id)
    .eq("food_id", parsed.data.foodId)
    .maybeSingle();

  if (existing) {
    if (!existing.deleted_at) return { success: true, alreadyInPantry: true };
    const { error } = await supabase
      .from("pantry_items")
      .update({ deleted_at: null })
      .eq("id", existing.id);
    if (error) return { error: t.failed };
    revalidatePantry();
    return { success: true };
  }

  const { error } = await supabase
    .from("pantry_items")
    .insert({ user_id: user.id, food_id: parsed.data.foodId });
  if (error) return { error: t.failed };

  revalidatePantry();
  return { success: true };
}

/**
 * Agrega un alimento externo (USDA / Open Food Facts): primero lo importa al
 * catalogo (re-pidiendo macros al proveedor) y luego lo pone en la despensa.
 */
export async function addExternalPantryFood(
  input: unknown,
): Promise<PantryActionResult> {
  const parsed = addExternalPantryFoodSchema.safeParse(input);
  const { user } = await requireUser();
  if (!parsed.success || !user) return { error: t.failed };

  const imported = await importExternalFood(parsed.data);
  if ("error" in imported) return { error: imported.error };

  return addPantryFood({ foodId: imported.foodId });
}

/** Quita un alimento de la despensa (soft-delete). */
export async function removePantryFood(
  input: unknown,
): Promise<PantryActionResult> {
  const parsed = removePantryFoodSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return { error: t.failed };

  const { error } = await supabase
    .from("pantry_items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("food_id", parsed.data.foodId)
    .is("deleted_at", null);
  if (error) return { error: t.failed };

  revalidatePantry();
  return { success: true };
}
