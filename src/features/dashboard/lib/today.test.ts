import { describe, expect, it } from "vitest";
import { buildTodayNutrition } from "@/features/dashboard/lib/today";
import { DEFAULT_TOLERANCES } from "@/features/nutrition/lib/tolerances";

const target = {
  calories: 2000,
  proteinG: 140,
  carbohydrateG: 200,
  fatG: 60,
  fiberG: 28,
};

const zero = {
  calories: 0,
  proteinG: 0,
  carbohydrateG: 0,
  fatG: 0,
  fiberG: 0,
};

const build = (
  planned: typeof target | null,
  consumed: typeof target = zero,
) =>
  buildTodayNutrition({
    target,
    planned,
    consumed,
    tolerances: DEFAULT_TOLERANCES,
  });

describe("buildTodayNutrition", () => {
  it("calcula el restante como objetivo menos consumido", () => {
    const today = build(null, { ...zero, calories: 750, proteinG: 55 });
    const calories = today.rows.find((row) => row.macro === "calories")!;
    expect(calories.remaining).toBe(1250);
    expect(today.rows.find((row) => row.macro === "protein")!.remaining).toBe(
      85,
    );
  });

  it("da restante negativo cuando ya se paso", () => {
    const today = build(null, { ...zero, calories: 2300 });
    expect(today.rows.find((row) => row.macro === "calories")!.remaining).toBe(
      -300,
    );
  });

  it("distingue sin plan de plan en cero", () => {
    // null no es 0: sin dieta activa no se sabe lo planificado, y pintar un
    // cero haria pensar que el plan del dia esta vacio.
    expect(build(null).rows[0]!.planned).toBeNull();
    expect(build(zero).rows[0]!.planned).toBe(0);
  });

  it("no evalua el plan cuando no hay dieta activa", () => {
    expect(build(null).planVsTarget).toBeNull();
  });

  it("avisa cuando el plan del dia no llega al objetivo", () => {
    // 1700 kcal contra 2000 son 15 % por debajo, muy fuera del 5 %.
    const today = build({ ...target, calories: 1700 });
    expect(today.planVsTarget?.withinTolerance).toBe(false);
    expect(today.planVsTarget?.exceeded).toContain("calories");
  });

  it("acepta el plan que cae dentro de la tolerancia", () => {
    const today = build({ ...target, calories: 2050 });
    expect(today.planVsTarget?.withinTolerance).toBe(true);
  });

  it("solo marca exceso en lo consumido, nunca defecto", () => {
    // A media manana se ha consumido casi nada: eso no es una desviacion.
    const manana = build(null, { ...zero, calories: 300 });
    expect(manana.exceeded).toEqual([]);

    const pasado = build(null, { ...target, calories: 2400 });
    expect(pasado.exceeded).toContain("calories");
  });

  it("la fibra nunca cuenta como exceso: no tiene tolerancia", () => {
    const today = build(null, { ...zero, fiberG: 60 });
    expect(today.exceeded).not.toContain("fiber");
  });

  it("reconoce el dia que aun no ha empezado", () => {
    expect(build(null).nothingLogged).toBe(true);
    expect(build(null, { ...zero, calories: 1 }).nothingLogged).toBe(false);
  });
});
