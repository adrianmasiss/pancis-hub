/**
 * Open Food Facts. Base colaborativa, abierta y sin clave de API.
 *
 * Aporta lo que USDA no tiene: productos empacados con marca, codigo de
 * barras, imagen y nombres en espanol. A cambio, el dato es comunitario y
 * puede venir incompleto o mal cargado: por eso nada importado desde aqui
 * se marca como verificado y todo pasa por isPlausibleFood.
 */
import type { FoodGroup } from "@/features/foods/schemas";
import {
  deriveAliases,
  inferCookedState,
  inferFoodGroup,
} from "@/lib/food-providers/classify";
import {
  isPlausibleFood,
  type FoodProvider,
  type NormalizedFood,
  type NormalizedPortion,
} from "@/lib/food-providers/types";

/* El buscador nuevo (search-a-licious). El viejo `cgi/search.pl` tardaba ~3 s
   y no se podía paginar; este contesta en menos de uno y admite filtros. */
const SEARCH_URL = "https://search.openfoodfacts.org/search";
const PRODUCT_URL = "https://world.openfoodfacts.org/api/v2/product";
const TIMEOUT_MS = 8000;

/**
 * Open Food Facts pide identificar la aplicacion en el User-Agent para no
 * bloquear el trafico anonimo. Es un requisito de sus terminos de uso.
 */
const USER_AGENT =
  "PancisHub/0.1 (nutrition tracker; https://github.com/adrianmasiss/pancis-hub)";

/** Se piden solo los campos usados para no descargar respuestas enormes. */
const OFF_FIELDS = [
  "code",
  "product_name",
  "product_name_es",
  "generic_name",
  "generic_name_es",
  "brands",
  "categories",
  "categories_es",
  "image_front_url",
  "image_url",
  "last_modified_t",
  "serving_quantity",
  "serving_size",
  "quantity",
  "product_quantity_unit",
  "categories_tags",
  "nutriments",
].join(",");

type OffNutriments = Record<string, number | string | undefined>;

export type OffProduct = {
  code?: string;
  product_name?: string;
  product_name_es?: string;
  generic_name?: string;
  generic_name_es?: string;
  /* Texto con comas en el API de productos; lista en el buscador nuevo. */
  brands?: string | string[];
  categories?: string;
  categories_tags?: string[];
  quantity?: string;
  product_quantity_unit?: string;
  categories_es?: string;
  image_front_url?: string;
  image_url?: string;
  last_modified_t?: number;
  serving_quantity?: number | string;
  serving_size?: string;
  nutriments?: OffNutriments;
};

