/**
 * Calculos puros de tendencias para peso y otras series temporales.
 *
 * Regla de producto: una fluctuacion diaria de peso NO se interpreta como
 * variacion real de grasa; las comparaciones se hacen sobre promedios
 * moviles de varios dias (docs/02_PRODUCT_REQUIREMENTS.md).
 */

export type DatedValue = {
  /** Fecha en formato YYYY-MM-DD. */
  date: string;
  value: number;
};

export type TrendDirection = "sube" | "baja" | "estable";

/**
 * Promedio movil hacia atras: para cada punto, promedia los valores dentro
 * de la ventana de dias anteriores (incluido el propio dia). Funciona con
 * series irregulares (dias faltantes).
 */
export function movingAverage(
  series: DatedValue[],
  windowDays: number,
): DatedValue[] {
  const sorted = [...series].sort((a, b) => a.date.localeCompare(b.date));
  return sorted.map((point) => {
    const end = toUtcDate(point.date).getTime();
    const start = end - (windowDays - 1) * 86400000;
    const inWindow = sorted.filter((candidate) => {
      const time = toUtcDate(candidate.date).getTime();
      return time >= start && time <= end;
    });
    const sum = inWindow.reduce((total, item) => total + item.value, 0);
    return { date: point.date, value: round1(sum / inWindow.length) };
  });
}

/**
 * Diferencia entre el promedio de los ultimos `windowDays` y el promedio de
 * la ventana anterior equivalente. Devuelve null si alguna ventana no tiene
 * datos (no se inventa una tendencia sin evidencia).
 */
export function windowDifference(
  series: DatedValue[],
  windowDays: number,
  reference: Date = new Date(),
): number | null {
  const end = startOfUtcDay(reference).getTime();
  const currentStart = end - (windowDays - 1) * 86400000;
  const previousStart = currentStart - windowDays * 86400000;
  const previousEnd = currentStart - 86400000;

  const current = averageInRange(series, currentStart, end);
  const previous = averageInRange(series, previousStart, previousEnd);
  if (current === null || previous === null) return null;
  return round1(current - previous);
}

/**
 * Direccion de la tendencia con umbral: cambios menores al umbral se
 * consideran estables (evita falsa precision).
 */
export function trendDirection(
  difference: number | null,
  threshold = 0.2,
): TrendDirection | null {
  if (difference === null) return null;
  if (Math.abs(difference) < threshold) return "estable";
  return difference > 0 ? "sube" : "baja";
}

/** Racha de dias consecutivos con registro, contando hacia atras desde hoy o ayer. */
export function streakDays(
  dates: string[],
  reference: Date = new Date(),
): number {
  const set = new Set(dates);
  const today = startOfUtcDay(reference).getTime();
  // La racha se conserva si el ultimo registro fue hoy o ayer.
  let cursor = set.has(formatUtc(today)) ? today : today - 86400000;
  let streak = 0;
  while (set.has(formatUtc(cursor))) {
    streak += 1;
    cursor -= 86400000;
  }
  return streak;
}

function averageInRange(
  series: DatedValue[],
  startMs: number,
  endMs: number,
): number | null {
  const values = series.filter((point) => {
    const time = toUtcDate(point.date).getTime();
    return time >= startMs && time <= endMs;
  });
  if (values.length === 0) return null;
  return values.reduce((total, item) => total + item.value, 0) / values.length;
}

function toUtcDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

function startOfUtcDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function formatUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
