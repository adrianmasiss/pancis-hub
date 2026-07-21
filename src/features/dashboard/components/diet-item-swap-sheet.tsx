"use client";

import { useState, useTransition } from "react";
import { ArrowLeftRight, History, Star, TriangleAlert } from "lucide-react";
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
  MacroChip,
  macroLabel,
  macroUnit,
  type MacroType,
} from "@/components/shared/macro-chip";
import {
  getDietItemSwapSuggestions,
  swapDietTemplateItem,
  type DietSwapSuggestions,
} from "@/features/dashboard/actions";
import type { DietTemplateItemView } from "@/features/dashboard/queries";
import { messages } from "@/i18n/es-419";

const t = messages.swap;

function sign(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

const DIFF_MACROS: {
  type: MacroType;
  key: keyof DietSwapSuggestions["alternatives"][number]["diff"];
}[] = [
  { type: "calories", key: "calories" },
  { type: "protein", key: "proteinG" },
  { type: "carbs", key: "carbohydrateG" },
  { type: "fat", key: "fatG" },
  { type: "fiber", key: "fiberG" },
];

export function DietItemSwapSheet({ item }: { item: DietTemplateItemView }) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<DietSwapSuggestions | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  const load = async () => {
    setLoading(true);
    const result = await getDietItemSwapSuggestions({
      templateItemId: item.id,
    });
    setLoading(false);
    if ("error" in result) toast.error(result.error);
    else setSuggestions(result);
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
