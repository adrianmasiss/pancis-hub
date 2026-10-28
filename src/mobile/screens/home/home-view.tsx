"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ArrowUpRight,
  Barcode,
  Camera,
  Check,
  ChevronRight,
  Flame,
  MapPin,
  Play,
  Sparkles,
} from "lucide-react";
import { triggerHaptic } from "@/lib/haptics";
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
import { ESTADO, type WeekDay } from "@/mobile/screens/training/week";
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

/** «Pierna (Énfasis en cuádriceps)» → título y énfasis por separado. */
function splitTitle(title: string): [string, string | null] {
  const m = /^(.+?)\s*\((.+)\)\s*$/.exec(title);
  return m?.[1] && m[2] ? [m[1], m[2]] : [title, null];
}

/**
 * La semana en fichas: hoy en acento, entrenado con check, planeado con
 * aro, descanso con borde punteado. Tocar una dice que paso o que toca.
 */
function HomeWeek({ week }: { week: WeekDay[] }) {
  const [elegido, setElegido] = useState<string | null>(null);
  const dia = week.find((d) => d.date === elegido) ?? null;

  return (
    <div>
      <ol className="m-home-week" aria-label="Esta semana">
        {week.map((d) => (
          <li key={d.date}>
            <button
              type="button"
              className="m-home-day m-press"
              data-state={d.state}
              data-today={d.today ? "" : undefined}
              aria-pressed={elegido === d.date}
              aria-label={[
                d.nombre,
                d.today ? "hoy" : null,
                ESTADO[d.state],
                d.detail,
              ]
                .filter(Boolean)
                .join(" · ")}
              onClick={() => {
                triggerHaptic("selection");
                setElegido(elegido === d.date ? null : d.date);
              }}
            >
              <span aria-hidden="true">{d.letra}</span>
              {d.state === "done" ? (
                <Check size={11} strokeWidth={3.5} aria-hidden="true" />
              ) : d.state === "repeat" ? (
                <span className="m-home-day-r" aria-hidden="true">
                  R
                </span>
              ) : (
                <i aria-hidden="true" />
              )}
            </button>
          </li>
        ))}
      </ol>
      {dia && (
        <p className="m-home-week-caption" aria-live="polite">
          <strong>
            {dia.nombre}
            {dia.today ? " (hoy)" : ""}
          </strong>{" "}
          · {ESTADO[dia.state]}
          {dia.detail ? ` · ${dia.detail}` : ""}
        </p>
      )}
    </div>
  );
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
  const [titulo, enfasis] = nextDay
    ? splitTitle(dayTitle(nextDay))
    : ["", null];
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
            <span className="m-eyebrow">
              {!nextDay
                ? "Entreno"
                : doneToday && !sessionInProgress
                  ? "Hecho hoy"
                  : `Entreno de hoy · Día ${nextDayNumber}`}
            </span>
            <Link href="/entrenamiento?vista=hoy" className="m-home-link">
              Ver rutina
              <ArrowUpRight size={14} strokeWidth={2.4} aria-hidden="true" />
            </Link>
          </div>
          {nextDay ? (
            <>
              <div>
                <h2 id="m-home-train" className="m-home-title">
                  {doneToday && !sessionInProgress ? "Listo por hoy" : titulo}
                </h2>
                <p className="m-home-sub">
                  {doneToday && !sessionInProgress
                    ? `Próxima: Día ${nextDayNumber} · ${dayTitle(nextDay)}`
                    : [
                        enfasis,
                        `${exercises.length} ${exercises.length === 1 ? "ejercicio" : "ejercicios"}`,
                        `~${estimatedMinutes(exercises)} min`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                </p>
              </div>
              <HomeWeek week={week} />
              {sessionInProgress ? (
                <Link
                  href="/entrenamiento?vista=sesion"
                  className="m-home-go m-press"
                >
                  Continuar entreno
                  <span className="m-home-go-disc" aria-hidden="true">
                    <Play size={14} fill="currentColor" />
                  </span>
                </Link>
              ) : doneToday ? null : (
                <button
                  type="button"
                  className="m-home-go m-press"
                  disabled={starting}
                  onClick={empezar}
                >
                  {starting ? "Empezando…" : "Empezar entreno"}
                  <span className="m-home-go-disc" aria-hidden="true">
                    <Play size={14} fill="currentColor" />
                  </span>
                </button>
              )}
            </>
          ) : (
            <>
              <div>
                <h2 id="m-home-train" className="m-home-title">
                  Sin rutina activa
                </h2>
                <p className="m-home-sub">
                  Importa la de tu coach o deja que la IA arme una.
                </p>
              </div>
              <Link
                href="/entrenamiento?vista=rutinas"
                className="m-home-go m-press"
              >
                Elegir rutina
                <span className="m-home-go-disc" aria-hidden="true">
                  <ArrowUpRight size={16} strokeWidth={2.4} />
                </span>
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
            <span className="m-home-card-title">Nutrición</span>
            <span className="m-home-arrow" aria-hidden="true">
              <ArrowUpRight size={16} strokeWidth={2.2} />
            </span>
          </span>
          <span className="m-row" style={{ gap: 18 }}>
            <Ring
              value={target ? consumed.calories / target : 0}
              size={116}
              stroke={10}
            >
              <span className="m-num m-home-ring-value">
                {restantes !== null ? kcal(restantes) : "—"}
              </span>
              <span className="m-home-ring-label">kcal restantes</span>
            </Ring>
            <span className="m-stack" style={{ flex: 1, gap: 10 }}>
              {MACROS.slice(0, 3).map((m) => {
                const goal = day.targets?.[m.key] ?? null;
                return (
                  <span key={m.key} className="m-stack" style={{ gap: 5 }}>
                    <span className="m-home-macro">
                      <span>{m.label}</span>
                      <span className="m-num">
                        {gramos(consumed[m.key])}
                        <small>{goal ? ` / ${gramos(goal)}` : ""} g</small>
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
              <span className="m-home-next-text">
                <span className="m-home-next-label">
                  Siguiente comida
                  {next.scheduledTime && (
                    <span className="m-num">
                      {" "}
                      · {next.scheduledTime.slice(0, 5)}
                    </span>
                  )}
                </span>
                <span className="m-home-next-name">
                  {mealLabel(next.mealType, next.name)}
                </span>
              </span>
              <span className="m-num m-home-next-kcal">
                {kcal(next.totals.calories)} kcal
              </span>
            </span>
          ) : meals.length > 0 ? (
            <span className="m-home-next">
              <span className="m-home-next-text">
                <span className="m-home-next-label">Plan del día</span>
                <span className="m-home-next-name">Completo</span>
              </span>
              <span className="m-home-next-kcal" aria-hidden="true">
                <Check size={14} strokeWidth={3} />
              </span>
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
              {litros(water.shown)}
              <small>
                {waterTarget ? ` / ${litros(waterTarget)} L` : " L"}
              </small>
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
              + 250 ml
            </button>
          </section>

          <section
            className="m-card m-home-weight"
            aria-labelledby="m-home-weight"
          >
            <h2 id="m-home-weight" className="m-home-small-label">
              Peso
            </h2>
            {weight ? (
              <>
                <div className="m-home-big m-num">
                  {u.fmtWeight(weight.kg)}
                  <small> {u.weightUnit}</small>
                </div>
                {change !== null && Math.abs(change) >= 0.05 ? (
                  <span className="m-home-change" data-tone={tone}>
                    {change > 0 ? "+" : "−"}
                    {u.fmtWeight(Math.abs(change))} {u.weightUnit} en 4 sem
                  </span>
                ) : (
                  <span className="m-home-change">Último registro</span>
                )}
              </>
            ) : (
              <span className="m-home-change">Sin medidas recientes</span>
            )}
            <Link
              href="/progreso"
              className="m-btn m-press"
              data-variant="soft"
            >
              Registrar
            </Link>
          </section>
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
            <span className="m-home-insight-body">
              <span className="m-home-insight-label">Copiloto</span>
              <span className="m-home-insight-text">{insight.text}</span>
            </span>
            <ChevronRight size={16} strokeWidth={2.2} aria-hidden="true" />
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
