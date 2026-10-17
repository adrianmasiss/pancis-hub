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
import {
  getSwapSuggestions,
  swapMealItem,
} from "@/features/nutrition/swap-actions";
import type { MealItemView } from "@/features/nutrition/queries";
import type { RebalanceReport } from "@/features/nutrition/lib/rebalance";
import { RebalanceSummary } from "@/components/shared/rebalance-summary";
import { DayImpact } from "@/features/nutrition/components/compact-nutrition";
import type { SwapCandidate } from "@/features/foods/lib/equivalence";
import type { MacroSet } from "@/features/nutrition/lib/macros";
import { messages } from "@/i18n/es-419";

const t = messages.swap;

/**
 * Sustituir un alimento YA REGISTRADO.
 *
 * Lleva el mismo paso de veredicto que la hoja del plan: elegir selecciona y
 * abre la comparacion, y aplicar es un segundo gesto. Salio sin el, y como las
 * dos hojas comparten el rotulo del boton, aqui decia "Ver el cambio" y
 * aplicaba directo — un boton que promete mirar y ejecuta.
 */
export function FoodSwapSheet({
  item,
  dayTotals,
  dayTargets,
}: {
  item: MealItemView;
  dayTotals?: MacroSet;
  dayTargets?: MacroSet | null;
}) {
  const [open, setOpen] = useState(false);
  const [rebalance, setRebalance] = useState<RebalanceReport | null>(null);
  const [pending, startTransition] = useTransition();
  const [picked, setPicked] = useState<SwapCandidate | null>(null);

  const [completed, setCompleted] = useState(false);
  const load = useCallback(
    (request: AlternativeRequest) =>
      getSwapSuggestions({ itemId: item.id, ...request }),
    [item.id],
  );

  const confirm = () => {
    if (!picked) return;
    startTransition(async () => {
      const result = await swapMealItem({
        itemId: item.id,
        foodId: picked.food.id,
        quantityG: picked.suggestedQuantityG,
      });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(t.swapped);
        // La hoja no se cierra: el usuario necesita ver como quedo el dia
        // tras el cambio antes de seguir (requisito 6).
        setCompleted(true);
        setPicked(null);
        setRebalance(result.rebalance);
      }
    });
  };

  return (
    <FocusCard
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setPicked(null);
          setCompleted(false);
          setRebalance(null);
        }
      }}
    >
      <FocusCardTrigger asChild>
        <Button
          size="icon"
          variant="ghost"
          className="text-muted-foreground size-8"
          aria-label={`${t.trigger} — ${item.foodName}`}
        >
          <ArrowLeftRight className="size-4" />
        </Button>
      </FocusCardTrigger>
      <FocusCardContent className="nutrition-swap-sheet compact-nutrition-focus swap-workbench-focus">
        <FocusCardHeader>
          <FocusCardTitle>
            <span className="compact-title-icon">
              <ArrowLeftRight size={18} strokeWidth={1.5} />
            </span>
            Comparar alimentos
          </FocusCardTitle>
          <FocusCardDescription>En tu comida registrada</FocusCardDescription>
        </FocusCardHeader>
        <div className="compact-dialog-body">
          {completed ? (
            <div role="status">
              <p className="text-sm font-medium">Intercambio aplicado</p>
              {rebalance && <RebalanceSummary report={rebalance} />}
            </div>
          ) : (
            <SwapAlternativeList
              sourceName={item.foodName}
              sourceGroup={item.foodGroup}
              sourceImageUrl={item.imageUrl}
              sourceQuantityG={item.quantityG}
              sourceMacros={item.macros}
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
                    {pending ? messages.common.loading : "Aplicar intercambio"}
                  </Button>
                </div>
              )}
            </SwapAlternativeList>
          )}
        </div>
      </FocusCardContent>
    </FocusCard>
  );
}
