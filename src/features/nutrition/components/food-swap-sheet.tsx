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
import { messages } from "@/i18n/es-419";

const t = messages.swap;

export function FoodSwapSheet({ item }: { item: MealItemView }) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SwapSuggestions | null>(null);
  const [rebalance, setRebalance] = useState<RebalanceReport | null>(null);
  const [filter, setFilter] = useState<SwapFilter>("similar");
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

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
    void load(next);
  };

  const confirm = (foodId: string, quantityG: number) => {
    startTransition(async () => {
      const result = await swapMealItem({ itemId: item.id, foodId, quantityG });
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
        <div className="overflow-y-auto px-4 pb-6">
          <SwapAlternativeList
            sourceName={item.foodName}
            sourceQuantityG={item.quantityG}
            sourceCalories={item.macros.calories}
            filter={filter}
            onFilterChange={changeFilter}
            loading={loading}
            alternatives={suggestions?.alternatives ?? null}
            pending={pending}
            onConfirm={confirm}
            beforeList={
              rebalance ? <RebalanceSummary report={rebalance} /> : null
            }
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
