"use client";

import { useState, useTransition } from "react";
import { ArrowLeftRight, Star, History, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MacroChip,
  macroLabel,
  macroUnit,
  type MacroType,
} from "@/components/shared/macro-chip";
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
import { Label } from "@/components/ui/label";
import {
  SWAP_FILTERS,
  type SwapFilter,
} from "@/features/foods/lib/equivalence";
import type { MealItemView } from "@/features/nutrition/queries";
import type { RebalanceReport } from "@/features/nutrition/lib/rebalance";
import { CompatibilityScore } from "@/components/shared/compatibility-score";
import { RebalanceSummary } from "@/components/shared/rebalance-summary";
import { messages } from "@/i18n/es-419";

const t = messages.swap;
const n = messages.nutrition;

function sign(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

const DIFF_MACROS: { type: MacroType; key: keyof SwapSuggestions["alternatives"][number]["diff"] }[] = [
  { type: "calories", key: "calories" },
  { type: "protein", key: "proteinG" },
  { type: "carbs", key: "carbohydrateG" },
  { type: "fat", key: "fatG" },
  { type: "fiber", key: "fiberG" },
];

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
        <div className="space-y-3 overflow-y-auto px-4 pb-6">
          <p className="text-sm">
            {t.sourceLabel}:{" "}
            <span className="font-medium">
              {item.quantityG} g de {item.foodName}
            </span>{" "}
            <MacroChip
              type="calories"
              value={item.macros.calories}
              className="text-muted-foreground"
            />
          </p>

          {/* Requisito 5.2: buscar la alternativa segun lo que hace falta. */}
          <div className="space-y-1">
            <Label htmlFor="swap-filter">{t.filterLabel}</Label>
            <select
              id="swap-filter"
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              value={filter}
              onChange={(event) => {
                const next = event.target.value as SwapFilter;
                setFilter(next);
                setSuggestions(null);
                void load(next);
              }}
            >
              {SWAP_FILTERS.map((option) => (
                <option key={option} value={option}>
                  {t.filters[option]}
                </option>
              ))}
            </select>
            {filter === "mas_proteina" || filter === "mas_saciedad" ? (
              <p className="text-muted-foreground text-xs">{t.densityNote}</p>
            ) : null}
          </div>

          {rebalance ? <RebalanceSummary report={rebalance} /> : null}

          {loading ? (
            <p className="text-muted-foreground text-sm">
              {messages.common.loading}
            </p>
          ) : suggestions && suggestions.alternatives.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {filter === "similar" ? t.noAlternatives : t.filterEmpty}
            </p>
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
                    <MacroChip
                      type="calories"
                      value={alternative.macros.calories}
                      className="text-muted-foreground"
                    />
                  </p>
                  <p className="text-muted-foreground flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs">
                    <span>{t.differences}:</span>
                    {DIFF_MACROS.map(({ type, key }) => (
                      <span key={type} className="tabular-nums">
                        {macroLabel(type)} {sign(alternative.diff[key])}{" "}
                        {macroUnit(type)}
                      </span>
                    ))}
                  </p>
                  <CompatibilityScore score={alternative.compatibility} />
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

          {suggestions && suggestions.alternatives.length > 0 ? (
            <p className="text-muted-foreground text-xs">
              {t.compatibilityNote}
            </p>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
