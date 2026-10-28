"use client";

import Link from "next/link";
import { useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Reorder, useDragControls } from "motion/react";
import { Dumbbell, Lightbulb, Plus } from "lucide-react";
import { toast } from "sonner";
import { logDietTemplateMeal } from "@/features/dashboard/actions";
import { deleteMeal, updateMealTime } from "@/features/nutrition/actions";
import { setMealTimeForDay } from "@/features/nutrition/meal-time-actions";
import type { DayPlan, MealView } from "@/features/nutrition/queries";
import type {
  DietTemplateMealView,
  DietTemplateView,
} from "@/features/dashboard/queries";
import { consumedTotals } from "@/features/nutrition/lib/day-overview";
import { Bar, Ring } from "@/mobile/ui/display";
import { Fab } from "@/mobile/ui/fab";
import { useLongPressDrag } from "@/mobile/ui/use-long-press-drag";
import { ExtraSheet } from "./extra-sheet";
import { LooseMeal, PlanMeal } from "./plan-meal";
import { WaterCard } from "./water";
import { fromMinutes, toMinutes } from "./day-sheets";
import type { TrainingAdjustment } from "@/mobile/training-adjustment";
import { MACROS, addMacros, gramos, kcal } from "./format";

/** Una fila del dia: comida del plan o comida suelta, ordenadas por hora. */
type Entry =
  | {
      key: string;
      kind: "plan";
      meal: DietTemplateMealView;
      time: string | null;
    }
  | { key: string; kind: "suelta"; meal: MealView; time: string | null };

/**
 * La hora que le toca a una comida al soltarla entre otras dos: el punto
 * medio, redondeado a cinco minutos si cabe. Sin vecina antes o despues,
 * media hora antes o despues de la que queda al lado.
 */
export function timeBetween(
  prev: string | null,
  next: string | null,
): string | null {
  if (prev === null && next === null) return null;
  if (prev === null) return fromMinutes(Math.max(0, toMinutes(next!) - 30));
  if (next === null)
    return fromMinutes(Math.min(23 * 60 + 55, toMinutes(prev) + 30));
  const a = toMinutes(prev);
  const b = toMinutes(next);
  if (b - a < 2) return prev;
  const mid = (a + b) / 2;
  const redondo = Math.round(mid / 5) * 5;
  return fromMinutes(redondo > a && redondo < b ? redondo : Math.floor(mid));
}

