"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MacroChip } from "@/components/shared/macro-chip";
import { formatHouseholdEquivalence } from "@/features/foods/lib/equivalence";
import { logDietTemplateMeal } from "@/features/dashboard/actions";
import { DietItemSwapSheet } from "@/features/dashboard/components/diet-item-swap-sheet";
import { UndoDaySwapButton } from "@/features/nutrition/components/undo-day-swap-button";
import { triggerHaptic } from "@/lib/haptics";
import { fireCelebration } from "@/components/shared/celebration-overlay";
import type {
  DietTemplateMealView,
  DietTemplateView,
} from "@/features/dashboard/queries";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

const t = messages.nutrition.dietPlan;
const ds = messages.nutrition.swapQuestion;
const n = messages.nutrition;

function mealTitle(meal: DietTemplateMealView): string {
  return (
    meal.name || n.mealTypes[meal.mealType as keyof typeof n.mealTypes] || ""
  );
}

/* ---------------------------------------------------------------------------
   Barra de energia segmentada.
   Cada comida ocupa un tramo proporcional a sus calorias dentro de la meta del
   dia, asi que la barra comunica dos cosas a la vez: cuanto llevas y como se
   reparte lo que falta. El tramo final, si sobra meta, queda sin asignar.
   ------------------------------------------------------------------------- */
