import { describe, expect, it } from "vitest";
import {
  formatTime,
  minutesOfDay,
  nextScheduledMeal,
  sortBySchedule,
  toMinutes,
} from "@/features/nutrition/lib/meal-schedule";

describe("toMinutes", () => {
  it("acepta el formato de Postgres con y sin segundos", () => {
    expect(toMinutes("07:30:00")).toBe(450);
    expect(toMinutes("07:30")).toBe(450);
    expect(toMinutes("00:00")).toBe(0);
    expect(toMinutes("23:59")).toBe(1439);
  });

  it("devuelve null ante una hora ausente o invalida", () => {
    expect(toMinutes(null)).toBeNull();
    expect(toMinutes("")).toBeNull();
    expect(toMinutes("25:00")).toBeNull();
    expect(toMinutes("07:99")).toBeNull();
    expect(toMinutes("manana")).toBeNull();
  });
});

describe("formatTime", () => {
  it("formatea la hora de forma legible", () => {
    // El separador exacto depende del entorno; se comprueba el contenido.
    expect(formatTime("07:30:00")).toMatch(/7:30/);
    expect(formatTime("19:05:00")).toMatch(/7:05|19:05/);
  });

  it("no inventa una hora cuando no la hay", () => {
    expect(formatTime(null)).toBeNull();
  });
});

describe("sortBySchedule", () => {
  it("ordena por hora del dia", () => {
    const sorted = sortBySchedule([
      { scheduledTime: "20:00" },
      { scheduledTime: "07:00" },
      { scheduledTime: "13:30" },
    ]);
    expect(sorted.map((m) => m.scheduledTime)).toEqual([
      "07:00",
      "13:30",
      "20:00",
    ]);
  });

  it("manda al final las comidas sin horario", () => {
    // Sin hora no se puede afirmar que ocurran primero.
    const sorted = sortBySchedule([
      { scheduledTime: null, createdAt: "2026-07-22T10:00:00Z" },
      { scheduledTime: "13:00", createdAt: "2026-07-22T11:00:00Z" },
    ]);
    expect(sorted[0]!.scheduledTime).toBe("13:00");
    expect(sorted[1]!.scheduledTime).toBeNull();
  });

  it("desempata por orden de creacion", () => {
    const sorted = sortBySchedule([
      { scheduledTime: "09:00", createdAt: "2026-07-22T11:00:00Z" },
      { scheduledTime: "09:00", createdAt: "2026-07-22T10:00:00Z" },
    ]);
    expect(sorted[0]!.createdAt).toBe("2026-07-22T10:00:00Z");
  });

  it("no muta el arreglo original", () => {
    const original = [{ scheduledTime: "20:00" }, { scheduledTime: "07:00" }];
    sortBySchedule(original);
    expect(original[0]!.scheduledTime).toBe("20:00");
  });
});

describe("nextScheduledMeal", () => {
  const meals = [
    { scheduledTime: "07:00", status: "completada", name: "Desayuno" },
    { scheduledTime: "13:00", status: "planificada", name: "Almuerzo" },
    { scheduledTime: "20:00", status: "planificada", name: "Cena" },
    { scheduledTime: null, status: "planificada", name: "Snack libre" },
  ];

  it("devuelve la siguiente comida pendiente", () => {
    // 10:00
    expect(nextScheduledMeal(meals, 600)?.name).toBe("Almuerzo");
  });

  it("ignora las comidas ya completadas aunque no hayan pasado", () => {
    expect(nextScheduledMeal(meals, 0)?.name).toBe("Almuerzo");
  });

  it("no considera comidas sin horario", () => {
    // Tras la cena solo queda el snack sin hora, que no cuenta.
    expect(nextScheduledMeal(meals, 1300)).toBeNull();
  });

  it("devuelve null cuando ya no queda nada por delante", () => {
    expect(nextScheduledMeal([], 600)).toBeNull();
  });
});

describe("minutesOfDay", () => {
  it("usa la hora local, no UTC", () => {
    const date = new Date(2026, 6, 22, 14, 45);
    expect(minutesOfDay(date)).toBe(885);
  });
});
