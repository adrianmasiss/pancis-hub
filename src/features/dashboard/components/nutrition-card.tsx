import Link from "next/link";
import { Utensils } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { MacroProgress } from "@/components/shared/macro-progress";
import { messages } from "@/i18n/es-419";
import type { DashboardData } from "@/features/dashboard/queries";

const t = messages.dashboard.nutrition;

export function NutritionCard({ data }: { data: DashboardData }) {
  const { targets, consumed } = data;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          {t.title}
          <Link
            href="/nutricion"
            className="text-muted-foreground hover:text-foreground text-xs font-normal underline underline-offset-4"
          >
            {t.viewPlan}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {targets ? (
          <>
            <div>
              <p className="text-3xl font-semibold tracking-tight tabular-nums">
                {consumed.calories}
                <span className="text-muted-foreground text-base font-normal">
                  {" "}
                  / {targets.calories} kcal
                </span>
              </p>
              <p className="text-muted-foreground text-xs">
                {targets.calories - consumed.calories >= 0
                  ? `${targets.calories - consumed.calories} kcal ${t.remaining}`
                  : `${consumed.calories - targets.calories} kcal ${t.exceeded}`}
              </p>
            </div>
            <div className="space-y-3">
              <MacroProgress
                label={t.protein}
                consumed={consumed.proteinG}
                target={targets.proteinG}
              />
              <MacroProgress
                label={t.carbs}
                consumed={consumed.carbohydrateG}
                target={targets.carbohydrateG}
              />
              <MacroProgress
                label={t.fat}
                consumed={consumed.fatG}
                target={targets.fatG}
              />
              <MacroProgress
                label={t.fiber}
                consumed={consumed.fiberG}
                target={targets.fiberG}
              />
            </div>
            <p className="text-muted-foreground text-xs">{t.targetNote}</p>
          </>
        ) : (
          <EmptyState
            title={t.noTargets}
            description={messages.emptyStates.nutrition.description}
            icon={Utensils}
            className="py-8"
          />
        )}
      </CardContent>
    </Card>
  );
}
