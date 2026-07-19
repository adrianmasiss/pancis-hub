"use client";

import { useState, useTransition } from "react";
import { Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteCustomFood, toggleFavoriteFood } from "@/features/foods/actions";
import { FoodFormDialog } from "@/features/foods/components/food-form-dialog";
import type { LibraryFood } from "@/features/foods/queries";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

const t = messages.foods;
const n = messages.nutrition;

export function FoodRow({ food }: { food: LibraryFood }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  const toggleFavorite = () => {
    startTransition(async () => {
      const result = await toggleFavoriteFood({ foodId: food.id });
      if ("error" in result) toast.error(result.error);
    });
  };

  const remove = () => {
    startTransition(async () => {
      const result = await deleteCustomFood({ foodId: food.id });
      if ("error" in result) toast.error(result.error);
      else toast.success(t.deleted);
    });
  };

  return (
    <li className="flex items-center gap-2 py-2.5">
      <Button
        variant="ghost"
        size="icon"
        className="size-8 shrink-0"
        disabled={pending}
        onClick={toggleFavorite}
        aria-label={`${food.isFavorite ? t.favoriteRemove : t.favoriteAdd} — ${food.name}`}
        aria-pressed={food.isFavorite}
      >
        <Star
          className={cn(
            "size-4",
            food.isFavorite
              ? "fill-primary text-primary"
              : "text-muted-foreground",
          )}
        />
      </Button>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-1.5 text-sm">
          <span className="truncate font-medium">{food.name}</span>
          {food.cookedState ? (
            <span className="text-muted-foreground">
              ({n.cookedState[food.cookedState]})
            </span>
          ) : null}
          {food.brand ? (
            <span className="text-muted-foreground">· {food.brand}</span>
          ) : null}
          {food.isOwn ? (
            <Badge variant="outline" className="font-normal">
              {t.customBadge}
            </Badge>
          ) : null}
        </p>
        <p className="text-muted-foreground text-xs tabular-nums">
          {food.calories} {n.kcal} · P {food.proteinG} g · C{" "}
          {food.carbohydrateG} g · G {food.fatG} g · Fibra {food.fiberG} g{" "}
          {n.per100g}
        </p>
      </div>
      <span className="text-muted-foreground hidden text-xs sm:block">
        {t.groups[food.foodGroup]}
      </span>
      {food.isOwn ? (
        <div className="flex shrink-0 items-center">
          <FoodFormDialog food={food} />
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive size-8"
            disabled={pending}
            onClick={() => setConfirmDelete(true)}
            aria-label={`${t.deleteFood} — ${food.name}`}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ) : null}

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.deleteFood}</DialogTitle>
            <DialogDescription>{t.deleteFoodConfirm}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              {messages.common.cancel}
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => {
                setConfirmDelete(false);
                remove();
              }}
            >
              {messages.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </li>
  );
}
