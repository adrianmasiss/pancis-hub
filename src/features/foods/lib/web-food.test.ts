import { describe, expect, it } from "vitest";
import { prepareWebFood, type WebFoodReading } from "./web-food";

const reading: WebFoodReading = {
  name: "Galleta de prueba",
  brand: "Marca",
  market: "Costa Rica",
  foodGroup: "carbohidrato",
  identityClear: true,
  conflicts: [],
  basis: "serving_g",
  amount: 34,
  portionLabel: "1 paquete",
  calories: 162,
  proteinG: 2,
  carbohydrateG: 23,
  fatG: 7,
  fiberG: 1,
  sugarG: null,
  sodiumMg: null,
  evidence:
    "Por paquete de 34 g: 162 kcal, proteína 2 g, carbohidratos 23 g, grasa 7 g, fibra 1 g.",
  sourceIndices: [0],
  notes: [],
};
const sources = [{ title: "Etiqueta", url: "https://example.com/galleta" }];

describe("importación nutricional desde web", () => {
  it("convierte la porción a 100 g y conserva los desconocidos", () => {
    const result = prepareWebFood(reading, reading.evidence, sources);
    expect(result.status).toBe("ready");
    if (result.status !== "ready") return;
    expect(result.values.calories).toBeCloseTo(476.5, 1);
    expect(result.values.sugarG).toBeNull();
    expect(result.portion).toEqual({ label: "1 paquete", grams: 34 });
  });
  it.each(["proteinG", "carbohydrateG", "fatG", "fiberG"] as const)(
    "no inventa %s si falta",
    (key) => {
      expect(
        prepareWebFood({ ...reading, [key]: null }, reading.evidence, sources)
          .status,
      ).toBe("incomplete");
    },
  );
  it("bloquea una equivalencia de galletas contradictoria", () => {
    expect(
      prepareWebFood(
        { ...reading, conflicts: ["6 galletas = 34 g o 204 g"] },
        reading.evidence,
        sources,
      ).status,
    ).toBe("incomplete");
  });
  it("no acepta citas inventadas ni un extracto ajeno al informe", () => {
    expect(
      prepareWebFood(
        { ...reading, sourceIndices: [3] },
        reading.evidence,
        sources,
      ).status,
    ).toBe("incomplete");
    expect(prepareWebFood(reading, "No encontré datos", sources).status).toBe(
      "incomplete",
    );
    expect(
      prepareWebFood(reading, reading.evidence, [
        { title: "Mala", url: "javascript:alert(1)" },
      ]).status,
    ).toBe("incomplete");
  });
  it("no importa una coincidencia ambigua ni de otro país", () => {
    expect(
      prepareWebFood(
        { ...reading, identityClear: false },
        reading.evidence,
        sources,
      ).status,
    ).toBe("incomplete");
    expect(
      prepareWebFood(
        { ...reading, market: "Estados Unidos" },
        reading.evidence,
        sources,
      ).status,
    ).toBe("incomplete");
  });
  it("no permite que la extracción añada un valor ausente del extracto", () => {
    expect(
      prepareWebFood({ ...reading, proteinG: 5 }, reading.evidence, sources)
        .status,
    ).toBe("incomplete");
  });
  it("no confunde mililitros con gramos", () => {
    const result = prepareWebFood(
      { ...reading, basis: "per100ml", amount: 100 },
      reading.evidence,
      sources,
    );
    expect(result.status).toBe("ready");
    if (result.status === "ready") {
      expect(result.nutritionBasis).toBe("100ml");
      expect(result.portion).toBeNull();
    }
  });
  it("una tabla citada por 100 ml no se guarda como 100 g", () => {
    const evidence =
      "Por 100 ml: 50 kcal, proteína 3.2 g, carbohidratos 4.8 g, grasa 2 g, fibra 0 g.";
    const leche = {
      ...reading,
      name: "Leche semidescremada",
      basis: "per100g" as const,
      amount: 100,
      portionLabel: null,
      calories: 50,
      proteinG: 3.2,
      carbohydrateG: 4.8,
      fatG: 2,
      fiberG: 0,
      evidence,
    };
    const result = prepareWebFood(leche, evidence, sources);
    expect(result.status).toBe("ready");
    if (result.status === "ready") expect(result.nutritionBasis).toBe("100ml");

    // Una bebida "por 100 g" sin que la cita diga la base: no se adivina.
    const sinBase =
      "50 kcal, proteína 3.2 g, carbohidratos 4.8 g, grasa 2 g, fibra 0 g.";
    expect(
      prepareWebFood({ ...leche, evidence: sinBase }, sinBase, sources).status,
    ).toBe("incomplete");
  });
  it("una porción en mililitros sin su peso no se convierte", () => {
    const evidence =
      "Por porción de 250 ml: 125 kcal, proteína 8 g, carbohidratos 12 g, grasa 5 g, fibra 0 g.";
    const result = prepareWebFood(
      {
        ...reading,
        amount: 250,
        calories: 125,
        proteinG: 8,
        carbohydrateG: 12,
        fatG: 5,
        fiberG: 0,
        evidence,
      },
      evidence,
      sources,
    );
    expect(result.status).toBe("incomplete");
  });
  it("rechaza porciones nulas y valores imposibles", () => {
    expect(
      prepareWebFood({ ...reading, amount: 0 }, reading.evidence, sources)
        .status,
    ).toBe("incomplete");
    expect(
      prepareWebFood({ ...reading, proteinG: 150 }, reading.evidence, sources)
        .status,
    ).toBe("incomplete");
  });
});
