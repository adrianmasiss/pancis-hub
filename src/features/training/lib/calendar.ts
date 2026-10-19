/**
 * El mes del historial: semanas de lunes a domingo, con fechas YYYY-MM-DD.
 * Las celdas fuera del mes van vacías (null) para que la rejilla cuadre.
 */
import { addDaysISO, weekBoundsISO } from "@/lib/dates";

export type MonthGrid = {
  month: string;
  weeks: (string | null)[][];
};

/** «2026-10» → el mes anterior o siguiente. */
export function shiftMonth(month: string, delta: number): string {
  const [y = 1970, m = 1] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

export function monthGrid(month: string): MonthGrid {
  const first = `${month}-01`;
  const last = addDaysISO(`${shiftMonth(month, 1)}-01`, -1);
  const weeks: (string | null)[][] = [];
  for (
    let day = weekBoundsISO(first).start;
    day <= last;
    day = addDaysISO(day, 7)
  ) {
    weeks.push(
      Array.from({ length: 7 }, (_, i) => {
        const d = addDaysISO(day, i);
        return d.startsWith(month) ? d : null;
      }),
    );
  }
  return { month, weeks };
}

/** Agrupa por fecha local lo que ya viene fechado. */
export function groupByDate<T>(
  items: readonly T[],
  dateOf: (item: T) => string,
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const d = dateOf(item);
    map.set(d, [...(map.get(d) ?? []), item]);
  }
  return map;
}
