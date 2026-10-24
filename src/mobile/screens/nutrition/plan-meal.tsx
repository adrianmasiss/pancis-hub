"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  Clock,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import type { DietTemplateMealView } from "@/features/dashboard/queries";
import { setMealTimeForDay } from "@/features/nutrition/meal-time-actions";
import { CheckCircle } from "@/mobile/ui/controls";
import { FoodThumb } from "@/mobile/ui/food-thumb";
import { Sheet } from "@/mobile/ui/sheet";
import { MACROS, gramos, kcal, mealLabel, mealTypeLabel } from "./format";

/* Proteina, carbohidratos y grasas: los que suman kcal. La fibra va aparte. */
const TRES = MACROS.slice(0, 3);
const KCAL_POR_G = { proteinG: 4, carbohydrateG: 4, fatG: 9 } as const;

/** De donde salen las kcal de la comida, en tres tramos de color. */
export function MacroSplitBar({
  macros,
}: {
  macros: { proteinG: number; carbohydrateG: number; fatG: number };
}) {
  const partes = TRES.map((m) => ({
    ...m,
    kcal:
      macros[m.key as keyof typeof KCAL_POR_G] *
      KCAL_POR_G[m.key as keyof typeof KCAL_POR_G],
  }));
  const total = partes.reduce((t, p) => t + p.kcal, 0);
  return (
    <span className="m-split" aria-hidden="true">
      {total > 0 &&
        partes.map((p) => (
          <span
            key={p.key}
            style={{ flexGrow: p.kcal / total, background: p.color }}
          />
        ))}
    </span>
  );
}

/**
 * Una comida del plan que se despliega ahi mismo: cerrada, su hora, nombre,
 * kcal y de donde salen; abierta, cada ingrediente con gramos, kcal y P/C/G en
 * sus colores, el total y las acciones del dia.
 */
