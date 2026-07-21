import { describe, expect, it } from "vitest";
import {
  deriveAliases,
  inferCookedState,
  inferFoodGroup,
  normalizeText,
} from "@/lib/food-providers/classify";
import { mergeProviderResults, relevanceScore } from "@/lib/food-providers/dedupe";
import { normalizeUsdaFood } from "@/lib/food-providers/usda";
import { normalizeOffProduct } from "@/lib/food-providers/open-food-facts";
import { isPlausibleFood, type NormalizedFood } from "@/lib/food-providers/types";

const baseFood = (overrides: Partial<NormalizedFood> = {}): NormalizedFood => ({
  source: "usda",
  externalId: "1",
  name: "Pollo",
  externalName: "Chicken",
  brand: null,
  barcode: null,
  imageUrl: null,
  foodGroup: "proteina",
  cookedState: null,
  per100g: {
    calories: 165,
    proteinG: 31,
    carbohydrateG: 0,
    fatG: 3.6,
    fiberG: 0,
  },
  sugarG: null,
  sodiumMg: null,
  sourceUpdatedAt: null,
  portions: [],
  aliases: [],
  ...overrides,
});

describe("normalizeText", () => {
  it("quita acentos y normaliza espacios", () => {
    expect(normalizeText("  Plátano   MADURO ")).toBe("platano maduro");
  });
});

describe("inferFoodGroup", () => {
  it("usa palabras clave antes que los macros", () => {
    expect(
      inferFoodGroup("Chicken breast, raw", null, {
        calories: 165,
        proteinG: 31,
        carbohydrateG: 0,
        fatG: 3.6,
        fiberG: 0,
      }),
    ).toBe("proteina");
  });

  it("reconoce nombres en espanol", () => {
    expect(
      inferFoodGroup("Arroz blanco cocido", null, {
        calories: 130,
        proteinG: 2.7,
        carbohydrateG: 28,
        fatG: 0.3,
        fiberG: 0.4,
      }),
    ).toBe("carbohidrato");
  });

  it("cae a los macros cuando el nombre no dice nada", () => {
    expect(
      inferFoodGroup("Producto XYZ", null, {
        calories: 400,
        proteinG: 1,
        carbohydrateG: 5,
        fatG: 42,
        fiberG: 0,
      }),
    ).toBe("grasa");
  });

  // Regresion: la comparacion por subcadena hacia que "res" coincidiera
  // dentro de "preserves" y clasificara Nutella como proteina.
  it("compara palabras completas, no subcadenas", () => {
    const nutellaMacros = {
      calories: 539,
      proteinG: 6.3,
      carbohydrateG: 57.5,
      fatG: 30.9,
      fiberG: 0,
    };
    expect(
      inferFoodGroup("Nutella", "Spreads, Sweet spreads, Preserves", nutellaMacros),
    ).not.toBe("proteina");

    // "papa" no debe capturar "papaya", que es fruta.
    expect(
      inferFoodGroup("Papaya", null, {
        calories: 43,
        proteinG: 0.5,
        carbohydrateG: 11,
        fatG: 0.3,
        fiberG: 1.7,
      }),
    ).toBe("fruta");
  });

  it("declara mixto cuando ningun macro domina", () => {
    expect(
      inferFoodGroup("Producto XYZ", null, {
        calories: 300,
        proteinG: 15,
        carbohydrateG: 30,
        fatG: 12,
        fiberG: 2,
      }),
    ).toBe("mixto");
  });
});

describe("inferCookedState", () => {
  it("detecta crudo y cocido", () => {
    expect(inferCookedState("Rice, white, raw")).toBe("crudo");
    expect(inferCookedState("Arroz blanco cocido")).toBe("cocido");
  });

  it("devuelve null si el nombre es ambiguo o contradictorio", () => {
    expect(inferCookedState("Arroz blanco")).toBeNull();
    // "raw" y "cooked" juntos: no se adivina.
    expect(inferCookedState("Rice, raw, yields cooked")).toBeNull();
  });
});

describe("deriveAliases", () => {
  it("parte los nombres largos de USDA en fragmentos buscables", () => {
    const aliases = deriveAliases(
      "Chicken, broilers or fryers, breast, meat only, raw",
    );
    expect(aliases).toContain("chicken");
    expect(aliases).toContain("breast");
    expect(aliases.length).toBeLessThanOrEqual(6);
  });
});

