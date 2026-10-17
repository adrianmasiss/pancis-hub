import { describe, expect, it } from "vitest";
import { rescaleExtra, scaleExtra } from "./extras";

describe("sodio y azucar", () => {
  it("escala por 100 g y conserva el «sin dato»", () => {
    expect(scaleExtra(400, 150)).toBe(600);
    expect(scaleExtra("12.2", 120)).toBe(14.6);
    expect(scaleExtra(null, 150)).toBeNull();
    expect(scaleExtra(undefined, 150)).toBeNull();
  });

  it("reescala una instantanea sin volver al catalogo", () => {
    expect(rescaleExtra(50, 100, 150)).toBe(75);
    expect(rescaleExtra(null, 100, 150)).toBeNull();
  });
});
