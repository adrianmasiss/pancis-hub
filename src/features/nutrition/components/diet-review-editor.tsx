"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Link2, Link2Off, Plus, Search, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/section";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/shared/form-field";
import { SelectField } from "@/components/shared/select-field";
import { MacroChip, macroLabel } from "@/components/shared/macro-chip";
import {
  saveReviewedDiet,
  searchCatalogFoodsFull,
  type CatalogFoodMatch,
  type DietPlanResponse,
} from "@/features/nutrition/ai-actions";
import { MEAL_TYPES } from "@/features/nutrition/schemas";
import { FOOD_GROUPS } from "@/features/foods/schemas";
import { messages } from "@/i18n/es-419";

const t = messages.nutrition.aiDiet;
const n = messages.nutrition;

type EditableItem = {
  key: string;
  name: string;
  quantityG: number;
  servingEquivalence: string;
  linkedFood: CatalogFoodMatch | null;
  // Macros manuales: solo se usan cuando linkedFood es null.
  foodGroup: (typeof FOOD_GROUPS)[number];
  calories: number;
  proteinG: number;
  carbohydrateG: number;
  fatG: number;
  fiberG: number;
};

type EditableMeal = {
  key: string;
  mealType: (typeof MEAL_TYPES)[number];
  name: string;
  items: EditableItem[];
};

let keySeq = 0;
function nextKey() {
  keySeq += 1;
  return `k${keySeq}`;
}

function fromParsed(
  data: DietPlanResponse,
  suggestions: Record<string, CatalogFoodMatch | null>,
): EditableMeal[] {
  return data.meals.map((meal) => ({
    key: nextKey(),
    mealType: meal.meal_type,
    name: meal.name ?? "",
    items: meal.items.map((item) => ({
      key: nextKey(),
      name: item.name,
      quantityG: item.quantity_g,
      servingEquivalence: item.serving_equivalence ?? "",
      // Sugerencia automatica del catalogo (el usuario puede quitarla o
      // cambiarla libremente); nunca se guarda sin su revision.
      linkedFood: suggestions[item.name] ?? null,
      foodGroup: item.food_group,
      calories: item.calories,
      proteinG: item.protein_g,
      carbohydrateG: item.carbohydrate_g,
      fatG: item.fat_g,
      fiberG: item.fiber_g,
    })),
  }));
}

function itemMacros(item: EditableItem) {
  if (item.linkedFood) {
    const factor = item.quantityG / 100;
    const round1 = (v: number) => Math.round(v * 10) / 10;
    return {
      calories: Math.round(item.linkedFood.calories * factor),
      proteinG: round1(item.linkedFood.proteinG * factor),
      carbohydrateG: round1(item.linkedFood.carbohydrateG * factor),
      fatG: round1(item.linkedFood.fatG * factor),
      fiberG: round1(item.linkedFood.fiberG * factor),
    };
  }
  return {
    calories: item.calories,
    proteinG: item.proteinG,
    carbohydrateG: item.carbohydrateG,
    fatG: item.fatG,
    fiberG: item.fiberG,
  };
}

