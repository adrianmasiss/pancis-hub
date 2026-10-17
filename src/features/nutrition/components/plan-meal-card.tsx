"use client";

import { useOptimistic, useState, useTransition } from "react";
import {
  ArrowLeftRight,
  Check,
  ChevronDown,
  RotateCcw,
  Sun,
  Moon,
  Utensils,
  Apple,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DietItemSwapSheet } from "@/features/dashboard/components/diet-item-swap-sheet";
import { UndoDaySwapButton } from "./undo-day-swap-button";
import { MealCompareSheet } from "./meal-compare-sheet";
import { logDietTemplateMeal } from "@/features/dashboard/actions";
import { deleteMeal } from "../actions";
import { FoodAvatar } from "./food-avatar";
import { LogSwitch } from "./log-switch";
import { PlanFoodEditDialog } from "./plan-food-edit-dialog";
import { OmitFoodButton } from "./omit-food-button";
import { omitDietItemForDay, undoDietItemDaySwap } from "../day-swap-actions";
import { MacroCells } from "./meal-macro-cells";
import { fireCelebration } from "@/components/shared/celebration-overlay";
import { triggerHaptic } from "@/lib/haptics";
import type { DietTemplateMealView } from "@/features/dashboard/queries";
import type { ComparisonMeal } from "../compare-queries";
import type { MacroSet } from "../lib/macros";
import { messages } from "@/i18n/es-419";

const t = messages.nutrition.dietPlan;

/* Sodio en mg sin decimales; azucar con uno si baja de 10 g. */
const fmtExtra = (n: number) =>
  n.toLocaleString("es-419", { maximumFractionDigits: n < 10 ? 1 : 0 });

/**
 * Un plan tipico lleva dos o tres "snack", asi que la lista mostraba
 * SNACK dos veces y los rotulos dejaban de distinguir nada. La hora que la
 * propia comida ya tiene desambigua sin inventar ningun dato: media manana
 * si cae antes del mediodia, merienda por la tarde, y antes de dormir de
 * noche. Sin hora no se adivina: se queda en Snack.
 */
function mealGroupLabel(mealType: string, time?: string): string {
  const fallback =
    messages.nutrition.mealTypes[
      mealType as keyof typeof messages.nutrition.mealTypes
    ] ?? "Comida";
  if (mealType !== "snack" || !time) return fallback;
  const hour = Number(time.slice(0, 2));
  if (!Number.isFinite(hour)) return fallback;
  if (hour < 12) return "Media mañana";
  if (hour < 19) return "Merienda";
  return "Antes de dormir";
}

