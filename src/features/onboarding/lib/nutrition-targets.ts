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

/** Rango con extremos, para dejar de comunicar exactitud que no existe. */
export type Range = { min: number; max: number };

export type NutritionTargets = {
  calories: number;
  proteinG: number;
  /**
   * Rango de proteina para este objetivo. El valor unico de `proteinG` es el
   * punto medio: la literatura sostiene rangos, no cifras (NUT-003).
   */
  proteinRangeG: Range;
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
  /**
   * Ritmo semanal de cambio de peso que implica el objetivo, en % del peso.
   * NUT-004: el anclaje correcto es la tasa, no el multiplicador. null cuando
   * el objetivo es mantenimiento y no hay cambio esperado.
   */
  weeklyRatePercent: number | null;
  /**
   * true si esa tasa cae fuera de la banda de 0.5 a 1 %/semana, que es donde
   * mejor se conserva la masa magra segun Helms 2014.
   */
  rateOutsideRecommendedBand: boolean;
  /**
   * true cuando el indice de masa corporal sugiere que calcular la proteina
   * sobre el peso total la sobreestima. Sin composicion corporal no se puede
   * corregir, solo advertir (NUT-003).
   */
  proteinMayBeOverestimated: boolean;
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
  /**
   * Rango de proteina por objetivo, en g/kg de peso corporal (NUT-003).
   * Sustituye al valor unico: la necesidad cambia con el objetivo, el deficit
   * energetico, la edad y el nivel de entrenamiento.
   */
  proteinRanges: Record<PrimaryGoal, Range>;
  minFatGPerKg: number;
  fiberGPer1000Kcal: number;
  waterMlPerKg: number;
  safetyFloorFactor: number;
  /** Banda recomendada de cambio de peso semanal, en % del peso (NUT-004). */
  weeklyRateBandPercent: Range;
  /**
   * Energia por kg de masa corporal, para traducir un deficit diario a un
   * ritmo semanal. Es una APROXIMACION clasica y discutida: se usa solo para
   * COMPROBAR que la tasa cae en la banda, nunca para fijar el objetivo.
   */
  kcalPerKgBodyMass: number;
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
  /**
   * Rangos de NUT-003, completados con la investigacion aportada en /Info.
   * En deficit se sube para conservar masa magra (Helms 2014); en
   * mantenimiento no hace falta tanto (Morton 2018).
   */
  proteinRanges: {
    perdida_grasa: { min: 1.8, max: 2.4 },
    recomposicion: { min: 1.8, max: 2.2 },
    ganancia_muscular: { min: 1.6, max: 2.2 },
    mantenimiento: { min: 1.6, max: 2.0 },
  },
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
  weeklyRateBandPercent: { min: 0.5, max: 1.0 },
  kcalPerKgBodyMass: 7700,
};

/** Indice de masa corporal desde el cual la proteina sobre peso total infla. */
const BMI_PROTEIN_CAVEAT = 30;

const midpoint = (range: Range) => (range.min + range.max) / 2;

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

  // NUT-003: la proteina sale de un rango por objetivo, y el objetivo unico
  // es su punto medio. El rango viaja al resultado para que la UI lo muestre.
  const proteinRange = formulas.proteinRanges[input.primaryGoal];
  const proteinRangeG = {
    min: Math.round(input.weightKg * proteinRange.min),
    max: Math.round(input.weightKg * proteinRange.max),
  };
  const proteinG = Math.round(input.weightKg * midpoint(proteinRange));

  // Sin composicion corporal no se puede corregir el sesgo de calcular sobre
  // peso total, asi que se advierte en vez de inventar un "peso objetivo".
  const bmi = input.weightKg / (input.heightCm / 100) ** 2;
  const proteinMayBeOverestimated = bmi >= BMI_PROTEIN_CAVEAT;

  // NUT-004: el ritmo semanal es el anclaje correcto del deficit. La
  // conversion usa una aproximacion discutida, asi que se emplea solo para
  // COMPROBAR la banda, nunca para fijar las calorias.
  const dailyDelta = calories - tdee;
  const weeklyRatePercent =
    dailyDelta === 0
      ? null
      : Math.abs(
          ((dailyDelta * 7) / formulas.kcalPerKgBodyMass / input.weightKg) * 100,
        );
  const band = formulas.weeklyRateBandPercent;
  const rateOutsideRecommendedBand =
    weeklyRatePercent !== null &&
    (weeklyRatePercent < band.min || weeklyRatePercent > band.max);
  const fatG = Math.round(input.weightKg * formulas.minFatGPerKg);
  const remainingKcal = calories - proteinG * 4 - fatG * 9;
  const carbohydrateG = Math.max(0, Math.round(remainingKcal / 4));

  const fiberG = Math.round((calories / 1000) * formulas.fiberGPer1000Kcal);
  const waterMl = Math.round(input.weightKg * formulas.waterMlPerKg);

  return {
    calories,
    proteinG,
    proteinRangeG,
    carbohydrateG,
    fatG,
    fiberG,
    waterMl,
    safetyFloorApplied,
    weeklyRatePercent:
      weeklyRatePercent === null ? null : Math.round(weeklyRatePercent * 100) / 100,
    rateOutsideRecommendedBand,
    proteinMayBeOverestimated,
  };
}
