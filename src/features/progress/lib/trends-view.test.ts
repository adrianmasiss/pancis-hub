import { describe, expect, it } from "vitest";
import {
  changeTone,
  inRange,
  rangePosition,
  seriesOf,
  trendDef,
} from "./trends-view";
import type { MeasurementView } from "../queries";

const medicion = (
  measuredAt: string,
  extra: Partial<MeasurementView>,
): MeasurementView =>
  ({
    id: measuredAt,
    measuredAt,
    weightKg: null,
    bodyFatPercentage: null,
    skeletalMuscleKg: null,
    waistCm: null,
    chestCm: null,
    armCm: null,
    ...extra,
  }) as MeasurementView;

describe("seriesOf / inRange", () => {
  const meds = [
    medicion("2026-11-06", { weightKg: 65.1 }),
    medicion("2026-10-01", { weightKg: 66 }),
    medicion("2026-09-01", { bodyFatPercentage: 18 }),
    medicion("2026-08-01", { weightKg: 67 }),
  ];

  it("ordena de vieja a nueva y salta las que no traen el dato", () => {
    expect(seriesOf(meds, "weightKg").map((p) => p.value)).toEqual([
      67, 66, 65.1,
    ]);
  });

  it("con un solo punto en el rango, suma el anterior para medir el cambio", () => {
    const s = seriesOf(meds, "weightKg");
    expect(inRange(s, "2026-11-01").map((p) => p.date)).toEqual([
      "2026-10-01",
      "2026-11-06",
    ]);
    expect(inRange(s, "2026-07-01")).toHaveLength(3);
  });
});

describe("changeTone", () => {
  it("la grasa que baja y el musculo que sube son buenos", () => {
    expect(changeTone(trendDef("bodyFatPercentage"), -0.6, null)).toBe("good");
    expect(changeTone(trendDef("skeletalMuscleKg"), 0.4, null)).toBe("good");
    expect(changeTone(trendDef("waistCm"), 0.8, null)).toBe("bad");
  });

  it("lo que no pasa el ruido es neutro", () => {
    expect(changeTone(trendDef("bodyFatPercentage"), -0.2, null)).toBe(
      "neutral",
    );
  });

  it("el peso depende de la meta", () => {
    const peso = trendDef("weightKg");
    expect(changeTone(peso, -0.9, "perdida_grasa")).toBe("good");
    expect(changeTone(peso, -0.9, "ganancia_muscular")).toBe("bad");
    expect(changeTone(peso, -0.9, "recomposicion")).toBe("neutral");
  });
});

describe("rangePosition", () => {
  it("lo normal cae en el tercio del medio", () => {
    expect(rangePosition(15, [10, 20])).toEqual({ pos: 0.5, zone: "normal" });
    expect(rangePosition(10, [10, 20]).pos).toBeCloseTo(1 / 3);
  });

  it("afuera sigue la escala y se topa en el borde", () => {
    const alto = rangePosition(25, [10, 20]);
    expect(alto.zone).toBe("alto");
    expect(alto.pos).toBeCloseTo(5 / 6);
    expect(rangePosition(-50, [10, 20])).toEqual({ pos: 0, zone: "bajo" });
  });

  it("sin zona baja, normal ocupa dos tercios", () => {
    expect(rangePosition(9, [1, 9], false)).toEqual({
      pos: 2 / 3,
      zone: "normal",
    });
    expect(rangePosition(13, [1, 9], false).zone).toBe("alto");
  });
});
