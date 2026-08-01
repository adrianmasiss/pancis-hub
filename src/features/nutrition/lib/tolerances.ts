/**
 * Tolerancias por macro (claim EQ-003).
 *
 * `docs/spec/docs/01_SCOPE_AND_MVP.md` las describia como configurables y NO
 * EXISTIAN en el codigo. Sin ellas no se puede calcular la metrica North Star
 * del producto:
 *
 *   "Porcentaje de sustituciones confirmadas que mantienen el plan dentro de
 *    la tolerancia definida por el usuario."
 *
 * SON PREFERENCIAS DEL USUARIO, no limites cientificos. La redaccion importa:
 * "te avisamos si te alejas mas de un 10 %" es una preferencia; "no debes
 * exceder el 10 %" seria una afirmacion falsa. El mismo doc 01 lo dice.
 */
import type { MacroSet } from "@/features/nutrition/lib/macros";

export type MacroTolerances = {
  caloriesPct: number;
  proteinPct: number;
  carbsPct: number;
  fatPct: number;
};

/** Valores por defecto del doc 01. */
export const DEFAULT_TOLERANCES: MacroTolerances = {
  caloriesPct: 5,
  proteinPct: 10,
  carbsPct: 10,
  fatPct: 15,
};

export type ToleranceKey = "calories" | "protein" | "carbs" | "fat" | "fiber";

export type MacroDeviation = {
  macro: ToleranceKey;
  /** Desviacion en % respecto a lo planificado. Positivo = por encima. */
  deviationPct: number;
  /** null en fibra: es advertencia, nunca bloqueo. */
  tolerancePct: number | null;
  withinTolerance: boolean;
};

export type ToleranceReport = {
  deviations: MacroDeviation[];
  /** true si TODOS los macros con tolerancia caen dentro. */
  withinTolerance: boolean;
  /** Macros fuera de tolerancia, para explicarlo sin recorrer la lista. */
  exceeded: ToleranceKey[];
};

/**
 * La fibra no tiene tolerancia a proposito: el doc 01 la trata como
 * advertencia y no como bloqueo, y NUT-006 lo refuerza porque es un objetivo
 * de salud a largo plazo, no una necesidad diaria.
 */
const FIBER_HAS_NO_TOLERANCE = null;

function deviationPct(planned: number, actual: number): number {
  // Sin nada planificado no hay desviacion relativa que calcular.
  if (planned === 0) return actual === 0 ? 0 : 100;
  return ((actual - planned) / planned) * 100;
}

const round1 = (value: number) => Math.round(value * 10) / 10;

/**
 * Compara lo planificado con lo que quedaria tras una sustitucion, y dice si
 * se mantiene dentro de las tolerancias del usuario.
 */
export function evaluateTolerances(
  planned: MacroSet,
  actual: MacroSet,
  tolerances: MacroTolerances = DEFAULT_TOLERANCES,
): ToleranceReport {
  const rows: { macro: ToleranceKey; planned: number; actual: number; tol: number | null }[] = [
    { macro: "calories", planned: planned.calories, actual: actual.calories, tol: tolerances.caloriesPct },
    { macro: "protein", planned: planned.proteinG, actual: actual.proteinG, tol: tolerances.proteinPct },
    { macro: "carbs", planned: planned.carbohydrateG, actual: actual.carbohydrateG, tol: tolerances.carbsPct },
    { macro: "fat", planned: planned.fatG, actual: actual.fatG, tol: tolerances.fatPct },
    { macro: "fiber", planned: planned.fiberG, actual: actual.fiberG, tol: FIBER_HAS_NO_TOLERANCE },
  ];

  const deviations = rows.map(({ macro, planned: p, actual: a, tol }) => {
    const pct = deviationPct(p, a);
    return {
      macro,
      deviationPct: round1(pct),
      tolerancePct: tol,
      withinTolerance: tol === null ? true : Math.abs(pct) <= tol,
    };
  });

  const exceeded = deviations
    .filter((row) => !row.withinTolerance)
    .map((row) => row.macro);

  return {
    deviations,
    withinTolerance: exceeded.length === 0,
    exceeded,
  };
}
