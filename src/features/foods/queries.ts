import { createClient } from "@/lib/supabase/server";
import { applyCorrection } from "@/features/foods/lib/corrections";
import { getUserFoodCorrections } from "@/features/foods/correction-actions";
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
  /** Per 100 g; null = the food carries no data, not zero. */
  sugarG?: number | null;
  sodiumMg?: number | null;
  verified: boolean;
  isOwn: boolean;
  isFavorite: boolean;
  imageUrl: string | null;
  /** true si el usuario corrigio algun valor de este alimento. */
  isCorrected: boolean;
  source?: string | null;
  /** Sobre qué cantidad están los valores: 100 g o 100 ml (bebidas). */
  nutritionBasis?: "100g" | "100ml";
  /** Gramos por mililitro, medido; null si no se conoce. */
  densityGPerMl?: number | null;
  /** Porciones caseras con su peso: las compartidas y las propias. */
  portions?: { label: string; grams: number }[];
  /** La etiqueta no se sostiene (ver la migración de datos dudosos). */
  dataIssue?: "macros_imposibles" | "kcal_incoherentes" | null;
  /** Por 100 g, de USDA. Clave ausente = no medido. */
  micronutrients?: Partial<Record<MicronutrientKey, number>> | null;
};

export type MicronutrientKey =
  | "sat_fat_g"
  | "cholesterol_mg"
  | "calcium_mg"
  | "iron_mg"
  | "magnesium_mg"
  | "potassium_mg"
  | "zinc_mg"
  | "vit_a_ug"
  | "vit_c_mg"
  | "vit_d_ug"
  | "vit_b12_ug"
  | "folate_ug";

export type LibraryFilters = {
  query?: string;
  foodId?: string;
  group?: FoodGroup;
  view: FoodView;
  /** Página pedida, empezando en 1. */
  page?: number;
  pageSize?: number;
};

/** Cuántos alimentos se muestran por página. */
export const LIBRARY_PAGE_SIZE = 48;

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
  for (const row of data ?? []) {
    // Los sustitutos externos conservan snapshots pero no tienen foods.id.
    if (row.food_id) seen.add(row.food_id);
  }
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

/**
 * El filtro `or` de PostgREST separa condiciones por coma y delimita con
 * parentesis, asi que esos caracteres se retiran del termino de busqueda.
 * Tambien se neutralizan los comodines de LIKE para que el usuario no
 * pueda escribir un patron que devuelva la tabla entera.
 */
function sanitizeSearchTerm(term: string): string {
  return term
    .replace(/[,()]/g, " ")
    .replace(/[%_\\]/g, "\\$&")
    .trim();
}

/** Ids de alimentos cuyo alias coincide con el termino buscado. */
async function findFoodIdsByAlias(term: string): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("food_aliases")
    .select("food_id")
    .ilike("alias", `%${sanitizeSearchTerm(term)}%`)
    .limit(50);
  return [...new Set((data ?? []).map((row) => row.food_id))];
}

/**
 * Una página de la biblioteca, con el total real del catálogo.
 *
 * Antes esto pedía `.limit(100)` y devolvía sólo el arreglo. Con 22 alimentos
 * propios no se notaba; con 28.140 el tope escondía 28.040 y la pantalla
 * afirmaba «148 alimentos», que es falso y además no deja llegar al resto.
 * Ahora se pide un rango y el total exacto por separado, así que el número
 * que se muestra es el que hay y se puede navegar hasta el último.
 */
