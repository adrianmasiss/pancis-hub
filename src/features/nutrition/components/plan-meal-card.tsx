"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Check, ChevronDown, X } from "lucide-react";
import { toast } from "sonner";
import { DietItemSwapSheet } from "@/features/dashboard/components/diet-item-swap-sheet";
import { UndoDaySwapButton } from "@/features/nutrition/components/undo-day-swap-button";
import { logDietTemplateMeal } from "@/features/dashboard/actions";
import { fireCelebration } from "@/components/shared/celebration-overlay";
import { triggerHaptic } from "@/lib/haptics";
import type { DietTemplateMealView } from "@/features/dashboard/queries";
import type { MacroSet } from "@/features/nutrition/lib/macros";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

const n = messages.nutrition;
const t = messages.nutrition.dietPlan;
const r = messages.nutrition.dietPlan.rail;
const d = messages.dashboard.nutrition;

function mealTitle(meal: DietTemplateMealView): string {
  return (
    meal.name || n.mealTypes[meal.mealType as keyof typeof n.mealTypes] || ""
  );
}

const MEAL_TIMES: Record<string, string> = {
  desayuno: "07:00",
  snack_manana: "10:00",
  almuerzo: "12:30",
  snack_tarde: "16:30",
  merienda: "16:30",
  snack: "16:30",
  cena: "20:00",
};

const THUMB_POSITIONS = ["24% 58%", "65% 28%", "43% 62%", "77% 52%"];

/**
 * Reparto de energia de la comida, con la formula del prototipo: proteina y
 * carbohidrato a 4 kcal/g, grasa a 9. Es el reparto DE ESA COMIDA, no su peso
 * en el dia: responde "de que esta hecha", y el ancho de la barra en el riel
 * responde lo otro.
 */
function macroMix(meal: DietTemplateMealView) {
  const kp = meal.totals.proteinG * 4;
  const kc = meal.totals.carbohydrateG * 4;
  const kg = meal.totals.fatG * 9;
  const total = kp + kc + kg;
  // Una comida del plan todavia sin alimentos no tiene reparto que mostrar.
  // Con el `|| 1` de la formula del prototipo, el redondeo dejaba 0 % / 0 % y
  // el resto —el 100 %— caia entero en grasas: una comida vacia se pintaba
  // como si fuera pura grasa.
  if (total <= 0) return null;
  const p = Math.round((kp / total) * 100);
  const c = Math.round((kc / total) * 100);
  return { p, c, g: Math.max(0, 100 - p - c) };
}

/**
 * Una comida colgando del riel del dia (handoff, Nutricion).
 *
 * Plegada dice todo lo que hace falta para decidir: hora, estado, nombre, de
 * que esta hecha, su energia y su peso en el dia. Abierta muestra sus
 * alimentos, cada uno con su sustitucion.
 *
 * El interruptor de confirmacion esta SEPARADO del boton que despliega, como
 * pide el handoff: confirmar y mirar son dos intenciones distintas, y juntarlas
 * hace que se registre una comida por querer verla. Registrar no se deshace
 * desde aqui, asi que una vez hecha el control deja de ser un boton.
 */
