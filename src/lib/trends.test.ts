import { describe, expect, it } from "vitest";
import {
  movingAverage,
  streakDays,
  trendDirection,
  windowDifference,
} from "./trends";

const series = [
  { date: "2026-07-10", value: 70.0 },
  { date: "2026-07-11", value: 70.4 },
  { date: "2026-07-12", value: 69.8 },
  { date: "2026-07-14", value: 69.6 }, // dia 13 faltante a proposito
  { date: "2026-07-15", value: 69.9 },
];

describe("movingAverage", () => {
  it("promedia dentro de la ventana incluyendo el dia actual", () => {
    const result = movingAverage(series, 3);
    // 2026-07-12: (70.0 + 70.4 + 69.8) / 3 = 70.07 -> 70.1
    expect(result.find((p) => p.date === "2026-07-12")?.value).toBe(70.1);
  });

  it("tolera dias faltantes en la serie", () => {
    const result = movingAverage(series, 3);
    // 2026-07-14: ventana 12-14 solo tiene 12 y 14 -> (69.8 + 69.6) / 2 = 69.7
    expect(result.find((p) => p.date === "2026-07-14")?.value).toBe(69.7);
  });

  it("el primer punto es su propio promedio", () => {
    const result = movingAverage(series, 7);
    expect(result[0]?.value).toBe(70.0);
  });

  it("ordena la serie por fecha", () => {
    const shuffled = [...series].reverse();
    const result = movingAverage(shuffled, 3);
    expect(result.map((p) => p.date)).toEqual(series.map((p) => p.date).sort());
  });
});

describe("windowDifference", () => {
  it("compara la ventana actual contra la anterior", () => {
    const data = [
      { date: "2026-07-05", value: 71.0 },
      { date: "2026-07-06", value: 70.8 },
      { date: "2026-07-12", value: 70.0 },
      { date: "2026-07-13", value: 69.8 },
    ];
    const diff = windowDifference(data, 7, new Date("2026-07-14T12:00:00Z"));
    // actual (08-14): (70.0 + 69.8) / 2 = 69.9; previa (01-07): (71.0 + 70.8) / 2 = 70.9
    expect(diff).toBe(-1);
  });

  it("devuelve null si falta una ventana completa", () => {
    const data = [{ date: "2026-07-14", value: 70 }];
    expect(windowDifference(data, 7, new Date("2026-07-14T12:00:00Z"))).toBe(
      null,
    );
  });
});

describe("trendDirection", () => {
  it("clasifica con umbral de estabilidad", () => {
    expect(trendDirection(-0.5)).toBe("baja");
    expect(trendDirection(0.5)).toBe("sube");
    expect(trendDirection(0.1)).toBe("estable");
    expect(trendDirection(-0.19)).toBe("estable");
    expect(trendDirection(null)).toBe(null);
  });
});

describe("streakDays", () => {
  const today = new Date("2026-07-19T10:00:00Z");

  it("cuenta dias consecutivos terminando hoy", () => {
    expect(streakDays(["2026-07-17", "2026-07-18", "2026-07-19"], today)).toBe(
      3,
    );
  });

  it("conserva la racha si el ultimo registro fue ayer", () => {
    expect(streakDays(["2026-07-17", "2026-07-18"], today)).toBe(2);
  });

  it("rompe la racha con un hueco", () => {
    expect(streakDays(["2026-07-15", "2026-07-16", "2026-07-18"], today)).toBe(
      1,
    );
  });

  it("devuelve 0 sin registros recientes", () => {
    expect(streakDays(["2026-07-10"], today)).toBe(0);
    expect(streakDays([], today)).toBe(0);
  });
});
