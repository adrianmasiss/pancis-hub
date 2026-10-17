"use client";

import { motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSyncExternalStore, type ReactNode } from "react";
import type { MacroSet } from "../lib/macros";
import { formatMacro } from "./macro-comparison";
import { CompareHalo, MacroSkillBars } from "./macro-skill-bars";
import { FoodMedia } from "./swap-comparison-board";

export function CompactStep({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={`compact-step ${className}`}
      initial={{ opacity: 0, y: reduced ? 0 : 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.24 }}
    >
      {children}
    </motion.div>
  );
}
export function OptionPager({
  page,
  count,
  onPage,
  disabled = false,
  size = 2,
}: {
  page: number;
  count: number;
  onPage: (page: number) => void;
  disabled?: boolean;
  size?: number;
}) {
  const pages = Math.max(1, Math.ceil(count / size));
  return (
    <nav className="compact-pager" aria-label="Páginas de opciones">
      <span>
        {count
          ? `${page * size + 1}–${Math.min((page + 1) * size, count)} de ${count}`
          : "Sin opciones"}
      </span>
      <div>
        <button
          type="button"
          aria-label="Opciones anteriores"
          disabled={disabled || page === 0}
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft size={16} strokeWidth={1.5} />
        </button>
        <span>
          {page + 1} / {pages}
        </span>
        <button
          type="button"
          aria-label="Opciones siguientes"
          disabled={disabled || page + 1 >= pages}
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight size={16} strokeWidth={1.5} />
        </button>
      </div>
    </nav>
  );
}
type CardItem = { name: string; quantityG: number; macros: MacroSet };

/**
 * Que es esta comida, en una palabra: varios alimentos son una comida
 * completa; uno solo se nombra por el macro que mas energia le da.
 */
export function mealKind(items: CardItem[], totals: MacroSet): string {
  if (items.length === 0) return "Sin alimentos";
  if (items.length > 1) return `Comida completa · ${items.length} alimentos`;
  const energy = [
    ["Proteína", totals.proteinG * 4],
    ["Carbohidrato", totals.carbohydrateG * 4],
    ["Grasa", totals.fatG * 9],
  ] as const;
  return [...energy].sort((a, b) => b[1] - a[1])[0]![0];
}

/**
 * Tarjeta de una comida en comparar (referencia del usuario): halo arriba,
 * la foto del alimento principal en su cuadro con el nombre y el tipo al
 * lado, las barras de macros y la accion con borde que se rellena.
 */
export function CompactFoodCard({
  label,
  name,
  items,
  totals,
  scale,
  actionLabel,
  onAction,
  tone = "reference",
}: {
  label: string;
  tone?: "reference" | "alternative";
  name: string;
  items: CardItem[];
  totals: MacroSet;
  /** Gramos que llenan la barra; la misma en las dos tarjetas. */
  scale: number;
  actionLabel: string;
  onAction: () => void;
}) {
  /* La foto es la del alimento que mas aporta: es el que da cara al plato. */
  const main = [...items].sort(
    (a, b) => b.macros.calories - a.macros.calories,
  )[0];
  return (
    <section className="compact-food-card v11-card" data-tone={tone}>
      <CompareHalo />
      <span className="alternative-eyebrow">{label}</span>
      <div className="compact-food-head">
        <FoodMedia name={main?.name ?? null} />
        <div className="compact-food-identity">
          <strong title={name}>{name}</strong>
          <small>{mealKind(items, totals)}</small>
        </div>
        <p className="compact-food-energy">
          <b>{formatMacro(totals.calories)}</b>
          <span>kcal</span>
        </p>
      </div>
      <MacroSkillBars macros={items.length ? totals : null} scale={scale} />
      <button
        type="button"
        className="compare-outline-button"
        onClick={onAction}
      >
        {actionLabel}
      </button>
    </section>
  );
}
export function DayImpact({
  totals,
  targets,
  diff,
}: {
  totals?: MacroSet;
  targets?: MacroSet | null;
  diff: MacroSet;
}) {
  const reduced = useReducedMotion();
  if (!totals) return null;
  const after = totals.calories + diff.calories;
  const goal = targets && targets.calories > 0 ? targets.calories : null;
  const remaining = goal === null ? null : goal - after;
  return (
    <motion.section
      className="day-impact-card"
      aria-label="Así quedaría tu día"
      initial={{ opacity: 0, y: reduced ? 0 : 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0.1 : 0.24, ease: [0.32, 0.72, 0, 1] }}
    >
      <header>
        <h3>Así quedaría tu día</h3>
        <span>Con este cambio</span>
      </header>
      <div className="day-impact-values">
        <div>
          <span>Ahora</span>
          <strong>
            {formatMacro(totals.calories)} <small>kcal</small>
          </strong>
        </div>
        <span className="day-impact-arrow" aria-hidden="true">
          →
        </span>
        <div>
          <span>Después</span>
          <strong>
            {formatMacro(after)} <small>kcal</small>
          </strong>
        </div>
      </div>
      {goal !== null && (
        <>
          <div className="day-impact-track" aria-hidden="true">
            <motion.span
              initial={false}
              animate={{ scaleX: Math.max(0, Math.min(1, after / goal)) }}
              transition={{
                duration: reduced ? 0 : 0.3,
                ease: [0.32, 0.72, 0, 1],
              }}
            />
          </div>
          <p className="day-impact-goal">
            <span>
              Meta <b>{formatMacro(goal)} kcal</b>
            </span>
            <span>
              {remaining === 0
                ? "En tu meta"
                : `${formatMacro(Math.abs(remaining!))} kcal ${remaining! > 0 ? "por debajo" : "por encima"}`}
            </span>
          </p>
        </>
      )}
    </motion.section>
  );
}

const shortScreen = "(max-width: 600px) and (max-height: 650px)";
function subscribePageSize(listener: () => void) {
  const media = window.matchMedia(shortScreen);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
/** One option per page on short phones keeps controls visible without shrinking text. */
export function useOptionPageSize() {
  return useSyncExternalStore(
    subscribePageSize,
    () => (window.matchMedia(shortScreen).matches ? 1 : 2),
    () => 2,
  );
}
