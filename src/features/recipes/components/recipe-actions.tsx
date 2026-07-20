"use client";

import { useMemo, useState, useTransition } from "react";
import {
  CalendarPlus,
  Copy,
  ListChecks,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FormField } from "@/components/shared/form-field";
import { SelectField } from "@/components/shared/select-field";
import {
  addRecipeToPlan,
  deleteRecipe,
  duplicateRecipe,
} from "@/features/recipes/actions";
import { scaleIngredientsToServings } from "@/features/recipes/lib/recipe-macros";
import type { RecipeDetail } from "@/features/recipes/queries";
import { MEAL_TYPES } from "@/features/nutrition/schemas";
import { messages } from "@/i18n/es-419";

const t = messages.recipes;
const n = messages.nutrition;

export function RecipeActions({ recipe }: { recipe: RecipeDetail }) {
  const [planOpen, setPlanOpen] = useState(false);
  const [listOpen, setListOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [servings, setServings] = useState(String(recipe.servings));
  const [pending, startTransition] = useTransition();

  const shoppingLines = useMemo(() => {
    const desired = Number(servings) || recipe.servings;
    const quantities = scaleIngredientsToServings(
      recipe.ingredients,
      recipe.servings,
      desired,
    );
    return recipe.ingredients.map(
      (ingredient, index) => `${ingredient.foodName}: ${quantities[index]} g`,
    );
  }, [recipe, servings]);

  const onAddToPlan = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await addRecipeToPlan({
        recipeId: recipe.id,
        date: String(formData.get("date")),
        mealType: String(formData.get("mealType")),
        servings: Number(formData.get("servings")),
      });
      if ("error" in result) toast.error(result.error);
      else {
        toast.success(t.addedToPlan);
        setPlanOpen(false);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" onClick={() => setPlanOpen(true)}>
        <CalendarPlus className="size-4" aria-hidden="true" />
        {t.addToPlan}
      </Button>
      <Button variant="outline" size="sm" onClick={() => setListOpen(true)}>
        <ListChecks className="size-4" aria-hidden="true" />
        {t.shoppingList}
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            aria-label={messages.common.openMenu}
            disabled={pending}
          >
            <MoreVertical className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() =>
              startTransition(async () => {
                const result = await duplicateRecipe({ recipeId: recipe.id });
                if (result && "error" in result) toast.error(result.error);
              })
            }
          >
            <Copy className="size-4" /> {t.duplicateRecipe}
          </DropdownMenuItem>
          {recipe.isOwn ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="size-4" /> {t.deleteRecipe}
              </DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={planOpen} onOpenChange={setPlanOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.addToPlanTitle}</DialogTitle>
          </DialogHeader>
          <form onSubmit={onAddToPlan} className="space-y-4">
            <FormField
              label={t.planDate}
              name="date"
              type="date"
              required
              defaultValue={new Date().toISOString().slice(0, 10)}
            />
            <SelectField
              label={t.planMealType}
              name="mealType"
              options={MEAL_TYPES.map((type) => ({
                value: type,
                label: n.mealTypes[type],
              }))}
            />
            <FormField
              label={t.planServings}
              name="servings"
              type="number"
              inputMode="decimal"
              step="0.5"
              min="0.5"
              required
              defaultValue={1}
            />
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? messages.common.loading : messages.common.confirm}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={listOpen} onOpenChange={setListOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.shoppingListTitle}</DialogTitle>
            <DialogDescription>
              {t.shoppingListFor} {servings} {t.servingsWord}
            </DialogDescription>
          </DialogHeader>
          <FormField
            label={t.planServings}
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0.5"
            value={servings}
            onChange={(event) => setServings(event.target.value)}
          />
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {shoppingLines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <Button
            variant="outline"
            onClick={async () => {
              await navigator.clipboard.writeText(shoppingLines.join("\n"));
              toast.success(t.listCopied);
            }}
          >
            {t.copyList}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.deleteRecipe}</DialogTitle>
            <DialogDescription>{t.deleteRecipeConfirm}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              {messages.common.cancel}
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await deleteRecipe({ recipeId: recipe.id });
                  if (result && "error" in result) toast.error(result.error);
                })
              }
            >
              {messages.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
