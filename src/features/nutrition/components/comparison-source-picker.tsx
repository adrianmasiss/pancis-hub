"use client";

import { useState, useTransition } from "react";
import { ChevronDown } from "lucide-react";
import {
  FocusCard,
  FocusCardContent,
  FocusCardDescription,
  FocusCardHeader,
  FocusCardTitle,
} from "@/components/ui/focus-card";
import { CompareTool } from "./compare-tool";
import { loadComparisonSources } from "../comparison-actions";
import type { ComparisonMeal } from "../compare-queries";
import type { ComparisonFood } from "./swap-comparison-board";

export function ComparisonSourcePicker({ source }: { source: ComparisonFood }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{
    dietMeals: ComparisonMeal[];
    todayMeals: ComparisonMeal[];
  } | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const load = () => {
    setError("");
    startTransition(async () => {
      try {
        const result = await loadComparisonSources();
        if ("error" in result) setError(result.error);
        else setData(result);
      } catch {
        setError("No pudimos cargar tus comidas. Inténtalo de nuevo.");
      }
    });
  };
  const original: ComparisonMeal = {
    id: "selected-food",
    label: source.name,
    totals: source.macros!,
    items: [
      {
        name: source.name,
        quantityG: source.quantityG,
        macros: source.macros!,
      },
    ],
  };
  return (
    <>
      <button
        className="comparison-source-button"
        type="button"
        onClick={() => {
          setOpen(true);
          if (!data) load();
        }}
      >
        Cambiar alimento o comida{" "}
        <ChevronDown size={14} strokeWidth={1.5} aria-hidden="true" />
      </button>
      <FocusCard open={open} onOpenChange={setOpen}>
        <FocusCardContent className="nutrition-swap-sheet compact-nutrition-focus swap-workbench-focus">
          <FocusCardHeader>
            <FocusCardTitle>Comparar alimentos</FocusCardTitle>
            <FocusCardDescription>
              Elige un alimento o una comida. Esta comparación no modifica tu
              plan.
            </FocusCardDescription>
          </FocusCardHeader>
          <div className="compact-dialog-body">
            {pending ? (
              <p role="status">Cargando tus comidas…</p>
            ) : error ? (
              <div role="alert">
                <p>{error}</p>
                <button type="button" onClick={load}>
                  Reintentar
                </button>
              </div>
            ) : (
              data && (
                <CompareTool
                  dietMeals={[original, ...data.dietMeals]}
                  todayMeals={data.todayMeals}
                  initialMealId={original.id}
                />
              )
            )}
          </div>
        </FocusCardContent>
      </FocusCard>
    </>
  );
}
