"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SwapAlternativeList } from "@/components/shared/swap-alternative-list";
import { SwapQuestionPanel } from "@/features/nutrition/components/swap-question-panel";
import { SwapVerdict } from "@/features/nutrition/components/swap-verdict";
import {
  getDietItemSwapSuggestions,
  swapDietTemplateItem,
  type DietSwapSuggestions,
} from "@/features/dashboard/actions";
import type { SwapFilter } from "@/features/foods/lib/equivalence";
import type { DietTemplateItemView } from "@/features/dashboard/queries";
import type { SwapCandidate } from "@/features/foods/lib/equivalence";
import type { MacroSet } from "@/features/nutrition/lib/macros";
import { messages } from "@/i18n/es-419";

const t = messages.swap;

export function DietItemSwapSheet({
  item,
  date,
  trigger = "icon",
  dayTotals,
  dayTargets,
}: {
  item: DietTemplateItemView;
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
  trigger?: "icon" | "pill";
}) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<DietSwapSuggestions | null>(
    null,
  );
  const [filter, setFilter] = useState<SwapFilter>("similar");
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  /**
   * Elegir una alternativa ya NO la aplica: la selecciona y abre el veredicto.
   * Es la peticion del handoff —comparar y sustituir en tres niveles— y ademas
   * es lo que dice el producto: proponer, no ejecutar. Antes, un toque en la
   * lista cambiaba el plan del dia sin enseniar que pasaba con el.
   */
  const [picked, setPicked] = useState<SwapCandidate | null>(null);
  const verdictRef = useRef<HTMLDivElement | null>(null);

  /* El veredicto entra arriba de la hoja y la lista puede estar desplazada muy
     abajo: sin esto, elegir una alternativa no parece hacer nada. */
  useEffect(() => {
    if (!picked) return;
    verdictRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  }, [picked]);

  const load = async (nextFilter: SwapFilter = filter) => {
    setLoading(true);
    const result = await getDietItemSwapSuggestions({
      templateItemId: item.id,
      filter: nextFilter,
    });
    setLoading(false);
    if ("error" in result) toast.error(result.error);
    else setSuggestions(result);
  };

  const changeFilter = (next: SwapFilter) => {
    setFilter(next);
    setSuggestions(null);
    setPicked(null);
    void load(next);
  };

  const pick = (foodId: string, quantityG: number) => {
    const candidate =
      suggestions?.alternatives.find(
        (alternative) =>
          alternative.food.id === foodId &&
          alternative.suggestedQuantityG === quantityG,
      ) ?? null;
    setPicked(candidate);
  };

  const confirm = () => {
    if (!picked) return;
    startTransition(async () => {
      const result = await swapDietTemplateItem({
        templateItemId: item.id,
        foodId: picked.food.id,
        quantityG: picked.suggestedQuantityG,
      });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(t.swapped);
        setOpen(false);
        setSuggestions(null);
        setPicked(null);
      }
    });
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void load();
        else {
          setSuggestions(null);
          setPicked(null);
        }
      }}
    >
      <SheetTrigger asChild>
        {trigger === "pill" ? (
          <Button
            variant="link"
            className="h-7 shrink-0 rounded-none px-1 text-xs font-medium"
            aria-label={`${t.trigger} — ${item.foodName}`}
          >
            <ArrowLeftRight className="size-3.5" />
            {t.triggerShort}
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
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t.title}</SheetTitle>
          <SheetDescription>{t.description}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-5 overflow-y-auto px-4 pb-6">
          {/* Consulta libre con IA, antes de la lista de alternativas del
              catalogo: es la via para el producto que no esta en la
              biblioteca, que es justo cuando la lista no ayuda. */}
          <SwapQuestionPanel
            from={{
              name: item.foodName,
              per100g: {
                calories: item.quantityG
                  ? (item.macros.calories / item.quantityG) * 100
                  : 0,
                proteinG: item.quantityG
                  ? (item.macros.proteinG / item.quantityG) * 100
                  : 0,
                carbohydrateG: item.quantityG
                  ? (item.macros.carbohydrateG / item.quantityG) * 100
                  : 0,
                fatG: item.quantityG
                  ? (item.macros.fatG / item.quantityG) * 100
                  : 0,
                fiberG: item.quantityG
                  ? (item.macros.fiberG / item.quantityG) * 100
                  : 0,
              },
              quantityG: item.quantityG,
            }}
            templateItemId={item.id}
            date={date}
          />

          {picked ? (
            <div ref={verdictRef}>
              <SwapVerdict
                fromName={item.foodName}
                toName={picked.food.name}
                diff={picked.diff}
                dayTotals={dayTotals}
                dayTargets={dayTargets}
                pending={pending}
                onConfirm={confirm}
              />
            </div>
          ) : null}

          <SwapAlternativeList
            sourceName={item.foodName}
            sourceQuantityG={item.quantityG}
            sourceCalories={item.macros.calories}
            filter={filter}
            onFilterChange={changeFilter}
            loading={loading}
            alternatives={suggestions?.alternatives ?? null}
            pending={pending}
            onConfirm={pick}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
