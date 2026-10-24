"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  Barcode,
  Camera,
  ChevronRight,
  Flame,
  MapPin,
  Play,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { startSession } from "@/features/training/actions";
import type { DayPlan } from "@/features/nutrition/queries";
import type { DietTemplateView } from "@/features/dashboard/queries";
import type { PlanDayView } from "@/features/training/queries";
import { consumedTotals } from "@/features/nutrition/lib/day-overview";
import { useWater } from "@/features/nutrition/components/use-water";
import { estimatedMinutes } from "@/features/training/lib/stats";
import { useMobile } from "@/mobile/shell/mobile-shell";
import { Bar, Ring } from "@/mobile/ui/display";
import { useUnits } from "@/mobile/units";
import {
  MACROS,
  gramos,
  kcal,
  litros,
  mealLabel,
} from "@/mobile/screens/nutrition/format";
import { dayTitle } from "@/mobile/screens/training/today";
import { WeekStrip, type WeekDay } from "@/mobile/screens/training/week";
import type { Insight } from "./insight";

export type WeightSummary = {
  kg: number;
  /** Cambio frente a hace 4 semanas, en kg; null sin medida de referencia. */
  change4w: number | null;
  /** -1 si el objetivo es bajar, 1 si es subir, 0 si no hay direccion. */
  direction: -1 | 0 | 1;
  /** Ultimas medidas, de la mas vieja a la mas nueva, para la linea. */
  points: number[];
};

