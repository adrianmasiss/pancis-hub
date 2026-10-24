import type { SessionSummary } from "@/features/training/queries";
import { addDaysISO, localDateOf, weekBoundsISO } from "@/lib/dates";

const LETRAS = ["L", "K", "M", "J", "V", "S", "D"];
const NOMBRES = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export type WeekDay = {
  letra: string;
  nombre: string;
  date: string;
  state: "done" | "today" | "plan" | "rest";
};

/** La semana de lunes a domingo, con lo entrenado por fecha local. */
export function buildWeek({
  today,
  timezone,
  recentSessions,
  doneThisWeek,
  todayDone = false,
}: {
  today: string;
  timezone: string;
  recentSessions: SessionSummary[];
  doneThisWeek: Record<string, string>;
  /** En el resumen, hoy cuenta como entrenado aunque no se haya guardado. */
  todayDone?: boolean;
}): WeekDay[] {
  const { start: monday } = weekBoundsISO(today);
  const trained = new Set(
    recentSessions
      .filter((s) => s.completedAt)
      .map((s) => localDateOf(s.startedAt, timezone)),
  );
  for (const date of Object.values(doneThisWeek)) trained.add(date);
  return LETRAS.map((letra, i) => {
    const date = addDaysISO(monday, i);
    const state: WeekDay["state"] =
      date === today && todayDone
        ? "today"
        : trained.has(date)
          ? "done"
          : date === today
            ? "today"
            : date > today
              ? "plan"
              : "rest";
    return { letra, nombre: NOMBRES[i]!, date, state };
  });
}

const ESTADO: Record<WeekDay["state"], string> = {
  today: "hoy",
  done: "entrenado",
  plan: "por venir",
  rest: "descanso",
};

export function WeekStrip({ week }: { week: WeekDay[] }) {
  return (
    <ol className="m-week" aria-label="Esta semana">
      {week.map((d) => (
        <li key={d.date}>
          <span className="m-week-letter" aria-hidden="true">
            {d.letra}
          </span>
          <span
            className="m-week-dot"
            data-state={d.state}
            role="img"
            aria-label={`${d.nombre}: ${ESTADO[d.state]}`}
          />
        </li>
      ))}
    </ol>
  );
}
