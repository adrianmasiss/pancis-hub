import { describe, expect, it } from "vitest";
import { detectPatterns, type CheckinRecord } from "./patterns";

const reference = new Date("2026-07-19T12:00:00Z");

function makeCheckin(
  daysAgo: number,
  overrides: Partial<CheckinRecord> = {},
): CheckinRecord {
  const date = new Date(reference.getTime() - daysAgo * 86400000)
    .toISOString()
    .slice(0, 10);
  return {
    date,
    sleepHours: 7.5,
    hunger: 2,
    stress: 2,
    soreness: 2,
    ...overrides,
  };
}

describe("detectPatterns", () => {
  it("sin datos no detecta nada", () => {
    expect(detectPatterns([], reference)).toEqual([]);
  });

  it("detecta sueno bajo sostenido", () => {
    const checkins = [
      makeCheckin(1, { sleepHours: 5.5 }),
      makeCheckin(2, { sleepHours: 6 }),
      makeCheckin(3, { sleepHours: 6 }),
    ];
    expect(detectPatterns(checkins, reference)).toContain("lowSleep");
  });

  it("no marca sueno bajo con pocos datos", () => {
    const checkins = [makeCheckin(1, { sleepHours: 4 })];
    expect(detectPatterns(checkins, reference)).not.toContain("lowSleep");
  });

  it("detecta estres alto y hambre alta repetida", () => {
    const checkins = [
      makeCheckin(1, { stress: 5, hunger: 4 }),
      makeCheckin(2, { stress: 4, hunger: 5 }),
      makeCheckin(3, { stress: 4, hunger: 4 }),
    ];
    const patterns = detectPatterns(checkins, reference);
    expect(patterns).toContain("highStress");
    expect(patterns).toContain("highHunger");
  });

  it("detecta dolor muscular persistente", () => {
    const checkins = [
      makeCheckin(1, { soreness: 4 }),
      makeCheckin(2, { soreness: 5 }),
      makeCheckin(4, { soreness: 4 }),
    ];
    expect(detectPatterns(checkins, reference)).toContain("persistentSoreness");
  });

  it("celebra la racha de registro", () => {
    const checkins = [0, 1, 2, 3, 4].map((day) => makeCheckin(day));
    expect(detectPatterns(checkins, reference)).toContain("goodStreak");
  });

  it("ignora registros viejos fuera de la ventana de 7 dias", () => {
    const checkins = [
      makeCheckin(10, { sleepHours: 4 }),
      makeCheckin(11, { sleepHours: 4 }),
      makeCheckin(12, { sleepHours: 4 }),
    ];
    expect(detectPatterns(checkins, reference)).not.toContain("lowSleep");
  });
});