function num(value: number | string | undefined): number | undefined {
  if (typeof value === "number")
    return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

/**
 * Si la etiqueta es por 100 ml. Lo dice el envase («355 ml», «1 l») o, cuando
 * el envase no trae cantidad —pasa con muchos productos ticos—, la
 * categoría: una bebida o una leche, salvo en polvo, condensada o
 * concentrada. Si el envase dice gramos, manda el envase.
 */
export function offNutritionBasis(
  product: Partial<OffProduct>,
): "100g" | "100ml" {
  const quantity = String(product.quantity ?? "").toLowerCase();
  if (product.product_quantity_unit === "ml") return "100ml";
  if (/\d\s*(ml|cl|lt?|litros?|fl\.?\s?oz)\b/.test(quantity)) return "100ml";
  if (/\d\s*(g|gr|kg)\b/.test(quantity)) return "100g";
  const cats = product.categories_tags ?? [];
  const drink = cats.some((c) =>
    /^en:(beverages|milks|plant-based-milks|drinks)/.test(c),
  );
  const notLiquid = cats.some((c) =>
    /powder|condensed|dried|instant|concentrate|syrup|mix/.test(c),
  );
  return drink && !notLiquid ? "100ml" : "100g";
}

function portionsOf(product: OffProduct): NormalizedPortion[] {
  const grams = num(product.serving_quantity);
  if (grams === undefined || grams <= 0) return [];
  const label = product.serving_size?.trim() || "1 porcion";
  return [{ label, grams, householdMeasure: product.serving_size ?? null }];
}

export function normalizeOffProduct(raw: unknown): NormalizedFood | null {
  const product = raw as OffProduct;
  if (!product || typeof product !== "object") return null;

  const code = product.code?.trim();
  if (!code) return null;

  // Se prefiere el nombre en espanol cuando la comunidad lo cargo.
  const name = (
    product.product_name_es?.trim() ||
    product.product_name?.trim() ||
    product.generic_name_es?.trim() ||
    product.generic_name?.trim() ||
    ""
  ).slice(0, 80);
  if (!name) return null;

  const nutriments = product.nutriments ?? {};

  const kcal = num(nutriments["energy-kcal_100g"]);
  const kj = num(nutriments["energy_100g"]);
  const calories = kcal ?? (kj !== undefined ? kj / 4.184 : undefined);
  if (calories === undefined) return null;

  const round1 = (value: number) => Math.round(value * 10) / 10;
  const per100g = {
    calories: Math.round(calories),
    proteinG: round1(num(nutriments["proteins_100g"]) ?? 0),
    carbohydrateG: round1(num(nutriments["carbohydrates_100g"]) ?? 0),
    fatG: round1(num(nutriments["fat_100g"]) ?? 0),
    fiberG: round1(num(nutriments["fiber_100g"]) ?? 0),
  };

  const sugar = num(nutriments["sugars_100g"]);
  // Open Food Facts publica el sodio en GRAMOS por 100 g; el catalogo lo
  // guarda en miligramos. Si falta, se deriva de la sal (sal / 2.5).
  const sodiumG = num(nutriments["sodium_100g"]);
  const saltG = num(nutriments["salt_100g"]);
  const sodiumMg =
    sodiumG !== undefined
      ? sodiumG * 1000
      : saltG !== undefined
        ? (saltG / 2.5) * 1000
        : null;

  const category =
    product.categories_es?.trim() || product.categories?.trim() || null;

  const normalized: NormalizedFood = {
    source: "openfoodfacts",
    externalId: code,
    name,
    externalName: product.product_name?.trim() || name,
    brand:
      (Array.isArray(product.brands)
        ? product.brands[0]
        : product.brands?.split(",")[0]
      )?.trim() || null,
    barcode: code,
    imageUrl:
      product.image_front_url?.trim() || product.image_url?.trim() || null,
    foodGroup: inferFoodGroup(name, category, per100g) as FoodGroup,
    cookedState: inferCookedState(name),
    per100g,
    nutritionBasis: offNutritionBasis(product),
    sugarG: sugar !== undefined ? round1(sugar) : null,
    sodiumMg: sodiumMg !== null ? round1(sodiumMg) : null,
    sourceUpdatedAt: product.last_modified_t
      ? new Date(product.last_modified_t * 1000).toISOString()
      : null,
    portions: portionsOf(product),
    aliases: deriveAliases(name),
  };

  return isPlausibleFood(normalized) ? normalized : null;
}

async function requestJson(
  url: URL,
  signal?: AbortSignal,
): Promise<unknown | null> {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const combined = signal
    ? AbortSignal.any([signal, timeout])
    : (timeout as AbortSignal);

  try {
    const response = await fetch(url, {
      signal: combined,
      headers: { Accept: "application/json", "User-Agent": USER_AGENT },
    });

    // Open Food Facts limita la busqueda a ~10 peticiones por minuto. Al
    // pasarse responde 429, y ante un User-Agent que no reconoce devuelve
    // una pagina HTML con estado 200. En ambos casos hay que rendirse sin
    // intentar parsear: el buscador sigue con el catalogo local.
    if (response.status === 429) {
      console.warn("[open-food-facts] limite de peticiones alcanzado");
      return null;
    }
    if (!response.ok) return null;

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("json")) {
      console.warn("[open-food-facts] respuesta no JSON", contentType);
      return null;
    }

    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

export const openFoodFactsProvider: FoodProvider = {
  source: "openfoodfacts",
  label: "Open Food Facts",

  // No necesita clave: siempre disponible.
  isAvailable() {
    return true;
  },

  /*
    Dos consultas a la vez: los productos de Costa Rica y el resto del mundo.
    Lo tico va primero porque es lo que está en el súper de quien busca, y
    es lo que ninguna otra fuente tiene. Muchos productos de aquí no traen la
    etiqueta de país, así que la consulta mundial también los recoge; la
    fusión quita los repetidos.
  */
  async searchFoods(query, signal) {
    // Los signos de la sintaxis de Lucene, escritos por la persona, no
    // pueden convertirse en un filtro.
    const terms = query.replace(/[+\-!(){}[\]^"~*?:\\/&|]/g, " ").trim();
    if (!terms) return [];
    const ask = (q: string, size: number) => {
      const url = new URL(SEARCH_URL);
      url.searchParams.set("q", q);
      url.searchParams.set("langs", "es,en");
      url.searchParams.set("page_size", String(size));
      url.searchParams.set("fields", OFF_FIELDS);
      return requestJson(url, signal);
    };
    const [local, world] = await Promise.all([
      ask(`${terms} countries_tags:"en:costa-rica"`, 12),
      ask(terms, 20),
    ]);
    const seen = new Set<string>();
    const products = [local, world].flatMap(
      (data) => (data as { hits?: unknown[] } | null)?.hits ?? [],
    );
    return products
      .map(normalizeOffProduct)
      .filter((food): food is NormalizedFood => {
        if (!food || seen.has(food.externalId)) return false;
        seen.add(food.externalId);
        return true;
      });
  },

  async getFoodById(externalId, signal) {
    return this.getFoodByBarcode?.(externalId, signal) ?? null;
  },

  async getFoodByBarcode(barcode, signal) {
    const code = barcode.trim();
    if (!/^\d{6,14}$/.test(code)) return null;
    const url = new URL(`${PRODUCT_URL}/${code}.json`);
    url.searchParams.set("fields", OFF_FIELDS);
    const data = await requestJson(url, signal);
    const product = (data as { product?: unknown } | null)?.product;
    return product ? normalizeOffProduct(product) : null;
  },
};
