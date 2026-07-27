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
import { SwapQuestionPanel } from "@/features/nutrition/components/swap-question-panel";
import {
  getDietItemSwapSuggestions,
  swapDietTemplateItem,
  type DietSwapSuggestions,
} from "@/features/dashboard/actions";
import type { SwapFilter } from "@/features/foods/lib/equivalence";
import type { DietTemplateItemView } from "@/features/dashboard/queries";
import { messages } from "@/i18n/es-419";

const t = messages.swap;

export function DietItemSwapSheet({
  item,
  date,
}: {
  item: DietTemplateItemView;
  /** Dia al que aplicaria una sustitucion "solo por hoy". */
  date: string;
}) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<DietSwapSuggestions | null>(
    null,
  );
  const [filter, setFilter] = useState<SwapFilter>("similar");
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  const load = async (nextFilter: SwapFilter = filter) => {
    setLoading(true);
    const result = await getDietItemSwapSuggestions({
      templateItemId: item.id,
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
      const result = await swapDietTemplateItem({
        templateItemId: item.id,
        foodId,
        quantityG,
      });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(t.swapped);
        setOpen(false);
        setSuggestions(null);
      }
    });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void load();
        else setSuggestions(null);
      }}
    >
      <SheetTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="text-muted-foreground size-7 shrink-0"
          aria-label={`${t.trigger} — ${item.foodName}`}
        >
          <ArrowLeftRight className="size-3.5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t.title}</SheetTitle>
          <SheetDescription>{t.description}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-6">
          {/* Consulta libre con IA, antes de la lista de alternativas del
              catalogo: es la via para el producto que no esta en la
              biblioteca, que es justo cuando la lista no ayuda. */}
          <SwapQuestionPanel
            from={{
              name: item.foodName,
              per100g: {
                calories: item.quantityG
                  ? (item.macros.calories / item.quantityG) * 100
                  : 0,
                proteinG: item.quantityG
                  ? (item.macros.proteinG / item.quantityG) * 100
                  : 0,
                carbohydrateG: item.quantityG
                  ? (item.macros.carbohydrateG / item.quantityG) * 100
                  : 0,
                fatG: item.quantityG
                  ? (item.macros.fatG / item.quantityG) * 100
                  : 0,
                fiberG: item.quantityG
                  ? (item.macros.fiberG / item.quantityG) * 100
                  : 0,
              },
              quantityG: item.quantityG,
            }}
            templateItemId={item.id}
            date={date}
          />

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
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
