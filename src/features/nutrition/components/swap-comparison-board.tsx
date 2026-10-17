/* eslint-disable @next/next/no-img-element -- Existing food images and local illustrations, consistent with FoodThumbnail. */
"use client";

import "./swap-comparison-board.css";
import "./comparison-clarity.css";
import { Utensils } from "lucide-react";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { MacroSet } from "../lib/macros";
import { macroDifference } from "../lib/compare";
import { foodVisual } from "../lib/food-visual";
import { foodIllustration } from "@/features/foods/lib/food-illustrations";
import { formatMacro } from "./macro-comparison";
import { MacroSkillBars } from "./macro-skill-bars";
import { messages } from "@/i18n/es-419";

const nutrients = [
  ["proteinG", "Proteína"],
  ["carbohydrateG", "Carbos"],
  ["fatG", "Grasas"],
  ["fiberG", "Fibra"],
] as const;
export type ComparisonFood = {
  name: string;
  macros: MacroSet | null;
  quantityG: number;
  imageUrl?: string | null;
  group?: string | null;
  cookedState?: string | null;
  category?: string;
};
/** Foto del alimento en su cuadro, o su ilustracion, o un icono neutro. */
export function FoodMedia({
  name,
  group,
  imageUrl,
  cookedState,
}: {
  name: string | null;
  group?: string | null;
  imageUrl?: string | null;
  cookedState?: string | null;
}) {
  const visual = name ? foodVisual({ name, group, imageUrl }) : null;
  const illustration =
    name && !visual?.src
      ? foodIllustration(name, cookedState ?? null, null)
      : null;
  return (
    <div className="swap-card-media">
      {visual?.src ? (
        <img src={visual.src} alt="" className="swap-food-photo" />
      ) : illustration ? (
        <span
          className="swap-food-illustration"
          role="img"
          aria-label={`Ilustración de ${name}`}
          style={illustration}
        />
      ) : (
        <Utensils
          className="swap-food-placeholder"
          strokeWidth={1.2}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
function FoodCard({
  food,
  alternative = false,
  gramScale,
  children,
}: {
  food: ComparisonFood | null;
  alternative?: boolean;
  gramScale: number;
  children: ReactNode;
}) {
  return (
    <section
      className="swap-food-card v11-card"
      data-tone={alternative ? "alternative" : "reference"}
      aria-label={alternative ? "Alimento alternativo" : "Alimento actual"}
    >
      <span className="swap-role-label">
        {alternative ? "Alternativa" : "Tu alimento"}
      </span>
      <div className="swap-card-header">
        <FoodMedia
          name={food?.name ?? null}
          group={food?.group}
          imageUrl={food?.imageUrl}
          cookedState={food?.cookedState}
        />
        <div className="swap-card-identity">
          <h3 className="swap-card-name" title={food?.name}>
            {food?.name ?? "Elige una alternativa"}
          </h3>
          <p className="swap-card-category">
            {food
              ? (food.category ??
                messages.foods.groups[
                  food.group as keyof typeof messages.foods.groups
                ] ??
                "Alimento")
              : "Busca o elige abajo"}
          </p>
        </div>
      </div>
      <p className="swap-card-energy">
        <strong>
          {food?.macros ? formatMacro(food.macros.calories) : "—"}
        </strong>
        <span>kcal</span>
      </p>
      <div className="swap-card-portion">{children}</div>
      <MacroSkillBars macros={food?.macros ?? null} scale={gramScale} />
    </section>
  );
}
export function SwapComparisonBoard({
  source,
  alternative,
  portionControl,
  sourceControls,
  sourcePortionControl,
  alternativeControls,
  alternativePicker,
  dayImpact,
}: {
  source: ComparisonFood;
  alternative: ComparisonFood | null;
  portionControl: ReactNode;
  sourceControls?: ReactNode;
  sourcePortionControl?: ReactNode;
  alternativeControls?: ReactNode;
  alternativePicker?: ReactNode;
  dayImpact?: ReactNode;
}) {
  const reduced = useReducedMotion();
  const diff =
    source.macros && alternative?.macros
      ? macroDifference(source.macros, alternative.macros)
      : null;
  const delta = (key: keyof MacroSet) =>
    diff ? `${diff[key] > 0 ? "+" : ""}${formatMacro(diff[key])}` : "—";
  // All bars share one gram scale, so neither a nutrient nor a food is exaggerated.
  const gramScale = Math.max(
    1,
    ...nutrients.flatMap(([key]) => [
      source.macros?.[key] ?? 0,
      alternative?.macros?.[key] ?? 0,
    ]),
  );
  const choosing = Boolean(alternativePicker);
  return (
    <section
      className="swap-comparison-board comparison-clear"
      data-choosing={choosing}
      aria-label="Comparación del intercambio"
    >
      <div className="comparison-reference-column">
        {(sourceControls || alternativeControls) && (
          <div className="comparison-source-controls">{sourceControls}</div>
        )}
        <FoodCard food={source} gramScale={gramScale}>
          <span>
            {formatMacro(source.quantityG)} g <small>· porción actual</small>
          </span>
          {sourcePortionControl}
        </FoodCard>
      </div>
      <div className="comparison-choice-column">
        {alternativeControls && (
          <div className="comparison-alternative-controls">
            {alternativeControls}
          </div>
        )}
        {choosing ? (
          <section
            className="comparison-discovery"
            aria-label="Elegir alternativa"
          >
            <header>
              <h3>Elige una alternativa</h3>
              <p>Selecciona un alimento para comparar las porciones.</p>
            </header>
            {alternativePicker}
          </section>
        ) : (
          <FoodCard food={alternative} alternative gramScale={gramScale}>
            {portionControl}
          </FoodCard>
        )}
      </div>
      {!choosing && diff && (
        <motion.section
          key={alternative?.name}
          initial={{ opacity: 0, y: reduced ? 0 : 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: reduced ? 0.1 : 0.24,
            ease: [0.32, 0.72, 0, 1],
          }}
          className="comparison-conclusion"
          data-with-day={Boolean(dayImpact)}
          aria-label="Qué cambia con esta alternativa"
        >
          <header>
            <div>
              <h3>Qué cambia</h3>
              <p>La alternativa respecto a tu porción actual.</p>
            </div>
            <p className="comparison-energy-delta">
              <strong>{delta("calories")}</strong> kcal
            </p>
          </header>
          <dl className="comparison-deltas">
            {nutrients.map(([key, label]) => (
              <div
                key={key}
                data-macro={key}
                data-change={diff[key] === 0 ? "same" : "changed"}
              >
                <dt>{label}</dt>
                <dd>
                  {delta(key)} <small>g</small>
                  <span className="comparison-delta-caption">
                    {diff[key] > 0
                      ? "Más"
                      : diff[key] < 0
                        ? "Menos"
                        : "Sin cambio"}
                  </span>
                  <span className="comparison-delta-track" aria-hidden="true">
                    <motion.span
                      initial={false}
                      animate={{
                        scaleX: Math.min(1, Math.abs(diff[key]) / gramScale),
                      }}
                      transition={{
                        duration: reduced ? 0 : 0.28,
                        ease: [0.32, 0.72, 0, 1],
                      }}
                    />
                  </span>
                </dd>
              </div>
            ))}
          </dl>
          <p className="sr-only" role="status" aria-live="polite" aria-atomic>
            Diferencia: {delta("calories")} kcal;{" "}
            {nutrients
              .map(([key, label]) => `${label} ${delta(key)} g`)
              .join(", ")}
            .
          </p>
        </motion.section>
      )}
      {!choosing && diff && dayImpact && (
        <div className="comparison-day-slot">{dayImpact}</div>
      )}
    </section>
  );
}
