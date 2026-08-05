import Link from "next/link";
import { Utensils, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { MacroProgress } from "@/components/shared/macro-progress";
import { AppleMacroRings } from "@/components/shared/apple-macro-rings";
import { WhyThisNumber } from "@/features/assistant/components/why-this-number";
import { messages } from "@/i18n/es-419";
import type { DashboardData } from "@/features/dashboard/queries";

const t = messages.dashboard.nutrition;

export function NutritionCard({ data }: { data: DashboardData }) {
  const { targets, consumed } = data;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span className="flex min-w-0 items-center gap-2.5">
            <Utensils
              className="text-muted-foreground size-4 shrink-0"
              aria-hidden="true"
            />
            <span className="truncate">{t.title}</span>
          </span>
          <Link
            href="/nutricion"
            className="text-muted-foreground hover:text-foreground flex shrink-0 items-center gap-0.5 text-xs font-normal transition-colors duration-200"
          >
            {t.viewPlan}
            <ChevronRight className="size-3.5" aria-hidden="true" />
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {targets ? (
          // En el riel de 320px no caben dos columnas: la tarjeta se apila
          // siempre y los anillos quedan centrados sobre el resto.
          <div className="flex flex-col gap-6">
            <div className="flex justify-center">
              <AppleMacroRings
                calories={{
                  consumed: consumed.calories,
                  target: targets.calories,
                  unit: "kcal",
                }}
                protein={{
                  consumed: consumed.proteinG,
                  target: targets.proteinG,
                  unit: "g",
                }}
                carbs={{
                  consumed: consumed.carbohydrateG,
                  target: targets.carbohydrateG,
                  unit: "g",
                }}
                fat={{
                  consumed: consumed.fatG,
                  target: targets.fatG,
                  unit: "g",
                }}
                size={196}
              />
            </div>

            {/* Proteina, carbohidratos y grasas ya viven en la leyenda de los
                anillos, con su cifra. Aqui solo queda fibra, que no tiene
                anillo propio: cada dato aparece una sola vez en la tarjeta. */}
            <div className="flex flex-col gap-5">
              <MacroProgress
                label={t.fiber}
                consumed={consumed.fiberG}
                target={targets.fiberG}
              />
              {/* La trazabilidad, al lado de la cifra y no escondida en el
                  chat: es donde la pregunta aparece de verdad. */}
              <p className="text-muted-foreground flex flex-wrap gap-x-2 text-xs">
                <span>{t.targetNote}</span>
                <WhyThisNumber
                  keys={[
                    "bmr_equation",
                    "activity_factors",
                    "goal_adjustments",
                    "protein_ranges",
                    "min_fat_g_per_kg",
                    "fiber_g_per_1000_kcal",
                  ]}
                />
              </p>
            </div>
          </div>
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
