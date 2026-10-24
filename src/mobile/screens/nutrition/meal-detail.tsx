"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  Check,
  ChevronLeft,
  Clock,
  Plus,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { logDietTemplateMeal } from "@/features/dashboard/actions";
import { deleteMeal } from "@/features/nutrition/actions";
import {
  swapDietItemForDay,
  undoDietItemDaySwap,
} from "@/features/nutrition/day-swap-actions";
import type { DietTemplateMealView } from "@/features/dashboard/queries";
import { triggerHaptic } from "@/lib/haptics";
import { Stepper } from "@/mobile/ui/controls";
import { ExtraSheet } from "./extra-sheet";
import { Sheet } from "@/mobile/ui/sheet";
import {
  clearMealTimeForDay,
  setMealTimeForDay,
} from "@/features/nutrition/meal-time-actions";
import { MACROS, gramos, kcal, mealLabel, mealTypeLabel } from "./format";

type Item = DietTemplateMealView["items"][number];

/** Macros de un alimento del plan a otra cantidad (escala lineal). */
function scaled(item: Item, grams: number) {
  const f = item.quantityG > 0 ? grams / item.quantityG : 0;
  return {
    calories: item.macros.calories * f,
    proteinG: item.macros.proteinG * f,
    carbohydrateG: item.macros.carbohydrateG * f,
    fatG: item.macros.fatG * f,
    fiberG: item.macros.fiberG * f,
  };
}

/**
 * Detalle de una comida del plan: totales y cada ingrediente con su stepper
 * de ±10 g. El cambio de gramos vale SOLO para este dia (se guarda como el
 * ajuste del dia, la misma tabla que las sustituciones); el plan no cambia.
 */
