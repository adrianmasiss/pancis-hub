"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MacroChip } from "@/components/shared/macro-chip";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";
import type { FoodMacrosPer100g } from "@/features/nutrition/lib/macros";
import {
  answerSwapQuestion,
  type SwapAnswer,
} from "@/features/nutrition/swap-question-actions";
import { swapDietItemForDay } from "@/features/nutrition/day-swap-actions";

const t = messages.nutrition.swapQuestion;

type SwapQuestionPanelProps = {
  /**
   * Alimento de partida. Sin el, el panel funciona como consulta suelta:
   * busca el alimento y muestra sus macros, sin comparar ni ofrecer aplicar.
   */
  from?: {
    name: string;
    per100g: FoodMacrosPer100g;
    quantityG: number;
  };
  /**
   * Item del plan al que aplicaria la sustitucion. Sin el, el panel solo
   * informa: es el modo de la barra suelta de Nutricion, donde todavia no hay
   * un alimento del plan al que aplicarle nada.
   */
  templateItemId?: string;
  /** Fecha del dia al que aplica, en formato YYYY-MM-DD. */
  date?: string;
  className?: string;
};

/** Formatea un delta con su signo, para que se lea la direccion del cambio. */
function signed(value: number, unit: string) {
  const rounded = Math.round(value * 10) / 10;
  const sign = rounded > 0 ? "+" : "";
  return `${sign}${rounded}${unit}`;
}

/** Fila de comparacion. El color acompaña siempre al signo, nunca va solo. */
function DeltaRow({
  label,
  value,
  unit,
  /** Para proteina y fibra subir es favorable; para el resto es neutro. */
  higherIsBetter,
}: {
  label: string;
  value: number;
  unit: string;
  higherIsBetter?: boolean;
}) {
  const neutral = Math.abs(value) < 0.05;
  const favorable = higherIsBetter === undefined ? null : value > 0;

  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="text-muted-foreground truncate">{label}</span>
      <span
        className={cn(
          "num shrink-0 font-medium",
          neutral && "text-muted-foreground",
          !neutral &&
            favorable === true &&
            (higherIsBetter ? "text-[var(--success)]" : "text-foreground"),
          !neutral &&
            favorable === false &&
            (higherIsBetter ? "text-[var(--danger)]" : "text-foreground"),
        )}
      >
        {neutral ? `0${unit}` : signed(value, unit)}
      </span>
    </div>
  );
}

/**
 * Panel "¿y si lo cambio?".
 *
 * Resuelve primero contra la biblioteca y solo cae al asistente cuando el
 * producto no existe en el catalogo. La procedencia del dato se muestra
 * siempre: no es lo mismo una cifra de catalogo que una estimacion, y el
 * usuario tiene que poder distinguirlas antes de decidir.
 */
export function SwapQuestionPanel({
  from,
  templateItemId,
  date,
  className,
}: SwapQuestionPanelProps) {
  const [query, setQuery] = useState("");
  const [quantity, setQuantity] = useState(String(from?.quantityG ?? 100));
  const [answer, setAnswer] = useState<SwapAnswer | null>(null);
  const [pending, startTransition] = useTransition();
  const [applying, startApplying] = useTransition();

  // Aplicar exige los tres: un item del plan, la fecha y una respuesta.
  const canApply = Boolean(templateItemId && date && answer);

  const ask = () => {
    const toQuantityG = Number(quantity);
    if (!query.trim() || !Number.isFinite(toQuantityG) || toQuantityG <= 0) {
      return;
    }

    startTransition(async () => {
      const result = await answerSwapQuestion({
        from,
        toQuery: query,
        toQuantityG,
      });
      if ("error" in result) {
        setAnswer(null);
        toast.error(result.error);
        return;
      }
      setAnswer(result.answer);
    });
  };

  const apply = () => {
    if (!answer || !templateItemId || !date) return;
    startApplying(async () => {
      const result = await swapDietItemForDay({
        templateItemId,
        date,
        quantityG: Number(quantity),
        foodId: answer.toFoodId ?? undefined,
        external: answer.toFoodId
          ? undefined
          : {
              name: answer.toName,
              calories: answer.toPer100g.calories,
              proteinG: answer.toPer100g.proteinG,
              carbohydrateG: answer.toPer100g.carbohydrateG,
              fatG: answer.toPer100g.fatG,
            },
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(t.applied);
    });
  };

  return (
    <section className={cn("surface-raised flex flex-col gap-3 p-3.5", className)}>
      <div className="flex flex-col gap-1">
        <p className="flex items-center gap-2 text-[13px] font-semibold">
          <Sparkles className="text-primary size-4" aria-hidden="true" />
          {t.title}
        </p>
        <p className="text-muted-foreground text-xs">{t.description}</p>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-[11rem] flex-1">
          <span className="sr-only">{t.foodLabel}</span>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                ask();
              }
            }}
            placeholder={t.foodPlaceholder}
            aria-label={t.foodLabel}
          />
        </label>
        <label className="w-24">
          <span className="sr-only">{t.quantityLabel}</span>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            aria-label={t.quantityLabel}
          />
        </label>
        <Button type="button" onClick={ask} disabled={pending || !query.trim()}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : null}
          {pending ? t.calculating : t.submit}
        </Button>
      </div>

      {answer ? (
        <div className="flex flex-col gap-3 border-t border-[var(--divider)] pt-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-[13px] font-semibold">{answer.toName}</p>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10.5px] font-medium",
                answer.source === "biblioteca"
                  ? "bg-[color-mix(in_oklch,var(--success)_18%,transparent)] text-[var(--success)]"
                  : "bg-primary/15 text-primary",
              )}
            >
              {answer.source === "biblioteca" ? t.fromLibrary : t.fromAssistant}
            </span>
          </div>

          {/* Con origen se muestra el cambio; sin el, los macros a secas. */}
          {answer.impact ? (
            <div className="grid gap-1.5 sm:grid-cols-2">
              <DeltaRow
                label={messages.macros.calories.label}
                value={answer.impact.delta.calories}
                unit=" kcal"
              />
              <DeltaRow
                label={messages.macros.protein.label}
                value={answer.impact.delta.proteinG}
                unit=" g"
                higherIsBetter
              />
              <DeltaRow
                label={messages.macros.carbs.label}
                value={answer.impact.delta.carbohydrateG}
                unit=" g"
              />
              <DeltaRow
                label={messages.macros.fat.label}
                value={answer.impact.delta.fatG}
                unit=" g"
              />
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <MacroChip type="calories" value={answer.toMacros.calories} />
              <MacroChip type="protein" value={answer.toMacros.proteinG} />
              <MacroChip type="carbs" value={answer.toMacros.carbohydrateG} />
              <MacroChip type="fat" value={answer.toMacros.fatG} />
            </div>
          )}

          {answer.equivalentQuantityG ? (
            <p className="text-muted-foreground text-xs">
              {t.equivalentHint}{" "}
              <span className="num text-foreground font-medium">
                {answer.equivalentQuantityG} g
              </span>
              .
            </p>
          ) : null}

          {answer.estimateNotice ? (
            <p className="text-muted-foreground flex items-start gap-2 text-[11px] leading-relaxed">
              <TriangleAlert
                className="mt-px size-3.5 shrink-0 text-[var(--caution)]"
                aria-hidden="true"
              />
              {answer.estimateNotice}
            </p>
          ) : null}

          {canApply ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={apply}
              disabled={applying}
              className="self-start"
            >
              {applying ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              {t.applyForToday}
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
