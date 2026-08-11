import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MacroProgress } from "@/components/shared/macro-progress";
import { messages } from "@/i18n/es-419";
import type { DayPlan } from "@/features/nutrition/queries";

const t = messages.nutrition;
const d = messages.dashboard.nutrition;

export function DaySummary({ plan }: { plan: DayPlan }) {
  if (!plan.targets) {
    return (
      <Card>
        <CardContent className="text-muted-foreground py-4 text-sm">
          {t.noTargetsNote}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-baseline justify-between gap-2 text-base">
          {t.dayTotals}
          <span className="text-sm font-normal tabular-nums">
            {plan.totals.calories} {t.consumedOf} {plan.targets.calories}{" "}
            {t.kcal}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <MacroProgress
            label={d.protein}
            macro="protein"
            consumed={plan.totals.proteinG}
            target={plan.targets.proteinG}
          />
          <MacroProgress
            label={d.carbs}
            macro="carbs"
            consumed={plan.totals.carbohydrateG}
            target={plan.targets.carbohydrateG}
          />
          <MacroProgress
            label={d.fat}
            macro="fat"
            consumed={plan.totals.fatG}
            target={plan.targets.fatG}
          />
          <MacroProgress
            label={d.fiber}
            macro="fiber"
            consumed={plan.totals.fiberG}
            target={plan.targets.fiberG}
          />
        </div>
        <p className="text-muted-foreground text-xs">{d.targetNote}</p>
      </CardContent>
    </Card>
  );
}
