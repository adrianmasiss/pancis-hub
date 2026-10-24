"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ChevronRight, Play, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { logDietTemplateMeal } from "@/features/dashboard/actions";
import type { DayPlan } from "@/features/nutrition/queries";
import type { DietTemplateView } from "@/features/dashboard/queries";
import type { PlanDayView } from "@/features/training/queries";
import { consumedTotals } from "@/features/nutrition/lib/day-overview";
import { estimatedMinutes } from "@/features/training/lib/stats";
import { triggerHaptic } from "@/lib/haptics";
import { ScreenHeader } from "@/mobile/shell/screen-header";
import { CheckCircle } from "@/mobile/ui/controls";
import { Bar, Ring, Stat } from "@/mobile/ui/display";
import { ExerciseModel } from "@/mobile/ui/exercise-model";
import {
  MACROS,
  addMacros,
  kcal,
  mealLabel,
  mealTypeLabel,
} from "@/mobile/screens/nutrition/format";
import { dayTitle } from "@/mobile/screens/training/today";

function fechaLarga(dateISO: string): string {
  const s = new Intl.DateTimeFormat("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${dateISO}T12:00:00Z`));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function HomeView({
  greeting,
  extraKcal,
  displayName,
  today,
  day,
  diet,
  planName,
  nextDay,
  nextDayNumber,
  doneToday,
  sessionInProgress,
}: {
  greeting: string;
  /** Kcal sumadas a la meta por el entreno de hoy (0 si no aplica). */
  extraKcal: number;
  displayName: string;
  today: string;
  day: DayPlan;
  diet: DietTemplateView | null;
  planName: string | null;
  nextDay: PlanDayView | null;
  nextDayNumber: number;
  doneToday: boolean;
  sessionInProgress: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [justLogged, setJustLogged] = useState<string | null>(null);

  const meals = diet?.meals ?? [];
  const next = meals.find((m) => !m.loggedToday && m.id !== justLogged) ?? null;
  let consumed = consumedTotals(day.meals);
  const logged = justLogged ? meals.find((m) => m.id === justLogged) : null;
  if (logged && !logged.loggedToday)
    consumed = addMacros(consumed, logged.totals);
  const baseTarget = day.targets?.calories ?? diet?.targetCalories ?? null;
  const target = baseTarget !== null ? baseTarget + extraKcal : null;
  const restantes =
    target !== null ? Math.max(0, target - consumed.calories) : null;
  const hechas = meals.filter(
    (m) => m.loggedToday || m.id === justLogged,
  ).length;

  const logNext = () =>
    next &&
    startTransition(async () => {
      setJustLogged(next.id);
      const result = await logDietTemplateMeal({
        templateMealId: next.id,
        date: today,
      });
      if ("error" in result) {
        setJustLogged(null);
        toast.error(result.error);
      } else triggerHaptic("success");
    });

  const exercises = nextDay?.exercises ?? [];
  const nombre = displayName.split(/[\s@]/)[0] ?? "";

  return (
    <div className="m-screen">
      <ScreenHeader
        title="Hoy"
        subtitle={`${greeting}${nombre ? `, ${nombre}` : ""} · ${fechaLarga(today)}`}
      />
      <div className="m-body m-stagger" style={{ paddingTop: 12 }}>
        <Link
          href="/nutricion"
          className="m-card m-press"
          data-glow=""
          aria-label="Nutrición de hoy"
        >
          <div className="m-row" style={{ gap: 16 }}>
            <Ring
              value={target ? consumed.calories / target : 0}
              size={104}
              stroke={8}
              label={
                restantes !== null
                  ? `${kcal(restantes)} kilocalorías restantes`
                  : "Sin meta"
              }
            >
              <span
                className="m-num"
                style={{ fontSize: 22, fontWeight: 700, lineHeight: 1 }}
              >
                {restantes !== null ? kcal(restantes) : "—"}
              </span>
              <span className="m-stat-label" style={{ fontSize: 11 }}>
                restantes
              </span>
            </Ring>
            <div className="m-stack" style={{ flex: 1, gap: 8 }}>
              <span className="m-eyebrow" data-tone="accent">
                Nutrición · {hechas} de {meals.length}
              </span>
              {MACROS.slice(0, 3).map((m) => {
                const goal = day.targets?.[m.key] ?? null;
                return (
                  <div key={m.key} className="m-stack" style={{ gap: 4 }}>
                    <span className="m-macro-name" style={{ fontSize: 12 }}>
                      {m.label}
                    </span>
                    <Bar
                      value={goal ? consumed[m.key] / goal : 0}
                      color={m.color}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </Link>

        {next && (
          <section className="m-stack" aria-labelledby="m-home-next">
            <h2 id="m-home-next" className="m-section">
              Lo que toca
            </h2>
            <div className="m-meal-row">
              <Link
                href={`/nutricion?comida=${next.id}`}
                className="m-meal-main m-press"
              >
                <span className="m-meal-meta">
                  {next.scheduledTime && (
                    <span className="m-num">
                      {next.scheduledTime.slice(0, 5)} ·{" "}
                    </span>
                  )}
                  {mealTypeLabel(next.mealType)}
                </span>
                <span className="m-list-row-title">
                  {next.name?.trim() ||
                    next.items.map((i) => i.foodName).join(", ") ||
                    mealLabel(next.mealType)}
                </span>
              </Link>
              <span className="m-num m-meal-kcal">
                {kcal(next.totals.calories)}
              </span>
              <CheckCircle
                checked={false}
                disabled={pending || next.items.length === 0}
                label={`Marcar ${mealLabel(next.mealType, next.name)} como comida`}
                onToggle={logNext}
              />
            </div>
          </section>
        )}

        <section className="m-card" aria-labelledby="m-home-train">
          {nextDay ? (
            <div className="m-day-split">
              <div className="m-day-info">
                <div>
                  <div className="m-eyebrow" data-tone="accent">
                    {doneToday ? "Hecho hoy" : `Entreno · Día ${nextDayNumber}`}
                  </div>
                  <h2 id="m-home-train" className="m-card-title">
                    {dayTitle(nextDay)}
                  </h2>
                  {planName && <div className="m-sub">{planName}</div>}
                </div>
                <Stat value={exercises.length} label="Ejercicios" />
                <Stat
                  value={`~${estimatedMinutes(exercises)}`}
                  unit="min"
                  label="Duración"
                />
              </div>
              {exercises.length > 0 && (
                <ExerciseModel
                  exercises={exercises}
                  compact
                  className="m-day-model"
                />
              )}
            </div>
          ) : (
            <>
              <h2 id="m-home-train" className="m-card-title">
                Sin rutina activa
              </h2>
              <p className="m-sheet-text">
                Importa la de tu coach o deja que la IA arme una.
              </p>
            </>
          )}
          <Link
            href={
              sessionInProgress
                ? "/entrenamiento?vista=sesion"
                : nextDay
                  ? "/entrenamiento?vista=hoy"
                  : "/entrenamiento?vista=rutinas"
            }
            className="m-btn m-press"
            data-variant="primary"
            data-block=""
          >
            <Play size={16} fill="currentColor" aria-hidden="true" />
            {sessionInProgress
              ? "Continuar entrenamiento"
              : nextDay
                ? "Ir a entrenar"
                : "Elegir rutina"}
          </Link>
        </section>

        <Link
          href={`/asistente?q=${encodeURIComponent(
            restantes !== null
              ? `¿Qué como? Me quedan ${kcal(restantes)} kcal hoy.`
              : "¿Cómo voy hoy?",
          )}`}
          className="m-copilot-card m-press"
        >
          <Sparkles size={20} aria-hidden="true" />
          <span style={{ flex: 1 }}>
            <span className="m-list-row-title" style={{ display: "block" }}>
              ¿Qué como ahora?
            </span>
            <span className="m-copilot-sub">
              El copiloto lo calcula con lo que te queda hoy.
            </span>
          </span>
          <ChevronRight size={18} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
