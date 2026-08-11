/**
 * Cuando los objetivos guardados dejan de corresponder al cuerpo de hoy.
 *
 * `calculateInitialTargets` solo corria en el onboarding: quien bajaba seis
 * kilos seguia comiendo contra el objetivo de su peso de partida y la app
 * nunca se lo decia. Era la mitad viva del defecto D-002.
 *
 * Aqui no se decide NADA por el usuario: esto solo compara el objetivo activo
 * con el que saldria del calculo hoy y responde si vale la pena avisar. El
 * cambio lo confirma la persona, como toda escritura que propone la app.
 *
 * Funcion pura y sin dependencias de servidor: se prueba sin base de datos.
 */

import type { NutritionTargets } from "@/features/onboarding/lib/nutrition-targets";

/** Las seis cifras que se guardan en `nutrition_targets`. */
export type TargetSnapshot = Pick<
  NutritionTargets,
  "calories" | "proteinG" | "carbohydrateG" | "fatG" | "fiberG" | "waterMl"
>;

export type TargetChange = {
  from: number;
  to: number;
  /** Positivo si el objetivo nuevo es mayor. */
  delta: number;
};

export type TargetDrift = {
  /**
   * true cuando la diferencia supera el ruido del propio metodo y merece
   * proponerse. Si es false, la interfaz no debe mostrar nada: avisar por 20
   * kcal seria pedirle al usuario que confirme una diferencia que la formula
   * no puede distinguir de su propio error.
   */
  material: boolean;
  calories: TargetChange;
  proteinG: TargetChange;
  carbohydrateG: TargetChange;
  fatG: TargetChange;
  fiberG: TargetChange;
  waterMl: TargetChange;
};

/**
 * Umbrales de aviso.
 *
 * NO son un hallazgo cientifico y no llevan claim detras: son una convencion
 * de producto, del mismo tipo que los umbrales de ruido del seguimiento
 * corporal. La razon de que existan es que Mifflin-St Jeor tiene un error
 * estandar cercano al 10 % sobre el gasto real; proponer un ajuste menor que
 * ese error seria vender precision que el metodo no tiene.
 *
 * Se pide EL PORCENTAJE Y un minimo absoluto porque en objetivos bajos un 3 %
 * son 45 kcal, que ya no se distinguen de la variacion normal de un dia.
 */
export const DRIFT_CALORIE_PERCENT = 0.03;
export const DRIFT_CALORIE_MIN_KCAL = 60;
export const DRIFT_PROTEIN_G = 5;

const change = (from: number, to: number): TargetChange => ({
  from,
  to,
  delta: to - from,
});

export function evaluateTargetDrift(
  active: TargetSnapshot,
  proposed: TargetSnapshot,
): TargetDrift {
  const calories = change(active.calories, proposed.calories);
  const proteinG = change(active.proteinG, proposed.proteinG);

  const calorieThreshold = Math.max(
    DRIFT_CALORIE_MIN_KCAL,
    active.calories * DRIFT_CALORIE_PERCENT,
  );

  // La proteina entra por su cuenta: cambiar de objetivo (perder grasa a
  // ganar musculo) mueve su rango g/kg sin mover apenas las calorias, y ese
  // caso importa aunque el total apenas se inmute.
  const material =
    Math.abs(calories.delta) >= calorieThreshold ||
    Math.abs(proteinG.delta) >= DRIFT_PROTEIN_G;

  return {
    material,
    calories,
    proteinG,
    carbohydrateG: change(active.carbohydrateG, proposed.carbohydrateG),
    fatG: change(active.fatG, proposed.fatG),
    fiberG: change(active.fiberG, proposed.fiberG),
    waterMl: change(active.waterMl, proposed.waterMl),
  };
}

/**
 * Datos con los que se calculo un objetivo, para poder explicar el aviso.
 *
 * Viajan a `nutrition_targets.calculation_inputs`. Sin esto el aviso solo
 * puede decir "tu objetivo cambio"; con esto dice "se calculo con 82 kg y hoy
 * pesas 76", que es la diferencia entre una notificacion y una razon.
 */
export type TargetInputsSnapshot = {
  weightKg: number;
  heightCm: number;
  ageYears: number;
  activityLevel: string;
  primaryGoal: string;
};

/** Qué cambió respecto de los datos con los que se calculó el objetivo. */
export type InputChange = {
  field: "weightKg" | "ageYears" | "activityLevel" | "primaryGoal" | "heightCm";
  from: string | number;
  to: string | number;
};

export function diffTargetInputs(
  previous: TargetInputsSnapshot | null,
  current: TargetInputsSnapshot,
): InputChange[] {
  // Los objetivos anteriores a esta funcion no guardaron sus entradas. No es
  // un error: simplemente no se puede explicar el porque de esos, y el aviso
  // se queda con las cifras.
  if (!previous) return [];

  const changes: InputChange[] = [];
  for (const field of [
    "weightKg",
    "heightCm",
    "ageYears",
    "activityLevel",
    "primaryGoal",
  ] as const) {
    if (previous[field] !== current[field]) {
      changes.push({ field, from: previous[field], to: current[field] });
    }
  }
  return changes;
}
