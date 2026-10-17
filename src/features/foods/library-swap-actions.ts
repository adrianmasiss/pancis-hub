"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayInTimezone } from "@/lib/dates";
import { getDietPlanForDate } from "@/features/nutrition/queries";
import { getFoodsLibrary } from "./queries";
import { equivalentQuantity, type EquivalenceFood } from "./lib/equivalence";
import { matchesRestriction } from "./lib/allergens";
import { scaleMacros, type MacroSet } from "@/features/nutrition/lib/macros";
import { swapDietItemForDay } from "@/features/nutrition/day-swap-actions";

const schema = z.object({
  foodId: z.uuid(),
  templateItemId: z.uuid(),
  date: z.iso.date(),
  quantityG: z.number().min(1).max(5000).optional(),
});
export type LibrarySwapPreview = {
  fromName: string;
  toName: string;
  fromQuantity: number;
  quantityG: number;
  before: MacroSet;
  after: MacroSet;
  diff: MacroSet;
};

export async function previewLibrarySwap(
  input: unknown,
): Promise<{ error: string } | LibrarySwapPreview> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: "Revisa el alimento y la cantidad." };
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) return { error: "Inicia sesión para sustituir alimentos." };
  const { data: profile } = await db
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();
  if (
    parsed.data.date !==
    todayInTimezone(profile?.timezone ?? "America/Costa_Rica")
  )
    return {
      error: "El día cambió. Actualiza la biblioteca antes de sustituir.",
    };
  const [diet, foods, preferences] = await Promise.all([
    getDietPlanForDate(user.id, parsed.data.date),
    getFoodsLibrary(user.id, { view: "todos", foodId: parsed.data.foodId }),
    db
      .from("dietary_preferences")
      .select("value")
      .eq("user_id", user.id)
      .in("preference_type", ["alergia", "restriccion", "alimento_no_deseado"]),
  ]);
  const meal = diet?.meals.find((m) =>
    m.items.some((i) => i.id === parsed.data.templateItemId),
  );
  const item = meal?.items.find((i) => i.id === parsed.data.templateItemId);
  const food = foods[0];
  if (!item || !food || meal?.loggedToday)
    return {
      error:
        "Esta comida ya fue registrada o no pertenece a tu dieta activa. Actualiza la página.",
    };
  if (preferences.error)
    return {
      error: "No pudimos comprobar tus preferencias. Inténtalo de nuevo.",
    };
  if (
    (preferences.data ?? []).some((p) =>
      matchesRestriction(food.name, [p.value]),
    )
  )
    return {
      error:
        "Este alimento coincide con una restricción que tienes guardada. Elige otra alternativa.",
    };
  const { data: original } = await db
    .from("foods")
    .select("food_group")
    .eq("id", item.foodId)
    .maybeSingle();
  const from: EquivalenceFood = {
    id: item.foodId,
    name: item.foodName,
    foodGroup:
      (original?.food_group as EquivalenceFood["foodGroup"]) ?? "mixto",
    cookedState: null,
    per100g: scaleMacros(item.macros, 10000 / item.quantityG),
  };
  const to: EquivalenceFood = {
    id: food.id,
    name: food.name,
    foodGroup: food.foodGroup,
    cookedState: food.cookedState,
    per100g: {
      calories: food.calories,
      proteinG: food.proteinG,
      carbohydrateG: food.carbohydrateG,
      fatG: food.fatG,
      fiberG: food.fiberG,
    },
  };
  const quantityG =
    parsed.data.quantityG ?? equivalentQuantity(from, item.quantityG, to);
  const after = scaleMacros(to.per100g, quantityG);
  const diff = Object.fromEntries(
    Object.entries(after).map(([key, value]) => [
      key,
      Math.round((value - item.macros[key as keyof MacroSet]) * 10) / 10,
    ]),
  ) as MacroSet;
  return {
    fromName: item.foodName,
    toName: food.name,
    fromQuantity: item.quantityG,
    quantityG,
    before: item.macros,
    after,
    diff,
  };
}

export async function confirmLibrarySwap(
  input: unknown,
): Promise<{ error?: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success || parsed.data.quantityG === undefined)
    return { error: "Revisa la cantidad." };
  const preview = await previewLibrarySwap(parsed.data);
  if ("error" in preview) return preview;
  const result = await swapDietItemForDay({
    ...parsed.data,
    quantityG: preview.quantityG,
  });
  revalidatePath("/nutricion/alimentos");
  return result;
}