/**
 * Nutricion · Hoy: el anillo de kcal restantes, los cuatro macros, el agua y
 * el plan de comidas con su hora y su check. Marcar o desmarcar recalcula
 * todo al instante; el servidor lo confirma detras. Las comidas se reordenan
 * manteniendolas presionadas: eso les da otra hora, solo hoy.
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
  const router = useRouter();
  const meals = diet?.meals ?? [];
  const [, startTransition] = useTransition();
  const [newOpen, setNewOpen] = useState(false);
  /* Una comida abierta a la vez. */
  const [openMeal, setOpenMeal] = useState<string | null>(null);

  /* Lo marcado y desmarcado se ve antes de que responda el servidor. */
  const [overrides, setOverride] = useOptimistic(
    {} as Record<string, boolean>,
    (state, [id, value]: [string, boolean]) => ({ ...state, [id]: value }),
  );
  /* La hora nueva al soltar una comida, mientras el servidor confirma. */
  const [times, setTime] = useOptimistic(
    {} as Record<string, string>,
    (state, [key, hhmm]: [string, string]) => ({ ...state, [key]: hhmm }),
  );
  const loggedOf = (templateMealId: string) =>
    day.meals.find((m) => m.sourceTemplateMealId === templateMealId);
  const isDone = (id: string, base: boolean) => overrides[id] ?? base;

  let consumed = consumedTotals(day.meals);
  for (const meal of meals) {
    const now = isDone(meal.id, meal.loggedToday);
    if (now && !meal.loggedToday) consumed = addMacros(consumed, meal.totals);
    if (!now && meal.loggedToday) {
      const logged = loggedOf(meal.id);
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
        const logged = loggedOf(mealId);
        if (!logged) return;
        const result = await deleteMeal({ mealId: logged.id });
        if ("error" in result) toast.error(result.error);
      }
    });

  const ensureLogged = async (mealId: string) => {
    const logged = loggedOf(mealId);
    if (logged) return logged.id;
    const r = await logDietTemplateMeal({ templateMealId: mealId, date });
    if ("error" in r) {
      toast.error(r.error);
      return null;
    }
    return r.mealId ?? null;
  };

  const extrasOf = (templateMealId: string) =>
    day.meals.filter((m) => m.extraOfTemplateMealId === templateMealId);
  const loose = day.meals.filter(
    (m) => !m.sourceTemplateMealId && !m.extraOfTemplateMealId,
  );

  /* El dia en orden de hora: lo del plan y lo agregado, juntos. */
  const entries: Entry[] = [
    ...meals.map((meal) => ({
      key: `p:${meal.id}`,
      kind: "plan" as const,
      meal,
      time: meal.scheduledTime?.slice(0, 5) ?? null,
    })),
    ...loose.map((meal) => ({
      key: `s:${meal.id}`,
      kind: "suelta" as const,
      meal,
      time: meal.scheduledTime?.slice(0, 5) ?? null,
    })),
  ]
    .map((e) => ({ ...e, time: times[e.key] ?? e.time }))
    .sort((a, b) => (a.time ?? "99").localeCompare(b.time ?? "99"));
  const byKey = new Map(entries.map((e) => [e.key, e]));

  /* Orden local mientras se arrastra; vuelve al del servidor cuando cambia. */
  const firma = entries.map((e) => e.key).join("|");
  const [local, setLocal] = useState({
    firma,
    order: entries.map((e) => e.key),
  });
  if (local.firma !== firma)
    setLocal({ firma, order: entries.map((e) => e.key) });
  const order = local.order.filter((k) => byKey.has(k));
  /* El orden al levantar y el ultimo al mover: soltar sin cambiar de lugar
     no debe cambiar la hora. */
  const drag = useRef({ start: "", now: order });

  const drop = (key: string) => {
    const now = drag.current.now;
    if (now.join("|") === drag.current.start) return;
    const i = now.indexOf(key);
    const timeOf = (k: string | undefined) =>
      k === undefined ? null : (byKey.get(k)?.time ?? null);
    const prev = now.slice(0, i).reverse().map(timeOf).find(Boolean) ?? null;
    const next =
      now
        .slice(i + 1)
        .map(timeOf)
        .find(Boolean) ?? null;
    const entry = byKey.get(key);
    const hora = timeBetween(prev, next);
    if (!entry || !hora || hora === entry.time) return;
    startTransition(async () => {
      setTime([key, hora]);
      const r =
        entry.kind === "plan"
          ? await setMealTimeForDay({
              templateMealId: entry.meal.id,
              date,
              time: hora,
            })
          : await updateMealTime({
              mealId: entry.meal.id,
              scheduledTime: hora,
            });
      if ("error" in r && r.error) {
        toast.error(r.error);
        return;
      }
      toast.success(
        entry.kind === "plan" ? `Hoy a las ${hora}.` : `A las ${hora}.`,
      );
      router.refresh();
    });
  };

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
              <span className="m-stat-value m-kcal-stat">
                {kcal(consumed.calories)}
                <small>kcal</small>
              </span>
            </div>
            <div className="m-stat">
              <span className="m-stat-label">Meta de hoy</span>
              <span className="m-stat-value m-kcal-stat">
                {target !== null ? kcal(target) : "—"}
                {target !== null && <small>kcal</small>}
              </span>
            </div>
          </div>
        </div>

        <dl className="m-macro-grid">
          {MACROS.map((m) => {
            const value = consumed[m.key];
            const goal = targets?.[m.key] ?? null;
            return (
              <div key={m.key} className="m-macro-line">
                <dt>
                  <span
                    className="m-dot"
                    style={{ background: m.color }}
                    aria-hidden="true"
                  />
                  {m.label}
                </dt>
                <dd className="m-num">
                  {gramos(value)}
                  {goal ? (
                    <small> / {gramos(goal)} g</small>
                  ) : (
                    <small> g</small>
                  )}
                </dd>
                <dd className="m-macro-line-bar">
                  <Bar value={goal ? value / goal : 0} color={m.color} />
                </dd>
              </div>
            );
          })}
        </dl>

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
              foto) o registra lo que comas con el «+».
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
        <Reorder.Group
          as="ul"
          axis="y"
          values={order}
          onReorder={(o) => {
            drag.current.now = o;
            setLocal((s) => ({ ...s, order: o }));
          }}
          className="m-day-list"
        >
          {order.map((key) => {
            const entry = byKey.get(key)!;
            return (
              <DayItem
                key={key}
                value={key}
                onLift={() =>
                  (drag.current = { start: order.join("|"), now: order })
                }
                onDrop={() => drop(key)}
              >
                {(longPress) =>
                  entry.kind === "plan" ? (
                    <PlanMeal
                      meal={
                        times[key]
                          ? { ...entry.meal, scheduledTime: `${times[key]}:00` }
                          : entry.meal
                      }
                      date={date}
                      today={today}
                      open={openMeal === key}
                      onOpenChange={(o) => setOpenMeal(o ? key : null)}
                      done={isDone(entry.meal.id, entry.meal.loggedToday)}
                      canToggle={
                        entry.meal.items.some((i) => !i.omitted) &&
                        !(entry.meal.loggedToday && !loggedOf(entry.meal.id))
                      }
                      onToggle={() =>
                        toggle(
                          entry.meal.id,
                          isDone(entry.meal.id, entry.meal.loggedToday),
                        )
                      }
                      movedFrom={
                        moved[entry.meal.id] ??
                        (times[key]
                          ? (entry.meal.scheduledTime?.slice(0, 5) ?? "")
                          : undefined)
                      }
                      logged={loggedOf(entry.meal.id)}
                      extras={extrasOf(entry.meal.id)}
                      ensureLogged={() => ensureLogged(entry.meal.id)}
                      longPress={longPress}
                    />
                  ) : (
                    <LooseMeal
                      meal={
                        times[key]
                          ? { ...entry.meal, scheduledTime: `${times[key]}:00` }
                          : entry.meal
                      }
                      date={date}
                      open={openMeal === key}
                      onOpenChange={(o) => setOpenMeal(o ? key : null)}
                      longPress={longPress}
                    />
                  )
                }
              </DayItem>
            );
          })}
        </Reorder.Group>
        {entries.length > 1 && (
          <p className="m-ing-hint" style={{ textAlign: "center" }}>
            Mantén presionada una comida para moverla de hora.
          </p>
        )}
      </section>

      <Link
        href={`/asistente?q=${encodeURIComponent(
          restantes !== null
            ? `¿Qué como? Me quedan ${kcal(restantes)} kcal hoy.`
            : "¿Qué como hoy?",
        )}`}
        className="m-btn m-press"
        data-block=""
      >
        <Lightbulb size={16} aria-hidden="true" />
        ¿Qué como?
      </Link>

      <Fab
        label="Nueva comida"
        actions={[
          {
            label: "Nueva comida",
            icon: Plus,
            onClick: () => setNewOpen(true),
          },
        ]}
      />
      <ExtraSheet
        open={newOpen}
        onOpenChange={setNewOpen}
        date={date}
        destino={{ kind: "nueva" }}
      />
    </div>
  );
}

/** Una fila arrastrable del dia: se levanta tras mantenerla presionada. */
function DayItem({
  value,
  onLift,
  onDrop,
  children,
}: {
  value: string;
  onLift: () => void;
  onDrop: () => void;
  children: (longPress: ReturnType<typeof useLongPressDrag>) => React.ReactNode;
}) {
  const controls = useDragControls();
  const longPress = useLongPressDrag(controls);
  return (
    <Reorder.Item
      as="li"
      value={value}
      dragListener={false}
      dragControls={controls}
      className="m-day-item"
      whileDrag={{ scale: 1.02, zIndex: 5 }}
      onDragStart={onLift}
      onDragEnd={onDrop}
    >
      {children(longPress)}
    </Reorder.Item>
  );
}