export function PlanMeal({
  meal,
  date,
  today,
  open,
  onOpenChange,
  done,
  canToggle,
  onToggle,
  movedFrom,
  onAddExtra,
}: {
  meal: DietTemplateMealView;
  date: string;
  today: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  done: boolean;
  canToggle: boolean;
  onToggle: () => void;
  movedFrom: string | undefined;
  onAddExtra: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [timeOpen, setTimeOpen] = useState(false);
  const [swapOpen, setSwapOpen] = useState(false);
  const [hora, setHora] = useState(meal.scheduledTime?.slice(0, 5) ?? "12:00");

  const time = meal.scheduledTime?.slice(0, 5);
  const items = meal.items.filter((i) => !i.omitted);
  const swapped = meal.items.some((i) => i.daySwap);
  const foods = items.map((i) => i.foodName).join(", ");
  const title = meal.name?.trim() || foods || mealLabel(meal.mealType);
  const fecha = date !== today ? `&fecha=${date}` : "";
  const bodyId = `m-meal-${meal.id}`;

  return (
    <div
      className="m-plan-meal"
      data-open={open ? "" : undefined}
      data-done={done ? "" : undefined}
    >
      <div className="m-plan-meal-head">
        <button
          type="button"
          className="m-plan-meal-toggle m-press"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => onOpenChange(!open)}
        >
          <span className="m-plan-meal-main">
            <span className="m-meal-meta">
              {time && <span className="m-num">{time}</span>}
              {time && " · "}
              {mealTypeLabel(meal.mealType)}
              {swapped && (
                <span
                  className="m-tag"
                  data-tone="warn"
                  style={{ marginLeft: 6 }}
                >
                  Ajustada hoy
                </span>
              )}
              {movedFrom !== undefined && (
                <span
                  className="m-tag"
                  data-tone="neutral"
                  style={{ marginLeft: 6 }}
                >
                  Movida hoy
                </span>
              )}
            </span>
            <span className="m-plan-meal-title">{title}</span>
            <MacroSplitBar macros={meal.totals} />
          </span>
          <span className="m-plan-meal-kcal">
            <span className="m-num">{kcal(meal.totals.calories)}</span>
            <small>kcal</small>
          </span>
          <ChevronDown
            className="m-chevron m-disclosure-chevron"
            size={18}
            aria-hidden="true"
          />
        </button>
        <CheckCircle
          checked={done}
          label={
            done
              ? `Desmarcar ${mealLabel(meal.mealType, meal.name)}`
              : `Marcar ${mealLabel(meal.mealType, meal.name)} como comida`
          }
          disabled={!canToggle}
          onToggle={onToggle}
        />
      </div>

      <div id={bodyId} className="m-disclosure-body" inert={!open}>
        <div>
          <div className="m-plan-meal-body">
            <div className="m-ing m-ing-head" aria-hidden="true">
              <span>Ingrediente</span>
              <span>kcal</span>
              {TRES.map((m) => (
                <span key={m.key} style={{ color: m.color }}>
                  {m.short.charAt(0)}
                </span>
              ))}
            </div>
            <ul className="m-ing-list">
              {items.map((item) => (
                <li key={item.id} className="m-ing">
                  <span className="m-ing-name">
                    <span>{item.foodName}</span>
                    <small>
                      <span className="m-num">{gramos(item.quantityG)}</span> g
                      {item.daySwap &&
                        item.daySwap.originalFoodName !== item.foodName &&
                        ` · en lugar de ${item.daySwap.originalFoodName}`}
                    </small>
                  </span>
                  <span className="m-num">{kcal(item.macros.calories)}</span>
                  {TRES.map((m) => (
                    <span
                      key={m.key}
                      className="m-num"
                      style={{ color: m.color }}
                      aria-label={`${m.label} ${gramos(item.macros[m.key])} g`}
                    >
                      {gramos(item.macros[m.key])}
                    </span>
                  ))}
                </li>
              ))}
            </ul>
            <div className="m-ing m-ing-total">
              <span>Total</span>
              <span className="m-num">{kcal(meal.totals.calories)}</span>
              {TRES.map((m) => (
                <span key={m.key} className="m-num" style={{ color: m.color }}>
                  {gramos(meal.totals[m.key])}
                </span>
              ))}
            </div>

            <div className="m-plan-meal-actions">
              <button
                type="button"
                className="m-btn m-press"
                data-variant={done ? "outline" : "primary"}
                disabled={!canToggle}
                onClick={onToggle}
              >
                <Check size={16} strokeWidth={2.5} aria-hidden="true" />
                {done ? "Comida marcada" : "Marcar como comida"}
              </button>
              <div className="m-grid-2">
                <button
                  type="button"
                  className="m-btn m-press"
                  disabled={items.length === 0}
                  onClick={() =>
                    items.length === 1
                      ? router.push(
                          `/nutricion?vista=comparar&item=${items[0]!.id}`,
                        )
                      : setSwapOpen(true)
                  }
                >
                  <ArrowLeftRight size={16} aria-hidden="true" />
                  Cambiar alimento
                </button>
                <button
                  type="button"
                  className="m-btn m-press"
                  onClick={() => setTimeOpen(true)}
                >
                  <Clock size={16} aria-hidden="true" />
                  Mover de hora
                </button>
                <button
                  type="button"
                  className="m-btn m-press"
                  onClick={onAddExtra}
                >
                  <Plus size={16} aria-hidden="true" />
                  Agregar extra
                </button>
                <Link
                  href={`/nutricion?comida=${meal.id}${fecha}`}
                  className="m-btn m-press"
                >
                  <SlidersHorizontal size={16} aria-hidden="true" />
                  Ajustar gramos
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Sheet
        open={swapOpen}
        onOpenChange={setSwapOpen}
        title="¿Qué alimento cambias?"
        description="Solo por hoy. Tu plan no cambia."
      >
        <div className="m-stack" style={{ gap: 8 }}>
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/nutricion?vista=comparar&item=${item.id}`}
              className="m-swap-card m-press"
              onClick={() => setSwapOpen(false)}
            >
              <FoodThumb imageUrl={item.imageUrl} foodGroup={item.foodGroup} />
              <span className="m-list-row-main">
                <span className="m-list-row-title">{item.foodName}</span>
                <span className="m-list-row-sub">
                  <span className="m-num">{gramos(item.quantityG)}</span> g ·{" "}
                  <span className="m-num">{kcal(item.macros.calories)}</span>{" "}
                  kcal
                </span>
                <MacroSplitBar macros={item.macros} />
              </span>
              <ArrowLeftRight
                size={18}
                aria-hidden="true"
                className="m-chevron"
              />
            </Link>
          ))}
        </div>
      </Sheet>

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
