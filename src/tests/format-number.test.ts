import { describe, expect, it } from "vitest";
import { formatDecimal, formatNumber } from "@/lib/format/number";

const THIN = " ";

describe("formatNumber", () => {
  it("agrupa desde cuatro cifras con espacio fino, como el lienzo", () => {
    expect(formatNumber(2070)).toBe(`2${THIN}070`);
    expect(formatNumber(2480)).toBe(`2${THIN}480`);
  });

  it("no agrupa por debajo de mil", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(410)).toBe("410");
  });

  it("agrupa de tres en tres desde la derecha", () => {
    expect(formatNumber(1234567)).toBe(`1${THIN}234${THIN}567`);
  });

  it("conserva el signo fuera de los grupos", () => {
    expect(formatNumber(-2070)).toBe(`-2${THIN}070`);
  });

  it("redondea antes de agrupar", () => {
    expect(formatNumber(2069.6)).toBe(`2${THIN}070`);
  });
});

describe("formatDecimal", () => {
  it("usa coma decimal", () => {
    expect(formatDecimal(36.24)).toBe("36,2");
  });
});