export function PlanMealCard({
  meal,
  date,
  defaultOpen = false,
  dayCalories,
  dayTotals,
  dayTargets,
}: {
  meal: DietTemplateMealView;
  date: string;
  defaultOpen?: boolean;
  /** Energia del plan completo, para el peso de esta comida en el dia. */
  dayCalories?: number;
  /** Totales y objetivo del dia: el veredicto de una sustitucion los necesita
      para decir si el cambio te acerca o te aleja de tu plan. */
  dayTotals?: MacroSet;
  dayTargets?: MacroSet | null;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [pending, startTransition] = useTransition();
  const title = mealTitle(meal);
  const done = meal.loggedToday;
  const time = MEAL_TIMES[meal.mealType] ?? "—";
  const mix = macroMix(meal);
  const kcal = Math.round(meal.totals.calories);
  const share =
    dayCalories && dayCalories > 0
      ? Math.round((meal.totals.calories / dayCalories) * 100)
      : null;
  const swapped = meal.items.some((item) => item.daySwap);
  const summary = meal.items.map((item) => item.foodName).join(", ");

  const onLog = () => {
    triggerHaptic("success");
    startTransition(async () => {
      const result = await logDietTemplateMeal({
        templateMealId: meal.id,
        date,
      });
      if ("error" in result) toast.error(result.error);
      else {
        toast.success(
          result.alreadyLogged ? t.alreadyLoggedToast : t.loggedToast,
        );
        if (!result.alreadyLogged) fireCelebration();
      }
    });
  };

  return (
    <li
      className="stagger-item relative pb-3"
      aria-labelledby={`plan-comida-${meal.id}`}
      style={{ "--stagger-index": meal.orderIndex } as React.CSSProperties}
    >
      <div className="grid grid-cols-[27px_minmax(0,1fr)] gap-3 sm:grid-cols-[35px_minmax(0,1fr)] sm:gap-4">
        {/* El nodo sobre la linea del riel. */}
        <span className="flex justify-center pt-5">
          <span
            aria-hidden="true"
            className={cn(
              "size-[9px] rounded-full ring-4 transition-colors duration-[var(--dur-base)]",
              done
                ? "bg-positive ring-background"
                : "bg-primary ring-background",
            )}
          />
        </span>

        <div
          className={cn(
            "border-hairline bg-card min-w-0 rounded-[14px] border transition-colors duration-[var(--dur-base)]",
            open && "border-border-strong",
          )}
        >
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 p-4">
            <div className="flex min-w-0 flex-col gap-2">
              <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span className="text-subtle-foreground num text-[11px] font-medium tracking-[0.04em]">
                  {time}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-semibold tracking-[0.13em] uppercase",
                    done ? "text-subtle-foreground" : "text-primary",
                  )}
                >
                  {done ? r.stateLogged : r.statePending}
                </span>
                {swapped ? (
                  <span className="border-caution/40 text-caution rounded-full border px-2 py-0.5 text-[10px] font-medium">
                    {r.modified}
                  </span>
                ) : null}
              </span>

              {/* Toda la fila salvo el interruptor despliega el detalle. */}
              <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-label={`${open ? r.collapse : r.expand} — ${title}`}
                className="focus-visible:ring-ring/40 -m-1 flex min-w-0 flex-col items-start gap-1.5 rounded-sm p-1 text-left outline-none focus-visible:ring-2"
              >
                <span className="flex w-full min-w-0 items-baseline gap-2">
                  <span
                    id={`plan-comida-${meal.id}`}
                    className={cn(
                      "min-w-0 truncate text-[16px] font-semibold tracking-[-0.02em]",
                      done && "text-muted-foreground",
                    )}
                  >
                    {title}
                  </span>
                  <span className="num text-muted-foreground shrink-0 text-[13px] font-medium">
                    {kcal.toLocaleString("es-419")} {n.kcal}
                  </span>
                  <ChevronDown
                    className={cn(
                      "text-subtle-foreground ml-auto size-4 shrink-0 transition-transform duration-[var(--dur-base)]",
                      open && "rotate-180",
                    )}
                    aria-hidden="true"
                  />
                </span>
                {summary ? (
                  <span className="text-muted-foreground line-clamp-1 text-[13px]">
                    {summary}
                  </span>
                ) : null}
              </button>

              {/* Reparto de energia y peso en el dia. Tres segmentos, no una
                  barra por macro: lo que se compara aqui es la proporcion. */}
              <span className="flex items-center gap-3">
                {mix ? (
                  <span
                    className="bg-track flex h-[5px] min-w-0 flex-1 overflow-hidden rounded-full"
                    role="img"
                    aria-label={r.macroMix(mix.p, mix.c, mix.g)}
                  >
                    <span
                      className="bg-positive h-full"
                      style={{ width: `${mix.p}%` }}
                    />
                    <span
                      className="bg-primary h-full"
                      style={{ width: `${mix.c}%` }}
                    />
                    <span
                      className="bg-caution h-full"
                      style={{ width: `${mix.g}%` }}
                    />
                  </span>
                ) : (
                  <span className="bg-track h-[5px] min-w-0 flex-1 rounded-full" />
                )}
                {share !== null ? (
                  <span className="text-subtle-foreground num shrink-0 text-[11px]">
                    {r.shareOfDay(share)}
                  </span>
                ) : null}
              </span>
            </div>

            {/* El interruptor. La cruz gira hasta el check al confirmar, que es
                la transicion que pide el handoff; no es una casilla nueva. */}
            {done ? (
              <span
                aria-label={t.logged}
                title={t.logged}
                className="bg-positive/15 text-positive flex size-10 shrink-0 items-center justify-center rounded-full"
              >
                <Check className="size-4" strokeWidth={3} aria-hidden="true" />
              </span>
            ) : (
              <button
                type="button"
                onClick={onLog}
                disabled={pending}
                aria-label={`${t.logAction} — ${title}`}
                className="group border-border text-subtle-foreground hover:border-positive hover:text-positive focus-visible:ring-ring/40 flex size-10 shrink-0 items-center justify-center rounded-full border transition-[color,border-color,transform] duration-[var(--dur-base)] ease-[var(--pc-spring)] outline-none focus-visible:ring-2 active:scale-95 disabled:opacity-50"
              >
                <X
                  className="size-4 transition-transform duration-[var(--dur-base)] ease-[var(--pc-spring)] group-hover:rotate-90"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>

          {open ? (
            <ul className="border-hairline border-t px-4">
              {meal.items.map((item, index) => (
                <li
                  key={item.id}
                  className="border-hairline grid min-h-[64px] grid-cols-[38px_minmax(0,1fr)_auto] items-center gap-3 border-b py-3 last:border-b-0"
                >
                  <span className="border-hairline bg-card-raised relative size-9 overflow-hidden rounded-full border">
                    <Image
                      src="/images/nutrition-editorial.png"
                      alt=""
                      fill
                      sizes="36px"
                      className="nutrition-photo object-cover"
                      style={{
                        objectPosition:
                          THUMB_POSITIONS[index % THUMB_POSITIONS.length],
                      }}
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium">
                      {item.foodName}
                    </p>
                    <p className="text-muted-foreground num mt-0.5 text-[11px]">
                      {item.quantityG} g · {Math.round(item.macros.calories)}{" "}
                      {n.kcal} · {d.protein} {Math.round(item.macros.proteinG)}{" "}
                      g
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <DietItemSwapSheet
                      item={item}
                      date={date}
                      trigger="pill"
                      dayTotals={dayTotals}
                      dayTargets={dayTargets}
                    />
                    {item.daySwap ? (
                      <UndoDaySwapButton templateItemId={item.id} date={date} />
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </li>
  );
}
