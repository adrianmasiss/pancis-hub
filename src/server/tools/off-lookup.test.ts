import { describe, expect, it } from "vitest";
import type { NormalizedFood } from "@/lib/food-providers/types";
import { pickOffMatch } from "./off-lookup";

function food(
  code: string,
  name: string,
  per100g: Partial<NormalizedFood["per100g"]> = {},
  extra: Partial<NormalizedFood> = {},
): NormalizedFood {
  return {
    source: "openfoodfacts",
    externalId: code,
    externalName: name,
    name,
    brand: "Pozuelo",
    barcode: code,
    imageUrl: null,
    foodGroup: "carbohidrato",
    cookedState: null,
    per100g: {
      calories: 488,
      proteinG: 5,
      carbohydrateG: 67.5,
      fatG: 22.5,
      fiberG: 2.5,
      ...per100g,
    },
    sugarG: 30,
    sodiumMg: 275,
    sourceUpdatedAt: null,
    portions: [],
    aliases: [],
    ...extra,
  };
}

describe("pickOffMatch", () => {
  it("una ficha completa y relevante se guarda", () => {
    const result = pickOffMatch("chiky", [food("1", "Chiky")]);
    expect(result).toMatchObject({ kind: "one", food: { externalId: "1" } });
  });

  it("dos fichas que solo difieren por redondeo cuentan como una", () => {
    const result = pickOffMatch("chiky", [
      food("1", "Chiky"),
      food("2", "Chiky", { calories: 490, fatG: 22.9 }),
    ]);
    expect(result.kind).toBe("one");
  });

  it("fichas del mismo producto que no coinciden piden elegir", () => {
    const result = pickOffMatch("chiky", [
      food("1", "Chiky"),
      food("2", "Chiky", { calories: 500, fatG: 26.3 }),
      food("3", "Chiky Vanilla", { calories: 300 }),
    ]);
    expect(result).toMatchObject({ kind: "choices" });
    if (result.kind === "choices")
      expect(result.foods.map((f) => f.externalId)).toEqual(["1", "2"]);
  });

  it("no guarda en automático una ficha con huecos", () => {
    const result = pickOffMatch("chiky", [
      food("1", "Chiky", {}, { missingNutrients: ["fiberG"] }),
    ]);
    expect(result.kind).toBe("none");
  });

  it("sin fibra publicada solo pasa si casi no tiene carbohidratos", () => {
    const leche = food(
      "1",
      "Leche",
      { calories: 50, proteinG: 3.2, carbohydrateG: 4.8, fatG: 2, fiberG: 0 },
      { missingNutrients: ["fiberG"] },
    );
    expect(pickOffMatch("leche", [leche]).kind).toBe("one");
  });

  it("acepta una ficha cuyo nombre esta dentro de lo pedido", () => {
    const result = pickOffMatch("galletas chiky", [
      food("1", "Chiky", {}, { brand: null }),
      food("2", "Chiky Vanilla", { calories: 300 }, { brand: null }),
    ]);
    expect(result).toMatchObject({ kind: "one", food: { externalId: "1" } });
  });

  it("no confunde la marca que se pidio con otra", () => {
    const maria = food(
      "1",
      "Maria",
      { calories: 447, proteinG: 9.7, carbohydrateG: 70, fatG: 14, fiberG: 3 },
      { brand: "Marilan" },
    );
    expect(pickOffMatch("galletas maria pozuelo", [maria]).kind).toBe("none");
    expect(pickOffMatch("galletas maria marilan", [maria]).kind).toBe("one");
  });

  it("descarta una ficha cuyas calorias no cuadran con sus macros", () => {
    expect(
      pickOffMatch("chiky", [food("1", "Chiky", { calories: 150 })]).kind,
    ).toBe("none");
  });

  it("un snack seco con calorias de porcion no se guarda como 100 g", () => {
    const porcion = food("1", "Galletas Maria", {
      calories: 90,
      proteinG: 1,
      carbohydrateG: 16,
      fatG: 2.5,
      fiberG: 1,
    });
    expect(pickOffMatch("galletas maria", [porcion]).kind).toBe("none");
  });

  it("lo que no empareja con la búsqueda no cuenta", () => {
    expect(pickOffMatch("choco ququi", [food("1", "Chiky")]).kind).toBe("none");
  });

  it("por 100 ml y por 100 g nunca son la misma ficha", () => {
    const result = pickOffMatch("leche", [
      food("1", "Leche", {}, { nutritionBasis: "100ml" }),
      food("2", "Leche"),
    ]);
    expect(result.kind).toBe("choices");
  });
});
