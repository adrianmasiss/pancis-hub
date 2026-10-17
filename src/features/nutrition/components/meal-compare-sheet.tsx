"use client";

import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FocusCard,
  FocusCardContent,
  FocusCardDescription,
  FocusCardHeader,
  FocusCardTitle,
  FocusCardTrigger,
} from "@/components/ui/focus-card";
import { CompareTool } from "./compare-tool";
import type { ComparisonMeal } from "../compare-queries";
import "@/features/nutrition/components/compare.css";

/**
 * Comparar se abre en el centro, con el resto difuminado: un escenario sin
 * superficie propia, porque `CompareTool` ya trae sus dos tarjetas (y su
 * veredicto). Envolverlas en otra seria tarjeta dentro de tarjeta.
 */
export function MealCompareSheet({
  mealId,
  mealName,
  dietMeals,
  todayMeals,
  source = "diet",
}: {
  mealId: string;
  mealName: string;
  dietMeals: ComparisonMeal[];
  todayMeals: ComparisonMeal[];
  source?: "diet" | "today";
}) {
  return (
    <FocusCard>
      <FocusCardTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          aria-label={`Comparar — ${mealName}`}
        >
          <ArrowLeftRight size={16} aria-hidden="true" />
          Comparar
        </Button>
      </FocusCardTrigger>
      <FocusCardContent className="nutrition-compare-focus compact-nutrition-focus swap-workbench-focus">
        <FocusCardHeader>
          <FocusCardTitle>
            <span className="compact-title-icon">
              <ArrowLeftRight size={18} strokeWidth={1.5} />
            </span>
            Comparar comida
          </FocusCardTitle>
          <FocusCardDescription>
            {mealName} · vista previa, sin cambiar tu plan
          </FocusCardDescription>
        </FocusCardHeader>
        <div className="compact-dialog-body">
          <CompareTool
            initialMealId={mealId}
            initialSource={source}
            dietMeals={dietMeals}
            todayMeals={todayMeals}
          />
        </div>
      </FocusCardContent>
    </FocusCard>
  );
}
