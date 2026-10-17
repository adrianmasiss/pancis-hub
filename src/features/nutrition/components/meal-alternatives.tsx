"use client";
import { useState } from "react";
import type { ComparisonMeal } from "../compare-queries";
import { rankMealAlternatives } from "../lib/meal-alternatives";
import { MacroSummary } from "./macro-comparison";
import { OptionPager } from "./compact-nutrition";
import { AlternativeRow } from "@/components/shared/alternative-row";
import "./alternative-explorer.css";

export type MealExploreMode = "similar" | "macros" | "search";
export function MealAlternatives({
  reference,
  meals,
  mode,
  onMode,
  onSelect,
  selectedId,
  compact = false,
}: {
  reference: ComparisonMeal | null;
  meals: ComparisonMeal[];
  mode: MealExploreMode;
  onMode: (mode: MealExploreMode) => void;
  onSelect: (meal: ComparisonMeal) => void;
  selectedId: string;
  compact?: boolean;
}) {
  const [page, setPage] = useState(0);
  const alternatives =
    reference && mode !== "search"
      ? rankMealAlternatives(reference, meals, mode)
      : [];
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(alternatives.length / 2) - 1),
  );
  return (
    <section
      className="compact-step meal-discovery"
      aria-label="Alternativas de comida"
    >
      {reference && !compact && (
        <div className="alternative-reference v11-card">
          <div>
            <p className="alternative-eyebrow">Tu comida actual</p>
            <h3>{reference.label}</h3>
          </div>
          <MacroSummary macros={reference.totals} />
        </div>
      )}
      {!compact && (
        <>
          <div
            role="group"
            aria-label="Encontrar comidas"
            className="alternative-tabs"
          >
            {(
              [
                ["similar", "Similares"],
                ["macros", "Más cercanas en macros"],
                ["search", "Buscar / crear"],
              ] as const
            ).map(([value, label]) => (
              <button
                type="button"
                key={value}
                aria-label={label}
                aria-pressed={mode === value}
                onClick={() => {
                  setPage(0);
                  onMode(value);
                }}
              >
                {value === "macros" ? "Macros cercanos" : label}
              </button>
            ))}
          </div>
        </>
      )}
      <p className="compact-note">
        {mode === "similar"
          ? "Mismo tipo de comida o ingredientes en común."
          : "Ordenadas por cercanía en todos los macros."}
      </p>
      {alternatives.length ? (
        <ul className="alternative-list">
          {alternatives
            .slice(currentPage * 2, currentPage * 2 + 2)
            .map((meal, index) => (
              <li key={meal.id}>
                <AlternativeRow
                  name={meal.label}
                  meta={`${meal.items.length} ${
                    meal.items.length === 1 ? "alimento" : "alimentos"
                  } · ${Math.round(meal.totals.calories)} kcal`}
                  deltaKcal={
                    reference
                      ? meal.totals.calories - reference.totals.calories
                      : null
                  }
                  featured={index === 0 && currentPage === 0}
                  pressed={meal.id === selectedId}
                  onClick={() => onSelect(meal)}
                />
              </li>
            ))}
        </ul>
      ) : (
        <p className="compact-empty">
          {reference
            ? "No hay otras comidas para este criterio. Prueba Macros cercanos o crea una combinación."
            : "Selecciona una comida o crea una combinación."}
        </p>
      )}
      <OptionPager
        page={currentPage}
        count={alternatives.length}
        onPage={setPage}
      />
    </section>
  );
}