function fechaLarga(dateISO: string): string {
  const s = new Intl.DateTimeFormat("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${dateISO}T12:00:00Z`));
  return s.charAt(0).toUpperCase() + s.slice(1).replace(",", "");
}

function initials(name: string): string {
  const parts = name.replace(/@.*/, "").trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second =
    parts.length > 1 ? (parts.at(-1)?.[0] ?? "") : (parts[0]?.[1] ?? "");
  return (first + second).toUpperCase();
}

/** La linea de tendencia del peso, en un lienzo de 134 × 44. */
function sparkPath(points: number[]): string | null {
  if (points.length < 2) return null;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  return points
    .map((v, i) => {
      const x = ((i * 134) / (points.length - 1)).toFixed(1);
      const y = (4 + ((max - v) / span) * 36).toFixed(1);
      return `${i ? "L" : "M"}${x} ${y}`;
    })
    .join(" ");
}

/**
 * Inicio: solo resume. Encabezado con racha; entreno de hoy con la semana y
 * «Empezar»; nutricion (anillo, macros y la siguiente comida); agua y peso;
 * el consejo del copiloto (por reglas, se oculta si no hay); accesos.
 */
export function HomeView({
  extraKcal,
  displayName,
  today,
  day,
  diet,
  activePlanId,
  nextDay,
  nextDayNumber,
  doneToday,
  sessionInProgress,
  week,
  streak,
  weight,
  insight,
}: {
  /** Kcal sumadas a la meta por el entreno de hoy (0 si no aplica). */
  extraKcal: number;
  displayName: string;
  today: string;
  day: DayPlan;
  diet: DietTemplateView | null;
  activePlanId: string | null;
  nextDay: PlanDayView | null;
  nextDayNumber: number;
  doneToday: boolean;
  sessionInProgress: boolean;
  week: WeekDay[];
  streak: number;
  weight: WeightSummary | null;
  insight: Insight | null;
}) {
  const { avatarUrl } = useMobile();
  const u = useUnits();
  const [starting, startTransition] = useTransition();
  const water = useWater({
    date: today,
    ml: day.waterMl,
    targetMl: day.waterMlTarget,
  });

  const meals = diet?.meals ?? [];
  const next = meals.find((m) => !m.loggedToday) ?? null;
  const consumed = consumedTotals(day.meals);
  const baseTarget = day.targets?.calories ?? diet?.targetCalories ?? null;
  const target = baseTarget !== null ? baseTarget + extraKcal : null;
  const restantes =
    target !== null ? Math.max(0, target - consumed.calories) : null;

  const exercises = nextDay?.exercises ?? [];
  const nombre = displayName.split(/[\s@]/)[0] ?? "";

  const empezar = () =>
    startTransition(async () => {
      const result = await startSession({
        planId: activePlanId ?? undefined,
        planDayId: nextDay?.id,
      });
      if (result && "error" in result) toast.error(result.error);
    });

  const waterTarget = day.waterMlTarget ?? 0;
  const llenos = waterTarget
    ? Math.min(10, Math.floor((water.shown / waterTarget) * 10))
    : 0;

  const spark = weight ? sparkPath(weight.points) : null;
  const change = weight?.change4w ?? null;
  const tone =
    change === null || weight?.direction === 0 || Math.abs(change) < 0.05
      ? undefined
      : Math.sign(change) === weight?.direction
        ? "positive"
        : "caution";

  return (
    <div className="m-screen m-home">
      <div className="m-home-glow" aria-hidden="true" />
      <header className="m-home-head">
        <Link
          href="/configuracion"
          aria-label="Perfil y configuración"
          className="m-home-avatar m-press"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- URL firmada de Supabase
            <img src={avatarUrl} alt="" />
          ) : (
            initials(displayName)
          )}
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="m-home-date">{fechaLarga(today)}</div>
          <h1 className="m-home-hello">Hola{nombre ? `, ${nombre}` : ""}</h1>
        </div>
        <div
          className="m-home-streak"
          role="img"
          aria-label={`Racha de ${streak} ${streak === 1 ? "día" : "días"}`}
        >
          <Flame
            size={16}
            fill="currentColor"
            strokeWidth={0}
            aria-hidden="true"
          />
          <span className="m-num">{streak}</span>
        </div>
      </header>

      <div className="m-body m-stagger m-home-body">
        {/* Entreno de hoy */}
        <section
          className="m-card m-home-train"
          data-glow=""
          aria-labelledby="m-home-train"
        >
          <div className="m-home-row">
            <span className="m-eyebrow" data-tone="accent">
              {!nextDay
                ? "Entreno"
                : doneToday && !sessionInProgress
                  ? "Hecho hoy"
                  : `Entreno de hoy · Día ${nextDayNumber}`}
            </span>
            <Link href="/entrenamiento?vista=hoy" className="m-home-link">
              Ver rutina
            </Link>
          </div>
          {nextDay ? (
            <>
              <h2 id="m-home-train" className="m-home-title">
                {doneToday && !sessionInProgress
                  ? "Listo por hoy"
                  : dayTitle(nextDay)}
              </h2>
              <WeekStrip week={week} />
              <div className="m-home-row" style={{ gap: 12 }}>
                <div className="m-home-mini">
                  {doneToday && !sessionInProgress ? (
                    <div>
                      <div className="m-home-mini-value">
                        Día {nextDayNumber}
                      </div>
                      <div className="m-home-mini-label">
                        Próxima: {dayTitle(nextDay)}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="m-home-mini-value m-num">
                          {exercises.length}
                        </div>
                        <div className="m-home-mini-label">ejercicios</div>
                      </div>
                      <div>
                        <div className="m-home-mini-value m-num">
                          ~{estimatedMinutes(exercises)}&apos;
                        </div>
                        <div className="m-home-mini-label">duración</div>
                      </div>
                    </>
                  )}
                </div>
                {sessionInProgress ? (
                  <Link
                    href="/entrenamiento?vista=sesion"
                    className="m-btn m-press"
                    data-variant="primary"
                  >
                    <Play size={14} fill="currentColor" aria-hidden="true" />
                    Continuar
                  </Link>
                ) : doneToday ? null : (
                  <button
                    type="button"
                    className="m-btn m-press"
                    data-variant="primary"
                    disabled={starting}
                    onClick={empezar}
                  >
                    <Play size={14} fill="currentColor" aria-hidden="true" />
                    {starting ? "Empezando…" : "Empezar"}
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <h2 id="m-home-train" className="m-home-title">
                Sin rutina activa
              </h2>
              <p className="m-sheet-text">
                Importa la de tu coach o deja que la IA arme una.
              </p>
              <Link
                href="/entrenamiento?vista=rutinas"
                className="m-btn m-press"
                data-variant="primary"
              >
                Elegir rutina
              </Link>
            </>
          )}
        </section>

        {/* Nutricion */}
        <Link
          href="/nutricion"
          className="m-card m-press m-home-nutri"
          aria-label={
            restantes !== null
              ? `Nutrición: ${kcal(restantes)} kilocalorías restantes`
              : "Nutrición de hoy"
          }
        >
          <span className="m-home-row">
            <span className="m-eyebrow">Nutrición</span>
            <ChevronRight size={16} aria-hidden="true" className="m-faint" />
          </span>
          <span className="m-row" style={{ gap: 16 }}>
            <Ring
              value={target ? consumed.calories / target : 0}
              size={92}
              stroke={8}
            >
              <span className="m-num m-home-ring-value">
                {restantes !== null ? kcal(restantes) : "—"}
              </span>
              <span className="m-home-ring-label">restantes</span>
            </Ring>
            <span className="m-stack" style={{ flex: 1, gap: 9 }}>
              {MACROS.slice(0, 3).map((m) => {
                const goal = day.targets?.[m.key] ?? null;
                return (
                  <span key={m.key} className="m-stack" style={{ gap: 4 }}>
                    <span className="m-home-macro">
                      <span>{m.label}</span>
                      <span className="m-num">
                        {gramos(consumed[m.key])}
                        {goal ? ` / ${gramos(goal)}` : ""} g
                      </span>
                    </span>
                    <Bar
                      value={goal ? consumed[m.key] / goal : 0}
                      color={m.color}
                    />
                  </span>
                );
              })}
            </span>
          </span>
          {next ? (
            <span className="m-home-next">
              {next.scheduledTime && (
                <span className="m-num m-home-next-time">
                  {next.scheduledTime.slice(0, 5)}
                </span>
              )}
              <span className="m-home-next-name">
                Siguiente: {mealLabel(next.mealType, next.name)}
              </span>
              <span className="m-num m-home-next-time">
                {kcal(next.totals.calories)}
              </span>
            </span>
          ) : meals.length > 0 ? (
            <span className="m-home-next">
              <span className="m-home-next-name">Plan del día completo</span>
            </span>
          ) : null}
        </Link>

        {/* Agua y peso */}
        <div className="m-home-pair">
          <section
            className="m-card m-home-water"
            aria-labelledby="m-home-water"
          >
            <h2 id="m-home-water" className="m-home-small-label">
              Agua
            </h2>
            <div className="m-home-big m-num">
              {litros(water.shown)}{" "}
              <small>{waterTarget ? `/ ${litros(waterTarget)} L` : "L"}</small>
            </div>
            {waterTarget > 0 && (
              <div className="m-home-drops" aria-hidden="true">
                {Array.from({ length: 10 }, (_, i) => (
                  <span key={i} data-on={i < llenos ? "" : undefined} />
                ))}
              </div>
            )}
            <button
              type="button"
              className="m-btn m-press"
              data-variant="soft"
              disabled={water.pending}
              onClick={() => water.add(250)}
            >
              +250 ml
            </button>
          </section>

          <Link
            href="/progreso"
            className="m-card m-press m-home-weight"
            aria-label={
              weight
                ? `Peso: ${u.fmtWeight(weight.kg)} ${u.weightUnit}`
                : "Registrar peso en Progreso"
            }
          >
            <span className="m-home-small-label">Peso</span>
            {weight ? (
              <>
                <span className="m-home-big m-num">
                  {u.fmtWeight(weight.kg)} <small>{u.weightUnit}</small>
                </span>
                {change !== null && (
                  <span className="m-home-change" data-tone={tone}>
                    {change > 0 ? "+" : change < 0 ? "−" : ""}
                    {u.fmtWeight(Math.abs(change))} {u.weightUnit} en 4 sem
                  </span>
                )}
                {spark && (
                  <svg
                    className="m-home-spark"
                    width="100%"
                    height="44"
                    viewBox="0 0 134 44"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                  >
                    <path d={spark} pathLength={1} />
                  </svg>
                )}
              </>
            ) : (
              <span className="m-sub">Sin medidas recientes</span>
            )}
          </Link>
        </div>

        {/* Consejo del copiloto: se oculta si no hay nada relevante */}
        {insight && (
          <Link
            href={`/asistente?q=${encodeURIComponent(insight.ask)}`}
            className="m-home-insight m-press"
          >
            <span className="m-home-insight-icon" aria-hidden="true">
              <Sparkles size={18} />
            </span>
            <span style={{ flex: 1 }}>
              <span className="m-home-insight-label">Copiloto</span>
              <span className="m-home-insight-text">{insight.text}</span>
              <span className="m-home-insight-cta">
                Preguntar algo
                <ChevronRight size={14} strokeWidth={2.5} aria-hidden="true" />
              </span>
            </span>
          </Link>
        )}

        {/* Accesos rapidos */}
        <nav className="m-grid-3" aria-label="Accesos rápidos">
          <Link href="/progreso?vista=fotos" className="m-add-tile m-press">
            <Camera size={20} aria-hidden="true" />
            Foto de progreso
          </Link>
          <Link href="/nutricion?vista=escanear" className="m-add-tile m-press">
            <Barcode size={20} aria-hidden="true" />
            Escanear
          </Link>
          <Link href="/nutricion?vista=fuera" className="m-add-tile m-press">
            <MapPin size={20} aria-hidden="true" />
            Comer fuera
          </Link>
        </nav>
      </div>
    </div>
  );
}
