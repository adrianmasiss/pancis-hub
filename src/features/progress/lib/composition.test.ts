import { describe, expect, it } from "vitest";
import {
  buildCompositionReport,
  compositionSeries,
  deriveSnapshot,
  type CompositionSnapshot,
} from "@/features/progress/lib/composition";

const snapshot = (
  overrides: Partial<CompositionSnapshot> & { measuredAt: string },
): CompositionSnapshot => ({
  source: "inbody",
  weightKg: 80,
  bodyFatPercentage: 20,
  skeletalMuscleKg: 35,
  visceralFatLevel: 8,
  bodyWaterPercentage: 55,
  waistCm: 85,
  ...overrides,
});

describe("deriveSnapshot", () => {
  it("calcula masa grasa y masa magra", () => {
    const derived = deriveSnapshot(
      snapshot({ measuredAt: "2026-07-01", weightKg: 80, bodyFatPercentage: 20 }),
    );
    expect(derived.fatMassKg).toBe(16);
    expect(derived.leanMassKg).toBe(64);
  });

  it("deja las derivadas en null si falta el peso o el porcentaje", () => {
    const sinGrasa = deriveSnapshot(
      snapshot({ measuredAt: "2026-07-01", bodyFatPercentage: null }),
    );
    expect(sinGrasa.fatMassKg).toBeNull();
    expect(sinGrasa.leanMassKg).toBeNull();
  });
});

