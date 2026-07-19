"use client";

import { useState, useTransition } from "react";
import { ArrowLeftRight, Star, History, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  getSwapSuggestions,
  swapMealItem,
  type SwapSuggestions,
} from "@/features/nutrition/swap-actions";
import type { MealItemView } from "@/features/nutrition/queries";
import { messages } from "@/i18n/es-419";

const t = messages.swap;
const n = messages.nutrition;

function sign(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

export function FoodSwapSheet({ item }: { item: MealItemView }) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SwapSuggestions | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  const load = async () => {
    setLoading(true);
    const result = await getSwapSuggestions({ itemId: item.id });
    setLoading(false);
    if ("error" in result) toast.error(result.error);
    else setSuggestions(result);
  };

  const confirm = (foodId: string, quantityG: number) => {
    startTransition(async () => {
      const result = await swapMealItem({ itemId: item.id, foodId, quantityG });
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
        <div className="space-y-3 overflow-y-auto px-4 pb-6">
          <p className="text-sm">
            {t.sourceLabel}:{" "}
            <span className="font-medium">
              {item.quantityG} g de {item.foodName}
            </span>{" "}
            <span className="text-muted-foreground tabular-nums">
              ({item.macros.calories} {n.kcal})
            </span>
          </p>

          {loading ? (
            <p className="text-muted-foreground text-sm">
              {messages.common.loading}
            </p>
          ) : suggestions && suggestions.alternatives.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t.noAlternatives}</p>
          ) : suggestions ? (
            <ul className="space-y-2">
              {suggestions.alternatives.map((alternative) => (
                <li
                  key={alternative.food.id}
                  className="space-y-2 rounded-xl border p-3"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-medium">
                      {alternative.food.name}
                    </span>
                    {alternative.food.cookedState ? (
                      <span className="text-muted-foreground text-xs">
                        ({n.cookedState[alternative.food.cookedState]})
                      </span>
                    ) : null}
                    {!alternative.sameGroup ? (
                      <Badge variant="outline" className="gap-1 font-normal">
                        <TriangleAlert className="size-3" aria-hidden="true" />
                        {t.crossGroupNote}
                      </Badge>
                    ) : null}
                    {alternative.isFavorite ? (
                      <Badge variant="secondary" className="gap-1 font-normal">
                        <Star className="size-3" aria-hidden="true" />
                        {t.favoriteNote}
                      </Badge>
                    ) : alternative.isRecent ? (
                      <Badge variant="secondary" className="gap-1 font-normal">
                        <History className="size-3" aria-hidden="true" />
                        {t.recentNote}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="text-sm tabular-nums">
                    {t.suggestedQuantity}:{" "}
                    <span className="font-medium">
                      {alternative.suggestedQuantityG} g
                    </span>{" "}
                    <span className="text-muted-foreground">
                      ≈ {alternative.macros.calories} {n.kcal}
                    </span>
                  </p>
                  <p className="text-muted-foreground text-xs tabular-nums">
                    {t.differences}: {sign(alternative.diff.calories)} {n.kcal}{" "}
                    · P {sign(alternative.diff.proteinG)} g · C{" "}
                    {sign(alternative.diff.carbohydrateG)} g · G{" "}
                    {sign(alternative.diff.fatG)} g · Fibra{" "}
                    {sign(alternative.diff.fiberG)} g
                  </p>
                  <Button
                    size="sm"
                    className="w-full"
                    disabled={pending}
                    onClick={() =>
                      confirm(
                        alternative.food.id,
                        alternative.suggestedQuantityG,
                      )
                    }
                  >
                    {pending ? messages.common.loading : t.confirmSwap}
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
