/**
 * Busqueda hibrida de alimentos: primero el catalogo local, y solo si hace
 * falta se consulta a los proveedores externos (docs/02_PRODUCT_REQUIREMENTS 7.1).
 *
 * Las respuestas externas se cachean en public.external_food_cache para no
 * repetir llamadas por la misma busqueda: las APIs gratuitas tienen limites
 * de uso y una lista de resultados no cambia de un minuto a otro.
 *
 * SERVER-ONLY.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeText } from "@/lib/food-providers/classify";
import { mergeProviderResults } from "@/lib/food-providers/dedupe";
import { availableProviders, barcodeProvider } from "@/lib/food-providers";
import type {
  NormalizedFood,
  ProviderSource,
} from "@/lib/food-providers/types";

/** Vigencia de una busqueda cacheada. */
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Bajo este numero de resultados locales se complementa con lo externo. */
export const LOCAL_RESULTS_THRESHOLD = 5;

/** Consultas mas cortas producen ruido y gastan cuota. */
export const MIN_QUERY_LENGTH = 3;

export type ExternalSearchResult = NormalizedFood & {
  alreadyImported: boolean;
  importedFoodId: string | null;
};

async function readCache(
  source: ProviderSource,
  cacheKey: string,
): Promise<NormalizedFood[] | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("external_food_cache")
    .select("payload, fetched_at")
    .eq("source", source)
    .eq("cache_key", cacheKey)
    .maybeSingle();

  if (!data) return null;
  const age = Date.now() - new Date(data.fetched_at).getTime();
  if (age > CACHE_TTL_MS) return null;
  return data.payload as unknown as NormalizedFood[];
}

async function writeCache(
  source: ProviderSource,
  cacheKey: string,
  foods: NormalizedFood[],
): Promise<void> {
  const admin = createAdminClient();
  await admin.from("external_food_cache").upsert(
    {
      source,
      cache_key: cacheKey,
      payload: foods as unknown as never,
      fetched_at: new Date().toISOString(),
    },
    { onConflict: "source,cache_key" },
  );
}

/**
 * Cuales de estos resultados ya estan en el catalogo local. Evita ofrecer
 * "importar" algo que ya existe y permite enlazar al alimento existente.
 */
async function findImported(
  foods: NormalizedFood[],
): Promise<Map<string, string>> {
  if (foods.length === 0) return new Map();
  const admin = createAdminClient();
  const { data } = await admin
    .from("foods")
    .select("id, external_source, external_id")
    .in("external_id", foods.map((food) => food.externalId))
    .not("external_source", "is", null);

  const map = new Map<string, string>();
  for (const row of data ?? []) {
    if (row.external_source && row.external_id) {
      map.set(`${row.external_source}:${row.external_id}`, row.id);
    }
  }
  return map;
}

/**
 * Consulta a los proveedores en paralelo, con cache por proveedor. Un
 * proveedor caido no rompe la busqueda: devuelve lista vacia y se usa el
 * resto (los providers ya absorben sus propios errores).
 */
export async function searchExternalFoods(
  rawQuery: string,
): Promise<ExternalSearchResult[]> {
  const query = rawQuery.trim();
  if (query.length < MIN_QUERY_LENGTH) return [];

  const cacheKey = `q:${normalizeText(query)}`;
  const providers = availableProviders();
  if (providers.length === 0) return [];

  const perProvider = await Promise.all(
    providers.map(async (provider) => {
      const cached = await readCache(provider.source, cacheKey);
      if (cached) return cached;
      const fresh = await provider.searchFoods(query);
      // Solo se cachean respuestas utiles: si el proveedor fallo y devolvio
      // vacio, no se congela ese vacio durante una semana.
      if (fresh.length > 0) await writeCache(provider.source, cacheKey, fresh);
      return fresh;
    }),
  );

  const merged = mergeProviderResults(perProvider.flat(), query);
  const imported = await findImported(merged);

  return merged.map((food) => {
    const importedFoodId = imported.get(`${food.source}:${food.externalId}`);
    return {
      ...food,
      alreadyImported: importedFoodId !== undefined,
      importedFoodId: importedFoodId ?? null,
    };
  });
}

/** Busqueda por codigo de barras (Open Food Facts). */
export async function findExternalFoodByBarcode(
  barcode: string,
): Promise<ExternalSearchResult | null> {
  const provider = barcodeProvider();
  if (!provider?.getFoodByBarcode) return null;

  const code = barcode.trim();
  const cacheKey = `barcode:${code}`;
  const cached = await readCache(provider.source, cacheKey);

  const food = cached?.[0] ?? (await provider.getFoodByBarcode(code));
  if (!food) return null;
  if (!cached) await writeCache(provider.source, cacheKey, [food]);

  const imported = await findImported([food]);
  const importedFoodId = imported.get(`${food.source}:${food.externalId}`);
  return {
    ...food,
    alreadyImported: importedFoodId !== undefined,
    importedFoodId: importedFoodId ?? null,
  };
}
