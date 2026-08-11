import { describe, expect, it } from "vitest";
import {
  DRIFT_CALORIE_MIN_KCAL,
  diffTargetInputs,
  evaluateTargetDrift,
  type TargetInputsSnapshot,
  type TargetSnapshot,
} from "@/features/onboarding/lib/target-drift";

const base: TargetSnapshot = {
  calories: 2400,
  proteinG: 160,
  carbohydrateG: 250,
  fatG: 70,
  fiberG: 34,
  waterMl: 2800,
};

const withCalories = (calories: number): TargetSnapshot => ({
  ...base,
  calories,
});

describe("evaluateTargetDrift", () => {
  it("no propone nada cuando las cifras coinciden", () => {
    expect(evaluateTargetDrift(base, { ...base }).material).toBe(false);
  });

  it("ignora diferencias por debajo del ruido del metodo", () => {
    // 2400 * 3 % = 72 kcal, que manda sobre el minimo absoluto de 60.
    expect(evaluateTargetDrift(base, withCalories(2460)).material).toBe(false);
  });

  it("avisa cuando la diferencia calorica supera el umbral", () => {
    const drift = evaluateTargetDrift(base, withCalories(2300));
    expect(drift.material).toBe(true);
    expect(drift.calories).toEqual({ from: 2400, to: 2300, delta: -100 });
  });

  it("usa el minimo absoluto en objetivos bajos", () => {
    // 1200 * 3 % = 36 kcal: sin el piso de 60 avisaria por una diferencia
    // menor que la variacion normal de un dia.
    const low = { ...base, calories: 1200 };
    expect(evaluateTargetDrift(low, { ...low, calories: 1245 }).material).toBe(
      false,
    );
    expect(
      evaluateTargetDrift(low, {
        ...low,
        calories: 1200 + DRIFT_CALORIE_MIN_KCAL,
      }).material,
    ).toBe(true);
  });

  it("avisa por la proteina aunque las calorias no se muevan", () => {
    // Es el caso de cambiar de objetivo: el rango g/kg salta y el total no.
    const drift = evaluateTargetDrift(base, { ...base, proteinG: 152 });
    expect(drift.material).toBe(true);
    expect(drift.proteinG.delta).toBe(-8);
  });

  it("devuelve el resto de macros aunque no disparen el aviso", () => {
    const drift = evaluateTargetDrift(base, {
      ...base,
      calories: 2200,
      waterMl: 2600,
    });
    expect(drift.waterMl).toEqual({ from: 2800, to: 2600, delta: -200 });
    expect(drift.fiberG.delta).toBe(0);
  });
});

describe("diffTargetInputs", () => {
  const previous: TargetInputsSnapshot = {
    weightKg: 82,
    heightCm: 178,
    ageYears: 31,
    activityLevel: "moderado",
    primaryGoal: "perdida_grasa",
  };

  it("no inventa explicaciones para objetivos sin entradas guardadas", () => {
    expect(diffTargetInputs(null, previous)).toEqual([]);
  });

  it("lista solo lo que cambio", () => {
    const changes = diffTargetInputs(previous, {
      ...previous,
      weightKg: 76,
      primaryGoal: "recomposicion",
    });
    expect(changes).toEqual([
      { field: "weightKg", from: 82, to: 76 },
      { field: "primaryGoal", from: "perdida_grasa", to: "recomposicion" },
    ]);
  });

  it("no reporta nada cuando las entradas son las mismas", () => {
    expect(diffTargetInputs(previous, { ...previous })).toEqual([]);
  });
});
