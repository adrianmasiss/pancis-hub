/**
 * Lectura de `food_source_values`: lo que dijo cada proveedor de un alimento.
 *
 * Está separado de `queries.ts` a propósito. La biblioteca se pide en todas
 * las pantallas de nutrición y casi ninguna necesita el cotejo; cargarlo
 * siempre sería pagar una consulta por algo que se enseña en dos sitios.
 */

import { createClient } from "@/lib/supabase/server";
import type { ProviderSource } from "@/lib/food-providers/types";
import type {
  SourceAgreement,
  SourceReading,
} from "@/features/foods/lib/source-agreement";
import { DIVERGENCE_THRESHOLD } from "@/features/foods/lib/source-agreement";

const numberOrNull = (value: unknown) =>
  value === null || value === undefined ? null : Number(value);

const CAMPOS =
  "food_id, source, external_id, external_name, calories, protein_g, carbohydrate_g, fat_g, fiber_g";

function toReading(row: Record<string, unknown>): SourceReading {
  return {
    source: row.source as ProviderSource,
    externalId: String(row.external_id ?? ""),
    externalName: (row.external_name as string | null) ?? null,
    calories: numberOrNull(row.calories),
    proteinG: numberOrNull(row.protein_g),
    carbohydrateG: numberOrNull(row.carbohydrate_g),
    fatG: numberOrNull(row.fat_g),
    fiberG: numberOrNull(row.fiber_g),
  };
}

/**
 * El cotejo de los alimentos pedidos, indexado por id.
 *
 * Sólo devuelve entrada para los que tienen más de una medición: un alimento
 * con una sola fuente no tiene nada que corroborar, y devolverlo obligaría a
 * cada pantalla a repetir esa comprobación.
 */
export async function getSourceAgreements(
  foodIds: string[],
): Promise<Map<string, SourceAgreement>> {
  const salida = new Map<string, SourceAgreement>();
  if (foodIds.length === 0) return salida;

  const supabase = await createClient();
  const [{ data: alimentos }, { data: valores }] = await Promise.all([
    supabase
      .from("foods")
      .select("id, external_source, external_id, max_divergence_pct")
      .in("id", foodIds),
    supabase.from("food_source_values").select(CAMPOS).in("food_id", foodIds),
  ]);

  const porAlimento = new Map<string, SourceReading[]>();
  for (const fila of valores ?? []) {
    const id = fila.food_id as string;
    const lista = porAlimento.get(id) ?? [];
    lista.push(toReading(fila));
    porAlimento.set(id, lista);
  }

  for (const alimento of alimentos ?? []) {
    const lecturas = porAlimento.get(alimento.id) ?? [];
    if (lecturas.length < 2) continue;
    const canonical =
      (alimento.external_source as ProviderSource | null) ?? null;
    // La canónica primero: es el valor que la pantalla está mostrando, y todo
    // lo demás se lee como «y las otras dicen…».
    const ordenadas = [
      ...lecturas.filter((l) => l.source === canonical),
      ...lecturas.filter((l) => l.source !== canonical),
    ];
    salida.set(alimento.id, {
      readings: ordenadas,
      canonical,
      maxDivergencePct: numberOrNull(alimento.max_divergence_pct),
    });
  }
  return salida;
}

export type ReviewItem = {
  foodId: string;
  name: string;
  brand: string | null;
  maxDivergencePct: number;
  agreement: SourceAgreement;
};

/**
 * Los alimentos cuyas fuentes no se ponen de acuerdo, del peor al menos malo.
 *
 * Es una cola de revisión humana, no una alarma: casi nunca es que la comida
 * sea rara, es que alguien escribió el valor por porción en la casilla de por
 * 100 g. Verlos juntos y ordenados es lo que permite despacharlos.
 */
export async function getFoodsToReview(limit = 50): Promise<ReviewItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("foods")
    .select("id, name, brand, external_source, max_divergence_pct")
    .is("deleted_at", null)
    .gt("max_divergence_pct", DIVERGENCE_THRESHOLD)
    .order("max_divergence_pct", { ascending: false })
    .limit(limit);
  if (!data?.length) return [];

  const acuerdos = await getSourceAgreements(data.map((f) => f.id));
  return data.flatMap((food) => {
    const agreement = acuerdos.get(food.id);
    if (!agreement) return [];
    return [
      {
        foodId: food.id,
        name: food.name,
        brand: food.brand,
        maxDivergencePct: Number(food.max_divergence_pct),
        agreement,
      },
    ];
  });
}

/** Cuántos alimentos esperan revisión. Para el aviso de la biblioteca. */
export async function countFoodsToReview(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("foods")
    .select("id", { count: "exact", head: true })
    .is("deleted_at", null)
    .gt("max_divergence_pct", DIVERGENCE_THRESHOLD);
  return count ?? 0;
}
