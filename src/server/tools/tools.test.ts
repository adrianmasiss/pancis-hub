import { describe, expect, it } from "vitest";
import {
  proposalResult,
  readResult,
  requiresConfirmation,
} from "./types";
import { formatSourcesForPrompt } from "./evidence";
import type { ToolSource } from "./types";

describe("frontera entre lectura y escritura (RF-013)", () => {
  it("un resultado de lectura no requiere confirmacion", () => {
    expect(requiresConfirmation(readResult({ valor: 1 }))).toBe(false);
  });

  it("una propuesta si la requiere", () => {
    const propuesta = proposalResult(
      "Cambiar avena por arroz",
      { foodId: "abc" },
      "features/nutrition/day-swap-actions#swapDietItemForDay",
    );

    expect(requiresConfirmation(propuesta)).toBe(true);
    expect(propuesta.appliedBy).toContain("swapDietItemForDay");
  });

  /**
   * La garantia no es que el modelo se porte bien: es que la funcion que
   * propone NO TIENE con que escribir. Si algun dia alguien le pasara un
   * cliente de base de datos, esta prueba no lo detectaria, pero el tipo de
   * retorno obliga a que la interfaz pase por la confirmacion.
   */
  it("una propuesta nunca se confunde con un hecho consumado", () => {
    const propuesta = proposalResult("x", { a: 1 }, "accion");

    expect(propuesta.kind).toBe("proposal");
    expect("data" in propuesta).toBe(false);
  });
});

describe("formatSourcesForPrompt", () => {
  const fuente: ToolSource = {
    title: "Dose-response relationship between weekly resistance training volume",
    year: 2017,
    identifier: "PMID 27433992",
    evidenceGrade: "A",
    population: "Adultos entrenados, mayoritariamente hombres jovenes",
    limitations: "Muestra sesgada por sexo y edad",
    isProductParameter: false,
  };

  it("sin fuentes devuelve cadena vacia", () => {
    expect(formatSourcesForPrompt([])).toBe("");
  });

  /**
   * La poblacion viaja SIEMPRE al contexto del modelo. Es la diferencia entre
   * "necesitas 2 g/kg" y "en adultos que entrenan, mayormente hombres
   * jovenes, se observo que...".
   */
  it("incluye poblacion y limitaciones, no solo el titulo", () => {
    const texto = formatSourcesForPrompt([fuente]);

    expect(texto).toContain("PMID 27433992");
    expect(texto).toContain("Poblacion:");
    expect(texto).toContain("hombres jovenes");
    expect(texto).toContain("Limitaciones:");
  });

  it("marca los parametros de producto para que no se presenten como ciencia", () => {
    const texto = formatSourcesForPrompt([
      { ...fuente, isProductParameter: true },
    ]);

    expect(texto).toContain("parametro de producto");
  });

  it("no inventa campos que la fuente no tiene", () => {
    const texto = formatSourcesForPrompt([
      {
        title: "Fuente minima",
        year: null,
        identifier: null,
        evidenceGrade: null,
        population: null,
        limitations: null,
        isProductParameter: false,
      },
    ]);

    expect(texto).toBe("- Fuente minima");
  });
});
