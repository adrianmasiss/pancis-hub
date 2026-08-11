import Link from "next/link";
import { Utensils, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { AppleMacroRings } from "@/components/shared/apple-macro-rings";
import { WhyThisNumber } from "@/features/assistant/components/why-this-number";
import { buildTodayNutrition } from "@/features/dashboard/lib/today";
import type { DashboardData } from "@/features/dashboard/queries";
import type { ToleranceKey } from "@/features/nutrition/lib/tolerances";
import { messages } from "@/i18n/es-419";

const t = messages.dashboard.nutrition;

const UNITS: Record<ToleranceKey, string> = {
  calories: "kcal",
  protein: "g",
  carbs: "g",
  fat: "g",
  fiber: "g",
};

const listMacros = (macros: ToleranceKey[]) =>
  macros.map((macro) => t.macroNames[macro]).join(", ");

/**
 * Nutricion de hoy: objetivo, plan, consumido y lo que falta.
 *
 * Las cuatro columnas juntas son el punto: el usuario tenia el objetivo y el
 * consumido, y calculaba el resto de cabeza. Los anillos viven aqui dentro y
 * no en una tarjeta aparte para que cada cifra aparezca UNA vez.
 */
export function TodayNutritionCard({
  data,
  targetsOutdated = false,
}: {
  data: DashboardData;
  /** true si los objetivos guardados ya no corresponden a los datos de hoy. */
  targetsOutdated?: boolean;
}) {
  const { targets, consumed, plannedTotals, tolerances } = data;

  if (!targets) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2.5">
            <Utensils
              className="text-muted-foreground size-4 shrink-0"
              aria-hidden="true"
            />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title={t.noTargets}
            description={messages.emptyStates.nutrition.description}
            icon={Utensils}
            className="py-8"
          />
        </CardContent>
      </Card>
    );
  }

  const today = buildTodayNutrition({
    target: targets,
    planned: plannedTotals,
    consumed,
    tolerances,
  });

  // Sin dieta activa la columna del plan desaparece entera. Repetir "Sin
  // plan" en las cinco filas era ruido: es un solo hecho, se dice una vez.
  const hasPlan = plannedTotals !== null;

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

      <CardContent className="flex flex-col gap-6">
        {/* Anillos arriba y tabla debajo, siempre apilados: con los dos en
            fila la columna "Faltan" se salia del ancho de la tarjeta, y era
            justo la que esta vista viene a anadir. */}
        <div className="flex flex-col items-center gap-6">
          <div className="shrink-0">
            <AppleMacroRings
              showLegend={false}
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
              size={168}
            />
          </div>

          {/* Cuatro columnas de numeros: es una comparacion, no una secuencia,
              y en una tabla se lee de un vistazo. Con scroll propio porque en
              telefono no caben sin empujar la pagina. */}
          <div className="w-full min-w-0 overflow-x-auto">
            <table className="w-full text-sm tabular-nums">
              <thead>
                <tr className="text-muted-foreground text-xs">
                  <th scope="col" className="pb-2 text-left font-normal">
                    <span className="sr-only">{t.macroColumn}</span>
                  </th>
                  <th scope="col" className="pb-2 text-right font-normal">
                    {t.columnTarget}
                  </th>
                  {/* En telefono el plan cede el sitio: "Faltan" es la razon
                      de ser de esta vista y no puede quedar tras el scroll.
                      Lo que el plan aporta sigue dicho en el aviso de abajo. */}
                  {hasPlan ? (
                    <th
                      scope="col"
                      className="hidden pb-2 text-right font-normal sm:table-cell"
                    >
                      {t.columnPlanned}
                    </th>
                  ) : null}
                  <th scope="col" className="pb-2 text-right font-normal">
                    {t.columnConsumed}
                  </th>
                  <th scope="col" className="pb-2 text-right font-normal">
                    {t.columnRemaining}
                  </th>
                </tr>
              </thead>
              <tbody>
                {today.rows.map((row) => {
                  const unit = UNITS[row.macro];
                  const over = row.remaining < 0;
                  return (
                    <tr key={row.macro} className="border-border/60 border-t">
                      <th
                        scope="row"
                        className="py-2 pr-3 text-left font-normal capitalize"
                      >
                        {t.macroNames[row.macro]}
                      </th>
                      <td className="py-2 pl-3 text-right whitespace-nowrap">
                        {row.target} {unit}
                      </td>
                      {hasPlan ? (
                        <td className="text-muted-foreground hidden py-2 pl-3 text-right whitespace-nowrap sm:table-cell">
                          {row.planned} {unit}
                        </td>
                      ) : null}
                      <td className="py-2 pl-3 text-right whitespace-nowrap">
                        {row.consumed} {unit}
                      </td>
                      <td
                        className={`py-2 pl-3 text-right font-medium whitespace-nowrap ${
                          over ? "text-caution" : ""
                        }`}
                      >
                        {over
                          ? `${Math.abs(row.remaining)} ${unit} ${t.over}`
                          : `${row.remaining} ${unit}`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-2 text-xs">
          {hasPlan ? null : (
            <p className="text-muted-foreground">{t.noPlanned}</p>
          )}

          {today.nothingLogged ? (
            <p className="text-muted-foreground">{t.dayNotStarted}</p>
          ) : null}

          {/* El plan contra el objetivo se puede responder por la manana, y es
              lo que justifica cambiar el plan antes de empezar a comer. */}
          {today.planVsTarget ? (
            today.planVsTarget.withinTolerance ? (
              <p className="text-muted-foreground">{t.planWithin}</p>
            ) : (
              <p className="text-caution text-balance">
                {t.planOutside.replace(
                  "{macros}",
                  listMacros(today.planVsTarget.exceeded),
                )}
              </p>
            )
          ) : null}

          {today.exceeded.length > 0 ? (
            <p className="text-caution text-balance">
              {t.consumedOver.replace("{macros}", listMacros(today.exceeded))}
            </p>
          ) : null}

          {targetsOutdated ? (
            <p className="text-caution flex flex-wrap gap-x-2">
              <span className="text-balance">{t.outdated}</span>
              <Link
                href="/configuracion"
                className="underline underline-offset-2"
              >
                {t.outdatedLink}
              </Link>
            </p>
          ) : null}

          <p className="text-muted-foreground flex flex-wrap gap-x-2">
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
      </CardContent>
    </Card>
  );
}
