import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_FORMULAS,
  type NutritionFormulas,
} from "@/features/onboarding/lib/nutrition-targets";

/**
 * Lee las constantes nutricionales activas de `formula_versions`.
 *
 * La fuente de verdad es la base, no el codigo: es lo que implementa "ningun
 * numero magico sin fuente" y cierra D-002. Cada valor de aqui tiene su
 * referencia cientifica en `research_sources`.
 *
 * SERVER-ONLY. La vista previa del onboarding sigue usando DEFAULT_FORMULAS
 * en el cliente; el valor que se GUARDA sale de aqui.
 */

/** Claves esperadas en formula_versions. Una por constante inyectable. */
const KEYS = [
  "activity_factors",
  "goal_adjustments",
  "protein_g_per_kg",
  "min_fat_g_per_kg",
  "fiber_g_per_1000_kcal",
  "water_ml_per_kg",
  "safety_floor_factor",
] as const;

function asNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asRecord<T extends string>(
  value: unknown,
  fallback: Record<T, number>,
): Record<T, number> {
  if (typeof value !== "object" || value === null) return fallback;
  const source = value as Record<string, unknown>;
  const result = { ...fallback };
  for (const key of Object.keys(fallback) as T[]) {
    result[key] = asNumber(source[key], fallback[key]);
  }
  return result;
}

/**
 * Nunca lanza. Si la base no responde o falta una clave, se usa el respaldo:
 * calcular con un valor aproximado es mejor que dejar al usuario sin objetivo
 * (RF-015, las funciones esenciales sobreviven a un fallo externo).
 */
export async function getNutritionFormulas(): Promise<NutritionFormulas> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("formula_versions")
      .select("key, value")
      .in("key", KEYS as unknown as string[])
      .eq("is_active", true);

    if (!data || data.length === 0) return DEFAULT_FORMULAS;

    const byKey = new Map(data.map((row) => [row.key, row.value]));
    const get = (key: (typeof KEYS)[number]) => byKey.get(key);

    return {
      activityFactors: asRecord(
        get("activity_factors"),
        DEFAULT_FORMULAS.activityFactors,
      ),
      goalAdjustments: asRecord(
        get("goal_adjustments"),
        DEFAULT_FORMULAS.goalAdjustments,
      ),
      proteinGPerKg: asNumber(
        get("protein_g_per_kg"),
        DEFAULT_FORMULAS.proteinGPerKg,
      ),
      minFatGPerKg: asNumber(
        get("min_fat_g_per_kg"),
        DEFAULT_FORMULAS.minFatGPerKg,
      ),
      fiberGPer1000Kcal: asNumber(
        get("fiber_g_per_1000_kcal"),
        DEFAULT_FORMULAS.fiberGPer1000Kcal,
      ),
      waterMlPerKg: asNumber(
        get("water_ml_per_kg"),
        DEFAULT_FORMULAS.waterMlPerKg,
      ),
      safetyFloorFactor: asNumber(
        get("safety_floor_factor"),
        DEFAULT_FORMULAS.safetyFloorFactor,
      ),
    };
  } catch {
    return DEFAULT_FORMULAS;
  }
}
