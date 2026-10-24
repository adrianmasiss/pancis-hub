/* eslint-disable @next/next/no-img-element -- Existing food images and local illustrations, consistent with FoodThumbnail. */
"use client";

import "./swap-comparison-board.css";
import "./comparison-clarity.css";
import { Utensils } from "lucide-react";
import { useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import type { MacroSet } from "../lib/macros";
import { macroDifference } from "../lib/compare";
import { foodVisual } from "../lib/food-visual";
import { foodIllustration } from "@/features/foods/lib/food-illustrations";
import { formatMacro } from "./macro-comparison";
import styles from "./comparison-table.module.css";
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
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const visual = name ? foodVisual({ name, group, imageUrl }) : null;
  const src = visual?.src && visual.src !== failedSrc ? visual.src : null;
  const illustration =
    name && !src ? foodIllustration(name, cookedState ?? null, null) : null;
  return (
    <div className="swap-card-media">
      {src ? (
        <img
          src={src}
          alt=""
          className="swap-food-photo"
          onError={() => setFailedSrc(src)}
        />
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
  children,
}: {
  food: ComparisonFood | null;
  alternative?: boolean;
  children: ReactNode;
}) {
  const reduced = useReducedMotion();
  return (
    <section
      className={styles.food}
      data-tone={alternative ? "alternative" : "reference"}
      aria-label={alternative ? "Alimento alternativo" : "Alimento actual"}
    >
      <div className={styles.role}>
        <span aria-hidden="true" />
        {alternative ? "Tu alternativa" : "Tu alimento actual"}
      </div>
      <motion.div
        className={styles.portrait}
        key={`${food?.name}-${food?.imageUrl}`}
        initial={{ opacity: 0, scale: reduced ? 1 : 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: reduced ? 0.1 : 0.22,
          ease: [0.32, 0.72, 0, 1],
        }}
      >
        <FoodMedia
          name={food?.name ?? null}
          group={food?.group}
          imageUrl={food?.imageUrl}
          cookedState={food?.cookedState}
        />
      </motion.div>
      <div className={styles.identity}>
        <p className={styles.category}>
          {food
            ? (food.category ??
              messages.foods.groups[
                food.group as keyof typeof messages.foods.groups
              ] ??
              "Alimento")
            : "Por descubrir"}
        </p>
        <h3>{food?.name ?? "Elige una alternativa"}</h3>
      </div>
      <div className={styles.serving}>
        <div className={`${styles.portion} swap-card-portion`}>{children}</div>
        <p className={`${styles.energy} swap-card-energy`}>
          <strong>
            {food?.macros ? formatMacro(food.macros.calories) : "—"}
          </strong>
          <span>kcal</span>
        </p>
      </div>
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
      className={`swap-comparison-board comparison-clear ${styles.scene}`}
      data-choosing={choosing}
      aria-label="Comparación del intercambio"
    >
      <div className={`comparison-reference-column v11-card ${styles.column}`}>
        {(sourceControls || alternativeControls) && (
          <div className="comparison-source-controls">{sourceControls}</div>
        )}
        <FoodCard food={source}>
          <span>
            {formatMacro(source.quantityG)} g <small>· porción actual</small>
          </span>
          {sourcePortionControl}
        </FoodCard>
        {choosing && source.macros && (
          <dl
            className={styles.sourceFacts}
            aria-label="Nutrientes de tu alimento actual"
          >
            {nutrients.map(([key, label]) => (
              <div key={key} data-macro={key}>
                <dt>{label}</dt>
                <dd>
                  {formatMacro(source.macros![key])}
                  <small> g</small>
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
      <div className={`comparison-choice-column v11-card ${styles.column}`}>
        {alternativeControls && (
          <div className="comparison-alternative-controls">
            {alternativeControls}
          </div>
        )}
        {choosing ? (
          <section
            className={`comparison-discovery ${styles.discovery}`}
            aria-label="Elegir alternativa"
          >
            <header>
              <span className={styles.eyebrow}>Alternativas</span>
              <h3>Encuentra tu alternativa</h3>
              <p>Selecciona un alimento para comparar las porciones.</p>
            </header>
            {alternativePicker}
          </section>
        ) : (
          <FoodCard food={alternative} alternative>
            {portionControl}
          </FoodCard>
        )}
      </div>
      {!choosing && (
        <section
          className={`v11-card ${styles.nutrition}`}
          aria-label="Qué cambia con esta alternativa"
        >
          <header className={styles.summary}>
            <div>
              <span className={styles.eyebrow}>Balance del intercambio</span>
              <h3>
                {diff
                  ? `${formatMacro(Math.abs(diff.calories))} kcal ${diff.calories < 0 ? "menos" : diff.calories > 0 ? "más" : "de diferencia"}`
                  : "Compara tus porciones"}
              </h3>
              <p>
                {diff
                  ? "Con las cantidades que elegiste."
                  : "Elige una alternativa y una cantidad válida para comparar."}
              </p>
            </div>
            <span className={styles.summaryMark} aria-hidden="true">
              ↔
            </span>
          </header>
          <table className={styles.nutrients}>
            <caption className="sr-only">
              Nutrientes por porción. Todas las barras comparten la misma escala
              en gramos.
            </caption>
            <thead>
              <tr>
                <th scope="col">Nutriente</th>
                <th scope="col">Actual</th>
                <th scope="col">Alternativa</th>
                <th scope="col">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {nutrients.map(([key, label]) => (
                <tr key={key} data-macro={key}>
                  <th scope="row">{label}</th>
                  {[source.macros, alternative?.macros].map((macros, index) => (
                    <td
                      key={index}
                      data-side={index === 0 ? "reference" : "alternative"}
                    >
                      <span>
                        {macros ? formatMacro(macros[key]) : "—"}{" "}
                        <small>g</small>
                      </span>
                      <span className={styles.track} aria-hidden="true">
                        <motion.span
                          initial={false}
                          animate={{
                            scaleX: macros
                              ? Math.min(1, macros[key] / gramScale)
                              : 0,
                          }}
                          transition={{
                            duration: reduced ? 0 : 0.22,
                            ease: [0.32, 0.72, 0, 1],
                          }}
                        />
                      </span>
                    </td>
                  ))}
                  <td className={styles.difference}>
                    {delta(key)} <small>g</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="sr-only" role="status" aria-live="polite" aria-atomic>
            {diff
              ? `Diferencia: ${delta("calories")} kcal; ${nutrients.map(([key, label]) => `${label} ${delta(key)} g`).join(", ")}.`
              : "Comparación pendiente."}
          </p>
        </section>
      )}
      {!choosing && diff && dayImpact && (
        <div className="comparison-day-slot">{dayImpact}</div>
      )}
    </section>
  );
}
