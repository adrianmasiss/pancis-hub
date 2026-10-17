import { describe, expect, it } from "vitest";
import { filterByRelevance, significantTokens } from "./relevance";
import type { NormalizedFood } from "./types";

const food = (
  name: string,
  extra: Partial<NormalizedFood> = {},
): NormalizedFood =>
  ({
    source: "usda",
    externalId: name,
    name,
    externalName: name,
    brand: null,
    barcode: null,
    imageUrl: null,
    foodGroup: "otro",
    cookedState: null,
    per100g: {
      calories: 100,
      proteinG: 1,
      carbohydrateG: 1,
      fatG: 1,
      fiberG: 1,
    },
    sugarG: null,
    sodiumMg: null,
    sourceUpdatedAt: null,
    portions: [],
    aliases: [],
    ...extra,
  }) as NormalizedFood;

describe("significantTokens", () => {
  it("descarta palabras vacias y las de menos de tres letras", () => {
    expect(significantTokens("arroz con leche")).toEqual(["arroz", "leche"]);
    expect(significantTokens("olla de carne")).toEqual(["olla", "carne"]);
  });

  it("ignora acentos y mayusculas", () => {
    expect(significantTokens("Plátano MADURO")).toEqual(["platano", "maduro"]);
  });
});

describe("filterByRelevance", () => {
  it("descarta el ruido que solo empareja una palabra", () => {
    // El caso real: USDA devolvia esto para «gallo pinto».
    const resultados = [
      food("PINTO BEANS, PINTO"),
      food("PICO DE GALLO TORTILLA"),
      food("Beans, pinto, immature seeds, frozen"),
    ];
    expect(filterByRelevance("gallo pinto", resultados)).toEqual([]);
  });

  it("conserva lo que empareja todas las palabras", () => {
    const resultados = [food("Gallo pinto casero"), food("PINTO BEANS, PINTO")];
    const salida = filterByRelevance("gallo pinto", resultados);
    expect(salida).toHaveLength(1);
    expect(salida[0]!.name).toBe("Gallo pinto casero");
  });

  it("no estorba a una busqueda de una sola palabra", () => {
    const resultados = [food("Pechuga de pollo"), food("POLLO ADOBADO")];
    expect(filterByRelevance("pollo", resultados)).toHaveLength(2);
  });

  it("empareja contra la marca y los alias, no solo el nombre", () => {
    const resultados = [
      food("Chicken breast, raw", { aliases: ["pechuga de pollo"] }),
    ];
    expect(filterByRelevance("pollo", resultados)).toHaveLength(1);
  });

  it("no filtra cuando la busqueda no deja nada significativo", () => {
    const resultados = [food("Arroz blanco"), food("Frijol negro")];
    // Sin criterio no se puede juzgar: vaciar la lista seria peor.
    expect(filterByRelevance("de la", resultados)).toHaveLength(2);
  });
});
