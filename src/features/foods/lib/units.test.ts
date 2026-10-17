import { describe, expect, it } from "vitest";
import {
  convertAmount,
  defaultUnit,
  formatAmount,
  pluralize,
  unitsFor,
  type UnitFood,
} from "./units";

const leche: UnitFood = {
  name: "Leche entera, 3,25 % de grasa",
  group: "lacteo",
  basis: "100g",
  density: 1.052,
  portions: [{ label: "1 taza", grams: 249 }],
};
const refresco: UnitFood = {
  name: "Refresco de cola",
  group: "bebida",
  basis: "100ml",
  density: null,
  portions: [{ label: "1 envase (355 ml)", grams: 355 }],
};
const manzana: UnitFood = {
  name: "Manzana, cruda",
  group: "fruta",
  basis: "100g",
  density: 0.528,
  portions: [
    { label: "1 unidad mediana", grams: 200 },
    { label: "1 taza", grams: 125 },
  ],
};
const pollo: UnitFood = {
  name: "Pechuga de pollo",
  group: "proteina",
  basis: "100g",
  density: null,
  portions: [],
};
const ids = (food: UnitFood) => unitsFor(food).map((u) => u.id);

describe("unitsFor", () => {
  it("siempre ofrece masa, y gramos primero", () => {
    expect(ids(pollo)).toEqual(["g", "oz", "lb", "kg"]);
  });

  it("sin densidad medida no inventa tazas para un sólido", () => {
    expect(ids(pollo)).not.toContain("taza");
  });

  it("ofrece taza y cucharadas a un sólido con densidad, pero no ml", () => {
    const u = ids(manzana);
    expect(u).toContain("taza");
    expect(u).not.toContain("ml");
  });

  it("no repite «taza» cuando ya la cubre la densidad", () => {
    const porciones = unitsFor(manzana).filter((u) => u.kind === "porcion");
    expect(porciones.map((u) => u.short)).toEqual(["unidad mediana"]);
  });

  it("una taza de leche pesa lo que dice USDA, y es estimada", () => {
    const taza = unitsFor(leche).find((u) => u.id === "taza")!;
    expect(taza.basePerUnit).toBeCloseTo(248.9, 0);
    expect(taza.approx).toBe(true);
  });

  it("en una etiqueta por 100 ml, los ml son exactos y los g estimados", () => {
    const units = unitsFor(refresco);
    expect(units.find((u) => u.id === "ml")).toMatchObject({
      basePerUnit: 1,
      approx: false,
    });
    expect(units.find((u) => u.id === "g")!.approx).toBe(true);
  });

  it("las porciones medidas no son estimaciones", () => {
    const lata = unitsFor(refresco).find((u) => u.kind === "porcion")!;
    expect(lata.short).toBe("envase");
    expect(lata.basePerUnit).toBe(355);
  });
});

describe("defaultUnit", () => {
  it("abre en ml lo líquido y en gramos lo demás", () => {
    expect(defaultUnit(unitsFor(refresco), refresco).id).toBe("ml");
    expect(defaultUnit(unitsFor(leche), leche).id).toBe("ml");
    expect(defaultUnit(unitsFor(pollo), pollo).id).toBe("g");
  });
});

describe("convertAmount", () => {
  const [g, oz] = [unitsFor(pollo)[0]!, unitsFor(pollo)[1]!];
  it("entre masas conserva la cantidad", () => {
    expect(convertAmount(g, oz, 100)).toBeCloseTo(3.5, 1);
  });
  it("hacia una medida casera abre en 1", () => {
    const taza = unitsFor(manzana).find((u) => u.id === "taza")!;
    expect(convertAmount(unitsFor(manzana)[0]!, taza, 100)).toBe(1);
  });
});

describe("formatAmount y pluralize", () => {
  it("pluraliza el sustantivo y sus adjetivos", () => {
    expect(pluralize("unidad mediana")).toBe("unidades medianas");
    expect(pluralize("porción")).toBe("porciones");
    expect(pluralize("taza")).toBe("tazas");
  });
  it("escribe con coma decimal", () => {
    const taza = unitsFor(manzana).find((u) => u.id === "taza")!;
    expect(formatAmount(taza, 1.5)).toBe("1,5 tazas");
    expect(formatAmount(taza, 1)).toBe("1 taza");
  });
});
