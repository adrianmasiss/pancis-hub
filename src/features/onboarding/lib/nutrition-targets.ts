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
  /**
   * true si el objetivo calculado quedaba por debajo del piso y se subio.
   *
   * Antes esto ocurria en silencio: el usuario nunca se enteraba de que su
   * configuracion era problematica. Ahora se expone para que la interfaz lo
   * diga (claim NUT-008).
   */
  safetyFloorApplied: boolean;
};

/**
 * Constantes del calculo, agrupadas para poder INYECTARLAS.
 *
 * Vivian sueltas en el modulo, que es lo que la fase 2 identifico como el
 * defecto D-002: numeros afirmando cosas sin poder demostrarlas. Ahora la
 * fuente de verdad es la tabla `formula_versions`, con su referencia
 * cientifica detras, y estos valores quedan como respaldo.
 *
 * Se inyectan en vez de leerse aqui porque `calculateInitialTargets` se usa
 * tambien en el cliente, para la vista previa del onboarding. Convertirla en
 * asincrona romperia esa previsualizacion sin ganar nada.
 */
export type NutritionFormulas = {
  activityFactors: Record<ActivityLevel, number>;
  goalAdjustments: Record<PrimaryGoal, number>;
  proteinGPerKg: number;
  minFatGPerKg: number;
  fiberGPer1000Kcal: number;
  waterMlPerKg: number;
  safetyFloorFactor: number;
};

/**
 * Respaldo cuando la base no responde. Que existan no contradice el principio
 * de trazabilidad: la app tiene que seguir calculando si Supabase falla
 * (RF-015), y un objetivo aproximado es mejor que una pantalla vacia.
 *
 * Sus valores y su justificacion viven en docs/investigacion/claims/NUT-*.
 */
export const DEFAULT_FORMULAS: NutritionFormulas = {
  activityFactors: {
    // NUT-002: redondeados. Los escalones de tres decimales eran convencion
    // heredada y aparentaban una precision que el metodo no tiene.
    sedentario: 1.2,
    ligero: 1.4,
    moderado: 1.6,
    alto: 1.75,
  },
  /**
   * Ajustes moderados por objetivo. Deficits agresivos quedan fuera por
   * principio de producto (progreso sostenible, sin metodos extremos).
   */
  goalAdjustments: {
    perdida_grasa: 0.85,
    recomposicion: 0.95,
    mantenimiento: 1,
    ganancia_muscular: 1.1,
  },
  proteinGPerKg: 1.8,
  minFatGPerKg: 0.8,
  fiberGPer1000Kcal: 14,
  waterMlPerKg: 35,
  /**
   * Guarda cruda sobre el metabolismo basal.
   *
   * NO es un piso de seguridad de verdad, y no debe presentarse como tal: no
   * descuenta el gasto del ejercicio, asi que deja pasar situaciones de
   * disponibilidad energetica baja justo en quien mas entrena. El piso
   * correcto vive en `./energy-availability` y necesita masa libre de grasa
   * medida. Ver claim NUT-008.
   */
  safetyFloorFactor: 1.1,
};

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
  formulas: NutritionFormulas = DEFAULT_FORMULAS,
): number {
  return Math.round(bmr * formulas.activityFactors[activityLevel]);
}

export function calculateInitialTargets(
  input: TargetsInput,
  formulas: NutritionFormulas = DEFAULT_FORMULAS,
): NutritionTargets {
  const bmr = calculateBmr(input);
  const tdee = calculateTdee(bmr, input.activityLevel, formulas);

  const adjusted = tdee * formulas.goalAdjustments[input.primaryGoal];
  const floor = bmr * formulas.safetyFloorFactor;
  const safetyFloorApplied = adjusted < floor;
  const calories = Math.round(Math.max(adjusted, floor));

  const proteinG = Math.round(input.weightKg * formulas.proteinGPerKg);
  const fatG = Math.round(input.weightKg * formulas.minFatGPerKg);
  const remainingKcal = calories - proteinG * 4 - fatG * 9;
  const carbohydrateG = Math.max(0, Math.round(remainingKcal / 4));

  const fiberG = Math.round((calories / 1000) * formulas.fiberGPer1000Kcal);
  const waterMl = Math.round(input.weightKg * formulas.waterMlPerKg);

  return {
    calories,
    proteinG,
    carbohydrateG,
    fatG,
    fiberG,
    waterMl,
    safetyFloorApplied,
  };
}
