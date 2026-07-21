"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";
import { fetchAndStoreFoodImage } from "@/lib/images/food-image";
import {
  foodFormSchema,
  foodIdSchema,
  updateFoodSchema,
} from "@/features/foods/schemas";

const t = messages.foods;

export type FoodsActionResult = { error: string } | { success: true };

const fail: FoodsActionResult = { error: t.errors.failed };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function createCustomFood(
  input: unknown,
): Promise<FoodsActionResult> {
  const parsed = foodFormSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { data: created, error } = await supabase
    .from("foods")
    .insert({
      owner_user_id: user.id,
      name: parsed.data.name,
      brand: parsed.data.brand || null,
      food_group: parsed.data.foodGroup,
      cooked_state: parsed.data.cookedState ?? null,
      calories: parsed.data.calories,
      protein_g: parsed.data.proteinG,
      carbohydrate_g: parsed.data.carbohydrateG,
      fat_g: parsed.data.fatG,
      fiber_g: parsed.data.fiberG,
      source: "personalizado",
      verified: false,
    })
    .select("id")
    .single();
  if (error) return fail;

  const imageUrl = await fetchAndStoreFoodImage({
    query: `${parsed.data.name} comida`,
    pathPrefix: "foods",
    id: created.id,
  });
  if (imageUrl) {
    await supabase
      .from("foods")
      .update({ image_url: imageUrl })
      .eq("id", created.id);
  }

  revalidatePath("/nutricion/alimentos");
  return { success: true };
}

export async function updateCustomFood(
  input: unknown,
): Promise<FoodsActionResult> {
  const parsed = updateFoodSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { error } = await supabase
    .from("foods")
    .update({
      name: parsed.data.name,
      brand: parsed.data.brand || null,
      food_group: parsed.data.foodGroup,
      cooked_state: parsed.data.cookedState ?? null,
      calories: parsed.data.calories,
      protein_g: parsed.data.proteinG,
      carbohydrate_g: parsed.data.carbohydrateG,
      fat_g: parsed.data.fatG,
      fiber_g: parsed.data.fiberG,
    })
    .eq("id", parsed.data.foodId)
    .eq("owner_user_id", user.id);
  if (error) return fail;
  revalidatePath("/nutricion/alimentos");
  return { success: true };
}

/** Soft delete: los snapshots historicos siguen siendo validos. */
export async function deleteCustomFood(
  input: unknown,
): Promise<FoodsActionResult> {
  const parsed = foodIdSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { error } = await supabase
    .from("foods")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.foodId)
    .eq("owner_user_id", user.id);
  if (error) return fail;
  revalidatePath("/nutricion/alimentos");
  return { success: true };
}

export async function toggleFavoriteFood(
  input: unknown,
): Promise<FoodsActionResult> {
  const parsed = foodIdSchema.safeParse(input);
  const { supabase, user } = await requireUser();
  if (!parsed.success || !user) return fail;

  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("user_id", user.id)
    .eq("item_type", "food")
    .eq("item_id", parsed.data.foodId)
    .maybeSingle();

  const { error } = existing
    ? await supabase.from("favorites").delete().eq("id", existing.id)
    : await supabase.from("favorites").insert({
        user_id: user.id,
        item_type: "food",
        item_id: parsed.data.foodId,
      });
  if (error) return fail;
  revalidatePath("/nutricion/alimentos");
  return { success: true };
}
