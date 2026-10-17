import { describe, expect, it } from "vitest";
import { modelRegionAt, pectoralInterior } from "./model-regions";
describe("zonas del modelo anatómico", () => {
  it("distingue la cara anterior de la posterior", () => {
    expect(modelRegionAt(0.055, 0.752, 1)?.muscle).toBe("pectoral");
    expect(modelRegionAt(0.055, 0.752, -1)?.muscle).not.toBe("pectoral");
    expect(modelRegionAt(0.066, 0.407, 1)?.muscle).toBe("cuadriceps");
    expect(modelRegionAt(0.066, 0.407, -1)?.muscle).toBe("isquios");
  });
  it("deja cabeza, manos y pies sin asignaciones inventadas", () => {
    expect(modelRegionAt(0, 0.97, 1)).toBeNull();
    expect(modelRegionAt(0.2, 0.45, 1)).toBeNull();
    expect(modelRegionAt(0.06, 0.02, 1)).toBeNull();
  });
  it("es simétrico y suaviza los extremos de una zona", () => {
    expect(modelRegionAt(0.055, 0.752, 1)).toEqual(
      modelRegionAt(-0.055, 0.752, 1),
    );
    expect(modelRegionAt(0.055, 0.788, 1)?.strength).toBeLessThan(1);
  });
  it("separa ambos pectorales y respeta clavícula y axila", () => {
    expect(pectoralInterior(0, 0.752)).toBe(0);
    expect(modelRegionAt(0, 0.752, 1)).toBeNull();
    expect(pectoralInterior(0.11, 0.787)).toBe(0);
    expect(pectoralInterior(0.115, 0.724)).toBe(0);
    expect(pectoralInterior(0.055, 0.752)).toBeGreaterThan(0.012);
    expect(modelRegionAt(0.137, 0.766, 1)?.muscle).toBe("deltoides");
  });
});
