/**
 * Las cuentas de la pantalla de Progreso en el telefono (nov 2026): que
 * metricas se siguen, su serie en el tiempo, cuanto cambiaron en el rango
 * elegido, si ese cambio es bueno para la meta y donde cae una cifra en el
 * rango normal que imprime el InBody. Sin React y sin Supabase.
 */

import type { MeasurementView } from "../queries";
import type { PrimaryGoal } from "./composition";

export type TrendKey =
  | "weightKg"
  | "bodyFatPercentage"
  | "skeletalMuscleKg"
  | "waistCm"
  | "chestCm"
  | "armCm";

export type TrendDef = {
  key: TrendKey;
  label: string;
  /** Nombre corto para la pestaña del grafico. */
  short: string;
  unit: string;
  color: string;
  /**
   * Hacia donde es bueno ir. `meta`: depende del objetivo (el peso), sin
   * objetivo claro no se califica.
   */
  better: "baja" | "sube" | "meta";
  /** Por debajo, el cambio es ruido de la bascula o de la cinta. */
  noise: number;
};

export const TRENDS: TrendDef[] = [
  {
    key: "weightKg",
    label: "Peso",
    short: "Peso",
    unit: "kg",
    color: "var(--m-accent-line)",
    better: "meta",
    noise: 0.3,
  },
  {
    key: "bodyFatPercentage",
    label: "% de grasa",
    short: "Grasa",
    unit: "%",
    color: "var(--m-serie-grasa)",
    better: "baja",
    noise: 0.4,
  },
  {
    key: "skeletalMuscleKg",
    label: "Músculo",
    short: "Músculo",
    unit: "kg",
    color: "var(--m-serie-musculo)",
    better: "sube",
    noise: 0.3,
  },
  {
    key: "waistCm",
    label: "Cintura",
    short: "Cintura",
    unit: "cm",
    color: "var(--m-serie-cintura)",
    better: "baja",
    noise: 0.5,
  },
  {
    key: "chestCm",
    label: "Pecho",
    short: "Pecho",
    unit: "cm",
    color: "var(--m-serie-pecho)",
    better: "sube",
    noise: 0.5,
  },
  {
    key: "armCm",
    label: "Brazo",
    short: "Brazo",
    unit: "cm",
    color: "var(--m-serie-brazo)",
    better: "sube",
    noise: 0.3,
  },
];

export const trendDef = (key: TrendKey) => TRENDS.find((t) => t.key === key)!;

export type Point = { date: string; value: number };

/** La serie de una metrica, de la mas vieja a la mas nueva. */
export function seriesOf(
  measurements: readonly MeasurementView[],
  key: TrendKey,
): Point[] {
  return measurements
    .filter((m) => m[key] !== null)
    .map((m) => ({ date: m.measuredAt, value: m[key] as number }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Lo que cae en el rango (`desde` en adelante). Si en el rango hay un solo
 * punto, se suma el anterior: sin el no hay contra que medir el cambio.
 */
export function inRange(series: readonly Point[], desde: string): Point[] {
  const dentro = series.filter((p) => p.date >= desde);
  if (dentro.length >= 2 || series.length < 2) return dentro;
  const antes = series.filter((p) => p.date < desde).at(-1);
  return antes ? [antes, ...dentro] : dentro;
}

export type Tone = "good" | "bad" | "neutral";

/** El objetivo dice si bajar de peso es bueno. */
export function changeTone(
  def: Pick<TrendDef, "better" | "noise">,
  delta: number | null,
  goal: PrimaryGoal | null,
): Tone {
  if (delta === null || Math.abs(delta) < def.noise) return "neutral";
  const better =
    def.better === "meta"
      ? goal === "perdida_grasa"
        ? "baja"
        : goal === "ganancia_muscular"
          ? "sube"
          : null
      : def.better;
  if (!better) return "neutral";
  return delta < 0 === (better === "baja") ? "good" : "bad";
}

export type RangeZone = "bajo" | "normal" | "alto";

/**
 * Donde cae una cifra en la barra Bajo · Normal · Alto. La zona normal ocupa
 * el tercio del medio; afuera, la escala sigue con el mismo ancho del rango
 * normal y se topa en los bordes. `lowZone: false` (grasa visceral: no hay
 * «bajo») reparte la barra en Normal (2/3) y Alto (1/3).
 */
export function rangePosition(
  value: number,
  [min, max]: readonly [number, number],
  lowZone = true,
): { pos: number; zone: RangeZone } {
  const span = Math.max(1e-6, max - min);
  const clamp = (v: number) => Math.min(1, Math.max(0, v));
  if (!lowZone) {
    const zone = value > max ? "alto" : "normal";
    const pos =
      value <= max
        ? clamp(((value - min) / span) * (2 / 3))
        : clamp(2 / 3 + ((value - max) / span) * (1 / 3));
    return { pos, zone };
  }
  const zone = value < min ? "bajo" : value > max ? "alto" : "normal";
  const pos = clamp(1 / 3 + ((value - min) / span) * (1 / 3));
  return { pos, zone };
}

/** La ultima medicion con ese dato y la anterior a ella que tambien lo trae. */
export function latestPair<K extends keyof MeasurementView>(
  measurements: readonly MeasurementView[],
  key: K,
): { current: MeasurementView | null; previous: MeasurementView | null } {
  // `measurements` viene de la mas nueva a la mas vieja.
  const con = measurements.filter((m) => m[key] !== null);
  return { current: con[0] ?? null, previous: con[1] ?? null };
}
