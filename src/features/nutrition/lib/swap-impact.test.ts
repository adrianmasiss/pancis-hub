import { describe, expect, it } from "vitest";
import {
  computeSwapImpact,
  equivalentQuantityByCalories,
} from "./swap-impact";

// Pechuga de pollo y avena, por 100 g, tal como estan en el catalogo semilla.
const POLLO = {
  calories: 165,
  proteinG: 31,
  carbohydrateG: 0,
  fatG: 3.6,
  fiberG: 0,
};
const AVENA = {
  calories: 389,
  proteinG: 16.9,
  carbohydrateG: 66.3,
  fatG: 6.9,
  fiberG: 10.6,
};

describe("computeSwapImpact", () => {
  it("calcula el delta entre original y sustituto", () => {
    const impact = computeSwapImpact({
      fromPer100g: POLLO,
      fromQuantityG: 150,
      toPer100g: AVENA,
      toQuantityG: 80,
    });

    // scaleMacros conserva un decimal, asi que 150 g de pollo son 247.5 kcal.
    expect(impact.from.calories).toBeCloseTo(247.5);
    expect(impact.from.proteinG).toBeCloseTo(46.5);

    // 80 g de avena: 311.2 kcal y 13.5 g de proteina.
    expect(impact.to.calories).toBeCloseTo(311.2);
    expect(impact.to.proteinG).toBeCloseTo(13.5);

    // El delta cuadra con lo que se ve en pantalla: 311.2 - 247.5.
    expect(impact.delta.calories).toBeCloseTo(
      impact.to.calories - impact.from.calories,
    );
    expect(impact.delta.proteinG).toBeCloseTo(-33);
    expect(impact.delta.carbohydrateG).toBeCloseTo(53);
  });

  it("da delta cero al sustituir un alimento por si mismo", () => {
    const impact = computeSwapImpact({
      fromPer100g: POLLO,
      fromQuantityG: 120,
      toPer100g: POLLO,
      toQuantityG: 120,
    });
    expect(impact.delta).toEqual({
      calories: 0,
      proteinG: 0,
      carbohydrateG: 0,
      fatG: 0,
      fiberG: 0,
    });
  });
});

describe("equivalentQuantityByCalories", () => {
  it("devuelve la cantidad que iguala las calorias", () => {
    // 150 g de pollo son 247.5 kcal; en avena eso es ~64 g.
    expect(
      equivalentQuantityByCalories({
        fromPer100g: POLLO,
        fromQuantityG: 150,
        toPer100g: AVENA,
      }),
    ).toBe(64);
  });

  it("no divide por cero cuando el sustituto no aporta calorias", () => {
    expect(
      equivalentQuantityByCalories({
        fromPer100g: POLLO,
        fromQuantityG: 150,
        toPer100g: {
          calories: 0,
          proteinG: 0,
          carbohydrateG: 0,
          fatG: 0,
          fiberG: 0,
        },
      }),
    ).toBeNull();
  });
});
