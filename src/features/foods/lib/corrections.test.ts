import { describe, expect, it } from "vitest";
import {
  applyCorrection,
  applyCorrections,
  hasChanges,
  type CorrectableFood,
  type FoodCorrection,
} from "@/features/foods/lib/corrections";

const food: CorrectableFood = {
  id: "1",
  name: "Yogur griego",
  calories: 97,
  proteinG: 9,
  carbohydrateG: 4,
  fatG: 5,
  fiberG: 0,
  cookedState: null,
};

const emptyCorrection: FoodCorrection = {
  name: null,
  calories: null,
  proteinG: null,
  carbohydrateG: null,
  fatG: null,
  fiberG: null,
  cookedState: null,
  reason: null,
};

describe("applyCorrection", () => {
  it("sin correccion devuelve el alimento intacto", () => {
    const result = applyCorrection(food, null);
    expect(result.calories).toBe(97);
    expect(result.isCorrected).toBe(false);
  });

  it("aplica solo los campos corregidos y hereda el resto", () => {
    const result = applyCorrection(food, {
      ...emptyCorrection,
      calories: 59,
      proteinG: 10,
    });
    expect(result.calories).toBe(59);
    expect(result.proteinG).toBe(10);
    // No corregidos: siguen viniendo del catalogo.
    expect(result.carbohydrateG).toBe(4);
    expect(result.fatG).toBe(5);
    expect(result.name).toBe("Yogur griego");
    expect(result.isCorrected).toBe(true);
  });

  it("permite corregir el nombre", () => {
    const result = applyCorrection(food, {
      ...emptyCorrection,
      name: "Yogur griego 0%",
    });
    expect(result.name).toBe("Yogur griego 0%");
  });

  it("acepta corregir un macro a cero", () => {
    // 0 es un valor legitimo y no debe confundirse con "sin corregir".
    const result = applyCorrection(food, { ...emptyCorrection, fatG: 0 });
    expect(result.fatG).toBe(0);
    expect(result.isCorrected).toBe(true);
  });

  it("null en la correccion significa 'no lo toque', no 'borralo'", () => {
    const cocido: CorrectableFood = { ...food, cookedState: "cocido" };
    const result = applyCorrection(cocido, emptyCorrection);
    expect(result.cookedState).toBe("cocido");
  });

  it("no marca como corregido si los valores coinciden con el catalogo", () => {
    const result = applyCorrection(food, {
      ...emptyCorrection,
      calories: 97,
    });
    expect(result.isCorrected).toBe(false);
  });

  it("nunca modifica el alimento original", () => {
    applyCorrection(food, { ...emptyCorrection, calories: 59 });
    expect(food.calories).toBe(97);
  });
});

describe("hasChanges", () => {
  it("detecta cambios reales y ignora los iguales", () => {
    expect(hasChanges(food, { ...emptyCorrection, proteinG: 10 })).toBe(true);
    expect(hasChanges(food, { ...emptyCorrection, proteinG: 9 })).toBe(false);
    expect(hasChanges(food, emptyCorrection)).toBe(false);
  });
});

describe("applyCorrections", () => {
  it("aplica cada correccion a su alimento", () => {
    const otro: CorrectableFood = { ...food, id: "2", name: "Avena" };
    const corrections = new Map<string, FoodCorrection>([
      ["2", { ...emptyCorrection, calories: 380 }],
    ]);

    const result = applyCorrections([food, otro], corrections);
    expect(result[0]!.isCorrected).toBe(false);
    expect(result[1]!.calories).toBe(380);
    expect(result[1]!.isCorrected).toBe(true);
  });
});
