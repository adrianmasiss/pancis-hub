"use client";

import { useState } from "react";
import { ChevronDown, CircleDot } from "lucide-react";
import { MealCard } from "./meal-card";
import { FoodAvatar } from "./food-avatar";
import { MacroCells } from "./meal-macro-cells";
import { MealCompareSheet } from "./meal-compare-sheet";
import type { MealView } from "../queries";
import type { ComparisonMeal } from "../compare-queries";
import type { MacroSet } from "../lib/macros";
import { isMealConsumed } from "../lib/day-overview";
import { messages } from "@/i18n/es-419";

/**
 * Una comida registrada que NO sale del plan, con la misma piel que las
 * paradas del plan: tarjeta en la ruta del dia y sus alimentos por separado.
 *
 * Antes esto vivia en una seccion aparte —«Registro del dia»— que repetia la
 * lista entera debajo de la del plan: la misma comida aparecia dos veces, una
 * con casilla y otra en un desplegable. Absorbida aqui, el dia es UNA lista en
 * orden de hora, y lo que sobra es la seccion, no la funcion: editar
 * cantidades y comparar siguen dentro, un toque mas abajo.
 */
export function LoggedMealRow({
  meal,
  dayTotals,
  dayTargets,
  comparison,
}: {
  meal: MealView;
  dayTotals: MacroSet;
  dayTargets: MacroSet | null;
  comparison: { dietMeals: ComparisonMeal[]; todayMeals: ComparisonMeal[] };
}) {
  const [abierto, setAbierto] = useState(false);
  const titulo = meal.name || messages.nutrition.mealTypes[meal.mealType];
  const consumida = isMealConsumed(meal.status);

  const hora = meal.scheduledTime?.slice(0, 5);
  return (
    <li
      className="meal-stop"
      data-done={consumida}
      aria-labelledby={`registro-${meal.id}`}
    >
      <div className="meal-stop-rail" aria-hidden="true">
        <span className="meal-stop-time">{hora ?? "—"}</span>
        <span className="meal-stop-dot" />
      </div>
      <article className="meal-card">
        <header className="meal-row meal-row-head">
          <div className="meal-row-title">
            <span className="meal-card-eyebrow">
              <CircleDot size={13} aria-hidden="true" />
              Fuera del plan
              {hora ? (
                <span className="meal-card-eyebrow-time">{hora}</span>
              ) : null}
              {/* Marca sin interruptor: esto ya esta comido por definicion,
                  no es algo que se marque y desmarque como el plan. */}
              <span
                className="meal-card-tag"
                data-tone={consumida ? undefined : "swap"}
              >
                {messages.nutrition.statuses[meal.status]}
              </span>
            </span>
            <h3 id={`registro-${meal.id}`}>{titulo}</h3>
          </div>
          <MacroCells macros={meal.totals} targets={dayTargets} strong />
          <div className="meal-row-end">
            <button
              type="button"
              className="meal-card-head-toggle"
              onClick={() => setAbierto(!abierto)}
              aria-expanded={abierto}
              aria-controls={`registro-detalle-${meal.id}`}
              aria-label={`${abierto ? "Ocultar" : "Editar"} los alimentos — ${titulo}`}
            >
              <ChevronDown size={18} aria-hidden="true" />
            </button>
          </div>
        </header>
        {abierto ? (
          <div
            id={`registro-detalle-${meal.id}`}
            className="nutrition-logged-detail"
          >
            <MealCompareSheet
              mealId={meal.id}
              mealName={titulo}
              source="today"
              {...comparison}
            />
            <MealCard
              meal={meal}
              dayTotals={dayTotals}
              dayTargets={dayTargets}
            />
          </div>
        ) : meal.items.length > 0 ? (
          <ul className="meal-foods" aria-label={`Alimentos — ${titulo}`}>
            {meal.items.map((item) => (
              <li key={item.id} className="meal-food">
                <div className="meal-row meal-row-food">
                  <div className="meal-row-title">
                    <FoodAvatar name={item.foodName} />
                    <div className="meal-food-copy">
                      <strong>{item.foodName}</strong>
                      <span>{Math.round(item.quantityG)} g</span>
                    </div>
                  </div>
                  <MacroCells macros={item.macros} />
                  <div className="meal-row-end" />
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </article>
    </li>
  );
}