describe("isPlausibleFood", () => {
  it("rechaza alimentos sin calorias", () => {
    expect(
      isPlausibleFood(baseFood({ per100g: { ...baseFood().per100g, calories: 0 } })),
    ).toBe(false);
  });

  it("rechaza macros que superan los 100 g por 100 g", () => {
    expect(
      isPlausibleFood(
        baseFood({
          per100g: {
            calories: 500,
            proteinG: 60,
            carbohydrateG: 60,
            fatG: 20,
            fiberG: 0,
          },
        }),
      ),
    ).toBe(false);
  });

  it("acepta un alimento normal", () => {
    expect(isPlausibleFood(baseFood())).toBe(true);
  });
});

describe("normalizeUsdaFood", () => {
  const searchShape = {
    fdcId: 171077,
    description: "Chicken, broilers or fryers, breast, meat only, raw",
    publishedDate: "2019-04-01",
    foodCategory: "Poultry Products",
    foodNutrients: [
      { nutrientId: 1008, value: 165 },
      { nutrientId: 1003, value: 31.02 },
      { nutrientId: 1005, value: 0 },
      { nutrientId: 1004, value: 3.57 },
      { nutrientId: 1079, value: 0 },
      { nutrientId: 1093, value: 74 },
    ],
  };

  it("normaliza la forma de /foods/search a valores por 100 g", () => {
    const food = normalizeUsdaFood(searchShape);
    expect(food).not.toBeNull();
    expect(food!.source).toBe("usda");
    expect(food!.externalId).toBe("171077");
    expect(food!.per100g.calories).toBe(165);
    expect(food!.per100g.proteinG).toBe(31);
    expect(food!.foodGroup).toBe("proteina");
    expect(food!.cookedState).toBe("crudo");
    expect(food!.sodiumMg).toBe(74);
  });

  it("normaliza la forma anidada de /food/{id}", () => {
    const food = normalizeUsdaFood({
      fdcId: 171077,
      description: "Chicken breast",
      foodNutrients: [
        { nutrient: { id: 1008 }, amount: 165 },
        { nutrient: { id: 1003 }, amount: 31 },
      ],
      foodPortions: [
        {
          amount: 1,
          gramWeight: 172,
          modifier: "breast",
          measureUnit: { name: "piece" },
        },
      ],
    });
    expect(food!.per100g.calories).toBe(165);
    expect(food!.portions[0]).toEqual({
      label: "1 piece breast",
      grams: 172,
      householdMeasure: "breast",
    });
  });

  it("convierte kilojulios cuando no hay kcal", () => {
    const food = normalizeUsdaFood({
      fdcId: 1,
      description: "Test food",
      foodNutrients: [{ nutrientId: 1062, value: 418.4 }],
    });
    expect(food!.per100g.calories).toBe(100);
  });

  it("descarta respuestas sin energia o sin id", () => {
    expect(
      normalizeUsdaFood({ fdcId: 1, description: "X", foodNutrients: [] }),
    ).toBeNull();
    expect(normalizeUsdaFood({ description: "Sin id" })).toBeNull();
  });
});

describe("normalizeOffProduct", () => {
  const product = {
    code: "7501000111145",
    product_name: "Whole milk",
    product_name_es: "Leche entera",
    brands: "Dos Pinos, Otra",
    categories_es: "Lacteos",
    image_front_url: "https://images.openfoodfacts.org/leche.jpg",
    last_modified_t: 1700000000,
    serving_quantity: 240,
    serving_size: "1 vaso (240 ml)",
    nutriments: {
      "energy-kcal_100g": 61,
      proteins_100g: 3.2,
      carbohydrates_100g: 4.8,
      fat_100g: 3.3,
      fiber_100g: 0,
      sugars_100g: 4.8,
      sodium_100g: 0.043,
    },
  };

  it("prefiere el nombre en espanol y toma la primera marca", () => {
    const food = normalizeOffProduct(product);
    expect(food!.name).toBe("Leche entera");
    expect(food!.externalName).toBe("Whole milk");
    expect(food!.brand).toBe("Dos Pinos");
    expect(food!.foodGroup).toBe("lacteo");
  });

  it("convierte el sodio de gramos a miligramos", () => {
    expect(normalizeOffProduct(product)!.sodiumMg).toBe(43);
  });

  it("deriva el sodio desde la sal cuando falta", () => {
    const food = normalizeOffProduct({
      ...product,
      nutriments: { ...product.nutriments, sodium_100g: undefined, salt_100g: 1.25 },
    });
    expect(food!.sodiumMg).toBe(500);
  });

  it("usa el codigo de barras como identificador externo", () => {
    const food = normalizeOffProduct(product);
    expect(food!.externalId).toBe("7501000111145");
    expect(food!.barcode).toBe("7501000111145");
  });

  it("acepta nutrientes que llegan como texto", () => {
    const food = normalizeOffProduct({
      ...product,
      nutriments: { "energy-kcal_100g": "61", proteins_100g: "3.2" },
    });
    expect(food!.per100g.calories).toBe(61);
    expect(food!.per100g.proteinG).toBe(3.2);
  });

  it("descarta productos sin energia", () => {
    expect(
      normalizeOffProduct({ ...product, nutriments: { proteins_100g: 3 } }),
    ).toBeNull();
  });
});

