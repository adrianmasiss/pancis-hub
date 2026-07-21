"use client";

import { useRef, useState, useTransition } from "react";
import { Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SelectField } from "@/components/shared/select-field";
import { FoodThumbnail } from "@/components/shared/food-thumbnail";
import { MacroChip } from "@/components/shared/macro-chip";
import { addMealItem, searchFoods } from "@/features/nutrition/actions";
import { messages } from "@/i18n/es-419";

const t = messages.nutrition;

type FoodResult = {
  id: string;
  name: string;
  brand: string | null;
  cookedState: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  portions: { id: string; label: string; grams: number }[];
  imageUrl: string | null;
  defaultServingAmount: number;
  defaultServingUnit: string;
};

const CUSTOM_PORTION = "custom";

export function FoodPicker({ mealId }: { mealId: string }) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<FoodResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<FoodResult | null>(null);
  const [portionId, setPortionId] = useState<string>(CUSTOM_PORTION);
  const [portionCount, setPortionCount] = useState("1");
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
      setSearching(true);
      const response = await searchFoods({ term: value });
      setSearching(false);
      if ("results" in response) setResults(response.results);
    }, 300);
  };

  const reset = () => {
    setTerm("");
    setResults(null);
    setSelected(null);
    setPortionId(CUSTOM_PORTION);
    setPortionCount("1");
    setGrams("100");
  };

  const selectedPortion = selected?.portions.find(
    (portion) => portion.id === portionId,
  );
  const effectiveGrams = selectedPortion
    ? Math.round(selectedPortion.grams * (Number(portionCount) || 0) * 10) / 10
    : Number(grams) || 0;
  const previewKcal = selected
    ? Math.round((selected.caloriesPer100g * effectiveGrams) / 100)
    : 0;

  const onConfirm = () => {
    if (!selected || effectiveGrams <= 0) return;
    startTransition(async () => {
      const result = await addMealItem({
        mealId,
        foodId: selected.id,
        quantityG: effectiveGrams,
      });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(t.itemAdded);
        setOpen(false);
        reset();
      }
    });
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
          {t.addFood}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t.addFood}</SheetTitle>
          <SheetDescription className="sr-only">
            {t.searchHint}
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
                  placeholder={t.searchFood}
                  className="pl-9"
                  aria-label={t.searchFood}
                />
              </div>
              {term.trim().length < 2 ? (
                <p className="text-muted-foreground text-sm">{t.searchHint}</p>
              ) : searching ? (
                <p className="text-muted-foreground text-sm">
                  {messages.common.loading}
                </p>
              ) : results && results.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  {t.searchNoResults}
                </p>
              ) : (
                <ul className="divide-y">
                  {(results ?? []).map((food) => (
                    <li key={food.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelected(food);
                          setPortionId(food.portions[0]?.id ?? CUSTOM_PORTION);
                          setGrams(String(food.defaultServingAmount));
                        }}
                        className="hover:bg-accent/60 flex w-full items-center justify-between gap-2 rounded-md px-2 py-2.5 text-left text-sm"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <FoodThumbnail
                            src={food.imageUrl}
                            alt={food.name}
                            className="size-8"
                          />
                          {food.name}
                          {food.cookedState ? (
                            <span className="text-muted-foreground">
                              {" "}
                              (
                              {
                                t.cookedState[
                                  food.cookedState as "crudo" | "cocido"
                                ]
                              }
                              )
                            </span>
                          ) : null}
                          {food.brand ? (
                            <span className="text-muted-foreground">
                              {" "}
                              · {food.brand}
                            </span>
                          ) : null}
                        </span>
                        <span className="text-muted-foreground flex items-center gap-1 text-xs whitespace-nowrap">
                          <MacroChip type="calories" value={food.caloriesPer100g} />
                          {t.per100g}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FoodThumbnail
                  src={selected.imageUrl}
                  alt={selected.name}
                  className="size-10"
                />
                <div>
                  <p className="font-medium">{selected.name}</p>
                  <p className="text-muted-foreground flex items-center gap-2 text-xs">
                    <MacroChip type="calories" value={selected.caloriesPer100g} />
                    <MacroChip type="protein" value={selected.proteinPer100g} />
                    <span>{t.per100g}</span>
                  </p>
                </div>
              </div>
              {selected.portions.length > 0 ? (
                <SelectField
                  label={t.portion}
                  options={[
                    ...selected.portions.map((portion) => ({
                      value: portion.id,
                      label: `${portion.label} (${portion.grams} g)`,
                    })),
                    { value: CUSTOM_PORTION, label: t.customGrams },
                  ]}
                  value={portionId}
                  onChange={(event) => setPortionId(event.target.value)}
                />
              ) : null}
              {selectedPortion ? (
                <div className="space-y-2">
                  <Label htmlFor="portion-count">{t.quantity}</Label>
                  <Input
                    id="portion-count"
                    type="number"
                    inputMode="decimal"
                    min="0.25"
                    step="0.25"
                    value={portionCount}
                    onChange={(event) => setPortionCount(event.target.value)}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="grams">{t.customGrams}</Label>
                  <Input
                    id="grams"
                    type="number"
                    inputMode="decimal"
                    min="1"
                    step="1"
                    value={grams}
                    onChange={(event) => setGrams(event.target.value)}
                  />
                  <p className="text-muted-foreground text-xs">
                    {t.defaultPortionLabel}: {selected.defaultServingAmount}{" "}
                    {selected.defaultServingUnit}
                  </p>
                </div>
              )}
              <p className="text-muted-foreground text-sm tabular-nums">
                {effectiveGrams} {t.grams} ≈ {previewKcal} {t.kcal}
              </p>
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
                  onClick={onConfirm}
                  disabled={pending || effectiveGrams <= 0}
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