export function MealDetail({
  meal,
  date,
  loggedMealId,
  movedFrom,
}: {
  meal: DietTemplateMealView;
  date: string;
  loggedMealId: string | null;
  /** Hora del plan si hoy se movio; null si esta a su hora. */
  movedFrom: string | null;
}) {
  const router = useRouter();
  const [grams, setGrams] = useState<Record<string, number>>(() =>
    Object.fromEntries(meal.items.map((i) => [i.id, i.quantityG])),
  );
  const [done, setDone] = useState(meal.loggedToday);
  const [pending, startTransition] = useTransition();
  const [extraOpen, setExtraOpen] = useState(false);
  const [timeOpen, setTimeOpen] = useState(false);
  const [hora, setHora] = useState("12:00");
  const timers = useRef<Record<string, number>>({});

  useEffect(() => {
    const pendientes = timers.current;
    return () =>
      Object.values(pendientes).forEach((t) => window.clearTimeout(t));
  }, []);

  const items = meal.items.filter((i) => !i.omitted);
  const totals = items.reduce(
    (t, i) => {
      const m = scaled(i, grams[i.id] ?? i.quantityG);
      return {
        calories: t.calories + m.calories,
        proteinG: t.proteinG + m.proteinG,
        carbohydrateG: t.carbohydrateG + m.carbohydrateG,
        fatG: t.fatG + m.fatG,
        fiberG: t.fiberG + m.fiberG,
      };
    },
    { calories: 0, proteinG: 0, carbohydrateG: 0, fatG: 0, fiberG: 0 },
  );

  /* Se guarda 600 ms despues del ultimo toque: tocar cinco veces es un cambio. */
  const changeGrams = (item: Item, value: number) => {
    setGrams((g) => ({ ...g, [item.id]: value }));
    window.clearTimeout(timers.current[item.id]);
    timers.current[item.id] = window.setTimeout(async () => {
      const result = await swapDietItemForDay({
        templateItemId: item.id,
        date,
        quantityG: value,
        foodId: item.foodId,
      });
      if (result.error) toast.error(result.error);
      else router.refresh();
    }, 600);
  };

  const restore = (item: Item) =>
    startTransition(async () => {
      const result = await undoDietItemDaySwap({
        templateItemId: item.id,
        date,
      });
      if (result.error) toast.error(result.error);
      else router.refresh();
    });

  const toggleDone = () =>
    startTransition(async () => {
      if (!done) {
        setDone(true);
        const result = await logDietTemplateMeal({
          templateMealId: meal.id,
          date,
        });
        if ("error" in result) {
          setDone(false);
          toast.error(result.error);
        } else triggerHaptic("success");
      } else if (loggedMealId) {
        setDone(false);
        const result = await deleteMeal({ mealId: loggedMealId });
        if ("error" in result) {
          setDone(true);
          toast.error(result.error);
        }
      }
      router.refresh();
    });

  const time = meal.scheduledTime?.slice(0, 5);

  return (
    <div className="m-screen" data-m-fullscreen="" style={{ paddingBottom: 0 }}>
      <div className="m-step-head">
        <Link
          href="/nutricion"
          aria-label="Volver"
          className="m-icon-btn m-press"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </Link>
        <div style={{ minWidth: 0 }}>
          <div className="m-sub">
            {time && <span className="m-num">{time} · </span>}
            {mealTypeLabel(meal.mealType)}
          </div>
          <h1 className="m-title" style={{ fontSize: 26 }}>
            {mealLabel(meal.mealType, meal.name)}
          </h1>
        </div>
      </div>

      <div className="m-body m-stagger">
        <div className="m-card m-meal-totals" data-size="sm">
          <div className="m-stat">
            <span className="m-stat-value" style={{ fontSize: 30 }}>
              {kcal(totals.calories)}
            </span>
            <span className="m-stat-label">kcal</span>
          </div>
          {MACROS.map((m) => (
            <div key={m.key} className="m-stat">
              <span className="m-stat-value" style={{ fontSize: 18 }}>
                {gramos(totals[m.key])}
                <small>g</small>
              </span>
              <span className="m-stat-label" style={{ fontSize: 11 }}>
                <span
                  className="m-dot"
                  style={{ background: m.color, marginRight: 4 }}
                  aria-hidden="true"
                />
                {m.short}
              </span>
            </div>
          ))}
        </div>

        <div className="m-row" style={{ justifyContent: "space-between" }}>
          <h2 className="m-section">Ingredientes</h2>
          <span className="m-sub">
            {done ? "Desmárcala para ajustar" : "Ajusta los gramos"}
          </span>
        </div>

        {meal.items.map((item) => {
          const g = grams[item.id] ?? item.quantityG;
          const m = scaled(item, g);
          return (
            <div
              key={item.id}
              className="m-card"
              data-size="sm"
              style={item.omitted ? { opacity: 0.5 } : undefined}
            >
              <div
                className="m-row"
                style={{ justifyContent: "space-between" }}
              >
                <span className="m-list-row-title">
                  {item.foodName}
                  {item.daySwap &&
                    item.daySwap.originalFoodName !== item.foodName && (
                      <span
                        className="m-sub"
                        style={{ display: "block", fontSize: 12 }}
                      >
                        Hoy en lugar de {item.daySwap.originalFoodName}
                      </span>
                    )}
                </span>
                <span className="m-stat-value" style={{ fontSize: 16 }}>
                  {kcal(m.calories)}
                  <small>kcal</small>
                </span>
              </div>
              <div className="m-row">
                <Stepper
                  label={`Gramos de ${item.foodName}`}
                  value={Math.round(g)}
                  step={10}
                  min={10}
                  max={2000}
                  unit="g"
                  onChange={(v) =>
                    !done && !item.omitted && changeGrams(item, v)
                  }
                />
                <span className="m-sub m-num" style={{ flex: 1, fontSize: 12 }}>
                  P {gramos(m.proteinG)} · C {gramos(m.carbohydrateG)} · G{" "}
                  {gramos(m.fatG)}
                </span>
                {item.daySwap ? (
                  <button
                    type="button"
                    className="m-icon-btn m-press"
                    data-variant="soft"
                    aria-label={`Volver al plan: ${item.daySwap.originalFoodName}`}
                    disabled={pending || done}
                    onClick={() => restore(item)}
                  >
                    <RotateCcw size={18} aria-hidden="true" />
                  </button>
                ) : (
                  <Link
                    href={`/nutricion?vista=comparar&item=${item.id}`}
                    aria-label={`Sustituir ${item.foodName}`}
                    className="m-icon-btn m-press"
                    style={{ background: "var(--m-surface-2)" }}
                  >
                    <ArrowLeftRight size={18} aria-hidden="true" />
                  </Link>
                )}
              </div>
            </div>
          );
        })}

        <div className="m-grid-2">
          <button
            type="button"
            className="m-btn m-press"
            onClick={() => {
              setHora(meal.scheduledTime?.slice(0, 5) ?? "12:00");
              setTimeOpen(true);
            }}
          >
            <Clock size={16} aria-hidden="true" />
            Mover de hora
          </button>
          <button
            type="button"
            className="m-btn m-press"
            onClick={() => setExtraOpen(true)}
          >
            <Plus size={16} aria-hidden="true" />
            Extra solo hoy
          </button>
        </div>
        {movedFrom !== null && (
          <p className="m-sub" style={{ fontSize: 13 }}>
            Hoy la moviste
            {movedFrom ? ` (en tu plan va a las ${movedFrom})` : ""}.{" "}
            <button
              type="button"
              className="m-accent-text"
              style={{ fontWeight: 700 }}
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const r = await clearMealTimeForDay({
                    templateMealId: meal.id,
                    date,
                  });
                  if (r.error) toast.error(r.error);
                  else router.refresh();
                })
              }
            >
              Volver a su hora
            </button>
          </p>
        )}
      </div>

      <div className="m-step-foot">
        <button
          type="button"
          className="m-btn m-press"
          data-variant={done ? "outline" : "primary"}
          disabled={
            pending ||
            items.length === 0 ||
            (done && !loggedMealId && meal.loggedToday)
          }
          onClick={toggleDone}
        >
          <Check size={18} strokeWidth={2.5} aria-hidden="true" />
          {done ? "Comida marcada" : "Marcar como comida"}
        </button>
      </div>

      <ExtraSheet open={extraOpen} onOpenChange={setExtraOpen} date={date} />

      <Sheet
        open={timeOpen}
        onOpenChange={setTimeOpen}
        title="Mover de hora"
        description="Solo por hoy. Mañana vuelve a la hora de tu plan."
      >
        <label className="m-field">
          <span>Nueva hora</span>
          <input
            type="time"
            className="m-input"
            value={hora}
            onChange={(e) => setHora(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="m-btn m-press"
          data-variant="primary"
          data-block=""
          disabled={pending || !/^\d{2}:\d{2}$/.test(hora)}
          onClick={() =>
            startTransition(async () => {
              const r = await setMealTimeForDay({
                templateMealId: meal.id,
                date,
                time: hora,
              });
              if (r.error) {
                toast.error(r.error);
                return;
              }
              toast.success(`Hoy a las ${hora}.`);
              setTimeOpen(false);
              router.refresh();
            })
          }
        >
          Mover solo hoy
        </button>
      </Sheet>
    </div>
  );
}
