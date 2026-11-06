import { createClient } from "@/lib/supabase/server";
import { commonsThumb } from "./lib/logo";
import { restaurantImage, restaurantItemImage } from "./lib/images";
import {
  MENU_SECTIONS,
  type MenuSection,
  type RestaurantCategory,
} from "./lib/menu";

export type RestaurantStatus = "verificado" | "estimado" | "pendiente";

export type RestaurantSummary = {
  id: string;
  name: string;
  category: RestaurantCategory | null;
  /** Imagen real del catálogo; respaldo de Wikimedia Commons si no hay. */
  logoUrl: string | null;
  imageSourceUrl?: string | null;
  itemCount: number;
  /** Platos verificados contra la tabla oficial del restaurante. */
  verifiedCount: number;
};

/** Una opcion del plato: la diferencia con el base, por porcion. */
export type RestaurantItemOption = {
  id: string;
  label: string;
  calories: number;
  proteinG: number;
  carbohydrateG: number;
  fatG: number;
  fiberG: number;
};

export type RestaurantItem = {
  id: string;
  name: string;
  imageUrl?: string | null;
  imageSourceUrl?: string | null;
  servingLabel: string | null;
  servingG: number | null;
  calories: number | null;
  proteinG: number | null;
  carbohydrateG: number | null;
  fatG: number | null;
  fiberG: number | null;
  /** Lo que trae la tabla del restaurante ademas de los macros; null = no lo publica. */
  satFatG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
  status: RestaurantStatus;
  section: MenuSection;
  sourceUrl: string | null;
  sourceNote: string | null;
  options: RestaurantItemOption[];
};

const n = (v: unknown) => (v === null || v === undefined ? null : Number(v));

const SUMMARY =
  "id, name, category, logo_url, restaurant_items(count), verificados:restaurant_items(count)";

type SummaryRow = {
  id: string;
  name: string;
  category: string | null;
  logo_url: string | null;
  restaurant_items: unknown;
  verificados: unknown;
};

const count = (v: unknown) =>
  (v as { count: number }[] | null)?.[0]?.count ?? 0;

function toSummary(r: SummaryRow): RestaurantSummary {
  return {
    id: r.id,
    name: r.name,
    category: (r.category ?? null) as RestaurantCategory | null,
    logoUrl:
      restaurantImage(r.name)?.src ??
      (r.logo_url ? commonsThumb(r.logo_url) : null),
    imageSourceUrl: restaurantImage(r.name)?.sourceUrl ?? null,
    itemCount: count(r.restaurant_items),
    verifiedCount: count(r.verificados),
  };
}

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
    .select(SUMMARY)
    .eq("verificados.status", "verificado")
    .order("name")
    .limit(60);
  if (query) request = request.ilike("name", `%${query}%`);
  const { data } = await request;
  return (data ?? [])
    .map(toSummary)
    .sort((a, b) => Number(b.itemCount > 0) - Number(a.itemCount > 0));
}

/** Un restaurante por id, con cuantos platos tiene; null si no existe. */
export async function getRestaurant(
  id: string,
): Promise<RestaurantSummary | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurants")
    .select(SUMMARY)
    .eq("verificados.status", "verificado")
    .eq("id", id)
    .maybeSingle();
  return data ? toSummary(data) : null;
}

/** El menu de un restaurante, con el estado de cada cifra. */
export async function getRestaurantItems(
  restaurantId: string,
): Promise<RestaurantItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurant_items")
    .select(
      "id, name, restaurants(name), serving_label, serving_g, calories, protein_g, carbohydrate_g, fat_g, fiber_g, sat_fat_g, sugar_g, sodium_mg, status, section, source_url, source_note, restaurant_item_options(id, label, calories_delta, protein_delta, carbohydrate_delta, fat_delta, fiber_delta)",
    )
    .eq("restaurant_id", restaurantId)
    .order("name");
  return (data ?? []).map((i) => ({
    id: i.id,
    name: i.name,
    imageUrl:
      restaurantItemImage(i.restaurants?.name ?? "", i.name)?.src ?? null,
    imageSourceUrl:
      restaurantItemImage(i.restaurants?.name ?? "", i.name)?.sourceUrl ?? null,
    servingLabel: i.serving_label,
    servingG: n(i.serving_g),
    calories: n(i.calories),
    proteinG: n(i.protein_g),
    carbohydrateG: n(i.carbohydrate_g),
    fatG: n(i.fat_g),
    fiberG: n(i.fiber_g),
    satFatG: n(i.sat_fat_g),
    sugarG: n(i.sugar_g),
    sodiumMg: n(i.sodium_mg),
    status: i.status as RestaurantStatus,
    section: (MENU_SECTIONS as readonly string[]).includes(i.section)
      ? (i.section as MenuSection)
      : "plato",
    sourceUrl: i.source_url,
    sourceNote: i.source_note,
    options: (i.restaurant_item_options ?? [])
      .map((o) => ({
        id: o.id,
        label: o.label,
        calories: Number(o.calories_delta),
        proteinG: Number(o.protein_delta),
        carbohydrateG: Number(o.carbohydrate_delta),
        fatG: Number(o.fat_delta),
        fiberG: Number(o.fiber_delta),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "es")),
  }));
}
