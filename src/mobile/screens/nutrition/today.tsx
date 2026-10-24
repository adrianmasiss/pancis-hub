"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { Dumbbell, Lightbulb, Plus } from "lucide-react";
import { toast } from "sonner";
import { logDietTemplateMeal } from "@/features/dashboard/actions";
import { deleteMeal } from "@/features/nutrition/actions";
import type { DayPlan } from "@/features/nutrition/queries";
import type { DietTemplateView } from "@/features/dashboard/queries";
import { consumedTotals } from "@/features/nutrition/lib/day-overview";
import { Bar, Ring } from "@/mobile/ui/display";
import { ExtraSheet } from "./extra-sheet";
import { PlanMeal } from "./plan-meal";
import { WaterCard } from "./water";
import type { TrainingAdjustment } from "@/mobile/training-adjustment";
import { MACROS, addMacros, gramos, kcal, mealLabel } from "./format";

/**
 * Nutricion · Hoy: el anillo de kcal restantes, los cuatro macros, el agua y
 * el plan de comidas con su hora y su check. Marcar o desmarcar recalcula
 * todo al instante; el servidor lo confirma detras.
 */
export function NutritionToday({
  day,
  diet,
  date,
  today,
  moved = {},
  adjustment = null,
}: {
  day: DayPlan;
  diet: DietTemplateView | null;
  date: string;
  today: string;
  /** Comidas movidas de hora solo hoy → hora del plan. */
  moved?: Record<string, string>;
  /** Kcal extra por el entreno de hoy (ajuste encendido en Perfil). */
  adjustment?: TrainingAdjustment | null;
}) {
  const meals = diet?.meals ?? [];
  const [, startTransition] = useTransition();
  const [extraOpen, setExtraOpen] = useState(false);
  /* Una comida abierta a la vez. */
  const [openMeal, setOpenMeal] = useState<string | null>(null);

  /* Lo marcado y desmarcado se ve antes de que responda el servidor. */
  const [overrides, setOverride] = useOptimistic(
    {} as Record<string, boolean>,
    (state, [id, value]: [string, boolean]) => ({ ...state, [id]: value }),
  );
  const loggedIdOf = (templateMealId: string) =>
    day.meals.find((m) => m.sourceTemplateMealId === templateMealId);
  const isDone = (id: string, base: boolean) => overrides[id] ?? base;

  let consumed = consumedTotals(day.meals);
  for (const meal of meals) {
    const now = isDone(meal.id, meal.loggedToday);
    if (now && !meal.loggedToday) consumed = addMacros(consumed, meal.totals);
    if (!now && meal.loggedToday) {
      const logged = loggedIdOf(meal.id);
      if (logged) consumed = addMacros(consumed, logged.totals, -1);
    }
  }

  const baseTarget = day.targets?.calories ?? diet?.targetCalories ?? null;
  const target =
    baseTarget !== null ? baseTarget + (adjustment?.kcal ?? 0) : null;
  const restantes =
    target !== null ? Math.max(0, target - consumed.calories) : null;
  const targets = day.targets;

  const toggle = (mealId: string, done: boolean) =>
    startTransition(async () => {
      setOverride([mealId, !done]);
      if (!done) {
        const result = await logDietTemplateMeal({
          templateMealId: mealId,
          date,
        });
        if ("error" in result) toast.error(result.error);
      } else {
        const logged = loggedIdOf(mealId);
        if (!logged) return;
        const result = await deleteMeal({ mealId: logged.id });
        if ("error" in result) toast.error(result.error);
      }
    });

  const offPlan = day.meals.filter((m) => !m.sourceTemplateMealId);

  return (
    <div className="m-body m-stagger">
      <section className="m-card" data-glow="" aria-label="Resumen del día">
        <div className="m-row" style={{ gap: 18, alignItems: "center" }}>
          <Ring
            value={target ? consumed.calories / target : 0}
            size={150}
            stroke={10}
            label={
              restantes !== null
                ? `${kcal(restantes)} kilocalorías restantes de ${kcal(target!)}`
                : "Sin meta de calorías"
            }
          >
            <span
              className="m-num"
              style={{ fontSize: 30, fontWeight: 700, lineHeight: 1 }}
            >
              {restantes !== null ? kcal(restantes) : "—"}
            </span>
            <span className="m-stat-label" style={{ marginTop: 4 }}>
              kcal restantes
            </span>
          </Ring>
          <div className="m-stack" style={{ gap: 14 }}>
            <div className="m-stat">
              <span className="m-stat-label">Consumidas</span>
              <span className="m-stat-value" style={{ fontSize: 24 }}>
                {kcal(consumed.calories)}
              </span>
            </div>
            <div className="m-stat">
              <span className="m-stat-label">Meta de hoy</span>
              <span className="m-stat-value" style={{ fontSize: 24 }}>
                {target !== null ? kcal(target) : "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="m-macros">
          {MACROS.map((m) => {
            const value = consumed[m.key];
            const goal = targets?.[m.key] ?? null;
            return (
              <div key={m.key} className="m-macro">
                <div className="m-macro-head">
                  <span className="m-macro-name">
                    <span
                      className="m-dot"
                      style={{ background: m.color }}
                      aria-hidden="true"
                    />
                    {m.label}
                  </span>
                  <span className="m-num m-macro-val">
                    {gramos(value)}
                    {goal ? ` / ${gramos(goal)}` : ""} g
                  </span>
                </div>
                <Bar value={goal ? value / goal : 0} color={m.color} />
              </div>
            );
          })}
        </div>

        <hr className="m-divider" />
        <WaterCard date={date} ml={day.waterMl} targetMl={day.waterMlTarget} />
      </section>

      {adjustment && (
        <div className="m-notice m-adjust" role="note">
          <Dumbbell size={18} aria-hidden="true" style={{ flex: "none" }} />
          <span>
            <strong>
              {adjustment.basis === "hecho" ? "Hoy entrenaste" : "Hoy entrenas"}
              {adjustment.dayName ? ` ${adjustment.dayName}` : ""}.
            </strong>{" "}
            Tu meta sube {kcal(adjustment.kcal)} kcal por el entreno.
          </span>
        </div>
      )}

      <section className="m-stack" aria-labelledby="m-plan-title">
        <div className="m-row" style={{ justifyContent: "space-between" }}>
          <div>
            <h2 id="m-plan-title" className="m-section">
              Plan de comidas
            </h2>
            {meals.length > 0 && (
              <p className="m-plan-sum">
                <span className="m-num">
                  {kcal(meals.reduce((t, m) => t + m.totals.calories, 0))}
                </span>{" "}
                kcal en {meals.length} comidas
              </p>
            )}
          </div>
          <Link
            href="/nutricion?vista=historial&copiar=1"
            className="m-link m-press"
            style={{ whiteSpace: "nowrap" }}
          >
            Copiar de otro día
          </Link>
        </div>
        {meals.length === 0 && (
          <div className="m-card" data-size="sm">
            <p className="m-sheet-text">
              Aún no tienes un plan activo. Sube el de tu nutricionista (PDF o
              foto) o registra lo que comas con «Extra solo hoy».
            </p>
            <Link
              href="/nutricion/dieta"
              className="m-btn m-press"
              data-variant="primary"
            >
              Subir plan de nutrición
            </Link>
          </div>
        )}
        {meals.map((meal) => (
          <PlanMeal
            key={meal.id}
            meal={meal}
            date={date}
            today={today}
            open={openMeal === meal.id}
            onOpenChange={(o) => setOpenMeal(o ? meal.id : null)}
            done={isDone(meal.id, meal.loggedToday)}
            canToggle={
              meal.items.length > 0 &&
              !(meal.loggedToday && !loggedIdOf(meal.id))
            }
            onToggle={() => toggle(meal.id, isDone(meal.id, meal.loggedToday))}
            movedFrom={moved[meal.id]}
            onAddExtra={() => setExtraOpen(true)}
          />
        ))}
        {offPlan.map((meal) => (
          <div key={meal.id} className="m-meal-row" data-done="">
            <div className="m-meal-main">
              <span className="m-meal-meta">
                Fuera del plan
                <span
                  className="m-tag"
                  data-tone="neutral"
                  style={{ marginLeft: 6 }}
                >
                  Extra
                </span>
              </span>
              <span className="m-list-row-title">
                {meal.name?.trim() ||
                  meal.items.map((i) => i.foodName).join(", ") ||
                  mealLabel(meal.mealType)}
              </span>
            </div>
            <span className="m-num m-meal-kcal">
              {kcal(meal.totals.calories)}
            </span>
          </div>
        ))}
      </section>

      <div className="m-grid-2">
        <button
          type="button"
          className="m-btn m-press"
          onClick={() => setExtraOpen(true)}
        >
          <Plus size={16} aria-hidden="true" />
          Extra solo hoy
        </button>
        <Link
          href={`/asistente?q=${encodeURIComponent(
            restantes !== null
              ? `¿Qué como? Me quedan ${kcal(restantes)} kcal hoy.`
              : "¿Qué como hoy?",
          )}`}
          className="m-btn m-press"
        >
          <Lightbulb size={16} aria-hidden="true" />
          ¿Qué como?
        </Link>
      </div>

      <ExtraSheet open={extraOpen} onOpenChange={setExtraOpen} date={date} />
    </div>
  );
}
