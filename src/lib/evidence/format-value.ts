/**
 * Formatea el `value` jsonb de `formula_versions` para leerlo.
 *
 * Vive aqui y no en `src/server/tools/evidence.ts` porque la pantalla de
 * Evidencia lo necesita en el cliente, y ese modulo importa el cliente de
 * Supabase de servidor: importarlo desde un componente cliente dependia de que
 * el tree-shaking quitara esa dependencia. Compilaba, pero por suerte, no por
 * diseno.
 *
 * Es una funcion pura: sin red, sin `next/headers`, sin estado.
 */
/** Las claves internas de las tablas, como las lee una persona. */
const KEY_LABELS: Record<string, string> = {
  perdida_grasa: "pérdida de grasa",
  ganancia_muscular: "ganancia muscular",
  recomposicion: "recomposición",
  mantenimiento: "mantenimiento",
  principiante: "principiante",
  intermedio: "intermedio",
  avanzado: "avanzado",
  proteico: "proteico",
  carbohidrato: "carbohidrato",
  comida: "comida",
  calories: "calorías",
  protein: "proteína",
  proteinG: "proteína",
  carbs: "carbohidratos",
  carbohydrateG: "carbohidratos",
  fat: "grasas",
  fatG: "grasas",
  fiber: "fibra",
  fiberG: "fibra",
};

const keyLabel = (key: string) => KEY_LABELS[key] ?? key.replace(/_/g, " ");

const isRange = (v: unknown): v is { min: number; max: number } =>
  !!v &&
  typeof v === "object" &&
  Object.keys(v).length === 2 &&
  "min" in v &&
  "max" in v;

export function formatValue(value: unknown, preferKey?: string | null): string {
  if (typeof value === "number" || typeof value === "string")
    return String(value);
  // En una tabla, null es «sin limite» (la fibra no tiene tolerancia).
  if (value === null) return "sin límite";
  if (isRange(value)) return `${value.min} a ${value.max}`;
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    if (preferKey && preferKey in record) return formatValue(record[preferKey]);
    return Object.entries(record)
      .map(([k, v]) =>
        // Una tabla dentro de otra («comida» con sus pesos por macro) se lee
        // entre parentesis, no como «[object Object]».
        v && typeof v === "object" && !isRange(v)
          ? `${keyLabel(k)} (${formatValue(v)})`
          : `${keyLabel(k)} ${formatValue(v)}`,
      )
      .join(", ");
  }
  return "";
}

/** Etiquetas legibles de cada constante, para explicarlas al usuario. */
const FORMULA_LABELS: Record<string, string> = {
  bmr_equation: "La fórmula con la que estimamos tu gasto en reposo",
  activity_factors: "El factor con el que ajustamos por tu actividad",
  goal_adjustments: "El ajuste que aplicamos por tu objetivo",
  safety_floor_factor: "El suelo por debajo del cual no bajamos tus calorías",
  macro_tolerances_pct: "Cuánto puede desviarse un cambio sin avisarte",
  compatibility_profiles: "Cómo puntuamos si dos alimentos se parecen",
  protein_ranges: "Tu rango de proteína",
  weekly_rate_band_percent: "El ritmo de cambio de peso que buscamos",
  min_fat_g_per_kg: "Tu mínimo de grasa",
  fiber_g_per_1000_kcal: "Tu objetivo de fibra",
  water_ml_per_kg: "La referencia de agua",
  energy_availability_thresholds: "El mínimo de energía disponible",
  rir_by_goal: "Las repeticiones en reserva que te sugerimos",
  min_rest_seconds: "El descanso mínimo entre series",
  weekly_set_ranges: "Los rangos de series por semana",
  tempo_very_slow_seconds: "El límite de lentitud por repetición",
  frequency_is_distribution: "Cómo tratamos la frecuencia",
  bia_individual_error: "El margen de error de la bioimpedancia",
};

/** Nombre legible de una constante de `formula_versions`, si lo tiene. */
export function formulaLabel(key: string): string | null {
  return FORMULA_LABELS[key] ?? null;
}
