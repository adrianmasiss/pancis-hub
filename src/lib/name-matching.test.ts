import { describe, expect, it } from "vitest";
import {
  nameSimilarity,
  normalizeName,
  pickBestMatch,
  significantTokens,
  singularize,
} from "@/lib/name-matching";

/** Catalogo real que provoco los duplicados en produccion. */
const catalog = [
  { id: "1", name: "Clara de huevo" },
  { id: "2", name: "Huevo entero" },
  { id: "3", name: "Atun en agua" },
  { id: "4", name: "Arroz blanco" },
  { id: "5", name: "Pechuga de pollo" },
  { id: "6", name: "Frijoles negros" },
];

describe("normalizeName", () => {
  it("quita acentos, mayusculas y puntuacion", () => {
    expect(normalizeName("Atún, en agua")).toBe("atun en agua");
  });
});

describe("singularize", () => {
  it("pasa a singular los plurales comunes", () => {
    expect(singularize("claras")).toBe("clara");
    expect(singularize("huevos")).toBe("huevo");
    expect(singularize("frijoles")).toBe("frijol");
  });

  it("no destroza palabras cortas ni ya singulares", () => {
    expect(singularize("pan")).toBe("pan");
    expect(singularize("arroz")).toBe("arroz");
  });
});

describe("significantTokens", () => {
  it("descarta las palabras sin valor discriminante", () => {
    expect(significantTokens("Clara de huevo")).toEqual(["clara", "huevo"]);
  });
});

describe("nameSimilarity", () => {
  it("da 1 a nombres equivalentes salvo plural y acentos", () => {
    expect(nameSimilarity("Claras de huevo", "Clara de huevo")).toBe(1);
    expect(nameSimilarity("atún en agua", "Atun en agua")).toBe(1);
  });

  it("no confunde alimentos que solo comparten una palabra", () => {
    // "Huevo" aparece en ambos, pero no son el mismo alimento.
    expect(
      nameSimilarity("Clara de huevo", "Huevo entero"),
    ).toBeLessThan(0.5);
  });

  it("da 0 cuando no comparten nada", () => {
    expect(nameSimilarity("Arroz blanco", "Pechuga de pollo")).toBe(0);
  });
});

describe("pickBestMatch", () => {
  // Estos tres casos son exactamente los duplicados que apareceron en
  // produccion al importar una dieta con IA.
  it("empareja plurales con la entrada del catalogo", () => {
    const match = pickBestMatch("Claras de huevo", catalog);
    expect(match?.candidate.name).toBe("Clara de huevo");
  });

  it("empareja ignorando acentos", () => {
    const match = pickBestMatch("atún en agua", catalog);
    expect(match?.candidate.name).toBe("Atun en agua");
  });

  it("empareja plurales de una sola palabra", () => {
    const match = pickBestMatch("Huevos enteros", catalog);
    expect(match?.candidate.name).toBe("Huevo entero");
  });

  it("no inventa una coincidencia cuando el alimento no esta", () => {
    // Preferible no sugerir nada a sugerir el alimento equivocado: una
    // sugerencia mala se registra sin que el usuario lo note.
    expect(pickBestMatch("Galleta Salma", catalog)).toBeNull();
    expect(pickBestMatch("Suplemento de proteina", catalog)).toBeNull();
  });

  it("no empareja descripciones de varios alimentos", () => {
    expect(pickBestMatch("Chile, cebolla y espinaca", catalog)).toBeNull();
  });

  it("ante empate prefiere el nombre mas corto y generico", () => {
    const match = pickBestMatch("arroz blanco", [
      { id: "a", name: "Arroz blanco cocido con verduras salteadas" },
      { id: "b", name: "Arroz blanco" },
    ]);
    expect(match?.candidate.id).toBe("b");
  });

  it("respeta un umbral mas exigente si se le pide", () => {
    expect(pickBestMatch("Frijol", catalog, 0.99)).toBeNull();
  });
});
