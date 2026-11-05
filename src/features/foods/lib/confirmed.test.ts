import { describe, expect, it } from "vitest";
import { isConfirmedFood, type ConfirmableFood } from "./confirmed";

const generico: ConfirmableFood = {
  externalSource: "usda",
  barcode: null,
  dataIssue: null,
  maxDivergencePct: null,
  isCorrected: false,
  isOwn: false,
};

describe("isConfirmedFood", () => {
  it("confirma un genérico de USDA sin dudas", () => {
    expect(isConfirmedFood(generico)).toBe(true);
  });

  it("acepta que otra fuente coincida dentro del umbral", () => {
    expect(isConfirmedFood({ ...generico, maxDivergencePct: 15 })).toBe(true);
  });

  it.each<[string, Partial<ConfirmableFood>]>([
    ["un producto de marca (etiqueta del fabricante)", { barcode: "0741" }],
    ["Open Food Facts", { externalSource: "openfoodfacts" }],
    ["sin fuente externa", { externalSource: null }],
    ["números que no se sostienen", { dataIssue: "macros_imposibles" }],
    ["fuentes que discrepan", { maxDivergencePct: 15.1 }],
    ["corregido por el usuario", { isCorrected: true }],
    ["un alimento propio", { isOwn: true }],
  ])("no confirma %s", (_, extra) => {
    expect(isConfirmedFood({ ...generico, ...extra })).toBe(false);
  });
});
