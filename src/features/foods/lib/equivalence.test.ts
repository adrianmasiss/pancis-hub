import { describe, expect, it } from "vitest";
import {
  anchorMacroForGroup,
  equivalentQuantity,
  matchesRestriction,
  nutritionalDistance,
  rankAlternatives,
  type EquivalenceFood,
} from "./equivalence";

const arrozCocido: EquivalenceFood = {
  id: "arroz",
  name: "Arroz blanco",
  foodGroup: "carbohidrato",
  cookedState: "cocido",
  per100g: {
    calories: 130,
    proteinG: 2.7,
    carbohydrateG: 28,
    fatG: 0.3,
    fiberG: 0.4,
  },
};

const papaCocida: EquivalenceFood = {
  id: "papa",
  name: "Papa",
  foodGroup: "carbohidrato",
  cookedState: "cocido",
  per100g: {
    calories: 87,
    proteinG: 1.9,
    carbohydrateG: 20,
    fatG: 0.1,
    fiberG: 1.8,
  },
};

const pollo: EquivalenceFood = {
  id: "pollo",
  name: "Pechuga de pollo",
  foodGroup: "proteina",
  cookedState: "cocido",
  per100g: {
    calories: 165,
    proteinG: 31,
    carbohydrateG: 0,
    fatG: 3.6,
    fiberG: 0,
  },
};

const atun: EquivalenceFood = {
  id: "atun",
  name: "Atun en agua",
  foodGroup: "proteina",
  cookedState: "cocido",
  per100g: {
    calories: 116,
    proteinG: 26,
    carbohydrateG: 0,
    fatG: 1,
    fiberG: 0,
  },
};

const mani: EquivalenceFood = {
  id: "mani",
  name: "Mani tostado",
  foodGroup: "grasa",
  cookedState: null,
  per100g: {
    calories: 567,
    proteinG: 26,
    carbohydrateG: 16,
    fatG: 49,
    fiberG: 8.5,
  },
};

describe("anchorMacroForGroup", () => {
  it("asigna el macro que define el rol del alimento", () => {
    expect(anchorMacroForGroup("carbohidrato")).toBe("carbohydrateG");
    expect(anchorMacroForGroup("proteina")).toBe("proteinG");
    expect(anchorMacroForGroup("grasa")).toBe("fatG");
    expect(anchorMacroForGroup("verdura")).toBe("calories");
  });
});

describe("equivalentQuantity", () => {
  it("iguala el macro ancla: 200 g de arroz -> papa por carbohidratos", () => {
    // 200 g arroz = 56 g carbs; papa aporta 20 g/100 g -> 280 g
    expect(equivalentQuantity(arrozCocido, 200, papaCocida)).toBe(280);
  });

  it("iguala proteina entre fuentes proteicas", () => {
    // 150 g pollo = 46.5 g proteina; atun 26 g/100 g -> 178.8 -> 180 g
    expect(equivalentQuantity(pollo, 150, atun)).toBe(180);
  });

  it("cae a calorias si la alternativa no aporta el macro ancla", () => {
    // Fuente carbohidrato -> pollo no tiene carbs: iguala 260 kcal -> ~157.6 -> 160 g
    expect(equivalentQuantity(arrozCocido, 200, pollo)).toBe(160);
  });

  it("redondea a multiplos de 5 y respeta el minimo", () => {
    expect(equivalentQuantity(arrozCocido, 10, papaCocida) % 5).toBe(0);
    expect(
      equivalentQuantity(arrozCocido, 1, papaCocida),
    ).toBeGreaterThanOrEqual(5);
  });
});

describe("nutritionalDistance", () => {
  const macros = {
    calories: 100,
    proteinG: 10,
    carbohydrateG: 20,
    fatG: 5,
    fiberG: 2,
  };

  it("es cero contra si mismo", () => {
    expect(nutritionalDistance(macros, macros)).toBe(0);
  });

  it("es simetrica", () => {
    const other = { ...macros, proteinG: 15, calories: 120 };
    expect(nutritionalDistance(macros, other)).toBe(
      nutritionalDistance(other, macros),
    );
  });

  it("pondera la proteina mas que las calorias por unidad", () => {
    const proteinDiff = nutritionalDistance(macros, {
      ...macros,
      proteinG: 11,
    });
    const calorieDiff = nutritionalDistance(macros, {
      ...macros,
      calories: 101,
    });
    expect(proteinDiff).toBeGreaterThan(calorieDiff);
  });
});

describe("matchesRestriction", () => {
  it("excluye por coincidencia de nombre sin importar mayusculas", () => {
    expect(matchesRestriction("Mani tostado", ["mani"])).toBe(true);
    expect(matchesRestriction("Arroz blanco", ["mani"])).toBe(false);
  });

  it("ignora restricciones vacias o de una letra", () => {
    expect(matchesRestriction("Arroz", ["", "a"])).toBe(false);
  });
});

describe("rankAlternatives", () => {
  const base = {
    source: arrozCocido,
    sourceQuantityG: 200,
    candidates: [papaCocida, pollo, atun, mani],
    favoriteIds: new Set<string>(),
    recentIds: new Set<string>(),
    restrictions: [] as string[],
  };

  it("prefiere alternativas del mismo grupo", () => {
    const results = rankAlternatives(base);
    expect(results[0]?.food.id).toBe("papa");
    expect(results[0]?.sameGroup).toBe(true);
  });

  it("excluye el propio alimento y las alergias declaradas", () => {
    const results = rankAlternatives({ ...base, restrictions: ["mani"] });
    expect(results.some((r) => r.food.id === "arroz")).toBe(false);
    expect(results.some((r) => r.food.id === "mani")).toBe(false);
  });

  it("los favoritos mejoran su posicion ante un empate cercano", () => {
    // pollo y atun son del mismo grupo distinto al origen; favorito
    // desempata a favor del marcado.
    const without = rankAlternatives(base);
    const with_ = rankAlternatives({
      ...base,
      favoriteIds: new Set(["atun"]),
    });
    const posWithout = without.findIndex((r) => r.food.id === "atun");
    const posWith = with_.findIndex((r) => r.food.id === "atun");
    expect(posWith).toBeLessThanOrEqual(posWithout);
  });

  it("reporta la diferencia de macros de la porcion sugerida", () => {
    const results = rankAlternatives(base);
    const papa = results.find((r) => r.food.id === "papa")!;
    // 280 g papa: 56 g carbs -> diff carbs = 0
    expect(papa.diff.carbohydrateG).toBe(0);
    // 280 g papa = 243.6 kcal vs 260 kcal del arroz -> diff negativo
    expect(papa.diff.calories).toBeLessThan(0);
  });

  it("respeta maxResults y ordena por score ascendente", () => {
    const results = rankAlternatives({ ...base, maxResults: 2 });
    expect(results).toHaveLength(2);
    expect(results[0]!.score).toBeLessThanOrEqual(results[1]!.score);
  });
});
