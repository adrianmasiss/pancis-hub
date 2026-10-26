import type {
  PlanDayView,
  SessionSummary,
  TrainingOverview,
} from "@/features/training/queries";
import {
  capital,
  enumerar,
  musculosDelDia,
} from "@/features/training/components/training-ui";
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

export type WeekState = "done" | "repeat" | "plan" | "rest";

export type WeekDay = {
  letra: string;
  nombre: string;
  date: string;
  state: WeekState;
  /** Hoy lleva anillo en acento, este entrenado o no. */
  today: boolean;
  /** Lo que se entreno o toca ese dia («Día 2 · Pierna»), si se sabe. */
  detail: string | null;
};

type PlanDay = { id: string; title: string };

/** El nombre de un dia del plan, o sus musculos principales si no tiene. */
export function dayTitle(day: PlanDayView): string {
  const musculos = musculosDelDia(day.exercises).slice(0, 3);
  return (
    day.name?.trim() ||
    (musculos.length ? capital(enumerar(musculos)) : "Día sin ejercicios")
  );
}

/** Los dias del plan como los necesita la semana. */
export function planDaysOf(days: PlanDayView[] | undefined): PlanDay[] {
  return (days ?? []).map((d) => ({ id: d.id, title: dayTitle(d) }));
}

/**
 * La semana de lunes a domingo, en la zona del usuario (`today` ya viene en
 * esa zona). Estados explicitos:
 *
 *  - entrenado: hubo una sesion terminada ese dia;
 *  - repetido: la sesion fue de un dia del plan ya hecho antes en la semana;
 *  - planeado: los proximos dias que faltan para completar la rutina —el
 *    plan no fija dias de la semana, asi que se reparten desde mañana (o
 *    desde hoy, si hoy aun no se entreno)—;
 *  - descanso: el resto.
 */
export function buildWeek({
  today,
  timezone,
  recentSessions,
  doneThisWeek,
  weekSessions = [],
  planDays = [],
  todayDone = false,
}: {
  today: string;
  timezone: string;
  recentSessions: SessionSummary[];
  doneThisWeek: Record<string, string>;
  weekSessions?: TrainingOverview["weekSessions"];
  planDays?: PlanDay[];
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
  if (todayDone) trained.add(today);

  const numero = new Map(planDays.map((d, i) => [d.id, i + 1]));
  const titulo = new Map(planDays.map((d) => [d.id, d.title]));
  const porFecha = new Map<string, { repeated: boolean; detail: string }>();
  for (const s of weekSessions) {
    const n = numero.get(s.planDayId);
    const detail = n
      ? `Día ${n} · ${titulo.get(s.planDayId) ?? ""}`.replace(/ · $/, "")
      : "Entreno";
    const previo = porFecha.get(s.date);
    porFecha.set(s.date, {
      repeated: (previo?.repeated ?? false) || s.repeated,
      detail: previo ? `${previo.detail} + ${detail}` : detail,
    });
  }

  // Lo que falta de la rutina esta semana, en el orden del plan.
  const pendientes = planDays.filter((d) => !(d.id in doneThisWeek));
  let siguiente = 0;

  return LETRAS.map((letra, i) => {
    const date = addDaysISO(monday, i);
    const sesion = porFecha.get(date);
    let state: WeekState = "rest";
    let detail: string | null = null;
    if (trained.has(date)) {
      state = sesion?.repeated ? "repeat" : "done";
      detail = sesion?.detail ?? "Entreno";
    } else if (date >= today && siguiente < pendientes.length) {
      const toca = pendientes[siguiente++]!;
      state = "plan";
      detail = `Día ${numero.get(toca.id)} · ${toca.title}`;
    }
    return {
      letra,
      nombre: NOMBRES[i]!,
      date,
      state,
      today: date === today,
      detail,
    };
  });
}
