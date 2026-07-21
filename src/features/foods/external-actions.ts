"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { messages } from "@/i18n/es-419";
import { fetchAndStoreFoodImage } from "@/lib/images/food-image";
import { providerBySource } from "@/lib/food-providers";
import { PROVIDER_SOURCES } from "@/lib/food-providers/types";
import { FOOD_GROUPS } from "@/features/foods/schemas";
import {
  searchExternalFoods,
  findExternalFoodByBarcode,
  type ExternalSearchResult,
} from "@/features/foods/external-queries";

const t = messages.foods;

export type ImportResult =
  | { error: string }
  | { success: true; foodId: string; alreadyExisted: boolean };

const importSchema = z.object({
  source: z.enum(PROVIDER_SOURCES),
  externalId: z.string().trim().min(1).max(64),
  /** Nombre mostrable elegido por el usuario, normalmente traducido. */
  displayName: z.string().trim().min(1).max(80).optional(),
  foodGroup: z.enum(FOOD_GROUPS).optional(),
});

async function requireUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/**
 * Importa un alimento externo al catalogo compartido.
 *
 * Los macros NO se toman del cliente: se vuelven a pedir al proveedor por
 * su identificador. Un cliente solo puede decir "importa el fdcId 12345",
 * nunca "importa esto con estos valores", asi nadie puede envenenar el
 * catalogo compartido con datos inventados.
 *
 * Es idempotente: si otro usuario ya lo importo, devuelve el existente
 * gracias al indice unico (external_source, external_id).
 */
export async function importExternalFood(input: unknown): Promise<ImportResult> {
  const parsed = importSchema.safeParse(input);
  const userId = await requireUserId();
  if (!parsed.success || !userId) return { error: t.errors.failed };

  const { source, externalId, displayName, foodGroup } = parsed.data;

  const admin = createAdminClient();

  // 1. Si ya existe, no se vuelve a traer ni a insertar.
  const { data: existing } = await admin
    .from("foods")
    .select("id")
    .eq("external_source", source)
    .eq("external_id", externalId)
    .maybeSingle();
  if (existing) {
    return { success: true, foodId: existing.id, alreadyExisted: true };
  }

  // 2. Dato fresco desde el proveedor, no desde el cliente.
  const provider = providerBySource(source);
  if (!provider?.isAvailable()) return { error: t.errors.providerUnavailable };

  const food = await provider.getFoodById(externalId);
  if (!food) return { error: t.errors.externalNotFound };

  // 3. Insercion en el catalogo compartido (owner_user_id null) con el
  //    cliente admin, porque RLS solo permite escribir alimentos propios.
  const { data: created, error } = await admin
    .from("foods")
    .insert({
      owner_user_id: null,
      name: displayName ?? food.name,
      external_name: food.externalName,
      brand: food.brand,
      barcode: food.barcode,
      food_group: foodGroup ?? food.foodGroup,
      cooked_state: food.cookedState,
      calories: food.per100g.calories,
      protein_g: food.per100g.proteinG,
      carbohydrate_g: food.per100g.carbohydrateG,
      fat_g: food.per100g.fatG,
      fiber_g: food.per100g.fiberG,
      sugar_g: food.sugarG,
      sodium_mg: food.sodiumMg,
      external_source: source,
      external_id: externalId,
      source: provider.label,
      source_updated_at: food.sourceUpdatedAt,
      // Importado != verificado: el dato viene de una fuente externa y no
      // ha sido revisado. La UI lo muestra como tal.
      verified: false,
      image_url: food.imageUrl,
    })
    .select("id")
    .single();

  // Carrera: otro usuario pudo importarlo entre el paso 1 y el 3.
  if (error) {
    const { data: raced } = await admin
      .from("foods")
      .select("id")
      .eq("external_source", source)
      .eq("external_id", externalId)
      .maybeSingle();
    if (raced) return { success: true, foodId: raced.id, alreadyExisted: true };
    console.error("[foods] error al importar", source, externalId, error);
    return { error: t.errors.failed };
  }

  // 4. Porciones y alias de busqueda (no criticos: si fallan, el alimento
  //    ya quedo utilizable).
  if (food.portions.length > 0) {
    await admin.from("food_portions").insert(
      food.portions.map((portion) => ({
        food_id: created.id,
        label: portion.label.slice(0, 60),
        grams: portion.grams,
        household_measure: portion.householdMeasure?.slice(0, 60) ?? null,
      })),
    );
  }

  const aliases = new Set(food.aliases);
  if (displayName) aliases.add(displayName.toLowerCase());
  if (aliases.size > 0) {
    await admin.from("food_aliases").insert(
      [...aliases].map((alias) => ({
        food_id: created.id,
        alias: alias.slice(0, 60),
        locale: "es" as const,
      })),
    );
  }

  // 5. Imagen: Open Food Facts suele traer foto del producto; USDA no, y
  //    ahi se recurre al pipeline propio de Pexels.
  if (!food.imageUrl) {
    const imageUrl = await fetchAndStoreFoodImage({
      query: `${displayName ?? food.name} comida`,
      pathPrefix: "foods",
      id: created.id,
    });
    if (imageUrl) {
      await admin.from("foods").update({ image_url: imageUrl }).eq("id", created.id);
    }
  }

  revalidatePath("/nutricion/alimentos");
  return { success: true, foodId: created.id, alreadyExisted: false };
}

/** Busqueda externa expuesta a la UI. Requiere sesion. */
export async function searchExternalFoodsAction(
  query: unknown,
): Promise<ExternalSearchResult[]> {
  const parsed = z.string().trim().min(1).max(80).safeParse(query);
  const userId = await requireUserId();
  if (!parsed.success || !userId) return [];
  return searchExternalFoods(parsed.data);
}

/** Escaneo/consulta por codigo de barras. Requiere sesion. */
export async function findByBarcodeAction(
  barcode: unknown,
): Promise<ExternalSearchResult | null> {
  const parsed = z
    .string()
    .trim()
    .regex(/^\d{6,14}$/)
    .safeParse(barcode);
  const userId = await requireUserId();
  if (!parsed.success || !userId) return null;
  return findExternalFoodByBarcode(parsed.data);
}