export async function getFoodsLibraryPage(
  userId: string,
  filters: LibraryFilters,
): Promise<{ foods: LibraryFood[]; total: number }> {
  const supabase = await createClient();

  const [favoriteIds, recentIds, corrections] = await Promise.all([
    getFavoriteFoodIds(userId),
    filters.view === "recientes"
      ? getRecentFoodIds(userId)
      : Promise.resolve([]),
    getUserFoodCorrections(userId),
  ]);

  const pageSize = filters.pageSize ?? LIBRARY_PAGE_SIZE;
  const page = Math.max(1, filters.page ?? 1);
  const desde = (page - 1) * pageSize;

  let query = supabase
    .from("foods")
    .select(
      "id, name, brand, food_group, cooked_state, calories, protein_g, carbohydrate_g, fat_g, fiber_g, sugar_g, sodium_mg, verified, owner_user_id, image_url, source, nutrition_basis, density_g_per_ml, data_issue, micronutrients, food_portions(label, grams)",
      { count: "exact" },
    )
    .is("deleted_at", null)
    /* El orden importa más que nunca con 28.140 filas. Por nombre a secas, la
       portada de la biblioteca eran «-KUNG PAO- TEMPURA CAULIFLOWER», «;ratio
       Keto Friendly Bar» y «:60 SECOND PASTA»: productos de marca de USDA que
       empiezan por un signo de puntuación y ordenan antes que cualquier letra.
       Así que primero lo que no viene de un proveedor (lo propio y lo
       sembrado), después los alimentos genéricos —que no tienen código de
       barras y son los que sirven para armar una dieta— y al final los 16.129
       productos de marca.

       El código de barras va antes que la fuente: con los genéricos de USDA
       ya en español, buscar «manzana» ponía delante los productos de Open
       Food Facts (que ordena antes que «usda» por el alfabeto) y dejaba la
       manzana cruda en el puesto doce. */
    .order("barcode", { nullsFirst: true })
    .order("external_source", { nullsFirst: true })
    .order("name")
    .range(desde, desde + pageSize - 1);

  if (filters.foodId) query = query.eq("id", filters.foodId);
  if (filters.query) {
    // Los alimentos importados de USDA conservan su nombre en ingles
    // ("Chicken, broilers..."), asi que la busqueda tambien mira los alias
    // en espanol guardados al importar.
    const term = sanitizeSearchTerm(filters.query);
    const aliasIds = await findFoodIdsByAlias(filters.query);
    query =
      aliasIds.length > 0
        ? query.or(
            `name.ilike.%${term}%,brand.ilike.%${term}%,id.in.(${aliasIds.join(",")})`,
          )
        : query.or(`name.ilike.%${term}%,brand.ilike.%${term}%`);
  }
  /* En «Todos» quedan fuera las etiquetas cuyos números no se sostienen, y
     sin búsqueda también los productos de marca: son 15.000 nombres en inglés
     que tapan los genéricos. Se encuentran buscándolos o por código de
     barras, y lo propio del usuario se ve siempre. */
  if (filters.view === "todos" && !filters.foodId) {
    query = query.or(
      filters.query
        ? `data_issue.is.null,owner_user_id.eq.${userId}`
        : `and(barcode.is.null,data_issue.is.null),owner_user_id.eq.${userId}`,
    );
  }
  if (filters.group && FOOD_GROUPS.includes(filters.group)) {
    query = query.eq("food_group", filters.group);
  }
  if (filters.view === "favoritos") {
    const ids = [...favoriteIds];
    if (ids.length === 0) return { foods: [], total: 0 };
    query = query.in("id", ids);
  }
  if (filters.view === "mios") query = query.eq("owner_user_id", userId);
  if (filters.view === "recientes") {
    if (recentIds.length === 0) return { foods: [], total: 0 };
    query = query.in("id", recentIds);
  }

  const { data, count } = await query;
  // Las correcciones del usuario se superponen al catalogo compartido.
  const foods = (data ?? []).map((food) =>
    applyCorrection(
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
        sugarG: food.sugar_g === null ? null : Number(food.sugar_g),
        sodiumMg: food.sodium_mg === null ? null : Number(food.sodium_mg),
        verified: food.verified,
        isOwn: food.owner_user_id === userId,
        isFavorite: favoriteIds.has(food.id),
        imageUrl: food.image_url,
        source: food.source,
        nutritionBasis: (food.nutrition_basis === "100ml"
          ? "100ml"
          : "100g") as "100g" | "100ml",
        densityGPerMl:
          food.density_g_per_ml === null ? null : Number(food.density_g_per_ml),
        portions: (food.food_portions ?? []).map((portion) => ({
          label: portion.label,
          grams: Number(portion.grams),
        })),
        dataIssue: food.data_issue as LibraryFood["dataIssue"],
        micronutrients: food.micronutrients as LibraryFood["micronutrients"],
      },
      corrections.get(food.id),
    ),
  );

  if (filters.view === "recientes") {
    const order = new Map(recentIds.map((id, index) => [id, index]));
    foods.sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
  }
  return { foods, total: count ?? foods.length };
}

/** La primera página sin el total, para quien sólo quiere la lista. */
export async function getFoodsLibrary(
  userId: string,
  filters: LibraryFilters,
): Promise<LibraryFood[]> {
  return (await getFoodsLibraryPage(userId, filters)).foods;
}
