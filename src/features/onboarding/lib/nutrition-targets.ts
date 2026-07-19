/**
 * Calculo inicial de objetivos nutricionales (docs/DECISIONS.md).
 *
 * Funciones puras y testeables. Los resultados son ESTIMACIONES
 * editables: la UI debe presentarlos siempre como tales, nunca como
 * mediciones exactas ni prescripciones.
 */

export type BiologicalSex = "masculino" | "femenino";
export type ActivityLevel = "sedentario" | "ligero" | "moderado" | "alto";
export type PrimaryGoal =
  "recomposicion" | "perdida_grasa" | "ganancia_muscular" | "mantenimiento";

export type BmrInput = {
  biologicalSex: BiologicalSex;
  weightKg: number;
  heightCm: number;
  ageYears: number;
};

export type TargetsInput = BmrInput & {
  activityLevel: ActivityLevel;
  primaryGoal: PrimaryGoal;
};

export type NutritionTargets = {
  calories: number;
  proteinG: number;
  carbohydrateG: number;
  fatG: number;
  fiberG: number;
  waterMl: number;
};

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  alto: 1.725,
};

/**
 * Ajustes moderados por objetivo. Deficits agresivos quedan fuera por
 * principio de producto (progreso sostenible, sin metodos extremos).
 */
const GOAL_ADJUSTMENTS: Record<PrimaryGoal, number> = {
  perdida_grasa: 0.85,
  recomposicion: 0.95,
  mantenimiento: 1,
  ganancia_muscular: 1.1,
};

const PROTEIN_G_PER_KG = 1.8;
const MIN_FAT_G_PER_KG = 0.8;
const FIBER_G_PER_1000_KCAL = 14;
const WATER_ML_PER_KG = 35;
/** Piso de seguridad: nunca por debajo de BMR x 1.1. */
const SAFETY_FLOOR_FACTOR = 1.1;

export function calculateAge(
  birthDate: Date,
  today: Date = new Date(),
): number {
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }
  return age;
}

/** Mifflin-St Jeor: la formula con mejor evidencia sin datos de composicion. */
export function calculateBmr(input: BmrInput): number {
  const base = 10 * input.weightKg + 6.25 * input.heightCm - 5 * input.ageYears;
  return Math.round(base + (input.biologicalSex === "masculino" ? 5 : -161));
}

export function calculateTdee(
  bmr: number,
  activityLevel: ActivityLevel,
): number {
  return Math.round(bmr * ACTIVITY_FACTORS[activityLevel]);
}

export function calculateInitialTargets(input: TargetsInput): NutritionTargets {
  const bmr = calculateBmr(input);
  const tdee = calculateTdee(bmr, input.activityLevel);

  const adjusted = tdee * GOAL_ADJUSTMENTS[input.primaryGoal];
  const floor = bmr * SAFETY_FLOOR_FACTOR;
  const calories = Math.round(Math.max(adjusted, floor));

  const proteinG = Math.round(input.weightKg * PROTEIN_G_PER_KG);
  const fatG = Math.round(input.weightKg * MIN_FAT_G_PER_KG);
  const remainingKcal = calories - proteinG * 4 - fatG * 9;
  const carbohydrateG = Math.max(0, Math.round(remainingKcal / 4));

  const fiberG = Math.round((calories / 1000) * FIBER_G_PER_1000_KCAL);
  const waterMl = Math.round(input.weightKg * WATER_ML_PER_KG);

  return { calories, proteinG, carbohydrateG, fatG, fiberG, waterMl };
}
