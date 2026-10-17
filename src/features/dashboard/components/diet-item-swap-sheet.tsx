"use client";

import { useCallback, useState, useTransition } from "react";
import { ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  FocusCard,
  FocusCardContent,
  FocusCardDescription,
  FocusCardHeader,
  FocusCardTitle,
  FocusCardTrigger,
} from "@/components/ui/focus-card";
import {
  SwapAlternativeList,
  type AlternativeRequest,
} from "@/components/shared/swap-alternative-list";
import { DayImpact } from "@/features/nutrition/components/compact-nutrition";
import {
  getDietItemSwapSuggestions,
  swapDietTemplateItem,
} from "@/features/dashboard/actions";
import type { DietTemplateItemView } from "@/features/dashboard/queries";
import type { SwapCandidate } from "@/features/foods/lib/equivalence";
import type { MacroSet } from "@/features/nutrition/lib/macros";
import { messages } from "@/i18n/es-419";
import { swapDietItemForDay } from "@/features/nutrition/day-swap-actions";

const t = messages.swap;

export function DietItemSwapSheet({
  item,
  date,
  trigger = "icon",
  dayTotals,
  dayTargets,
  scope = "day",
  triggerLabel,
}: {
  /** Rotulo de la capsula cuando «Cambiar» no basta para distinguirla. */
  triggerLabel?: string;
  item: DietTemplateItemView;
  scope?: "day" | "plan";
  /** Totales y objetivo del dia, para el efecto del cambio (handoff, nivel 3). */
  dayTotals?: MacroSet;
  dayTargets?: MacroSet | null;
  /** Dia al que aplicaria una sustitucion "solo por hoy". */
  date: string;
  /**
   * `icon` en la lista compacta de Hoy; `pill` en Nutricion, donde la maqueta
   * lo dibuja como capsula naranja con rotulo. Es la misma accion: cambia el
   * peso que se le da segun cuanta pantalla tenga alrededor.
   */
  trigger?: "icon" | "pill" | "action";
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  /**
   * Elegir una alternativa ya NO la aplica: la selecciona y abre el veredicto.
   * Es la peticion del handoff —comparar y sustituir en tres niveles— y ademas
   * es lo que dice el producto: proponer, no ejecutar. Antes, un toque en la
   * lista cambiaba el plan del dia sin enseniar que pasaba con el.
   */
  const [picked, setPicked] = useState<SwapCandidate | null>(null);
  const load = useCallback(
    (request: AlternativeRequest) =>
      getDietItemSwapSuggestions({
        templateItemId: item.id,
        date: scope === "day" ? date : undefined,
        ...request,
      }),
    [item.id, date, scope],
  );

  const confirm = () => {
    if (!picked) return;
    startTransition(async () => {
      const input = {
        templateItemId: item.id,
        foodId: picked.food.id,
        quantityG: picked.suggestedQuantityG,
      };
      const result =
        scope === "day"
          ? await swapDietItemForDay({ ...input, date })
          : await swapDietTemplateItem(input);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success(t.swapped);
        setOpen(false);
        setPicked(null);
      }
    });
  };

  return (
    <FocusCard
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setPicked(null);
      }}
    >
      <FocusCardTrigger asChild>
        {trigger === "action" ? (
          /* Boton redondo de la fila de alimento del plan de Nutricion, junto
             a «Editar»: mismo tamano y forma que su vecino. */
          <button
            type="button"
            className="plan-food-action"
            aria-label={`${t.trigger} — ${item.foodName}`}
          >
            <ArrowLeftRight size={15} aria-hidden="true" />
          </button>
        ) : trigger === "pill" ? (
          <Button
            variant="link"
            className="min-h-11 shrink-0 px-2 text-sm font-medium"
            aria-label={`${t.trigger} — ${item.foodName}`}
          >
            <ArrowLeftRight className="size-3.5" />
            {triggerLabel ?? t.triggerShort}
          </Button>
        ) : (
          <Button
            size="icon"
            variant="ghost"
            className="text-muted-foreground size-7 shrink-0"
            aria-label={`${t.trigger} — ${item.foodName}`}
          >
            <ArrowLeftRight className="size-3.5" />
          </Button>
        )}
      </FocusCardTrigger>
      <FocusCardContent className="nutrition-swap-sheet compact-nutrition-focus swap-workbench-focus">
        <FocusCardHeader>
          <FocusCardTitle>
            <span className="compact-title-icon">
              <ArrowLeftRight size={18} strokeWidth={1.5} />
            </span>
            Comparar alimentos
          </FocusCardTitle>
          <FocusCardDescription>
            {scope === "day" ? `Solo para ${date}` : "En tu plan habitual"}
          </FocusCardDescription>
        </FocusCardHeader>
        <div className="compact-dialog-body">
          <SwapAlternativeList
            sourceName={item.foodName}
            sourceQuantityG={item.quantityG}
            sourceMacros={item.macros}
            sourceImageUrl={item.imageUrl}
            sourceGroup={item.foodGroup}
            load={load}
            pending={pending}
            dayImpact={
              picked &&
              dayTotals && (
                <DayImpact
                  totals={dayTotals}
                  targets={dayTargets}
                  diff={picked.diff}
                />
              )
            }
            onPick={setPicked}
          >
            {picked && (
              <div className="compact-confirmation">
                <Button
                  className="compact-primary"
                  variant="brand"
                  onClick={confirm}
                  disabled={pending}
                >
                  {pending
                    ? messages.common.loading
                    : scope === "day"
                      ? "Sustituir solo este día"
                      : "Sustituir en mi plan"}
                </Button>
              </div>
            )}
          </SwapAlternativeList>
        </div>
      </FocusCardContent>
    </FocusCard>
  );
}
