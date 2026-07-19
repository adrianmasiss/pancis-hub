import { describe, expect, it } from "vitest";
import { remainingMacros, scaleMacros, sumMacros } from "./macros";

const avena = {
  calories: 389,
  proteinG: 16.9,
  carbohydrateG: 66,
  fatG: 6.9,
  fiberG: 10.6,
};

describe("scaleMacros", () => {
  it("escala por 100 g exactos sin cambio", () => {
    expect(scaleMacros(avena, 100)).toEqual(avena);
  });

  it("escala a 60 g con redondeo a 1 decimal", () => {
    const result = scaleMacros(avena, 60);
    expect(result.calories).toBe(233.4);
    expect(result.proteinG).toBe(10.1);
    expect(result.carbohydrateG).toBe(39.6);
    expect(result.fatG).toBe(4.1);
    expect(result.fiberG).toBe(6.4);
  });

  it("cantidad cero da macros en cero", () => {
    const result = scaleMacros(avena, 0);
    expect(result.calories).toBe(0);
    expect(result.proteinG).toBe(0);
  });
});

describe("sumMacros", () => {
  it("suma multiples items y redondea calorias a entero", () => {
    const total = sumMacros([
      {
        calories: 233.4,
        proteinG: 10.1,
        carbohydrateG: 39.6,
        fatG: 4.1,
        fiberG: 6.4,
      },
      {
        calories: 106.8,
        proteinG: 1.3,
        carbohydrateG: 27.6,
        fatG: 0.4,
        fiberG: 3.1,
      },
    ]);
    expect(total.calories).toBe(340);
    expect(total.proteinG).toBe(11.4);
    expect(total.carbohydrateG).toBe(67.2);
  });

  it("lista vacia da cero", () => {
    expect(sumMacros([]).calories).toBe(0);
  });
});

describe("remainingMacros", () => {
  const target = {
    calories: 2091,
    proteinG: 126,
    carbohydrateG: 271,
    fatG: 56,
    fiberG: 29,
  };

  it("resta lo consumido", () => {
    const remaining = remainingMacros(target, {
      calories: 340,
      proteinG: 11.4,
      carbohydrateG: 67.2,
      fatG: 4.5,
      fiberG: 9.5,
    });
    expect(remaining.calories).toBe(1751);
    expect(remaining.proteinG).toBe(114.6);
  });

  it("permite valores negativos cuando se excede el objetivo", () => {
    const remaining = remainingMacros(target, {
      calories: 2500,
      proteinG: 130,
      carbohydrateG: 300,
      fatG: 60,
      fiberG: 30,
    });
    expect(remaining.calories).toBe(-409);
    expect(remaining.proteinG).toBe(-4);
  });
});