export function PlanMealCard({
  meal,
  date,
  defaultOpen = false,
  dayTotals,
  dayTargets,
  mode = "day",
  comparison,
  featured = false,
  compact = false,
  loggedMealId,
}: {
  /** Registro del dia que salio de esta comida; permite desmarcarla. */
  loggedMealId?: string;
  featured?: boolean;
  compact?: boolean;
  meal: DietTemplateMealView;
  date: string;
  defaultOpen?: boolean;
  dayCalories?: number;
  dayTotals?: MacroSet;
  dayTargets?: MacroSet | null;
  mode?: "day" | "plan";
  comparison?: { dietMeals: ComparisonMeal[]; todayMeals: ComparisonMeal[] };
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [pending, startTransition] = useTransition();
  const title =
    meal.name ||
    messages.nutrition.mealTypes[
      meal.mealType as keyof typeof messages.nutrition.mealTypes
    ] ||
    "Comida";
  const MealIcon =
    meal.mealType === "desayuno"
      ? Sun
      : meal.mealType === "cena"
        ? Moon
        : meal.mealType === "snack"
          ? Apple
          : Utensils;
  const done = mode === "day" && meal.loggedToday;
  const time = meal.scheduledTime?.slice(0, 5);
  const swapped = mode === "day" && meal.items.some((item) => item.daySwap);

  const [shownDone, setShownDone] = useOptimistic(Boolean(done));

  /* Desmarcar borra (soft delete) el registro que salio de esta comida. Sin
     su id no hay que borrar, y el interruptor se queda bloqueado. */
  const onToggle = (next: boolean) => {
    if (next) return onLog();
    if (!loggedMealId) return;
    startTransition(async () => {
      setShownDone(false);
      const result = await deleteMeal({ mealId: loggedMealId });
      if ("error" in result) toast.error(result.error);
      else toast.success("Comida desmarcada");
    });
  };

  const [itemPending, startItem] = useTransition();
  /* Omitir avisa con «Deshacer» en el propio aviso: es un gesto rapido y
     reversible, asi que no pide confirmacion. */
  const restoreItem = (templateItemId: string, name: string) =>
    startItem(async () => {
      const result = await undoDietItemDaySwap({ templateItemId, date });
      if (result.error) toast.error(result.error);
      else toast.success(`${name} vuelve a contar hoy`);
    });
  const omitItem = (templateItemId: string, name: string) =>
    startItem(async () => {
      const result = await omitDietItemForDay({ templateItemId, date });
      if (result.error) toast.error(result.error);
      else
        toast.success(`${name} no cuenta hoy`, {
          action: {
            label: "Deshacer",
            onClick: () => restoreItem(templateItemId, name),
          },
        });
    });
  const allOmitted =
    meal.items.length > 0 && meal.items.every((item) => item.omitted);

  const onLog = () =>
    startTransition(async () => {
      setShownDone(true);
      const result = await logDietTemplateMeal({
        templateMealId: meal.id,
        date,
      });
      if ("error" in result) toast.error(result.error);
      else {
        toast.success(
          result.alreadyLogged ? t.alreadyLoggedToast : t.loggedToast,
        );
        if (!result.alreadyLogged) {
          triggerHaptic("success");
          fireCelebration();
        }
      }
    });

  if (compact) {
    /*
      Una parada de la ruta del dia. La cabecera lleva los totales de la
      comida en las mismas columnas que sus alimentos, con la barra de cuanto
      aporta a la meta diaria; cada alimento abre su sustitucion en su propia
      fila. El rotulo es el TIPO de comida y el titulo su nombre.
    */
    const groupLabel = mealGroupLabel(meal.mealType, time);
    const foods = meal.items.map((item) => item.foodName).join(" + ");
    const rowTitle = meal.name?.trim() || foods || "Sin alimentos";
    const editable = !shownDone;
    return (
      <li
        className="meal-stop"
        data-done={shownDone}
        aria-labelledby={`plan-comida-${meal.id}`}
      >
        <div className="meal-stop-rail" aria-hidden="true">
          <span className="meal-stop-time">{time ?? "—"}</span>
          <span className="meal-stop-dot" />
        </div>
        <article className="meal-card">
          <header className="meal-row meal-row-head">
            <div className="meal-row-title">
              <span className="meal-card-eyebrow">
                <MealIcon size={13} aria-hidden="true" />
                {groupLabel}
                {time ? (
                  <span className="meal-card-eyebrow-time">{time}</span>
                ) : null}
                {shownDone ? (
                  <span className="meal-card-tag">Registrada</span>
                ) : swapped ? (
                  <span className="meal-card-tag" data-tone="swap">
                    Modificada hoy
                  </span>
                ) : null}
              </span>
              <h3 id={`plan-comida-${meal.id}`}>{rowTitle}</h3>
            </div>
            <MacroCells macros={meal.totals} targets={dayTargets} strong />
            <div className="meal-row-end">
              {mode === "day" && (
                <LogSwitch
                  checked={shownDone}
                  busy={pending}
                  disabled={
                    pending ||
                    meal.items.length === 0 ||
                    allOmitted ||
                    (done && !loggedMealId)
                  }
                  onChange={onToggle}
                  label={
                    done
                      ? `Registrada — ${title}`
                      : `Marcar como comida — ${title}`
                  }
                />
              )}
            </div>
          </header>
          {meal.items.length > 0 ? (
            <ul className="meal-foods" aria-label={`Alimentos — ${title}`}>
              {meal.items.map((item) => (
                <li
                  key={item.id}
                  className="meal-food"
                  data-omitted={item.omitted || undefined}
                >
                  <div className="meal-row meal-row-food">
                    <div className="meal-row-title">
                      <FoodAvatar
                        name={item.foodName}
                        group={item.foodGroup}
                        imageUrl={item.imageUrl}
                      />
                      <div className="meal-food-copy">
                        <strong>{item.foodName}</strong>
                        <span>
                          {Math.round(item.quantityG)} g
                          {item.servingEquivalence
                            ? ` · ${item.servingEquivalence}`
                            : ""}
                        </span>
                        {/* Sodio y azucar solo si el alimento los trae y
                            no son cero: un hueco no se rellena con cero ni
                            con guion, y «Azucar 0 g» en la pechuga es ruido. */}
                        {(item.sodiumMg ?? 0) > 0 || (item.sugarG ?? 0) > 0 ? (
                          <span className="meal-food-extras">
                            {(item.sodiumMg ?? 0) > 0 ? (
                              <span data-extra="sodium">
                                Sodio {fmtExtra(item.sodiumMg!)} mg
                              </span>
                            ) : null}
                            {(item.sugarG ?? 0) > 0 ? (
                              <span data-extra="sugar">
                                Azúcar {fmtExtra(item.sugarG!)} g
                              </span>
                            ) : null}
                          </span>
                        ) : null}
                        {item.omitted ? (
                          <small data-tone="omitted">
                            No lo comes hoy · no suma
                          </small>
                        ) : item.daySwap && mode === "day" ? (
                          <small>
                            {item.daySwap.originalFoodName === item.foodName
                              ? "Cantidad ajustada hoy"
                              : `En lugar de ${item.daySwap.originalFoodName}`}
                          </small>
                        ) : null}
                      </div>
                    </div>
                    <MacroCells macros={item.macros} />
                    <div className="meal-row-end">
                      {editable && item.omitted ? (
                        <button
                          type="button"
                          className="meal-restore"
                          onClick={() => restoreItem(item.id, item.foodName)}
                          disabled={itemPending}
                        >
                          <RotateCcw size={14} aria-hidden="true" />
                          Restaurar
                        </button>
                      ) : editable ? (
                        <>
                          {/* Sustituir abre la tarjeta centrada, con el
                              resto difuminado: criterio fijo del usuario. */}
                          <DietItemSwapSheet
                            item={item}
                            date={date}
                            scope={mode}
                            trigger="action"
                            dayTotals={dayTotals}
                            dayTargets={dayTargets}
                          />
                          <PlanFoodEditDialog
                            item={item}
                            date={date}
                            mode={mode}
                          />
                          {mode === "day" && (
                            <OmitFoodButton
                              label={`No lo comí hoy — ${item.foodName}`}
                              disabled={itemPending}
                              onClick={() => omitItem(item.id, item.foodName)}
                            />
                          )}
                        </>
                      ) : null}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="meal-foods-empty">Esta comida no tiene alimentos.</p>
          )}
          {comparison && meal.items.length > 0 ? (
            <div className="meal-card-foot">
              <MealCompareSheet
                mealId={meal.id}
                mealName={title}
                {...comparison}
              />
            </div>
          ) : null}
        </article>
      </li>
    );
  }

  return (
    <li
      className="nutrition-plan-meal v11-card nutrition-home-card"
      data-featured={featured}
      aria-labelledby={`plan-comida-${meal.id}`}
      data-open={open}
      data-modified={swapped}
    >
      {featured && (
        <div className="nutrition-feature-intro">
          <h2>Primera comida pendiente</h2>
          <span>Según el orden de tu plan</span>
        </div>
      )}
      <div className="nutrition-meal-heading">
        <div>
          <p className="nutrition-meal-meta">
            <span className="nutrition-meal-icon">
              <MealIcon size={18} aria-hidden="true" />
            </span>
            {time ?? "Sin horario"}
            <span>
              {mode === "plan"
                ? "Plan habitual"
                : done
                  ? "Registrada"
                  : "Pendiente"}
            </span>
            {swapped ? (
              <span className="text-primary">Modificada este día</span>
            ) : null}
          </p>
          <h3 id={`plan-comida-${meal.id}`}>{title}</h3>
          <p className="nutrition-meal-foods">
            {meal.items.map((item) => item.foodName).join(", ") ||
              "Esta comida no tiene alimentos."}
          </p>
        </div>
        <p className="nutrition-meal-energy">
          <strong>{Math.round(meal.totals.calories)}</strong> kcal
        </p>
      </div>
      {featured && (
        <p className="nutrition-feature-guidance">
          Si ya comiste, regístrala. Si prefieres otra opción, compara o
          sustituye antes.
        </p>
      )}
      <dl
        className="nutrition-meal-nutrients"
        aria-label="Macros de esta comida"
      >
        <div>
          <dt>Proteína</dt>
          <dd>
            {Math.round(meal.totals.proteinG)} <span>g</span>
          </dd>
        </div>
        <div>
          <dt>Carbohidratos</dt>
          <dd>
            {Math.round(meal.totals.carbohydrateG)} <span>g</span>
          </dd>
        </div>
        <div>
          <dt>Grasas</dt>
          <dd>
            {Math.round(meal.totals.fatG)} <span>g</span>
          </dd>
        </div>
      </dl>
      <div className="nutrition-meal-toolbar">
        <button
          type="button"
          className="nutrition-detail-button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-controls={`alimentos-${meal.id}`}
        >
          {open ? "Ocultar alimentos" : "Ver alimentos"}
          <ChevronDown
            size={16}
            aria-hidden="true"
            className={open ? "rotate-180" : ""}
          />
        </button>
        <div className="nutrition-meal-buttons">
          {mode === "day" &&
            (done ? (
              <span className="nutrition-logged" aria-label={t.logged}>
                <Check size={16} aria-hidden="true" />
                Registrada
              </span>
            ) : (
              <Button
                size="sm"
                variant={featured ? "brand" : "default"}
                className="nutrition-register-button"
                onClick={onLog}
                disabled={pending || meal.items.length === 0}
                aria-label={`Marcar como comida — ${title}`}
              >
                <Check size={16} aria-hidden="true" />
                {pending ? "Registrando…" : "Registrar"}
              </Button>
            ))}
          {comparison ? (
            <MealCompareSheet
              mealId={meal.id}
              mealName={title}
              {...comparison}
            />
          ) : null}
          {!done && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpen(true)}
              aria-label={`Sustituir alimentos — ${title}`}
              disabled={meal.items.length === 0}
            >
              <ArrowLeftRight size={16} aria-hidden="true" />
              Sustituir
            </Button>
          )}
        </div>
      </div>
      {open && (
        <div id={`alimentos-${meal.id}`} className="nutrition-meal-detail">
          <p className="nutrition-detail-note">
            {done
              ? "Consulta el registro del día para editar lo que comiste."
              : mode === "day"
                ? "Elige un alimento para comparar alternativas y sustituirlo solo este día."
                : "Elige un alimento para comparar alternativas y actualizar tu plan habitual."}
          </p>
          <ul>
            {meal.items.map((item) => (
              <li key={item.id}>
                <div>
                  <p>{item.foodName}</p>
                  <span>
                    {item.quantityG} g
                    {item.servingEquivalence
                      ? ` · ${item.servingEquivalence}`
                      : ""}{" "}
                    · {Math.round(item.macros.calories)} kcal
                  </span>
                  {item.daySwap && mode === "day" ? (
                    <small>En lugar de {item.daySwap.originalFoodName}</small>
                  ) : null}
                </div>
                {!done && (
                  <div className="flex items-center gap-1">
                    <DietItemSwapSheet
                      item={item}
                      date={date}
                      scope={mode}
                      trigger="pill"
                      dayTotals={dayTotals}
                      dayTargets={dayTargets}
                    />
                    {item.daySwap && mode === "day" ? (
                      <UndoDaySwapButton templateItemId={item.id} date={date} />
                    ) : null}
                  </div>
                )}
              </li>
            ))}
          </ul>
          <p className="nutrition-meal-macros">
            Proteína {meal.totals.proteinG} g <span>·</span> Carbohidratos{" "}
            {meal.totals.carbohydrateG} g <span>·</span> Grasas{" "}
            {meal.totals.fatG} g
          </p>
        </div>
      )}
    </li>
  );
}
