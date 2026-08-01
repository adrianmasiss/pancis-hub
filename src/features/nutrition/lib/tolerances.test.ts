import { describe, expect, it } from "vitest";
import {
  DEFAULT_TOLERANCES,
  evaluateTolerances,
} from "./tolerances";

const plan = {
  calories: 600,
  proteinG: 40,
  carbohydrateG: 60,
  fatG: 20,
  fiberG: 8,
};

describe("evaluateTolerances", () => {
  it("una sustitucion identica cae dentro de todo", () => {
    const report = evaluateTolerances(plan, plan);

    expect(report.withinTolerance).toBe(true);
    expect(report.exceeded).toEqual([]);
  });

  it("las calorias tienen la tolerancia mas estrecha", () => {
    // +8 % de calorias: fuera del 5 %.
    const report = evaluateTolerances(plan, { ...plan, calories: 648 });

    expect(report.exceeded).toContain("calories");
    expect(report.withinTolerance).toBe(false);
  });

  it("la grasa admite mas desviacion que la proteina", () => {
    // +12 % en ambas: la grasa aguanta (15 %), la proteina no (10 %).
    const soloGrasa = evaluateTolerances(plan, { ...plan, fatG: 22.4 });
    const soloProteina = evaluateTolerances(plan, { ...plan, proteinG: 44.8 });

    expect(soloGrasa.withinTolerance).toBe(true);
    expect(soloProteina.exceeded).toContain("protein");
  });

  it("la desviacion tiene signo: se distingue pasarse de quedarse corto", () => {
    const porEncima = evaluateTolerances(plan, { ...plan, proteinG: 48 });
    const porDebajo = evaluateTolerances(plan, { ...plan, proteinG: 32 });

    expect(
      porEncima.deviations.find((d) => d.macro === "protein")!.deviationPct,
    ).toBe(20);
    expect(
      porDebajo.deviations.find((d) => d.macro === "protein")!.deviationPct,
    ).toBe(-20);
  });

  /**
   * EQ-003 y NUT-006: la fibra es advertencia, nunca bloqueo. Es un objetivo
   * de salud a largo plazo, no una necesidad diaria, asi que quedarse corto un
   * dia no tiene la misma consecuencia que fallar en proteina.
   */
  it("la fibra nunca bloquea, por mucho que se desvie", () => {
    const report = evaluateTolerances(plan, { ...plan, fiberG: 1 });

    expect(report.withinTolerance).toBe(true);
    expect(report.exceeded).not.toContain("fiber");
    expect(
      report.deviations.find((d) => d.macro === "fiber")!.tolerancePct,
    ).toBeNull();
  });

  it("las tolerancias del usuario mandan sobre las de por defecto", () => {
    const estricto = evaluateTolerances(
      plan,
      { ...plan, fatG: 22.4 },
      { ...DEFAULT_TOLERANCES, fatPct: 5 },
    );

    expect(estricto.exceeded).toContain("fat");
  });

  it("sin nada planificado no divide por cero", () => {
    const vacio = { calories: 0, proteinG: 0, carbohydrateG: 0, fatG: 0, fiberG: 0 };

    expect(evaluateTolerances(vacio, vacio).withinTolerance).toBe(true);
    expect(
      evaluateTolerances(vacio, { ...vacio, calories: 50 }).exceeded,
    ).toContain("calories");
  });
});
