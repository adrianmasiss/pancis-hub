/**
 * Disponibilidad energetica (claim NUT-008).
 *
 * El piso de seguridad anterior comparaba las calorias contra el metabolismo
 * basal, y eso NO protege de comer demasiado poco: el constructo que usa la
 * literatura resta el gasto del ejercicio.
 *
 *   disponibilidad = (ingesta - gasto del ejercicio) / masa libre de grasa
 *
 * Un piso sobre el metabolismo basal da luz verde justo a quien mas entrena,
 * que es exactamente al reves de lo que deberia. Ver
 * `docs/investigacion/claims/NUT-008-piso-de-seguridad.md`.
 *
 * FUENTE de los umbrales: Sims ST et al. International society of sports
 * nutrition position stand: nutritional concerns of the female athlete.
 * J Int Soc Sports Nutr. 2023. PMID 37221858 (acceso abierto, CC BY-NC).
 *
 * DOS LIMITACIONES QUE HAY QUE ARRASTRAR A LA INTERFAZ:
 * 1. El propio documento aclara que son modelos conceptuales derivados de
 *    estudios de laboratorio, no guias establecidas.
 * 2. Estan descritos EN MUJERES. Trasladarlos a hombres es una extrapolacion
 *    razonable pero no demostrada aqui.
 */

/** kcal por kg de masa libre de grasa y dia. */
export const EA_THRESHOLDS = {
  /** En este valor y por debajo se describen efectos hormonales en dias. */
  low: 30,
  /** Umbral de funcion fisiologica y mantenimiento del peso. */
  optimal: 45,
} as const;

export type EnergyAvailabilityStatus = "baja" | "reducida" | "adecuada";

export type EnergyAvailabilityInput = {
  /** Objetivo calorico diario. */
  caloriesTarget: number;
  /** Gasto medio diario atribuible al ejercicio, en kcal. */
  exerciseKcalPerDay: number;
  /** Masa libre de grasa en kg. Medida, nunca inferida. */
  fatFreeMassKg: number;
};

export type EnergyAvailabilityResult = {
  /** kcal por kg de masa libre de grasa y dia, redondeado a 1 decimal. */
  value: number;
  status: EnergyAvailabilityStatus;
  /** Calorias que harian falta para alcanzar el umbral bajo. 0 si ya se supera. */
  deficitToLowKcal: number;
  /** Calorias que harian falta para alcanzar el umbral optimo. */
  deficitToOptimalKcal: number;
};

const round1 = (value: number) => Math.round(value * 10) / 10;

export function classifyEnergyAvailability(
  value: number,
): EnergyAvailabilityStatus {
  if (value <= EA_THRESHOLDS.low) return "baja";
  if (value < EA_THRESHOLDS.optimal) return "reducida";
  return "adecuada";
}

/**
 * Calcula la disponibilidad energetica. Devuelve null cuando falta un dato
 * medido: **no se estima la masa libre de grasa a partir del peso**, porque
 * seria inventar la variable que da sentido al calculo.
 */
export function calculateEnergyAvailability(
  input: EnergyAvailabilityInput,
): EnergyAvailabilityResult | null {
  const { caloriesTarget, exerciseKcalPerDay, fatFreeMassKg } = input;
  if (!(fatFreeMassKg > 0)) return null;
  if (!(caloriesTarget > 0)) return null;
  if (exerciseKcalPerDay < 0) return null;

  const available = caloriesTarget - exerciseKcalPerDay;
  const value = available / fatFreeMassKg;

  const kcalFor = (threshold: number) =>
    Math.max(0, Math.round(threshold * fatFreeMassKg + exerciseKcalPerDay - caloriesTarget));

  return {
    value: round1(value),
    status: classifyEnergyAvailability(value),
    deficitToLowKcal: kcalFor(EA_THRESHOLDS.low),
    deficitToOptimalKcal: kcalFor(EA_THRESHOLDS.optimal),
  };
}

/**
 * Calorias minimas para no caer por debajo del umbral bajo, dado el gasto de
 * ejercicio y la masa libre de grasa. Es el piso correcto, el que si descuenta
 * el entrenamiento.
 */
export function minimumCaloriesForEnergyAvailability(
  fatFreeMassKg: number,
  exerciseKcalPerDay: number,
  threshold: number = EA_THRESHOLDS.low,
): number | null {
  if (!(fatFreeMassKg > 0) || exerciseKcalPerDay < 0) return null;
  return Math.round(threshold * fatFreeMassKg + exerciseKcalPerDay);
}
