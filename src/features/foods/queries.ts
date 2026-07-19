import { createClient } from "@/lib/supabase/server";
import {
  FOOD_GROUPS,
  type FoodGroup,
  type FoodView,
} from "@/features/foods/schemas";

export type LibraryFood = {
  id: string;
  name: string;
  brand: string | null;
  foodGroup: FoodGroup;
  cookedState: "crudo" | "cocido" | null;
  calories: number;
  proteinG: number;
  carbohydrateG: number;
  fatG: number;
  fiberG: number;
  verified: boolean;
  isOwn: boolean;
  isFavorite: boolean;
};

export type LibraryFilters = {
  query?: string;
  group?: FoodGroup;
  view: FoodView;
};

/** Ids de alimentos usados recientemente en comidas del usuario. */
export async function getRecentFoodIds(userId: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meal_items")
    .select("food_id, created_at, meals!inner(user_id)")
    .eq("meals.user_id", userId)
    .order("created_at", { ascending: false })
    .limit(60);
  const seen = new Set<string>();
  for (const row of data ?? []) seen.add(row.food_id);
  return [...seen].slice(0, 20);
}

export async function getFavoriteFoodIds(userId: string): Promise<Set<string>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("favorites")
    .select("item_id")
    .eq("user_id", userId)
    .eq("item_type", "food");
  return new Set((data ?? []).map((row) => row.item_id));
}

export async function getFoodsLibrary(
  userId: string,
  filters: LibraryFilters,
): Promise<LibraryFood[]> {
  const supabase = await createClient();

  const [favoriteIds, recentIds] = await Promise.all([
    getFavoriteFoodIds(userId),
    filters.view === "recientes"
      ? getRecentFoodIds(userId)
      : Promise.resolve([]),
  ]);

  let query = supabase
    .from("foods")
    .select(
      "id, name, brand, food_group, cooked_state, calories, protein_g, carbohydrate_g, fat_g, fiber_g, verified, owner_user_id",
    )
    .is("deleted_at", null)
    .order("name")
    .limit(100);

  if (filters.query) query = query.ilike("name", `%${filters.query}%`);
  if (filters.group && FOOD_GROUPS.includes(filters.group)) {
    query = query.eq("food_group", filters.group);
  }
  if (filters.view === "favoritos") {
    const ids = [...favoriteIds];
    if (ids.length === 0) return [];
    query = query.in("id", ids);
  }
  if (filters.view === "mios") query = query.eq("owner_user_id", userId);
  if (filters.view === "recientes") {
    if (recentIds.length === 0) return [];
    query = query.in("id", recentIds);
  }

  const { data } = await query;
  const foods = (data ?? []).map((food) => ({
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
    verified: food.verified,
    isOwn: food.owner_user_id === userId,
    isFavorite: favoriteIds.has(food.id),
  }));

  if (filters.view === "recientes") {
    const order = new Map(recentIds.map((id, index) => [id, index]));
    foods.sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
  }
  return foods;
}