function FoodLinkSearch({
  onSelect,
}: {
  onSelect: (food: CatalogFoodMatch) => void;
}) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<CatalogFoodMatch[] | null>(null);
  const [open, setOpen] = useState(false);
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

  return (
    <div className="relative">
      <div className="relative">
        <Search
          className="text-muted-foreground absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
          aria-hidden="true"
        />
        <Input
          value={term}
          onChange={(event) => onChange(event.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={t.searchToLink}
          className="h-8 pl-8 text-sm"
        />
      </div>
      {open && results && results.length > 0 ? (
        <ul className="bg-popover absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-md border shadow-md">
          {results.map((food) => (
            <li key={food.id}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect(food);
                  setTerm("");
                  setResults(null);
                  setOpen(false);
                }}
                className="hover:bg-accent flex w-full items-baseline justify-between gap-2 px-2 py-1.5 text-left text-xs"
              >
                <span>{food.name}</span>
                <span className="text-muted-foreground flex items-center gap-1">
                  <MacroChip type="calories" value={food.calories} />
                  {n.per100g}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function ItemRow({
  item,
  onChange,
  onRemove,
}: {
  item: EditableItem;
  onChange: (item: EditableItem) => void;
  onRemove: () => void;
}) {
  const macros = itemMacros(item);

  return (
    <div className="space-y-2 rounded-lg border p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1 space-y-1">
          <FormField
            label={t.itemOriginalLabel}
            value={item.name}
            onChange={(event) =>
              onChange({ ...item, name: event.target.value })
            }
            className="text-sm"
          />
          {item.servingEquivalence ? (
            <p className="text-muted-foreground text-xs">
              {item.servingEquivalence}
            </p>
          ) : null}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-destructive size-8 shrink-0"
          onClick={onRemove}
          aria-label={`${t.removeItem} — ${item.name}`}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <FormField
          label={t.quantityLabel}
          type="number"
          inputMode="decimal"
          min="1"
          value={item.quantityG}
          onChange={(event) =>
            onChange({ ...item, quantityG: Number(event.target.value) || 0 })
          }
        />
        <div className="col-span-2 space-y-1 sm:col-span-2">
          <Label className="text-xs">{t.linkedFood}</Label>
          {item.linkedFood ? (
            <div className="bg-accent/50 flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 text-sm">
              <span className="flex items-center gap-1.5 truncate">
                <Link2 className="text-primary size-3.5 shrink-0" />
                {item.linkedFood.name}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-6 shrink-0"
                onClick={() => onChange({ ...item, linkedFood: null })}
                aria-label={t.unlink}
              >
                <Link2Off className="size-3.5" />
              </Button>
            </div>
          ) : (
            <FoodLinkSearch
              onSelect={(food) => onChange({ ...item, linkedFood: food })}
            />
          )}
        </div>
      </div>

      {item.linkedFood ? (
        <p className="text-muted-foreground flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs">
          <span>{t.linkedMacrosNote}</span>
          <MacroChip type="calories" value={macros.calories} />
          <MacroChip type="protein" value={macros.proteinG} />
          <MacroChip type="carbs" value={macros.carbohydrateG} />
          <MacroChip type="fat" value={macros.fatG} />
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-muted-foreground text-xs">{t.manualMacrosNote}</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <SelectField
              label={messages.foods.fields.group}
              options={FOOD_GROUPS.map((group) => ({
                value: group,
                label: messages.foods.groups[group],
              }))}
              value={item.foodGroup}
              onChange={(event) =>
                onChange({
                  ...item,
                  foodGroup: event.target.value as (typeof FOOD_GROUPS)[number],
                })
              }
              className="text-xs"
            />
            <FormField
              label={n.kcal}
              type="number"
              inputMode="decimal"
              value={item.calories}
              onChange={(event) =>
                onChange({ ...item, calories: Number(event.target.value) || 0 })
              }
            />
            <FormField
              label={`${macroLabel("protein")} (g)`}
              type="number"
              inputMode="decimal"
              value={item.proteinG}
              onChange={(event) =>
                onChange({ ...item, proteinG: Number(event.target.value) || 0 })
              }
            />
            <FormField
              label={`${macroLabel("carbs")} (g)`}
              type="number"
              inputMode="decimal"
              value={item.carbohydrateG}
              onChange={(event) =>
                onChange({
                  ...item,
                  carbohydrateG: Number(event.target.value) || 0,
                })
              }
            />
            <FormField
              label={`${macroLabel("fat")} (g)`}
              type="number"
              inputMode="decimal"
              value={item.fatG}
              onChange={(event) =>
                onChange({ ...item, fatG: Number(event.target.value) || 0 })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function DietReviewEditor({
  parsed,
  suggestions,
}: {
  parsed: DietPlanResponse;
  suggestions: Record<string, CatalogFoodMatch | null>;
}) {
  const router = useRouter();
  const [dietName, setDietName] = useState(parsed.name || "Mi dieta");
  const [targets, setTargets] = useState({
    calories: parsed.target_calories,
    protein: parsed.target_protein,
    carbs: parsed.target_carbs,
    fat: parsed.target_fat,
  });
  const [meals, setMeals] = useState<EditableMeal[]>(() =>
    fromParsed(parsed, suggestions),
  );
  const [pending, startTransition] = useTransition();

  const updateMeal = (key: string, next: EditableMeal) => {
    setMeals((previous) =>
      previous.map((meal) => (meal.key === key ? next : meal)),
    );
  };

  const onSave = () => {
    startTransition(async () => {
      const result = await saveReviewedDiet({
        name: dietName,
        targetCalories: targets.calories,
        targetProtein: targets.protein,
        targetCarbs: targets.carbs,
        targetFat: targets.fat,
        meals: meals.map((meal) => ({
          mealType: meal.mealType,
          name: meal.name || undefined,
          items: meal.items.map((item) => ({
            name: item.name,
            quantityG: item.quantityG,
            servingEquivalence: item.servingEquivalence || undefined,
            foodId: item.linkedFood?.id,
            foodGroup: item.linkedFood ? undefined : item.foodGroup,
            calories: item.linkedFood ? undefined : item.calories,
            proteinG: item.linkedFood ? undefined : item.proteinG,
            carbohydrateG: item.linkedFood ? undefined : item.carbohydrateG,
            fatG: item.linkedFood ? undefined : item.fatG,
            fiberG: item.linkedFood ? undefined : item.fiberG,
          })),
        })),
      });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(t.saved);
        router.push("/");
      }
    });
  };

  return (
    <Section title={t.reviewTitle} description={t.reviewDescription}>
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <FormField
            label={t.dietName}
            value={dietName}
            onChange={(event) => setDietName(event.target.value)}
            className="col-span-2 sm:col-span-1"
          />
          <FormField
            label={n.kcal}
            type="number"
            inputMode="decimal"
            value={targets.calories}
            onChange={(event) =>
              setTargets((previous) => ({
                ...previous,
                calories: Number(event.target.value) || 0,
              }))
            }
          />
          <FormField
            label={`${macroLabel("protein")} (g)`}
            type="number"
            inputMode="decimal"
            value={targets.protein}
            onChange={(event) =>
              setTargets((previous) => ({
                ...previous,
                protein: Number(event.target.value) || 0,
              }))
            }
          />
          <FormField
            label={`${macroLabel("carbs")} (g)`}
            type="number"
            inputMode="decimal"
            value={targets.carbs}
            onChange={(event) =>
              setTargets((previous) => ({
                ...previous,
                carbs: Number(event.target.value) || 0,
              }))
            }
          />
          <FormField
            label={`${macroLabel("fat")} (g)`}
            type="number"
            inputMode="decimal"
            value={targets.fat}
            onChange={(event) =>
              setTargets((previous) => ({
                ...previous,
                fat: Number(event.target.value) || 0,
              }))
            }
          />
        </div>

        <div className="space-y-4">
          {meals.map((meal) => {
            const mealTotals = meal.items.reduce(
              (acc, item) => {
                const macros = itemMacros(item);
                return {
                  calories: acc.calories + macros.calories,
                  proteinG: acc.proteinG + macros.proteinG,
                };
              },
              { calories: 0, proteinG: 0 },
            );
            return (
              <div key={meal.key} className="space-y-3 rounded-xl border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <FormField
                    label={t.mealName}
                    value={meal.name}
                    onChange={(event) =>
                      updateMeal(meal.key, {
                        ...meal,
                        name: event.target.value,
                      })
                    }
                    className="min-w-40 flex-1"
                  />
                  <SelectField
                    label={t.mealType}
                    options={MEAL_TYPES.map((type) => ({
                      value: type,
                      label: n.mealTypes[type],
                    }))}
                    value={meal.mealType}
                    onChange={(event) =>
                      updateMeal(meal.key, {
                        ...meal,
                        mealType: event.target
                          .value as (typeof MEAL_TYPES)[number],
                      })
                    }
                  />
                  <Badge
                    variant="secondary"
                    className="ml-auto flex items-center gap-2 font-normal"
                  >
                    <MacroChip type="calories" value={mealTotals.calories} />
                    <MacroChip type="protein" value={mealTotals.proteinG} />
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      setMeals((previous) =>
                        previous.filter(
                          (candidate) => candidate.key !== meal.key,
                        ),
                      )
                    }
                  >
                    <Trash2 className="size-4" />
                    {t.removeMeal}
                  </Button>
                </div>

                <div className="space-y-2">
                  {meal.items.map((item) => (
                    <ItemRow
                      key={item.key}
                      item={item}
                      onChange={(next) =>
                        updateMeal(meal.key, {
                          ...meal,
                          items: meal.items.map((candidate) =>
                            candidate.key === item.key ? next : candidate,
                          ),
                        })
                      }
                      onRemove={() =>
                        updateMeal(meal.key, {
                          ...meal,
                          items: meal.items.filter(
                            (candidate) => candidate.key !== item.key,
                          ),
                        })
                      }
                    />
                  ))}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateMeal(meal.key, {
                      ...meal,
                      items: [
                        ...meal.items,
                        {
                          key: nextKey(),
                          name: "",
                          quantityG: 100,
                          servingEquivalence: "",
                          linkedFood: null,
                          foodGroup: "otro",
                          calories: 0,
                          proteinG: 0,
                          carbohydrateG: 0,
                          fatG: 0,
                          fiberG: 0,
                        },
                      ],
                    })
                  }
                >
                  <Plus className="size-4" />
                  {t.addItem}
                </Button>
              </div>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() =>
            setMeals((previous) => [
              ...previous,
              { key: nextKey(), mealType: "snack", name: "", items: [] },
            ])
          }
        >
          <Plus className="size-4" />
          {t.addMealButton}
        </Button>

        <Button
          type="button"
          className="w-full"
          size="lg"
          disabled={pending || meals.every((meal) => meal.items.length === 0)}
          onClick={onSave}
        >
          {pending ? t.saving : t.saveDiet}
        </Button>
      </div>
    </Section>
  );
}
