import { describe, expect, it } from "vitest";
import {
  anchorMacroForGroup,
  compatibilityScore,
  equivalentQuantity,
  matchesRestriction,
  profileForGroup,
  nutritionalDistance,
  rankAlternatives,
  formatHouseholdEquivalence,
  satietyIndex,
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

describe("formatHouseholdEquivalence", () => {
  it("retorna null si no hay porciones o cantidad es cero", () => {
    expect(
      formatHouseholdEquivalence(0, [{ label: "1 unidad", grams: 50 }]),
    ).toBeNull();
    expect(formatHouseholdEquivalence(150, [])).toBeNull();
  });

  it("calcula equivalencias enteras de porciones", () => {
    const portions = [{ label: "1 unidad", grams: 50 }];
    expect(formatHouseholdEquivalence(150, portions)).toBe("3 unidades");
    expect(formatHouseholdEquivalence(50, portions)).toBe("1 unidad");
  });

  it("calcula equivalencias con punto decimal si no es entero", () => {
    const portions = [{ label: "1 unidad", grams: 50 }];
    expect(formatHouseholdEquivalence(75, portions)).toBe("1.5 unidades");
  });

  it("pluraliza correctamente unidades en español", () => {
    expect(
      formatHouseholdEquivalence(64, [{ label: "1 rebanada", grams: 32 }]),
    ).toBe("2 rebanadas");
    expect(
      formatHouseholdEquivalence(316, [{ label: "1 taza", grams: 158 }]),
    ).toBe("2 tazas");
    expect(
      formatHouseholdEquivalence(28, [{ label: "1 cucharada", grams: 14 }]),
    ).toBe("2 cucharadas");
    expect(
      formatHouseholdEquivalence(340, [{ label: "1 envase", grams: 170 }]),
    ).toBe("2 envases");
  });

  it("maneja etiquetas no numericas con formato de multiplicador", () => {
    const portions = [{ label: "Envase familiar", grams: 500 }];
    expect(formatHouseholdEquivalence(1000, portions)).toBe(
      "2 x Envase familiar",
    );
  });
});

describe("compatibilityScore", () => {
  const source = {
    calories: 350,
    proteinG: 31,
    carbohydrateG: 2,
    fatG: 24,
    fiberG: 0,
  };

  it("da 10 cuando la alternativa aporta exactamente lo mismo", () => {
    const score = compatibilityScore(source, source, {
      sameGroup: true,
      sameCookedState: true,
    });
    expect(score.overall).toBe(10);
    expect(score.proteinG).toBe(10);
  });

  it("baja la nota del macro que mas se desvia", () => {
    // Pancakes frente a huevos: mas carbohidratos, menos proteina.
    const score = compatibilityScore(
      source,
      { calories: 455, proteinG: 14, carbohydrateG: 33, fatG: 19, fiberG: 1 },
      { sameGroup: false, sameCookedState: true },
    );
    expect(score.proteinG).toBeLessThan(5);
    expect(score.carbohydrateG).toBe(0);
    expect(score.overall).toBeLessThan(6);
  });

  it("nunca sale del rango 0-10", () => {
    const score = compatibilityScore(
      source,
      { calories: 0, proteinG: 0, carbohydrateG: 0, fatG: 0, fiberG: 0 },
      { sameGroup: false, sameCookedState: false },
    );
    expect(score.overall).toBeGreaterThanOrEqual(0);
    expect(score.overall).toBeLessThanOrEqual(10);
  });

  it("no castiga diferencias minimas en cantidades irrelevantes", () => {
    // 1 g contra 2 g de fibra es el 100 % de diferencia relativa, pero no
    // cambia nada del plan: el piso por macro lo absorbe.
    const score = compatibilityScore(
      { ...source, fiberG: 1 },
      { ...source, fiberG: 2 },
    );
    expect(score.fiberG).toBeGreaterThanOrEqual(5);
  });

  it("penaliza cambiar de grupo alimentario", () => {
    const same = compatibilityScore(source, source, {
      sameGroup: true,
      sameCookedState: true,
    });
    const cross = compatibilityScore(source, source, {
      sameGroup: false,
      sameCookedState: true,
    });
    expect(cross.overall).toBeLessThan(same.overall);
  });

  it("penaliza mezclar crudo con cocido", () => {
    const same = compatibilityScore(source, source, { sameCookedState: true });
    const mixed = compatibilityScore(source, source, {
      sameCookedState: false,
    });
    expect(mixed.overall).toBeLessThan(same.overall);
  });
});

describe("filtros de sustitucion", () => {
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
  const lentejas: EquivalenceFood = {
    id: "lentejas",
    name: "Lentejas cocidas",
    foodGroup: "proteina",
    cookedState: "cocido",
    per100g: {
      calories: 116,
      proteinG: 9,
      carbohydrateG: 20,
      fatG: 0.4,
      fiberG: 8,
    },
  };

  const rank = (filter: Parameters<typeof rankAlternatives>[0]["filter"]) =>
    rankAlternatives({
      source: pollo,
      sourceQuantityG: 100,
      candidates: [atun, lentejas],
      favoriteIds: new Set(["atun"]),
      recentIds: new Set<string>(),
      restrictions: [],
      filter,
    });

  it("por defecto ordena por parecido al original", () => {
    const results = rank("similar");
    expect(results[0]!.food.id).toBe("atun");
  });

  it("menos_calorias descarta lo que aporta mas y ordena por las mas bajas", () => {
    const results = rank("menos_calorias");
    expect(results.length).toBeGreaterThan(0);
    for (const result of results) {
      expect(result.macros.calories).toBeLessThan(165);
    }
  });

  it("mas_saciedad compara por caloria, no en total", () => {
    // Las lentejas aportan mas saciedad absoluta, pero necesitan 400 kcal
    // frente a las 165 del pollo: por caloria rinden menos y quedan fuera.
    // El atun aporta saciedad parecida con menos energia.
    const results = rank("mas_saciedad");
    expect(results.map((r) => r.food.id)).toEqual(["atun"]);
  });

  it("satietyIndex pondera proteina y fibra", () => {
    const soloProteina = satietyIndex({
      calories: 100,
      proteinG: 10,
      carbohydrateG: 0,
      fatG: 0,
      fiberG: 0,
    });
    const conFibra = satietyIndex({
      calories: 100,
      proteinG: 10,
      carbohydrateG: 0,
      fatG: 0,
      fiberG: 5,
    });
    expect(conFibra).toBeGreaterThan(soloProteina);
  });

  it("disponibles cae a favoritos o recientes cuando no hay despensa", () => {
    const results = rank("disponibles");
    expect(results).toHaveLength(1);
    expect(results[0]!.food.id).toBe("atun");
  });

  it("disponibles usa la despensa cuando el usuario tiene alimentos en ella", () => {
    // Con despensa manda lo que hay en casa: aunque el atun es favorito, si
    // solo las lentejas estan en la despensa, es lo unico disponible.
    const results = rankAlternatives({
      source: pollo,
      sourceQuantityG: 100,
      candidates: [atun, lentejas],
      favoriteIds: new Set(["atun"]),
      recentIds: new Set<string>(),
      pantryIds: new Set(["lentejas"]),
      restrictions: [],
      filter: "disponibles",
    });
    expect(results.map((r) => r.food.id)).toEqual(["lentejas"]);
    expect(results[0]!.isAvailable).toBe(true);
  });

  it("marca isAvailable en cualquier filtro segun la despensa", () => {
    const results = rankAlternatives({
      source: pollo,
      sourceQuantityG: 100,
      candidates: [atun, lentejas],
      favoriteIds: new Set<string>(),
      recentIds: new Set<string>(),
      pantryIds: new Set(["atun"]),
      restrictions: [],
      filter: "similar",
    });
    const atunResult = results.find((r) => r.food.id === "atun");
    const lentejasResult = results.find((r) => r.food.id === "lentejas");
    expect(atunResult?.isAvailable).toBe(true);
    expect(lentejasResult?.isAvailable).toBe(false);
  });

  it("mas_proteina compara densidad, no totales", () => {
    // La cantidad sugerida ya iguala la proteina, asi que comparar totales
    // daria "mejora" por puro redondeo. Lo que cuenta es la proteina por
    // caloria: el atun (26 g / 116 kcal) supera al pollo (31 g / 165 kcal).
    const results = rank("mas_proteina");
    expect(results.map((r) => r.food.id)).toEqual(["atun"]);
  });

  it("no ofrece alternativas que empeoren el criterio elegido", () => {
    // Nada supera la densidad proteica del atun.
    const results = rankAlternatives({
      source: atun,
      sourceQuantityG: 100,
      candidates: [lentejas],
      favoriteIds: new Set<string>(),
      recentIds: new Set<string>(),
      restrictions: [],
      filter: "mas_proteina",
    });
    expect(results).toHaveLength(0);
  });

  it("mantiene la compatibilidad visible aunque cambie el orden", () => {
    for (const result of rank("mas_saciedad")) {
      expect(result.compatibility.overall).toBeGreaterThanOrEqual(0);
      expect(result.compatibility.overall).toBeLessThanOrEqual(10);
    }
  });
});

describe("EQ-002 · pesos segun el papel del alimento", () => {
  const arroz = {
    id: "arroz",
    name: "Arroz blanco cocido",
    foodGroup: "carbohidrato" as const,
    cookedState: "cocido" as const,
    per100g: {
      calories: 130,
      proteinG: 2.7,
      carbohydrateG: 28,
      fatG: 0.3,
      fiberG: 0.4,
    },
  };
  const pollo = {
    id: "pollo",
    name: "Pechuga de pollo",
    foodGroup: "proteina" as const,
    cookedState: "cocido" as const,
    per100g: {
      calories: 165,
      proteinG: 31,
      carbohydrateG: 0,
      fatG: 3.6,
      fiberG: 0,
    },
  };

  it("el rol del alimento decide el perfil", () => {
    expect(profileForGroup("carbohidrato")).toBe("carbohidrato");
    expect(profileForGroup("proteina")).toBe("proteico");
    expect(profileForGroup("lacteo")).toBe("comida");
  });

  /**
   * El defecto que EQ-002 corrige: con un perfil unico, sustituir arroz
   * ponderaba la proteina mas que los carbohidratos, justo al reves del papel
   * que ese alimento cumple en la comida.
   */
  it("al sustituir un carbohidrato pesan mas los carbohidratos", () => {
    const source = { calories: 130, proteinG: 2.7, carbohydrateG: 28, fatG: 0.3, fiberG: 0.4 };
    // Candidato que clava los carbohidratos pero falla la proteina.
    const cuadraCarbos = { calories: 130, proteinG: 8, carbohydrateG: 28, fatG: 0.3, fiberG: 0.4 };
    // Candidato que clava la proteina pero falla los carbohidratos.
    const cuadraProteina = { calories: 130, proteinG: 2.7, carbohydrateG: 14, fatG: 0.3, fiberG: 0.4 };

    const conPerfilCarbo = compatibilityScore(source, cuadraCarbos, {
      profile: "carbohidrato",
    });
    const conPerfilCarboMalo = compatibilityScore(source, cuadraProteina, {
      profile: "carbohidrato",
    });

    expect(conPerfilCarbo.overall).toBeGreaterThan(conPerfilCarboMalo.overall);
  });

  it("el ranking usa el perfil del alimento original", () => {
    const [mejor] = rankAlternatives({
      source: arroz,
      sourceQuantityG: 150,
      candidates: [pollo],
      favoriteIds: new Set(),
      recentIds: new Set(),
      restrictions: [],
    });

    expect(mejor).toBeDefined();
    // No se comprueba el numero, sino que el motor no rompe al cambiar de
    // perfil y sigue devolviendo una compatibilidad en rango.
    expect(mejor!.compatibility.overall).toBeGreaterThanOrEqual(0);
    expect(mejor!.compatibility.overall).toBeLessThanOrEqual(10);
  });
});
