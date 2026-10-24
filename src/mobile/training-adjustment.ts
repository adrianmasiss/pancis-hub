import { createClient } from "@/lib/supabase/server";
import { getTrainingOverview } from "@/features/training/queries";
import { estimatedMinutes } from "@/features/training/lib/stats";
import { localDateOf } from "@/lib/dates";

/** Gasto de una sesion de pesas: MET 5 (fuerza, esfuerzo vigoroso). */
const MET_FUERZA = 5;
const PESO_POR_DEFECTO_KG = 70;

export type TrainingAdjustment = {
  /** Si el ajuste esta encendido (preferencia o, sin ella, segun la dieta). */
  enabled: boolean;
  /** true si el usuario no eligio: vale el defecto por el origen de la dieta. */
  byDefault: boolean;
  dietOrigin: "nutricionista" | "ia" | "manual" | null;
  /** Kcal que se suman hoy; 0 si no hay entreno o esta apagado. */
  kcal: number;
  /** «Dia B», para el aviso. */
  dayName: string | null;
  /** Si sale de un entreno ya hecho hoy o del que toca. */
  basis: "hecho" | "previsto" | null;
};

/**
 * Ajuste de la meta de calorias por entreno, solo para hoy.
 *
 * Deterministico, no IA: MET de fuerza × peso × minutos del entreno de hoy
 * (los reales si ya entreno, la duracion estimada del dia que toca si no).
 * Apagado por defecto si la dieta es del nutricionista; encendido si la hizo
 * la IA. El usuario lo cambia en Perfil.
 */
export async function getTrainingAdjustment(
  userId: string,
  today: string,
  timezone: string,
): Promise<TrainingAdjustment> {
  const supabase = await createClient();
  const [{ data: profile }, { data: diet }, { data: peso }] = await Promise.all(
    [
      supabase
        .from("profiles")
        .select("training_adjustment")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("diet_templates")
        .select("origin")
        .eq("user_id", userId)
        .eq("is_active", true)
        .maybeSingle(),
      supabase
        .from("body_measurements")
        .select("weight_kg")
        .eq("user_id", userId)
        .not("weight_kg", "is", null)
        .order("measured_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ],
  );
  const dietOrigin = (diet?.origin as TrainingAdjustment["dietOrigin"]) ?? null;
  const pref = profile?.training_adjustment ?? null;
  const enabled = pref ?? dietOrigin === "ia";
  const base: TrainingAdjustment = {
    enabled,
    byDefault: pref === null,
    dietOrigin,
    kcal: 0,
    dayName: null,
    basis: null,
  };
  if (!enabled) return base;

  const overview = await getTrainingOverview(userId, { date: today, timezone });
  const hoy = overview.recentSessions.filter(
    (s) => localDateOf(s.startedAt, timezone) === today,
  );
  let minutos = 0;
  let basis: TrainingAdjustment["basis"] = null;
  let dayName: string | null = null;
  const days = overview.activePlan?.days ?? [];
  if (hoy.length) {
    minutos = hoy.reduce((t, s) => t + (s.durationMinutes ?? 0), 0);
    basis = "hecho";
    dayName = days.find((d) => d.id === hoy[0]?.planDayId)?.name ?? null;
  }
  if (!minutos) {
    // El dia que toca: el siguiente al de la ultima sesion.
    let next = days[0] ?? null;
    const last = overview.recentSessions[0]?.planDayId;
    const i = last ? days.findIndex((d) => d.id === last) : -1;
    if (i >= 0) next = days[(i + 1) % days.length] ?? next;
    if (next) {
      minutos = estimatedMinutes(next.exercises);
      basis = "previsto";
      dayName = next.name;
    }
  }
  if (!minutos) return base;

  const kg = peso?.weight_kg ? Number(peso.weight_kg) : PESO_POR_DEFECTO_KG;
  const kcal = Math.round((MET_FUERZA * kg * (minutos / 60)) / 10) * 10;
  return { ...base, kcal, dayName, basis };
}
