import { describe, expect, it } from "vitest";
import {
  calculateAge,
  calculateBmr,
  calculateInitialTargets,
  calculateTdee,
} from "./nutrition-targets";

describe("calculateAge", () => {
  it("calcula la edad cumplida", () => {
    expect(calculateAge(new Date("1996-03-15"), new Date("2026-07-19"))).toBe(
      30,
    );
  });

  it("no suma el ano si aun no cumple", () => {
    expect(calculateAge(new Date("1996-12-31"), new Date("2026-07-19"))).toBe(
      29,
    );
  });

  it("maneja el dia exacto del cumpleanos", () => {
    expect(calculateAge(new Date("1996-07-19"), new Date("2026-07-19"))).toBe(
      30,
    );
  });
});

describe("calculateBmr (Mifflin-St Jeor)", () => {
  it("hombre de 80 kg, 180 cm, 30 anos", () => {
    // 10*80 + 6.25*180 - 5*30 + 5 = 1780
    expect(
      calculateBmr({
        biologicalSex: "masculino",
        weightKg: 80,
        heightCm: 180,
        ageYears: 30,
      }),
    ).toBe(1780);
  });

  it("mujer de 70 kg, 165 cm, 30 anos", () => {
    // 10*70 + 6.25*165 - 5*30 - 161 = 1420.25 -> 1420
    expect(
      calculateBmr({
        biologicalSex: "femenino",
        weightKg: 70,
        heightCm: 165,
        ageYears: 30,
      }),
    ).toBe(1420);
  });
});

describe("calculateTdee", () => {
  it.each([
    ["sedentario", 1780 * 1.2],
    ["ligero", 1780 * 1.375],
    ["moderado", 1780 * 1.55],
    ["alto", 1780 * 1.725],
  ] as const)("aplica el factor de %s", (level, expected) => {
    expect(calculateTdee(1780, level)).toBe(Math.round(expected));
  });
});

describe("calculateInitialTargets", () => {
  const base = {
    biologicalSex: "masculino",
    weightKg: 80,
    heightCm: 180,
    ageYears: 30,
    activityLevel: "moderado",
  } as const;

  it("recomposicion aplica -5 % sobre el TDEE", () => {
    const targets = calculateInitialTargets({
      ...base,
      primaryGoal: "recomposicion",
    });
    // TDEE = 2759, -5 % = 2621.05 -> 2621
    expect(targets.calories).toBe(2621);
  });

  it("perdida de grasa aplica -15 %", () => {
    const targets = calculateInitialTargets({
      ...base,
      primaryGoal: "perdida_grasa",
    });
    expect(targets.calories).toBe(Math.round(2759 * 0.85));
  });

  it("ganancia muscular aplica +10 %", () => {
    const targets = calculateInitialTargets({
      ...base,
      primaryGoal: "ganancia_muscular",
    });
    expect(targets.calories).toBe(Math.round(2759 * 1.1));
  });

  it("mantenimiento no ajusta el TDEE", () => {
    const targets = calculateInitialTargets({
      ...base,
      primaryGoal: "mantenimiento",
    });
    expect(targets.calories).toBe(2759);
  });

  it("proteina 1.8 g/kg y grasa minima 0.8 g/kg", () => {
    const targets = calculateInitialTargets({
      ...base,
      primaryGoal: "recomposicion",
    });
    expect(targets.proteinG).toBe(144);
    expect(targets.fatG).toBe(64);
  });

  it("los carbohidratos completan las calorias restantes", () => {
    const targets = calculateInitialTargets({
      ...base,
      primaryGoal: "recomposicion",
    });
    const remaining =
      targets.calories - targets.proteinG * 4 - targets.fatG * 9;
    expect(targets.carbohydrateG).toBe(Math.round(remaining / 4));
  });

  it("fibra 14 g por 1000 kcal y agua 35 ml/kg", () => {
    const targets = calculateInitialTargets({
      ...base,
      primaryGoal: "mantenimiento",
    });
    expect(targets.fiberG).toBe(Math.round((targets.calories / 1000) * 14));
    expect(targets.waterMl).toBe(2800);
  });

  it("nunca baja del piso de seguridad BMR x 1.1", () => {
    // Persona pequena y sedentaria en deficit: el piso debe activarse.
    const targets = calculateInitialTargets({
      biologicalSex: "femenino",
      weightKg: 45,
      heightCm: 150,
      ageYears: 60,
      activityLevel: "sedentario",
      primaryGoal: "perdida_grasa",
    });
    const bmr = calculateBmr({
      biologicalSex: "femenino",
      weightKg: 45,
      heightCm: 150,
      ageYears: 60,
    });
    expect(targets.calories).toBeGreaterThanOrEqual(Math.round(bmr * 1.1));
  });

  it("los carbohidratos nunca son negativos", () => {
    const targets = calculateInitialTargets({
      biologicalSex: "femenino",
      weightKg: 120,
      heightCm: 150,
      ageYears: 70,
      activityLevel: "sedentario",
      primaryGoal: "perdida_grasa",
    });
    expect(targets.carbohydrateG).toBeGreaterThanOrEqual(0);
  });
});
