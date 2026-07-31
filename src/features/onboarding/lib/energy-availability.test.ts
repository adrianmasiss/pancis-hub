import { describe, expect, it } from "vitest";
import {
  EA_THRESHOLDS,
  calculateEnergyAvailability,
  classifyEnergyAvailability,
  minimumCaloriesForEnergyAvailability,
} from "./energy-availability";

describe("classifyEnergyAvailability", () => {
  it("30 o menos es baja: el umbral es inclusivo", () => {
    expect(classifyEnergyAvailability(29.9)).toBe("baja");
    expect(classifyEnergyAvailability(30)).toBe("baja");
  });

  it("entre 30 y 45 es reducida", () => {
    expect(classifyEnergyAvailability(30.1)).toBe("reducida");
    expect(classifyEnergyAvailability(44.9)).toBe("reducida");
  });

  it("45 o mas es adecuada", () => {
    expect(classifyEnergyAvailability(45)).toBe("adecuada");
    expect(classifyEnergyAvailability(60)).toBe("adecuada");
  });
});

describe("calculateEnergyAvailability", () => {
  /**
   * El caso del claim NUT-008: mujer de 60 kg, metabolismo basal 1350, con el
   * piso antiguo (1350 x 1.1 = 1485) y una sesion de 400 kcal.
   * El piso VIEJO daba luz verde a esta situacion.
   */
  it("reproduce el caso que el piso anterior dejaba pasar", () => {
    const result = calculateEnergyAvailability({
      caloriesTarget: 1485,
      exerciseKcalPerDay: 400,
      fatFreeMassKg: 45,
    });

    expect(result).not.toBeNull();
    expect(result!.value).toBeCloseTo(24.1, 1);
    expect(result!.status).toBe("baja");
    // Por debajo del umbral de 30, que es donde se describen efectos en dias.
    expect(result!.value).toBeLessThan(EA_THRESHOLDS.low);
  });

  it("sin entrenar, esas mismas calorias no serian un problema", () => {
    const result = calculateEnergyAvailability({
      caloriesTarget: 1485,
      exerciseKcalPerDay: 0,
      fatFreeMassKg: 45,
    });

    expect(result!.value).toBeCloseTo(33, 1);
    expect(result!.status).toBe("reducida");
  });

  /**
   * Con las MISMAS calorias, entrenar mas cruza el umbral de riesgo. Es el
   * nucleo del defecto: el piso anterior no veia esta diferencia porque no
   * restaba el ejercicio.
   */
  it("las mismas calorias cruzan el umbral segun cuanto se entrene", () => {
    const base = { caloriesTarget: 2000, fatFreeMassKg: 50 };
    const poco = calculateEnergyAvailability({
      ...base,
      exerciseKcalPerDay: 100,
    })!;
    const mucho = calculateEnergyAvailability({
      ...base,
      exerciseKcalPerDay: 550,
    })!;

    expect(poco.value).toBe(38);
    expect(poco.status).toBe("reducida");

    expect(mucho.value).toBe(29);
    expect(mucho.status).toBe("baja");
  });

  it("dice cuantas calorias faltan para cada umbral", () => {
    const result = calculateEnergyAvailability({
      caloriesTarget: 1485,
      exerciseKcalPerDay: 400,
      fatFreeMassKg: 45,
    })!;

    // 30 x 45 + 400 = 1750 -> faltan 265
    expect(result.deficitToLowKcal).toBe(265);
    // 45 x 45 + 400 = 2425 -> faltan 940
    expect(result.deficitToOptimalKcal).toBe(940);
  });

  it("no reporta deficit cuando ya se supera el umbral", () => {
    const result = calculateEnergyAvailability({
      caloriesTarget: 3000,
      exerciseKcalPerDay: 400,
      fatFreeMassKg: 50,
    })!;

    expect(result.status).toBe("adecuada");
    expect(result.deficitToLowKcal).toBe(0);
    expect(result.deficitToOptimalKcal).toBe(0);
  });

  it("devuelve null sin masa libre de grasa medida, en vez de estimarla", () => {
    expect(
      calculateEnergyAvailability({
        caloriesTarget: 2000,
        exerciseKcalPerDay: 300,
        fatFreeMassKg: 0,
      }),
    ).toBeNull();
  });

  it("devuelve null con entradas invalidas", () => {
    expect(
      calculateEnergyAvailability({
        caloriesTarget: 0,
        exerciseKcalPerDay: 300,
        fatFreeMassKg: 50,
      }),
    ).toBeNull();
    expect(
      calculateEnergyAvailability({
        caloriesTarget: 2000,
        exerciseKcalPerDay: -1,
        fatFreeMassKg: 50,
      }),
    ).toBeNull();
  });
});

describe("minimumCaloriesForEnergyAvailability", () => {
  it("el piso correcto SI descuenta el ejercicio", () => {
    const sinEntrenar = minimumCaloriesForEnergyAvailability(45, 0);
    const entrenando = minimumCaloriesForEnergyAvailability(45, 400);

    expect(sinEntrenar).toBe(1350);
    expect(entrenando).toBe(1750);
    // La diferencia es exactamente el gasto de la sesion, que es el punto.
    expect(entrenando! - sinEntrenar!).toBe(400);
  });

  it("acepta el umbral optimo", () => {
    expect(
      minimumCaloriesForEnergyAvailability(45, 400, EA_THRESHOLDS.optimal),
    ).toBe(2425);
  });

  it("devuelve null sin masa libre de grasa", () => {
    expect(minimumCaloriesForEnergyAvailability(0, 400)).toBeNull();
  });
});
