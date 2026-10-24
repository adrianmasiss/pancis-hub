import { createClient } from "@/lib/supabase/server";

export type RestaurantStatus = "verificado" | "estimado" | "pendiente";

export type RestaurantSummary = {
  id: string;
  name: string;
  itemCount: number;
};

export type RestaurantItem = {
  id: string;
  name: string;
  servingLabel: string | null;
  servingG: number | null;
  calories: number | null;
  proteinG: number | null;
  carbohydrateG: number | null;
  fatG: number | null;
  fiberG: number | null;
  status: RestaurantStatus;
  sourceUrl: string | null;
  sourceNote: string | null;
};

const n = (v: unknown) => (v === null || v === undefined ? null : Number(v));

/**
 * Restaurantes de la base compartida, los que tienen platos primero. Con
 * `query`, solo los que coinciden por nombre.
 */
export async function listRestaurants(
  query?: string,
): Promise<RestaurantSummary[]> {
  const supabase = await createClient();
  let request = supabase
    .from("restaurants")
    .select("id, name, restaurant_items(count)")
    .order("name")
    .limit(60);
  if (query) request = request.ilike("name", `%${query}%`);
  const { data } = await request;
  return (data ?? [])
    .map((r) => ({
      id: r.id,
      name: r.name,
      itemCount:
        (r.restaurant_items as unknown as { count: number }[])?.[0]?.count ?? 0,
    }))
    .sort((a, b) => Number(b.itemCount > 0) - Number(a.itemCount > 0));
}

/** El menu de un restaurante, con el estado de cada cifra. */
export async function getRestaurantItems(
  restaurantId: string,
): Promise<RestaurantItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurant_items")
    .select(
      "id, name, serving_label, serving_g, calories, protein_g, carbohydrate_g, fat_g, fiber_g, status, source_url, source_note",
    )
    .eq("restaurant_id", restaurantId)
    .order("name");
  return (data ?? []).map((i) => ({
    id: i.id,
    name: i.name,
    servingLabel: i.serving_label,
    servingG: n(i.serving_g),
    calories: n(i.calories),
    proteinG: n(i.protein_g),
    carbohydrateG: n(i.carbohydrate_g),
    fatG: n(i.fat_g),
    fiberG: n(i.fiber_g),
    status: i.status as RestaurantStatus,
    sourceUrl: i.source_url,
    sourceNote: i.source_note,
  }));
}