function EnergyBar({
  meals,
  targetCalories,
  nextIndex,
}: {
  meals: DietTemplateMealView[];
  targetCalories: number;
  nextIndex: number;
}) {
  const planned = meals.reduce((sum, meal) => sum + meal.totals.calories, 0);
  const scale = Math.max(targetCalories, planned) || 1;
  const unassigned = Math.max(0, scale - planned);

  return (
    <div
      className="flex h-1.5 w-full gap-[3px] overflow-hidden"
      role="img"
      aria-label={`${meals.filter((m) => m.loggedToday).length} de ${meals.length} comidas registradas`}
    >
      {meals.map((meal, index) => (
        <span
          key={meal.id}
          className={cn(
            "h-full rounded-full transition-colors duration-500",
            meal.loggedToday
              ? "bg-primary"
              : index === nextIndex
                ? "bg-primary/30"
                : "bg-muted",
          )}
          style={{
            flexGrow: Math.max(meal.totals.calories, 1),
            flexBasis: 0,
          }}
        />
      ))}
      {unassigned > 0 ? (
        <span
          className="bg-muted/60 h-full rounded-full"
          style={{ flexGrow: unassigned, flexBasis: 0 }}
        />
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Nodo de la ruta. Tres estados legibles sin depender del color:
   hecho (relleno + palomita), en turno (anillo + punto), pendiente (contorno).
   ------------------------------------------------------------------------- */
function RailNode({ state }: { state: "done" | "next" | "todo" }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative z-10 flex size-7 shrink-0 items-center justify-center rounded-full transition-colors duration-300",
        state === "done" && "bg-primary text-primary-foreground",
        state === "next" && "border-primary bg-background border-2",
        state === "todo" && "border-hairline bg-background border",
      )}
    >
      {state === "done" ? (
        <Check className="size-3.5" strokeWidth={2.75} />
      ) : state === "next" ? (
        <span className="bg-primary size-1.5 rounded-full" />
      ) : null}
    </span>
  );
}

function MealStop({
  meal,
  today,
  state,
  isLast,
  index,
  open,
  onToggle,
}: {
  meal: DietTemplateMealView;
  today: string;
  state: "done" | "next" | "todo";
  isLast: boolean;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const panelId = `comida-${meal.id}`;

  const onLog = () => {
    triggerHaptic("medium");
    startTransition(async () => {
      const result = await logDietTemplateMeal({
        templateMealId: meal.id,
        date: today,
      });
      if ("error" in result) {
        triggerHaptic("warning");
        toast.error(result.error);
      } else {
        fireCelebration();
        toast.success(t.loggedToast);
      }
    });
  };

  return (
    <li
      className="animate-fade-up relative grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-4"
      // Entrada escalonada: la ruta se dibuja de arriba abajo al cargar.
      // El bloque global de prefers-reduced-motion la anula por completo.
      style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
    >
      {/* Tramo de union hasta el siguiente nodo. Se tine de bronce cuando la
          comida ya esta hecha, de modo que la linea misma marca el avance. */}
      {!isLast ? (
        <span
          aria-hidden="true"
          className={cn(
            "absolute top-7 bottom-0 left-[0.84375rem] w-px transition-colors duration-500",
            state === "done" ? "bg-primary/50" : "bg-hairline",
          )}
        />
      ) : null}

      <RailNode state={state} />

      <div className={cn("min-w-0", isLast ? "pb-0" : "pb-5")}>
        <button
          type="button"
          onClick={() => {
            triggerHaptic("selection");
            onToggle();
          }}
          aria-expanded={open}
          aria-controls={panelId}
          className="group/stop hover:bg-muted/60 -mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-md px-2 py-1 text-left transition-colors duration-200"
        >
          <span
            className={cn(
              "min-w-0 flex-1 truncate text-[0.9375rem] tracking-[-0.012em] transition-colors",
              state === "done"
                ? "text-muted-foreground font-normal"
                : "text-foreground font-medium",
            )}
          >
            {mealTitle(meal)}
          </span>

          <span className="num text-muted-foreground shrink-0 text-xs">
            {Math.round(meal.totals.calories)} kcal
          </span>

          <ChevronDown
            className={cn(
              "text-muted-foreground size-4 shrink-0 transition-transform duration-300",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>

        <div className="reveal" data-open={open} id={panelId}>
          <div>
            <div
              className={cn(
                "border-hairline mt-2 flex flex-col gap-4 rounded-lg border p-4",
                state === "next" ? "ring-primary/15 bg-card ring-1" : "bg-card",
              )}
            >
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <MacroChip type="calories" value={meal.totals.calories} />
                <MacroChip type="protein" value={meal.totals.proteinG} />
                <MacroChip type="carbs" value={meal.totals.carbohydrateG} />
                <MacroChip type="fat" value={meal.totals.fatG} />
              </div>

              <ul className="divide-hairline border-hairline divide-y border-t">
                {meal.items.map((item) => {
                  const equivalence =
                    item.servingEquivalence ??
                    formatHouseholdEquivalence(
                      item.quantityG,
                      item.foodPortions,
                    );
                  return (
                    <li
                      key={item.id}
                      className="flex items-center justify-between gap-3 py-2.5"
                    >
                      <span className="text-foreground min-w-0 text-[0.8125rem]">
                        <span className="truncate">{item.foodName}</span>
                        {equivalence ? (
                          <span className="text-muted-foreground">
                            {" "}
                            ({equivalence})
                          </span>
                        ) : null}
                        {item.isCustom ? (
                          <Badge
                            variant="outline"
                            className="border-hairline text-muted-foreground ml-2 text-[10px] font-normal"
                          >
                            {t.customFoodBadge}
                          </Badge>
                        ) : null}
                        {/* Con sustitucion vigente el plan sigue diciendo lo
                            que decia; lo que cambio es solo hoy, y se dice. */}
                        {item.daySwap ? (
                          <span className="text-muted-foreground mt-0.5 block text-[11px]">
                            {ds.replacesToday}{" "}
                            <span className="text-foreground">
                              {item.daySwap.originalFoodName}
                            </span>
                            {item.daySwap.source === "asistente" ? (
                              <span className="text-primary">
                                {" "}
                                · {ds.estimated}
                              </span>
                            ) : null}
                          </span>
                        ) : null}
                      </span>
                      <span className="flex shrink-0 items-center gap-1">
                        <span className="num text-muted-foreground text-xs">
                          {item.quantityG} g
                        </span>
                        <DietItemSwapSheet item={item} date={today} />
                        {item.daySwap ? (
                          <UndoDaySwapButton
                            templateItemId={item.id}
                            date={today}
                          />
                        ) : null}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <Button
                variant={meal.loggedToday ? "secondary" : "default"}
                size="sm"
                className="w-full"
                disabled={pending || meal.loggedToday}
                onClick={onLog}
              >
                {meal.loggedToday ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : null}
                {pending ? t.logging : meal.loggedToday ? t.logged : t.logMeal}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

export type DietChecklistProps = {
  template: DietTemplateView;
  today: string;
};

/**
 * Ruta del dia.
 *
 * Las comidas de un plan son una secuencia, no un conjunto: mostrarlas como
 * rejilla de tarjetas iguales pierde justo el dato que importa al abrir la app,
 * que es cual toca ahora. Aqui la secuencia es la estructura — una linea que se
 * tine conforme avanzas — y la comida en turno viene desplegada por defecto.
 */
export function DietChecklist({ template, today }: DietChecklistProps) {
  const meals = template.meals;

  const { doneCount, nextIndex, consumed } = useMemo(() => {
    const done = meals.filter((meal) => meal.loggedToday).length;
    const next = meals.findIndex((meal) => !meal.loggedToday);
    const eaten = meals
      .filter((meal) => meal.loggedToday)
      .reduce((sum, meal) => sum + meal.totals.calories, 0);
    return { doneCount: done, nextIndex: next, consumed: eaten };
  }, [meals]);

  // La comida en turno arranca abierta; el resto se despliega al tocarlas.
  const [openId, setOpenId] = useState<string | null>(
    () => meals.find((meal) => !meal.loggedToday)?.id ?? null,
  );

  const target = Math.round(template.targetCalories);
  const remaining = Math.max(0, target - Math.round(consumed));
  const allDone = nextIndex === -1;

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          <div className="flex min-w-0 flex-col gap-1">
            <p className="label-micro">{t.title}</p>
            <h2 className="truncate text-base font-medium tracking-[-0.015em]">
              {template.name}
            </h2>
          </div>
          <p className="num text-muted-foreground shrink-0 text-xs">
            <span className="text-foreground">{doneCount}</span> de{" "}
            {meals.length} comidas
          </p>
        </div>

        <EnergyBar
          meals={meals}
          targetCalories={template.targetCalories}
          nextIndex={nextIndex}
        />

        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="num text-muted-foreground text-xs">
            <span className="text-foreground">
              {Math.round(consumed).toLocaleString("es-419")}
            </span>{" "}
            de {target.toLocaleString("es-419")} {t.planTotal}
          </p>
          <p className="text-muted-foreground text-xs">
            {allDone ? (
              t.allDone
            ) : (
              <>
                <span className="num text-foreground">
                  {remaining.toLocaleString("es-419")}
                </span>{" "}
                {t.remaining}
              </>
            )}
          </p>
        </div>
      </div>

      <ul className="flex flex-col">
        {meals.map((meal, index) => (
          <MealStop
            key={meal.id}
            meal={meal}
            today={today}
            state={
              meal.loggedToday ? "done" : index === nextIndex ? "next" : "todo"
            }
            isLast={index === meals.length - 1}
            index={index}
            open={openId === meal.id}
            onToggle={() =>
              setOpenId((current) => (current === meal.id ? null : meal.id))
            }
          />
        ))}
      </ul>
    </section>
  );
}
