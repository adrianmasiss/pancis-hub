"use client";

import { useRef, useState, useTransition } from "react";
import { Check, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { searchFoods } from "@/features/nutrition/actions";
import {
  addRecipeIngredient,
  removeRecipeIngredient,
  updateRecipeIngredient,
} from "@/features/recipes/actions";
import type { RecipeIngredientView } from "@/features/recipes/queries";
import { messages } from "@/i18n/es-419";

const t = messages.recipes;
const n = messages.nutrition;

function IngredientRow({
  ingredient,
  editable,
}: {
  ingredient: RecipeIngredientView;
  editable: boolean;
}) {
  const [quantity, setQuantity] = useState(String(ingredient.quantityG));
  const [pending, startTransition] = useTransition();
  const changed = Number(quantity) !== ingredient.quantityG;

  return (
    <li className="flex items-center gap-2 py-2 text-sm">
      <div className="min-w-0 flex-1">
        <p className="truncate">
          {ingredient.foodName}
          {ingredient.cookedState ? (
            <span className="text-muted-foreground">
              {" "}
              ({n.cookedState[ingredient.cookedState as "crudo" | "cocido"]})
            </span>
          ) : null}
        </p>
      </div>
      {editable ? (
        <div className="flex items-center gap-1">
          <Input
            type="number"
            inputMode="decimal"
            min="1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            className="h-8 w-20 text-right tabular-nums"
            aria-label={`${n.quantity} (${n.grams}) — ${ingredient.foodName}`}
          />
          <span className="text-muted-foreground text-xs">{n.grams}</span>
          {changed ? (
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              disabled={pending}
              aria-label={`${messages.common.save} — ${ingredient.foodName}`}
              onClick={() =>
                startTransition(async () => {
                  const value = Number(quantity);
                  if (!value || value <= 0) return;
                  const result = await updateRecipeIngredient({
                    ingredientId: ingredient.id,
                    quantityG: value,
                  });
                  if ("error" in result) toast.error(result.error);
                  else toast.success(t.ingredientUpdated);
                })
              }
            >
              <Check className="size-4" />
            </Button>
          ) : null}
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive size-8"
            disabled={pending}
            aria-label={`${messages.common.delete} — ${ingredient.foodName}`}
            onClick={() =>
              startTransition(async () => {
                const result = await removeRecipeIngredient({
                  ingredientId: ingredient.id,
                });
                if ("error" in result) toast.error(result.error);
                else toast.success(t.ingredientRemoved);
              })
            }
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ) : (
        <span className="text-muted-foreground tabular-nums">
          {ingredient.quantityG} {n.grams}
        </span>
      )}
    </li>
  );
}

type SearchResult = {
  id: string;
  name: string;
  cookedState: string | null;
  caloriesPer100g: number;
};

function AddIngredientSheet({ recipeId }: { recipeId: string }) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [grams, setGrams] = useState("100");
  const [pending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onTermChange = (value: string) => {
    setTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const response = await searchFoods({ term: value });
      if ("results" in response) setResults(response.results);
    }, 300);
  };

  const reset = () => {
    setTerm("");
    setResults(null);
    setSelected(null);
    setGrams("100");
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <SheetTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="size-4" aria-hidden="true" />
          {t.addIngredient}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t.addIngredient}</SheetTitle>
          <SheetDescription className="sr-only">
            {n.searchHint}
          </SheetDescription>
        </SheetHeader>
        <div className="space-y-4 overflow-y-auto px-4 pb-6">
          {!selected ? (
            <>
              <div className="relative">
                <Search
                  className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
                  aria-hidden="true"
                />
                <Input
                  autoFocus
                  value={term}
                  onChange={(event) => onTermChange(event.target.value)}
                  placeholder={n.searchFood}
                  className="pl-9"
                  aria-label={n.searchFood}
                />
              </div>
              <ul className="divide-y">
                {(results ?? []).map((food) => (
                  <li key={food.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(food)}
                      className="hover:bg-accent/60 flex w-full items-baseline justify-between gap-2 rounded-md px-2 py-2.5 text-left text-sm"
                    >
                      <span>{food.name}</span>
                      <span className="text-muted-foreground text-xs whitespace-nowrap tabular-nums">
                        {food.caloriesPer100g} {n.kcal} {n.per100g}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="space-y-4">
              <p className="font-medium">{selected.name}</p>
              <div className="space-y-2">
                <label
                  className="text-sm font-medium"
                  htmlFor="ingredient-grams"
                >
                  {n.customGrams}
                </label>
                <Input
                  id="ingredient-grams"
                  type="number"
                  inputMode="decimal"
                  min="1"
                  value={grams}
                  onChange={(event) => setGrams(event.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelected(null)}
                >
                  {messages.common.back}
                </Button>
                <Button
                  className="flex-1"
                  disabled={pending || !(Number(grams) > 0)}
                  onClick={() =>
                    startTransition(async () => {
                      const result = await addRecipeIngredient({
                        recipeId,
                        foodId: selected.id,
                        quantityG: Number(grams),
                      });
                      if ("error" in result) toast.error(result.error);
                      else {
                        toast.success(t.ingredientAdded);
                        setOpen(false);
                        reset();
                      }
                    })
                  }
                >
                  {pending ? messages.common.loading : messages.common.confirm}
                </Button>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function IngredientList({
  recipeId,
  ingredients,
  editable,
}: {
  recipeId: string;
  ingredients: RecipeIngredientView[];
  editable: boolean;
}) {
  return (
    <div className="space-y-3">
      {ingredients.length > 0 ? (
        <ul className="divide-y">
          {ingredients.map((ingredient) => (
            <IngredientRow
              key={ingredient.id}
              ingredient={ingredient}
              editable={editable}
            />
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">{t.noIngredients}</p>
      )}
      {editable ? <AddIngredientSheet recipeId={recipeId} /> : null}
    </div>
  );
}
