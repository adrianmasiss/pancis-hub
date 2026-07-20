"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowRight, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/shared/select-field";
import {
  searchCatalogFoodsFull,
  type CatalogFoodMatch,
} from "@/features/nutrition/ai-actions";
import { sumMacros, type MacroSet } from "@/features/nutrition/lib/macros";
import type { ComparisonMeal } from "@/features/nutrition/compare-queries";
import { messages } from "@/i18n/es-419";

const t = messages.nutrition.compare;
const n = messages.nutrition;

type Source = "diet" | "today" | "custom";

type SlotItem = {
  key: string;
  name: string;
  quantityG: number;
  macros: MacroSet;
};

type SlotState = {
  source: Source;
  selectedMealId: string;
  customItems: SlotItem[];
};

let seq = 0;
function nextKey() {
  seq += 1;
  return `c${seq}`;
}

function CustomFoodAdder({
  onAdd,
}: {
  onAdd: (food: CatalogFoodMatch, quantityG: number) => void;
}) {
  const [term, setTerm] = useState("");
  const [quantity, setQuantity] = useState("100");
  const [results, setResults] = useState<CatalogFoodMatch[] | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onChange = (value: string) => {
    setTerm(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setResults(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const response = await searchCatalogFoodsFull(value);
      if ("results" in response) setResults(response.results);
    }, 300);
  };

  const quantityG = Number(quantity) || 0;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search
            className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            value={term}
            onChange={(event) => onChange(event.target.value)}
            placeholder={n.searchFood}
            className="h-8 pl-8 text-sm"
          />
        </div>
        <Input
          type="number"
          inputMode="decimal"
          min="1"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          aria-label={n.grams}
          className="h-8 w-16 text-sm tabular-nums"
        />
      </div>
      {results && results.length > 0 ? (
        <ul className="divide-y rounded-md border">
          {results.map((food) => (
            <li key={food.id}>
              <button
                type="button"
                disabled={quantityG <= 0}
                onClick={() => {
                  onAdd(food, quantityG);
                  setTerm("");
                  setResults(null);
                }}
                className="hover:bg-accent flex w-full items-baseline justify-between gap-2 px-2 py-1.5 text-left text-xs disabled:opacity-50"
              >
                <span>{food.name}</span>
                <span className="text-muted-foreground tabular-nums">
                  {food.calories} {n.kcal} {n.per100g}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function SlotEditor({
  label,
  slot,
  onChange,
  dietMeals,
  todayMeals,
}: {
  label: string;
  slot: SlotState;
  onChange: (next: SlotState) => void;
  dietMeals: ComparisonMeal[];
  todayMeals: ComparisonMeal[];
}) {
  const meals = slot.source === "diet" ? dietMeals : todayMeals;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{label}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <SelectField
          label="Fuente"
          options={[
            { value: "diet", label: t.sourceDiet },
            { value: "today", label: t.sourceToday },
            { value: "custom", label: t.sourceCustom },
          ]}
          value={slot.source}
          onChange={(event) =>
            onChange({
              ...slot,
              source: event.target.value as Source,
              selectedMealId: "",
            })
          }
        />

        {slot.source === "custom" ? (
          <div className="space-y-2">
            <CustomFoodAdder
              onAdd={(food, quantityG) =>
                onChange({
                  ...slot,
                  customItems: [
                    ...slot.customItems,
                    {
                      key: nextKey(),
                      name: food.name,
                      quantityG,
                      macros: {
                        calories: Math.round((food.calories * quantityG) / 100),
                        proteinG:
                          Math.round((food.proteinG * quantityG) / 10) / 10,
                        carbohydrateG:
                          Math.round((food.carbohydrateG * quantityG) / 10) /
                          10,
                        fatG: Math.round((food.fatG * quantityG) / 10) / 10,
                        fiberG: Math.round((food.fiberG * quantityG) / 10) / 10,
                      },
                    },
                  ],
                })
              }
            />
            {slot.customItems.length > 0 ? (
              <ul className="space-y-1">
                {slot.customItems.map((item) => (
                  <li
                    key={item.key}
                    className="flex items-center justify-between gap-2 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      {item.name} — {item.quantityG}g
                    </span>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() =>
                        onChange({
                          ...slot,
                          customItems: slot.customItems.filter(
                            (candidate) => candidate.key !== item.key,
                          ),
                        })
                      }
                      aria-label={`Quitar ${item.name}`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-xs">{t.empty}</p>
            )}
          </div>
        ) : (
          <SelectField
            label={t.selectMeal}
            placeholder={t.selectMeal}
            options={meals.map((meal) => ({
              value: meal.id,
              label: meal.label,
            }))}
            value={slot.selectedMealId}
            onChange={(event) =>
              onChange({ ...slot, selectedMealId: event.target.value })
            }
          />
        )}
      </CardContent>
    </Card>
  );
}

function slotTotals(
  slot: SlotState,
  dietMeals: ComparisonMeal[],
  todayMeals: ComparisonMeal[],
): MacroSet | null {
  if (slot.source === "custom") {
    return slot.customItems.length > 0
      ? sumMacros(slot.customItems.map((item) => item.macros))
      : null;
  }
  const meals = slot.source === "diet" ? dietMeals : todayMeals;
  const meal = meals.find((candidate) => candidate.id === slot.selectedMealId);
  return meal ? meal.totals : null;
}

function DeltaRow({
  label,
  value,
  unit,
}: {
  label: string;
  value: number;
  unit: string;
}) {
  const sign = value > 0 ? "+" : "";
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={
          value === 0
            ? "tabular-nums"
            : value > 0
              ? "text-primary font-medium tabular-nums"
              : "font-medium text-blue-600 tabular-nums dark:text-blue-400"
        }
      >
        {sign}
        {value} {unit}
      </span>
    </div>
  );
}

export function CompareTool({
  dietMeals,
  todayMeals,
}: {
  dietMeals: ComparisonMeal[];
  todayMeals: ComparisonMeal[];
}) {
  const [slotA, setSlotA] = useState<SlotState>({
    source: dietMeals.length > 0 ? "diet" : "today",
    selectedMealId: "",
    customItems: [],
  });
  const [slotB, setSlotB] = useState<SlotState>({
    source: "custom",
    selectedMealId: "",
    customItems: [],
  });

  const totalsA = useMemo(
    () => slotTotals(slotA, dietMeals, todayMeals),
    [slotA, dietMeals, todayMeals],
  );
  const totalsB = useMemo(
    () => slotTotals(slotB, dietMeals, todayMeals),
    [slotB, dietMeals, todayMeals],
  );

  const diff =
    totalsA && totalsB
      ? {
          calories: Math.round(totalsB.calories - totalsA.calories),
          proteinG: Math.round((totalsB.proteinG - totalsA.proteinG) * 10) / 10,
          carbohydrateG:
            Math.round((totalsB.carbohydrateG - totalsA.carbohydrateG) * 10) /
            10,
          fatG: Math.round((totalsB.fatG - totalsA.fatG) * 10) / 10,
          fiberG: Math.round((totalsB.fiberG - totalsA.fiberG) * 10) / 10,
        }
      : null;

  const compensationText = (() => {
    if (!diff) return null;
    const relative =
      totalsA && totalsA.calories > 0
        ? Math.abs(diff.calories) / totalsA.calories
        : 0;
    if (relative < 0.08) return t.compensationSimilar;
    return diff.calories > 0 ? t.compensationMore : t.compensationLess;
  })();

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <SlotEditor
          label={t.slotA}
          slot={slotA}
          onChange={setSlotA}
          dietMeals={dietMeals}
          todayMeals={todayMeals}
        />
        <SlotEditor
          label={t.slotB}
          slot={slotB}
          onChange={setSlotB}
          dietMeals={dietMeals}
          todayMeals={todayMeals}
        />
      </div>

      {totalsA && totalsB && diff ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              {t.totals}
              <Badge variant="outline" className="ml-auto font-normal">
                A <ArrowRight className="mx-1 inline size-3" /> B
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  {t.slotA}
                </p>
                <p className="tabular-nums">
                  {totalsA.calories} {n.kcal} · P {totalsA.proteinG} g · C{" "}
                  {totalsA.carbohydrateG} g · G {totalsA.fatG} g
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs font-medium">
                  {t.slotB}
                </p>
                <p className="tabular-nums">
                  {totalsB.calories} {n.kcal} · P {totalsB.proteinG} g · C{" "}
                  {totalsB.carbohydrateG} g · G {totalsB.fatG} g
                </p>
              </div>
            </div>

            <div className="space-y-1 border-t pt-3">
              <p className="mb-2 text-sm font-medium">{t.difference}</p>
              <DeltaRow label={n.kcal} value={diff.calories} unit="" />
              <DeltaRow label="Proteina" value={diff.proteinG} unit="g" />
              <DeltaRow
                label="Carbohidratos"
                value={diff.carbohydrateG}
                unit="g"
              />
              <DeltaRow label="Grasas" value={diff.fatG} unit="g" />
              <DeltaRow label="Fibra" value={diff.fiberG} unit="g" />
              <p className="text-muted-foreground pt-1 text-xs">
                {t.differenceNote}
              </p>
            </div>

            {compensationText ? (
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm font-medium">{t.compensationTitle}</p>
                <p className="text-muted-foreground text-sm">
                  {compensationText}
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <p className="text-muted-foreground text-center text-sm">{t.noData}</p>
      )}
    </div>
  );
}
