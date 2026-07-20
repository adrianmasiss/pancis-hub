"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, Circle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatHouseholdEquivalence } from "@/features/foods/lib/equivalence";
import { logDietTemplateMeal } from "@/features/dashboard/actions";
import { DietItemSwapSheet } from "@/features/dashboard/components/diet-item-swap-sheet";
import type {
  DietTemplateMealView,
  DietTemplateView,
} from "@/features/dashboard/queries";
import { messages } from "@/i18n/es-419";

const t = messages.nutrition.dietPlan;
const n = messages.nutrition;

function MealCard({
  meal,
  today,
}: {
  meal: DietTemplateMealView;
  today: string;
}) {
  const [pending, startTransition] = useTransition();

  const onLog = () => {
    startTransition(async () => {
      const result = await logDietTemplateMeal({
        templateMealId: meal.id,
        date: today,
      });
      if ("error" in result) toast.error(result.error);
      else toast.success(t.loggedToast);
    });
  };

  return (
    <div className="hover:border-primary/50 space-y-2 rounded-lg border p-4 transition-colors">
      <div className="flex items-center justify-between gap-2">
        <h4 className="min-w-0 truncate font-semibold">
          {meal.name || n.mealTypes[meal.mealType as keyof typeof n.mealTypes]}
        </h4>
        <Badge
          variant="secondary"
          className="shrink-0 font-normal tabular-nums"
        >
          {meal.totals.calories} {n.kcal} · P {meal.totals.proteinG} g
        </Badge>
      </div>

      <ul className="text-muted-foreground space-y-1 text-sm">
        {meal.items.map((item) => {
          const equivalence =
            item.servingEquivalence ??
            formatHouseholdEquivalence(item.quantityG, item.foodPortions);
          return (
            <li
              key={item.id}
              className="border-border/50 flex items-center justify-between gap-2 border-b py-1 last:border-0 last:pb-0"
            >
              <span className="min-w-0 truncate">
                {item.foodName}
                {equivalence ? (
                  <span className="text-muted-foreground text-xs">
                    {" "}
                    ({equivalence})
                  </span>
                ) : null}
                {item.isCustom ? (
                  <Badge variant="outline" className="ml-1.5 font-normal">
                    {t.customFoodBadge}
                  </Badge>
                ) : null}
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <span className="font-medium tabular-nums">
                  {item.quantityG}g
                </span>
                <DietItemSwapSheet item={item} />
              </span>
            </li>
          );
        })}
      </ul>

      <Button
        variant={meal.loggedToday ? "secondary" : "outline"}
        size="sm"
        className="w-full"
        disabled={pending || meal.loggedToday}
        onClick={onLog}
      >
        {meal.loggedToday ? (
          <CheckCircle2 className="size-4" aria-hidden="true" />
        ) : (
          <Circle className="size-4" aria-hidden="true" />
        )}
        {pending ? t.logging : meal.loggedToday ? t.logged : t.logMeal}
      </Button>
    </div>
  );
}

export type DietChecklistProps = {
  template: DietTemplateView;
  today: string;
};

export function DietChecklist({ template, today }: DietChecklistProps) {
  return (
    <Card className="border-primary/50 shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-xl">
          <CheckCircle2 className="text-primary size-6" aria-hidden="true" />
          {t.title}: {template.name}
        </CardTitle>
        <CardDescription>{t.todayChecklist}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2">
          {template.meals.map((meal) => (
            <MealCard key={meal.id} meal={meal} today={today} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
