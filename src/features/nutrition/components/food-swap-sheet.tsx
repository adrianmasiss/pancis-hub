"use client";

import { useState, useTransition } from "react";
import { ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SwapAlternativeList } from "@/components/shared/swap-alternative-list";
import {
  getSwapSuggestions,
  swapMealItem,
  type SwapSuggestions,
} from "@/features/nutrition/swap-actions";
import type { SwapFilter } from "@/features/foods/lib/equivalence";
import type { MealItemView } from "@/features/nutrition/queries";
import type { RebalanceReport } from "@/features/nutrition/lib/rebalance";
import { RebalanceSummary } from "@/components/shared/rebalance-summary";
import { SwapVerdict } from "@/features/nutrition/components/swap-verdict";
import type { SwapCandidate } from "@/features/foods/lib/equivalence";
import type { MacroSet } from "@/features/nutrition/lib/macros";
import { messages } from "@/i18n/es-419";

const t = messages.swap;

/**
 * Sustituir un alimento YA REGISTRADO.
 *
 * Lleva el mismo paso de veredicto que la hoja del plan: elegir selecciona y
 * abre la comparacion, y aplicar es un segundo gesto. Salio sin el, y como las
 * dos hojas comparten el rotulo del boton, aqui decia "Ver el cambio" y
 * aplicaba directo — un boton que promete mirar y ejecuta.
 */
export function FoodSwapSheet({
  item,
  dayTotals,
  dayTargets,
}: {
  item: MealItemView;
  dayTotals?: MacroSet;
  dayTargets?: MacroSet | null;
}) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SwapSuggestions | null>(null);
  const [rebalance, setRebalance] = useState<RebalanceReport | null>(null);
  const [filter, setFilter] = useState<SwapFilter>("similar");
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [picked, setPicked] = useState<SwapCandidate | null>(null);

  const load = async (nextFilter: SwapFilter = filter) => {
    setLoading(true);
    const result = await getSwapSuggestions({
      itemId: item.id,
      filter: nextFilter,
    });
    setLoading(false);
    if ("error" in result) toast.error(result.error);
    else setSuggestions(result);
  };

  const changeFilter = (next: SwapFilter) => {
    setFilter(next);
    setSuggestions(null);
    setPicked(null);
    void load(next);
  };

  const pick = (foodId: string, quantityG: number) => {
    setPicked(
      suggestions?.alternatives.find(
        (alternative) =>
          alternative.food.id === foodId &&
          alternative.suggestedQuantityG === quantityG,
      ) ?? null,
    );
  };

  const confirm = () => {
    if (!picked) return;
    startTransition(async () => {
      const result = await swapMealItem({
        itemId: item.id,
        foodId: picked.food.id,
        quantityG: picked.suggestedQuantityG,
      });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(t.swapped);
        // La hoja no se cierra: el usuario necesita ver como quedo el dia
        // tras el cambio antes de seguir (requisito 6).
        setSuggestions(null);
        setRebalance(result.rebalance);
      }
    });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void load();
        else {
          setSuggestions(null);
          setRebalance(null);
        }
      }}
    >
      <SheetTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="text-muted-foreground size-8"
          aria-label={`${t.trigger} — ${item.foodName}`}
        >
          <ArrowLeftRight className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t.title}</SheetTitle>
          <SheetDescription>{t.description}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-6">
          {picked ? (
            <SwapVerdict
              fromName={item.foodName}
              toName={picked.food.name}
              diff={picked.diff}
              dayTotals={dayTotals}
              dayTargets={dayTargets}
              pending={pending}
              onConfirm={confirm}
            />
          ) : null}

          <SwapAlternativeList
            sourceName={item.foodName}
            sourceQuantityG={item.quantityG}
            sourceCalories={item.macros.calories}
            filter={filter}
            onFilterChange={changeFilter}
            loading={loading}
            alternatives={suggestions?.alternatives ?? null}
            pending={pending}
            onConfirm={pick}
            beforeList={
              rebalance ? <RebalanceSummary report={rebalance} /> : null
            }
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