describe("mergeProviderResults", () => {
  it("deduplica por codigo de barras y conserva la fuente de mayor prioridad", () => {
    const merged = mergeProviderResults(
      [
        baseFood({
          source: "openfoodfacts",
          externalId: "123",
          barcode: "123",
          name: "Leche",
          imageUrl: "https://off/leche.jpg",
        }),
        baseFood({
          source: "usda",
          externalId: "999",
          barcode: "123",
          name: "Leche",
        }),
      ],
      "leche",
    );

    expect(merged).toHaveLength(1);
    expect(merged[0]!.source).toBe("usda");
    // El ganador hereda la imagen que solo tenia el duplicado descartado.
    expect(merged[0]!.imageUrl).toBe("https://off/leche.jpg");
  });

  it("deduplica por nombre y marca cuando no hay codigo de barras", () => {
    const merged = mergeProviderResults(
      [
        baseFood({ source: "usda", externalId: "1", name: "Pollo", brand: "ACME" }),
        baseFood({
          source: "openfoodfacts",
          externalId: "2",
          name: "  pollo ",
          brand: "acme",
        }),
      ],
      "pollo",
    );
    expect(merged).toHaveLength(1);
  });

  // Regresion: la busqueda devolvia "Nutella" tres veces, una por cada
  // presentacion, porque cada envase tiene su propio codigo de barras.
  it("colapsa presentaciones distintas con macros identicos", () => {
    const merged = mergeProviderResults(
      [
        baseFood({
          source: "openfoodfacts",
          externalId: "301762042003",
          barcode: "301762042003",
          name: "Nutella",
          brand: "Ferrero",
        }),
        baseFood({
          source: "openfoodfacts",
          externalId: "301762401070",
          barcode: "301762401070",
          name: "Nutella",
          brand: "Ferrero",
        }),
      ],
      "nutella",
    );
    expect(merged).toHaveLength(1);
  });

  it("no colapsa productos con el mismo nombre pero macros distintos", () => {
    const merged = mergeProviderResults(
      [
        baseFood({ externalId: "1", barcode: "1", name: "Yogur", brand: "X" }),
        baseFood({
          externalId: "2",
          barcode: "2",
          name: "Yogur",
          brand: "X",
          per100g: {
            calories: 60,
            proteinG: 10,
            carbohydrateG: 4,
            fatG: 0.2,
            fiberG: 0,
          },
        }),
      ],
      "yogur",
    );
    expect(merged).toHaveLength(2);
  });

  it("no mezcla alimentos distintos", () => {
    const merged = mergeProviderResults(
      [
        baseFood({ externalId: "1", name: "Pollo" }),
        baseFood({ externalId: "2", name: "Arroz" }),
      ],
      "comida",
    );
    expect(merged).toHaveLength(2);
  });
});

describe("relevanceScore", () => {
  it("premia la coincidencia exacta sobre la parcial", () => {
    const exact = relevanceScore(baseFood({ name: "Pollo" }), "pollo");
    const partial = relevanceScore(
      baseFood({ name: "Pollo asado con especias" }),
      "pollo",
    );
    expect(exact).toBeLessThan(partial);
  });

  // Regresion: con nombres tipo USDA la frase buscada no aparece literal,
  // asi que todos empataban y el orden salia arbitrario.
  it("prefiere el alimento que cubre mas palabras de la busqueda", () => {
    const merged = mergeProviderResults(
      [
        baseFood({ externalId: "1", name: "Chicken, ground, raw" }),
        baseFood({ externalId: "2", name: "Pheasant, breast, meat only, raw" }),
        baseFood({
          externalId: "3",
          name: "Chicken, broilers or fryers, breast, meat only, raw",
        }),
      ],
      "chicken breast raw",
    );
    expect(merged[0]!.externalId).toBe("3");
  });

  it("ordena los resultados mas relevantes primero", () => {
    const merged = mergeProviderResults(
      [
        baseFood({ externalId: "1", name: "Ensalada de pollo con mayonesa" }),
        baseFood({ externalId: "2", name: "Pollo" }),
      ],
      "pollo",
    );
    expect(merged[0]!.name).toBe("Pollo");
  });
});
