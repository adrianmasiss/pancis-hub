import { createClient } from "@/lib/supabase/server";
import { applyCorrection } from "@/features/foods/lib/corrections";
import { getUserFoodCorrections } from "@/features/foods/correction-actions";
import type { FoodGroup } from "@/features/foods/schemas";

export type PantryItemView = {
  /** id de la fila pantry_items, para quitarla. */
  id: string;
  foodId: string;
  name: string;
  brand: string | null;
  foodGroup: FoodGroup;
  calories: number;
  imageUrl: string | null;
};

/**
 * Ids de alimentos que el usuario declaro tener en casa. Alimenta el filtro
 * "disponibles" del motor de sustitucion.
 */
export async function getPantryFoodIds(userId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pantry_items")
    .select("food_id")
    .eq("user_id", userId)
    .is("deleted_at", null);
  return new Set((data ?? []).map((row) => row.food_id));
}

/** Despensa del usuario con datos del alimento para listarla. */
export async function getPantryItems(userId: string): Promise<PantryItemView[]> {
  const supabase = await createClient();

  const [{ data }, corrections] = await Promise.all([
    supabase
      .from("pantry_items")
      .select(
        "id, food_id, created_at, foods(id, name, brand, food_group, cooked_state, calories, protein_g, carbohydrate_g, fat_g, fiber_g, image_url)",
      )
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    getUserFoodCorrections(userId),
  ]);

  return (data ?? [])
    .filter((row) => row.foods)
    .map((row) => {
      const food = row.foods!;
      // Las correcciones del usuario se superponen al catalogo compartido.
      const corrected = applyCorrection(
        {
          id: food.id,
          name: food.name,
          brand: food.brand,
          foodGroup: food.food_group as FoodGroup,
          cookedState: food.cooked_state as "crudo" | "cocido" | null,
          calories: Number(food.calories),
          proteinG: Number(food.protein_g),
          carbohydrateG: Number(food.carbohydrate_g),
          fatG: Number(food.fat_g),
          fiberG: Number(food.fiber_g),
          verified: false,
          isOwn: false,
          isFavorite: false,
          imageUrl: food.image_url,
        },
        corrections.get(food.id),
      );
      return {
        id: row.id,
        foodId: food.id,
        name: corrected.name,
        brand: corrected.brand,
        foodGroup: corrected.foodGroup,
        calories: corrected.calories,
        imageUrl: corrected.imageUrl,
      };
    });
}
