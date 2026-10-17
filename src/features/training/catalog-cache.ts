import { createClient } from "@/lib/supabase/server";

type CatalogRow = {
  id: string;
  name: string;
  primary_muscle: string;
  secondary_muscles: string[] | null;
  movement_pattern: string | null;
  equipment: string | null;
  difficulty: string | null;
};

/* SERVER-ONLY. El catálogo entero (unos 2.200 ejercicios) en memoria del servidor por
   unos minutos: emparejar una rutina o buscar en español necesita verlo
   todo, y pedirlo en cada letra o en cada línea sería pedirlo cien veces. */
let cache: { at: number; rows: CatalogRow[] } | null = null;
const TTL_MS = 10 * 60 * 1000;

export async function loadExerciseCatalog(): Promise<CatalogRow[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.rows;
  const supabase = await createClient();
  const rows: CatalogRow[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from("exercise_catalog")
      .select(
        "id, name, primary_muscle, secondary_muscles, movement_pattern, equipment, difficulty",
      )
      .is("deleted_at", null)
      .order("id")
      .range(from, from + 999);
    if (error) throw error;
    rows.push(...(data as CatalogRow[]));
    if ((data ?? []).length < 1000) break;
  }
  cache = { at: Date.now(), rows };
  return rows;
}
