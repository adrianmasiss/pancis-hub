import { describe, expect, it } from "vitest";
import {
  checksumDigit,
  isValidBarcode,
  normalizeBarcode,
  toSearchableBarcode,
} from "@/features/foods/lib/barcode";

describe("normalizeBarcode", () => {
  it("descarta espacios, guiones y cualquier cosa que no sea digito", () => {
    expect(normalizeBarcode(" 3017-620 422003 ")).toBe("3017620422003");
  });
});

describe("checksumDigit", () => {
  it("calcula el verificador de un EAN-13 real", () => {
    // Nutella 3017620422003: el ultimo digito es el verificador.
    expect(checksumDigit("301762042200")).toBe(3);
  });

  it("calcula el verificador de un EAN-8", () => {
    expect(checksumDigit("9638507")).toBe(4);
  });
});

describe("isValidBarcode", () => {
  it("acepta codigos reales", () => {
    expect(isValidBarcode("3017620422003")).toBe(true);
    expect(isValidBarcode("3017624010701")).toBe(true);
    expect(isValidBarcode("96385074")).toBe(true);
  });

  it("rechaza un codigo con un digito mal leido", () => {
    // Mismo codigo con el penultimo digito cambiado.
    expect(isValidBarcode("3017620422013")).toBe(false);
  });

  it("rechaza longitudes imposibles", () => {
    expect(isValidBarcode("123")).toBe(false);
    expect(isValidBarcode("123456789012345")).toBe(false);
    expect(isValidBarcode("")).toBe(false);
  });

  it("acepta longitudes sin verificador estandar en vez de rechazarlas", () => {
    // Rechazar un formato que no sabemos validar seria peor que consultarlo.
    expect(isValidBarcode("123456")).toBe(true);
  });

  it("tolera el formato con separadores", () => {
    expect(isValidBarcode("3017-620-422003")).toBe(true);
  });
});

describe("toSearchableBarcode", () => {
  it("convierte UPC-A de 12 digitos al EAN-13 equivalente", () => {
    expect(toSearchableBarcode("012345678905")).toBe("0012345678905");
  });

  it("deja intactos los de otras longitudes", () => {
    expect(toSearchableBarcode("3017620422003")).toBe("3017620422003");
    expect(toSearchableBarcode("96385074")).toBe("96385074");
  });
});
