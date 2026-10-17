"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, UtensilsCrossed } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PlanMealCard } from "./plan-meal-card";
import { NutritionActionsMenu } from "./nutrition-actions-menu";
import { LoggedMealRow } from "./logged-meal-row";
import { NutritionGettingStarted } from "./nutrition-getting-started";
import { AddMealDialog } from "./add-meal-dialog";
import { NutritionOverview } from "./nutrition-overview";
import type { DayPlan } from "../queries";
import type { DietTemplateView } from "@/features/dashboard/queries";
import { isMealConsumed, pendingPlanTotals } from "../lib/day-overview";
import { sumMacros } from "../lib/macros";
import { messages } from "@/i18n/es-419";

export function NutritionWorkspace({
  day,
  diet,
  mode,
  dateControl,
}: {
  day: DayPlan;
  diet: DietTemplateView | null;
  mode: "day" | "plan";
  dateControl?: ReactNode;
}) {
  const planMeals = diet?.meals ?? [];
  const pendingMeals = planMeals.filter((meal) => !meal.loggedToday);
  /* Solo las que NO salen del plan: las que si, ya tienen su fila arriba
     marcada «Registrada», y mostrarlas otra vez aqui seria contar dos veces
     la misma comida. */
  const offPlanMeals = day.meals.filter((meal) => !meal.sourceTemplateMealId);
  const totals = sumMacros(planMeals.map((meal) => meal.totals));
  const pending = sumMacros([
    pendingPlanTotals(planMeals),
    ...day.meals
      .filter((meal) => meal.status === "planificada")
      .map((meal) => meal.totals),
  ]);
  const projected = sumMacros([day.totals, pending]);
  const comparison = {
    dietMeals: planMeals.map((meal) => ({
      id: meal.id,
      label:
        meal.name ||
        messages.nutrition.mealTypes[
          meal.mealType as keyof typeof messages.nutrition.mealTypes
        ],
      items: meal.items
        .filter((item) => !item.omitted)
        .map((item) => ({
          name: item.foodName,
          quantityG: item.quantityG,
          macros: item.macros,
        })),
      totals: meal.totals,
    })),
    todayMeals: day.meals.map((meal) => ({
      id: meal.id,
      label: meal.name || messages.nutrition.mealTypes[meal.mealType],
      items: meal.items.map((item) => ({
        name: item.foodName,
        quantityG: item.quantityG,
        macros: item.macros,
      })),
      totals: meal.totals,
    })),
  };
  const overview =
    mode === "day" ? (
      <NutritionOverview
        dateControl={dateControl}
        consumed={day.totals}
        targets={day.targets}
        pending={pending}
        count={day.meals.filter((meal) => isMealConsumed(meal.status)).length}
        date={day.date}
        waterMl={day.waterMl}
        waterTargetMl={day.waterMlTarget}
      />
    ) : null;

  /*
    Sin dieta y sin nada registrado en la fecha no hay tablero que mostrar:
    el resumen serian cuatro ceros y la columna lateral dos tarjetas que no
    se pueden usar. La pantalla se reduce a una sola direccion. El selector
    de fecha se queda arriba para no dejar a nadie encerrado en un dia.
  */
  if (mode === "day" && !diet && day.meals.length === 0)
    return (
      <>
        {dateControl ? (
          <div className="nutrition-start-datebar">{dateControl}</div>
        ) : null}
        <NutritionGettingStarted date={day.date} />
      </>
    );

  return (
    <>
      {overview}
      {/* Una sola columna: el plan es la pantalla. Los macros y la
          sustitucion viven en cada fila, no en tarjetas laterales. */}
      <div className="nutrition-workspace-grid" data-layout="full">
        <div className="nutrition-main-column">
          <section className="nutrition-meals-panel nutrition-table-panel v11-card nutrition-home-card">
            <div className="nutrition-panel-heading">
              <div>
                <h2>
                  {mode === "day"
                    ? "Mi plan de comidas"
                    : (diet?.name ?? "Mi plan de alimentación")}
                </h2>
              </div>
              {/* Lo que vivia en la cabecera de «Registro del dia» sube aqui:
                  es la misma lista, asi que son sus acciones. */}
              <div className="nutrition-panel-tools">
                {diet && (
                  <span className="nutrition-section-count">
                    {mode === "day"
                      ? `${planMeals.length - pendingMeals.length} de ${planMeals.length} completadas`
                      : `${planMeals.length} comidas`}
                  </span>
                )}
                {mode === "day" && (
                  <NutritionActionsMenu date={day.date} compact />
                )}
              </div>
            </div>
            {diet && (
              <p className="nutrition-panel-description">
                {mode === "day"
                  ? "Activa cada comida al terminarla. Las barras muestran cuánto de tu meta diaria cubre cada una; cambia o ajusta cualquier alimento desde su fila."
                  : "Compara y sustituye alimentos de tu plan habitual. Aquí los cambios se guardan para los próximos días."}
              </p>
            )}
            {!diet ? (
              /* Hay comidas sueltas registradas pero ningun plan: el resumen
                 de arriba si es dato real, asi que el vacio es solo este. */
              <EmptyState
                tone="warm"
                surface={false}
                icon={UtensilsCrossed}
                title="Aún no tienes un plan"
                description="Estás registrando comidas sueltas, y eso ya alimenta el resumen de arriba. Al subir tu dieta esta columna se llena con las comidas del día y sus sustitutos."
                action={
                  <Link href="/nutricion/dieta" className="v11-button">
                    Importar mi dieta
                  </Link>
                }
              />
            ) : planMeals.length === 0 ? (
              <EmptyState
                surface={false}
                icon={UtensilsCrossed}
                title="Tu dieta no tiene comidas todavía"
                description={`«${diet.name}» está creada pero vacía. Agrega sus comidas y aparecerán aquí en el orden del día.`}
                action={
                  <Link href="/nutricion/dieta" className="v11-button">
                    Gestionar dieta
                  </Link>
                }
              />
            ) : (
              <>
                <div className="meal-legend" aria-hidden="true">
                  <div className="meal-row">
                    <span className="meal-row-title">Alimento</span>
                    <span className="meal-cell" data-macro="proteinG">
                      Proteína
                    </span>
                    <span className="meal-cell" data-macro="carbohydrateG">
                      Carbos
                    </span>
                    <span className="meal-cell" data-macro="fatG">
                      Grasas
                    </span>
                    <span className="meal-cell" data-macro="fiberG">
                      Fibra
                    </span>
                    <span
                      className="meal-cell meal-cell-kcal"
                      data-macro="calories"
                    >
                      Energía
                    </span>
                    <span className="meal-row-end" />
                  </div>
                </div>
                <ol className="nutrition-plan-list nutrition-meal-table">
                  {planMeals.map((meal) => (
                    <PlanMealCard
                      key={`${mode}-${day.date}-${meal.id}`}
                      meal={meal}
                      compact
                      date={day.date}
                      mode={mode}
                      comparison={comparison}
                      dayTotals={mode === "plan" ? totals : projected}
                      dayTargets={day.targets}
                      loggedMealId={
                        day.meals.find(
                          (logged) => logged.sourceTemplateMealId === meal.id,
                        )?.id
                      }
                    />
                  ))}
                  {/* Las comidas sueltas cierran la MISMA lista, en vez de
                    repetirla en una seccion aparte. Solo las que no salen del
                    plan: las que si, ya estan arriba marcadas «Registrada». */}
                  {offPlanMeals.map((meal) => (
                    <LoggedMealRow
                      key={`registro-${meal.id}`}
                      meal={meal}
                      dayTotals={projected}
                      dayTargets={day.targets}
                      comparison={comparison}
                    />
                  ))}
                  {/* Cierra la lista, no la cabecera: `plan-row` es justo eso,
                    una fila de filete discontinuo que dice «y una mas». En la
                    cabecera se salia de la tarjeta y el discontinuo no tenia
                    a que referirse. */}
                  {mode === "day" && (
                    <li className="nutrition-add-row">
                      <AddMealDialog date={day.date} trigger="plan-row" />
                    </li>
                  )}
                </ol>
              </>
            )}
            {/* El plan existe pero el dia aun no tiene nada suyo: una linea,
                no una seccion. La accion ya esta en la cabecera. */}
            {mode === "day" &&
            diet &&
            planMeals.length > 0 &&
            day.meals.length === 0 ? (
              <p className="nutrition-day-hint">
                Todavía no has marcado ninguna comida de hoy. Marca una del plan
                o agrega la que comiste.
              </p>
            ) : null}
          </section>
          {diet && (
            <Link
              className="nutrition-edit-plan"
              href={
                mode === "day"
                  ? `/nutricion?vista=plan&fecha=${day.date}`
                  : `/nutricion?fecha=${day.date}`
              }
            >
              {mode === "day" ? "Editar plan habitual" : "Volver al día"}
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </>
  );
}
