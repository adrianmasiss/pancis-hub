/**
 * Deteccion de patrones simples sobre el diario. Son observaciones
 * descriptivas de los datos del propio usuario; NUNCA se presentan como
 * causalidad (docs/02_PRODUCT_REQUIREMENTS.md).
 */
import { streakDays } from "@/lib/trends";

export type CheckinRecord = {
  date: string;
  sleepHours: number | null;
  hunger: number | null;
  stress: number | null;
  soreness: number | null;
};

export type PatternKey =
  | "lowSleep"
  | "highStress"
  | "highHunger"
  | "persistentSoreness"
  | "goodStreak";

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function detectPatterns(
  checkins: CheckinRecord[],
  reference: Date = new Date(),
): PatternKey[] {
  const patterns: PatternKey[] = [];
  const referenceMs = reference.getTime();
  const last7 = checkins.filter(
    (checkin) =>
      referenceMs - new Date(`${checkin.date}T00:00:00Z`).getTime() <
      7 * 86400000,
  );

  const sleepValues = last7
    .map((checkin) => checkin.sleepHours)
    .filter((value): value is number => value !== null);
  const sleepAverage = average(sleepValues);
  if (sleepValues.length >= 3 && sleepAverage !== null && sleepAverage < 6.5) {
    patterns.push("lowSleep");
  }

  const stressValues = last7
    .map((checkin) => checkin.stress)
    .filter((value): value is number => value !== null);
  const stressAverage = average(stressValues);
  if (
    stressValues.length >= 3 &&
    stressAverage !== null &&
    stressAverage >= 4
  ) {
    patterns.push("highStress");
  }

  const highHungerDays = last7.filter(
    (checkin) => (checkin.hunger ?? 0) >= 4,
  ).length;
  if (highHungerDays >= 3) {
    patterns.push("highHunger");
  }

  const highSorenessDays = last7.filter(
    (checkin) => (checkin.soreness ?? 0) >= 4,
  ).length;
  if (highSorenessDays >= 3) {
    patterns.push("persistentSoreness");
  }

  if (
    streakDays(
      checkins.map((checkin) => checkin.date),
      reference,
    ) >= 5
  ) {
    patterns.push("goodStreak");
  }

  return patterns;
}
