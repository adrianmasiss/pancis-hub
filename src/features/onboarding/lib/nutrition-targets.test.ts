import { describe, expect, it } from "vitest";
import {
  calculateAge,
  calculateBmr,
  calculateInitialTargets,
  calculateTdee,
  DEFAULT_FORMULAS,
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
    ["ligero", 1780 * 1.4],
    ["moderado", 1780 * 1.6],
    ["alto", 1780 * 1.75],
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

  /**
   * Derivado, no fijado a mano: los factores viven en formula_versions y
   * cambian cuando la evidencia lo justifica (NUT-002 ya los redondeo). Una
   * prueba con el numero escrito a pelo se rompe en cada revision sin aportar
   * nada, porque lo que se quiere comprobar es el AJUSTE, no el TDEE.
   */
  const TDEE = calculateTdee(calculateBmr(base), base.activityLevel);

  it("recomposicion aplica -5 % sobre el TDEE", () => {
    const targets = calculateInitialTargets({
      ...base,
      primaryGoal: "recomposicion",
    });
    expect(targets.calories).toBe(
      Math.round(TDEE * DEFAULT_FORMULAS.goalAdjustments.recomposicion),
    );
  });

  it("perdida de grasa aplica -15 %", () => {
    const targets = calculateInitialTargets({
      ...base,
      primaryGoal: "perdida_grasa",
    });
    expect(targets.calories).toBe(
      Math.round(TDEE * DEFAULT_FORMULAS.goalAdjustments.perdida_grasa),
    );
  });

  it("ganancia muscular aplica +10 %", () => {
    const targets = calculateInitialTargets({
      ...base,
      primaryGoal: "ganancia_muscular",
    });
    expect(targets.calories).toBe(
      Math.round(TDEE * DEFAULT_FORMULAS.goalAdjustments.ganancia_muscular),
    );
  });

  it("mantenimiento no ajusta el TDEE", () => {
    const targets = calculateInitialTargets({
      ...base,
      primaryGoal: "mantenimiento",
    });
    expect(targets.calories).toBe(TDEE);
  });

  it("proteina segun el objetivo y grasa minima 0.8 g/kg", () => {
    const targets = calculateInitialTargets({
      ...base,
      primaryGoal: "recomposicion",
    });
    // NUT-003: recomposicion va de 1.8 a 2.2 g/kg; el objetivo es el punto
    // medio, 2.0. Antes era un 1.8 fijo para todos los objetivos.
    expect(targets.proteinG).toBe(160);
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

describe("formulas inyectables (D-002)", () => {
  const base = {
    biologicalSex: "masculino",
    weightKg: 80,
    heightCm: 180,
    ageYears: 30,
    activityLevel: "moderado",
    primaryGoal: "mantenimiento",
  } as const;

  it("sin formulas usa el respaldo", () => {
    expect(calculateInitialTargets(base)).toEqual(
      calculateInitialTargets(base, DEFAULT_FORMULAS),
    );
  });

  it("una formula distinta cambia el resultado", () => {
    const conMasProteina = calculateInitialTargets(base, {
      ...DEFAULT_FORMULAS,
      proteinRanges: {
        ...DEFAULT_FORMULAS.proteinRanges,
        mantenimiento: { min: 2.2, max: 2.2 },
      },
    });

    expect(conMasProteina.proteinG).toBe(176);
    // Mantenimiento por defecto: punto medio de 1.6 a 2.0 = 1.8 g/kg.
    expect(calculateInitialTargets(base).proteinG).toBe(144);
  });

  it("el factor de actividad inyectado manda sobre el respaldo", () => {
    const sedentarizado = calculateInitialTargets(base, {
      ...DEFAULT_FORMULAS,
      activityFactors: { ...DEFAULT_FORMULAS.activityFactors, moderado: 1.2 },
    });

    expect(sedentarizado.calories).toBeLessThan(
      calculateInitialTargets(base).calories,
    );
  });

  it("el piso de seguridad se marca cuando se aplica", () => {
    // Un objetivo agresivo sobre alguien pequeno cae por debajo del piso.
    const conPiso = calculateInitialTargets(
      {
        biologicalSex: "femenino",
        weightKg: 50,
        heightCm: 155,
        ageYears: 30,
        activityLevel: "sedentario",
        primaryGoal: "perdida_grasa",
      },
      { ...DEFAULT_FORMULAS, goalAdjustments: { ...DEFAULT_FORMULAS.goalAdjustments, perdida_grasa: 0.5 } },
    );

    expect(conPiso.safetyFloorApplied).toBe(true);
    // Y sin forzarlo, no se marca.
    expect(calculateInitialTargets(base).safetyFloorApplied).toBe(false);
  });
});

describe("NUT-003 · proteina por objetivo", () => {
  const base = {
    biologicalSex: "masculino",
    weightKg: 80,
    heightCm: 180,
    ageYears: 30,
    activityLevel: "moderado",
  } as const;

  it("el deficit pide mas proteina que el mantenimiento", () => {
    const deficit = calculateInitialTargets({
      ...base,
      primaryGoal: "perdida_grasa",
    });
    const manten = calculateInitialTargets({
      ...base,
      primaryGoal: "mantenimiento",
    });

    // Helms 2014: en deficit se sube para conservar masa magra.
    expect(deficit.proteinG).toBeGreaterThan(manten.proteinG);
  });

  it("el objetivo es el punto medio del rango, y el rango viaja", () => {
    const targets = calculateInitialTargets({
      ...base,
      primaryGoal: "perdida_grasa",
    });

    // 1.8 a 2.4 g/kg sobre 80 kg
    expect(targets.proteinRangeG).toEqual({ min: 144, max: 192 });
    expect(targets.proteinG).toBe(168);
  });

  it("advierte cuando calcular sobre peso total sobreestima", () => {
    const conSobrepeso = calculateInitialTargets({
      ...base,
      weightKg: 110,
      heightCm: 170,
      primaryGoal: "perdida_grasa",
    });

    expect(conSobrepeso.proteinMayBeOverestimated).toBe(true);
    // Y no se corrige inventando un peso objetivo: solo se avisa.
    expect(conSobrepeso.proteinG).toBe(Math.round(110 * 2.1));
  });

  it("no advierte en un indice de masa corporal normal", () => {
    expect(
      calculateInitialTargets({ ...base, primaryGoal: "perdida_grasa" })
        .proteinMayBeOverestimated,
    ).toBe(false);
  });
});

describe("NUT-004 · el deficit se juzga por ritmo semanal", () => {
  const base = {
    biologicalSex: "femenino",
    weightKg: 65,
    heightCm: 165,
    ageYears: 30,
    activityLevel: "moderado",
  } as const;

  it("mantenimiento no implica cambio de peso", () => {
    const targets = calculateInitialTargets({
      ...base,
      primaryGoal: "mantenimiento",
    });

    expect(targets.weeklyRatePercent).toBeNull();
    expect(targets.rateOutsideRecommendedBand).toBe(false);
  });

  /**
   * HALLAZGO, no un fallo de la prueba: en una mujer de 65 kg el deficit del
   * 15 % produce 0.46 %/semana, por DEBAJO de la banda recomendada. Es
   * exactamente lo que sostiene NUT-004: un multiplicador fijo produce tasas
   * distintas segun el tamano de la persona, y en las mas pequenas se queda
   * corto. La comprobacion existe para que eso deje de pasar inadvertido.
   */
  it("detecta que el 15 % se queda corto en una persona pequena", () => {
    const targets = calculateInitialTargets({
      ...base,
      primaryGoal: "perdida_grasa",
    });

    expect(targets.weeklyRatePercent).toBeCloseTo(0.46, 2);
    expect(targets.rateOutsideRecommendedBand).toBe(true);
  });

  /**
   * Y en una persona mucho mas grande sale casi lo mismo: 0.45 %. El ritmo es
   * practicamente independiente del tamano porque el gasto escala con el
   * peso, y el denominador tambien.
   *
   * O sea que el problema del multiplicador del 15 % no es que produzca tasas
   * distintas segun el tamano, como suponia NUT-004: es que produce una tasa
   * CONSTANTE y esa constante cae por debajo de la banda recomendada para
   * todo el mundo. El arreglo no es recalibrar el multiplicador sino derivar
   * el deficit de la tasa, que es lo que pide el claim.
   */
  it("y en una persona mas grande sale casi la misma tasa, tambien corta", () => {
    const targets = calculateInitialTargets({
      biologicalSex: "masculino",
      weightKg: 95,
      heightCm: 183,
      ageYears: 30,
      activityLevel: "moderado",
      primaryGoal: "perdida_grasa",
    });

    expect(targets.weeklyRatePercent).toBeCloseTo(0.45, 2);
    expect(targets.rateOutsideRecommendedBand).toBe(true);
  });

  /**
   * Un multiplicador de 0.6 daria 1315 kcal, pero el piso lo sube a 1507 y el
   * ritmo resultante vuelve a la banda. Es la guarda funcionando: se conserva
   * la prueba para que se note si algun dia deja de hacerlo.
   */
  it("el piso frena un deficit agresivo antes de que se dispare el ritmo", () => {
    const targets = calculateInitialTargets(
      { ...base, primaryGoal: "perdida_grasa" },
      {
        ...DEFAULT_FORMULAS,
        goalAdjustments: {
          ...DEFAULT_FORMULAS.goalAdjustments,
          perdida_grasa: 0.6,
        },
      },
    );

    expect(targets.safetyFloorApplied).toBe(true);
    expect(targets.weeklyRatePercent!).toBeLessThanOrEqual(1);
  });

  it("sin piso, el mismo deficit agresivo si se sale de la banda", () => {
    const targets = calculateInitialTargets(
      { ...base, primaryGoal: "perdida_grasa" },
      {
        ...DEFAULT_FORMULAS,
        safetyFloorFactor: 0,
        goalAdjustments: {
          ...DEFAULT_FORMULAS.goalAdjustments,
          perdida_grasa: 0.6,
        },
      },
    );

    expect(targets.rateOutsideRecommendedBand).toBe(true);
    expect(targets.weeklyRatePercent!).toBeGreaterThan(1);
  });
});