describe("buildCompositionReport", () => {
  it("devuelve null sin mediciones", () => {
    expect(buildCompositionReport([])).toBeNull();
  });

  it("con una sola medicion no inventa comparaciones", () => {
    const report = buildCompositionReport([snapshot({ measuredAt: "2026-07-01" })])!;
    expect(report.measurementCount).toBe(1);
    expect(report.previous).toBeNull();
    expect(report.baseline).toBeNull();
    expect(report.daysSinceBaseline).toBeNull();
    for (const comparison of report.comparisons) {
      expect(comparison.deltaPrevious).toBeNull();
      expect(comparison.deltaBaseline).toBeNull();
      expect(comparison.direction).toBe("estable");
      expect(comparison.assessment).toBe("neutro");
    }
  });

  it("compara contra la anterior y contra la linea base", () => {
    const report = buildCompositionReport([
      snapshot({ measuredAt: "2026-05-01", weightKg: 90, bodyFatPercentage: 28 }),
      snapshot({ measuredAt: "2026-06-01", weightKg: 86, bodyFatPercentage: 25 }),
      snapshot({ measuredAt: "2026-07-01", weightKg: 84, bodyFatPercentage: 23 }),
    ])!;

    const weight = report.comparisons.find((c) => c.metric === "weightKg")!;
    expect(weight.current).toBe(84);
    expect(weight.previous).toBe(86);
    expect(weight.baseline).toBe(90);
    expect(weight.deltaPrevious).toBe(-2);
    expect(weight.deltaBaseline).toBe(-6);
    expect(weight.percentChangeBaseline).toBe(-6.7);
    expect(report.daysSinceBaseline).toBe(61);
    expect(report.measurementCount).toBe(3);
  });

  it("ordena las mediciones aunque lleguen desordenadas", () => {
    const report = buildCompositionReport([
      snapshot({ measuredAt: "2026-07-01", weightKg: 84 }),
      snapshot({ measuredAt: "2026-05-01", weightKg: 90 }),
      snapshot({ measuredAt: "2026-06-01", weightKg: 86 }),
    ])!;
    expect(report.current.measuredAt).toBe("2026-07-01");
    expect(report.baseline!.measuredAt).toBe("2026-05-01");
    expect(report.previous!.measuredAt).toBe("2026-06-01");
  });

  it("declara estable lo que cabe dentro del ruido de medicion", () => {
    const report = buildCompositionReport([
      snapshot({ measuredAt: "2026-06-01", weightKg: 80 }),
      snapshot({ measuredAt: "2026-07-01", weightKg: 80.2 }),
    ])!;
    const weight = report.comparisons.find((c) => c.metric === "weightKg")!;
    expect(weight.direction).toBe("estable");
    expect(weight.assessment).toBe("neutro");
  });

  it("califica bajar grasa como favorable y perder musculo como desfavorable", () => {
    const report = buildCompositionReport([
      snapshot({
        measuredAt: "2026-06-01",
        bodyFatPercentage: 25,
        skeletalMuscleKg: 36,
      }),
      snapshot({
        measuredAt: "2026-07-01",
        bodyFatPercentage: 22,
        skeletalMuscleKg: 34,
      }),
    ])!;

    const fat = report.comparisons.find((c) => c.metric === "bodyFatPercentage")!;
    expect(fat.assessment).toBe("favorable");

    const muscle = report.comparisons.find(
      (c) => c.metric === "skeletalMuscleKg",
    )!;
    expect(muscle.assessment).toBe("desfavorable");
  });

  it("juzga el peso segun el objetivo del usuario", () => {
    const measurements = [
      snapshot({ measuredAt: "2026-06-01", weightKg: 80 }),
      snapshot({ measuredAt: "2026-07-01", weightKg: 83 }),
    ];

    const cutting = buildCompositionReport(measurements, "perdida_grasa")!;
    expect(
      cutting.comparisons.find((c) => c.metric === "weightKg")!.assessment,
    ).toBe("desfavorable");

    const bulking = buildCompositionReport(measurements, "ganancia_muscular")!;
    expect(
      bulking.comparisons.find((c) => c.metric === "weightKg")!.assessment,
    ).toBe("favorable");

    // En recomposicion el peso solo no dice nada.
    const recomp = buildCompositionReport(measurements, "recomposicion")!;
    expect(
      recomp.comparisons.find((c) => c.metric === "weightKg")!.assessment,
    ).toBe("neutro");
  });

  it("detecta recomposicion cuando baja la grasa y sube el musculo", () => {
    const report = buildCompositionReport([
      snapshot({
        measuredAt: "2026-06-01",
        weightKg: 80,
        bodyFatPercentage: 24,
        skeletalMuscleKg: 34,
      }),
      snapshot({
        measuredAt: "2026-07-01",
        weightKg: 80,
        bodyFatPercentage: 20,
        skeletalMuscleKg: 36,
      }),
    ])!;
    expect(report.isRecomposition).toBe(true);
  });

  it("no anuncia recomposicion por decimas dentro del ruido", () => {
    const report = buildCompositionReport([
      snapshot({
        measuredAt: "2026-06-01",
        weightKg: 80,
        bodyFatPercentage: 20,
        skeletalMuscleKg: 35,
      }),
      snapshot({
        measuredAt: "2026-07-01",
        weightKg: 80,
        bodyFatPercentage: 19.9,
        skeletalMuscleKg: 35.1,
      }),
    ])!;
    expect(report.isRecomposition).toBe(false);
  });

  it("omite las metricas sin valor actual", () => {
    const report = buildCompositionReport([
      snapshot({ measuredAt: "2026-06-01" }),
      snapshot({ measuredAt: "2026-07-01", visceralFatLevel: null }),
    ])!;
    expect(
      report.comparisons.some((c) => c.metric === "visceralFatLevel"),
    ).toBe(false);
  });
});

describe("compositionSeries", () => {
  it("devuelve la serie ordenada y sin huecos", () => {
    const series = compositionSeries(
      [
        snapshot({ measuredAt: "2026-07-01", weightKg: 84 }),
        snapshot({ measuredAt: "2026-05-01", weightKg: null }),
        snapshot({ measuredAt: "2026-06-01", weightKg: 86 }),
      ],
      "weightKg",
    );
    expect(series).toEqual([
      { date: "2026-06-01", value: 86 },
      { date: "2026-07-01", value: 84 },
    ]);
  });

  it("sirve para metricas derivadas", () => {
    const series = compositionSeries(
      [
        snapshot({ measuredAt: "2026-06-01", weightKg: 80, bodyFatPercentage: 25 }),
        snapshot({ measuredAt: "2026-07-01", weightKg: 78, bodyFatPercentage: 22 }),
      ],
      "fatMassKg",
    );
    expect(series).toEqual([
      { date: "2026-06-01", value: 20 },
      { date: "2026-07-01", value: 17.2 },
    ]);
  });
});
