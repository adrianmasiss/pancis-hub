/**
 * La vista Hoy: que toca comer, que llevas, que queda (doc 13).
 *
 * La pantalla de inicio ensenaba el consumido contra el objetivo y nada mas.
 * Faltaba la columna que responde la pregunta de verdad — "¿lo que tengo
 * planificado me lleva a donde quiero?" — y el restante, que hasta ahora el
 * usuario tenia que calcular de cabeza.
 *
 * Las tolerancias por macro ya existian (`nutrition/lib/tolerances`) y no las
 * usaba ninguna pantalla. Aqui entran, y con dos preguntas distintas que
 * conviene no mezclar:
 *
 *  1. ¿El PLAN del dia cumple el objetivo? Se puede responder por la manana,
 *     antes de comer nada, y es lo que justifica cambiar el plan.
 *  2. ¿Lo CONSUMIDO ya se paso del objetivo? Solo cuenta el exceso: quedarse
 *     corto a las 10 de la manana no es una desviacion, es que el dia empieza.
 *
 * Funciones puras: no leen base de datos ni saben de React.
 */

import type { MacroSet } from "@/features/nutrition/lib/macros";
import {
  evaluateTolerances,
  type MacroTolerances,
  type ToleranceKey,
  type ToleranceReport,
} from "@/features/nutrition/lib/tolerances";

export type TodayMacroRow = {
  macro: ToleranceKey;
  target: number;
  /** null cuando no hay dieta activa: no es cero, es que no se sabe. */
  planned: number | null;
  consumed: number;
  /** Objetivo menos consumido. Negativo cuando ya se paso. */
  remaining: number;
};

export type TodayNutrition = {
  rows: TodayMacroRow[];
  /**
   * El plan del dia contra el objetivo. null si no hay dieta activa: sin plan
   * no hay nada que evaluar, y un informe vacio se leeria como "todo bien".
   */
  planVsTarget: ToleranceReport | null;
  /** Macros donde lo consumido ya supera el objetivo mas su tolerancia. */
  exceeded: ToleranceKey[];
  /** true si no hay ni una comida registrada: el dia no ha empezado. */
  nothingLogged: boolean;
};

const round1 = (value: number) => Math.round(value * 10) / 10;

const MACRO_FIELDS: { macro: ToleranceKey; field: keyof MacroSet }[] = [
  { macro: "calories", field: "calories" },
  { macro: "protein", field: "proteinG" },
  { macro: "carbs", field: "carbohydrateG" },
  { macro: "fat", field: "fatG" },
  { macro: "fiber", field: "fiberG" },
];

export function buildTodayNutrition({
  target,
  planned,
  consumed,
  tolerances,
}: {
  target: MacroSet;
  planned: MacroSet | null;
  consumed: MacroSet;
  tolerances: MacroTolerances;
}): TodayNutrition {
  const rows = MACRO_FIELDS.map(({ macro, field }) => ({
    macro,
    target: round1(target[field]),
    planned: planned ? round1(planned[field]) : null,
    consumed: round1(consumed[field]),
    remaining: round1(target[field] - consumed[field]),
  }));

  const planVsTarget = planned
    ? evaluateTolerances(target, planned, tolerances)
    : null;

  // Solo el exceso. `evaluateTolerances` marca fuera de tolerancia en ambos
  // sentidos, y quedarse corto a media manana no es una desviacion: es que
  // todavia queda dia por delante.
  const consumedReport = evaluateTolerances(target, consumed, tolerances);
  const exceeded = consumedReport.deviations
    .filter((row) => !row.withinTolerance && row.deviationPct > 0)
    .map((row) => row.macro);

  const nothingLogged = MACRO_FIELDS.every(
    ({ field }) => consumed[field] === 0,
  );

  return { rows, planVsTarget, exceeded, nothingLogged };
}
