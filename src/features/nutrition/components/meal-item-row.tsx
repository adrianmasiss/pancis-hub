"use client";

import { useState, useTransition } from "react";
import { Check, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatHouseholdEquivalence } from "@/features/foods/lib/equivalence";
import {
  deleteMealItem,
  updateMealItemQuantity,
} from "@/features/nutrition/actions";
import { FoodSwapSheet } from "@/features/nutrition/components/food-swap-sheet";
import type { MealItemView } from "@/features/nutrition/queries";
import { messages } from "@/i18n/es-419";

const t = messages.nutrition;

export function MealItemRow({ item }: { item: MealItemView }) {
  const [quantity, setQuantity] = useState(String(item.quantityG));
  const [pending, startTransition] = useTransition();
  const changed = Number(quantity) !== item.quantityG;

  const save = () => {
    const value = Number(quantity);
    if (!value || value <= 0) return;
    startTransition(async () => {
      const result = await updateMealItemQuantity({
        itemId: item.id,
        quantityG: value,
      });
      if ("error" in result) toast.error(result.error);
      else toast.success(t.itemUpdated);
    });
  };

  const remove = () => {
    startTransition(async () => {
      const result = await deleteMealItem({ itemId: item.id });
      if ("error" in result) toast.error(result.error);
      else toast.success(t.itemDeleted);
    });
  };

  const equivalence =
    item.servingEquivalence && Number(quantity) === item.quantityG
      ? item.servingEquivalence
      : formatHouseholdEquivalence(
          Number(quantity) || 0,
          item.foodPortions || [],
        );

  return (
    <li className="flex items-center gap-2 py-2 text-sm">
      <div className="min-w-0 flex-1">
        <p className="truncate">
          {item.foodName}
          {item.cookedState ? (
            <span className="text-muted-foreground">
              {" "}
              ({t.cookedState[item.cookedState as "crudo" | "cocido"]})
            </span>
          ) : null}
          {equivalence ? (
            <span className="text-muted-foreground ml-1.5 text-xs font-normal">
              ({equivalence})
            </span>
          ) : null}
        </p>
        <p className="text-muted-foreground text-xs tabular-nums">
          {item.macros.calories} {t.kcal} · P {item.macros.proteinG} g · C{" "}
          {item.macros.carbohydrateG} g · G {item.macros.fatG} g
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          inputMode="decimal"
          min="1"
          step="1"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          className="h-8 w-20 text-right tabular-nums"
          aria-label={`${t.quantity} (${t.grams}) — ${item.foodName}`}
        />
        <span className="text-muted-foreground text-xs">{t.grams}</span>
        {changed ? (
          <Button
            size="icon"
            variant="ghost"
            className="size-8"
            disabled={pending}
            onClick={save}
            aria-label={`${messages.common.save} — ${item.foodName}`}
          >
            <Check className="size-4" />
          </Button>
        ) : null}
        <FoodSwapSheet item={item} />
        <Button
          size="icon"
          variant="ghost"
          className="text-muted-foreground hover:text-destructive size-8"
          disabled={pending}
          onClick={remove}
          aria-label={`${messages.common.delete} — ${item.foodName}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </li>
  );
}
