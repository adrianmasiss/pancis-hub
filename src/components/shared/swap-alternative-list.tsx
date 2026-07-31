"use client";

import type { ReactNode } from "react";
import { History, Home, Star, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  MacroChip,
  macroLabel,
  macroUnit,
  type MacroType,
} from "@/components/shared/macro-chip";
import { CompatibilityScore } from "@/components/shared/compatibility-score";
import {
  SWAP_FILTERS,
  type SwapCandidate,
  type SwapFilter,
} from "@/features/foods/lib/equivalence";
import { messages } from "@/i18n/es-419";

const t = messages.swap;
const n = messages.nutrition;

function sign(value: number): string {
  return value > 0 ? `+${value}` : `${value}`;
}

const DIFF_MACROS: { type: MacroType; key: keyof SwapCandidate["diff"] }[] = [
  { type: "calories", key: "calories" },
  { type: "protein", key: "proteinG" },
  { type: "carbs", key: "carbohydrateG" },
  { type: "fat", key: "fatG" },
  { type: "fiber", key: "fiberG" },
];

export type SwapAlternativeListProps = {
  sourceName: string;
  sourceQuantityG: number;
  sourceCalories: number;
  filter: SwapFilter;
  onFilterChange: (filter: SwapFilter) => void;
  loading: boolean;
  alternatives: SwapCandidate[] | null;
  pending: boolean;
  onConfirm: (foodId: string, quantityG: number) => void;
  /** Contenido opcional entre el filtro y la lista (p. ej. rebalanceo). */
  beforeList?: ReactNode;
};

/**
 * Lista de alternativas de sustitucion con su filtro de criterio. Es la
 * pieza comun del intercambio de alimentos, se use en una comida registrada
 * o en un item de la dieta plantilla: misma UX en ambos lugares (5.2).
 */
export function SwapAlternativeList({
  sourceName,
  sourceQuantityG,
  sourceCalories,
  filter,
  onFilterChange,
  loading,
  alternatives,
  pending,
  onConfirm,
  beforeList,
}: SwapAlternativeListProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm">
        {t.sourceLabel}:{" "}
        <span className="font-medium">
          {sourceQuantityG} g de {sourceName}
        </span>{" "}
        <MacroChip
          type="calories"
          value={sourceCalories}
          className="text-muted-foreground"
        />
      </p>

      {/* Requisito 5.2: buscar la alternativa segun lo que hace falta. */}
      <div className="space-y-1">
        <Label htmlFor="swap-filter">{t.filterLabel}</Label>
        <select
          id="swap-filter"
          className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
          value={filter}
          onChange={(event) => onFilterChange(event.target.value as SwapFilter)}
        >
          {SWAP_FILTERS.map((option) => (
            <option key={option} value={option}>
              {t.filters[option]}
            </option>
          ))}
        </select>
        {filter === "mas_proteina" || filter === "mas_saciedad" ? (
          <p className="text-muted-foreground text-xs">{t.densityNote}</p>
        ) : null}
      </div>

      {beforeList}

      {loading ? (
        <p className="text-muted-foreground text-sm">{messages.common.loading}</p>
      ) : alternatives && alternatives.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {filter === "similar" ? t.noAlternatives : t.filterEmpty}
        </p>
      ) : alternatives ? (
        <ul className="space-y-2">
          {alternatives.map((alternative) => (
            <li
              key={alternative.food.id}
              className="space-y-2 rounded-xl border p-3"
            >
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm font-medium">
                  {alternative.food.name}
                </span>
                {alternative.food.cookedState ? (
                  <span className="text-muted-foreground text-xs">
                    ({n.cookedState[alternative.food.cookedState]})
                  </span>
                ) : null}
                {!alternative.sameGroup ? (
                  <Badge variant="outline" className="gap-1 font-normal">
                    <TriangleAlert className="size-3" aria-hidden="true" />
                    {t.crossGroupNote}
                  </Badge>
                ) : null}
                {alternative.isAvailable ? (
                  <Badge variant="secondary" className="gap-1 font-normal">
                    <Home className="size-3" aria-hidden="true" />
                    {t.availableNote}
                  </Badge>
                ) : alternative.isFavorite ? (
                  <Badge variant="secondary" className="gap-1 font-normal">
                    <Star className="size-3" aria-hidden="true" />
                    {t.favoriteNote}
                  </Badge>
                ) : alternative.isRecent ? (
                  <Badge variant="secondary" className="gap-1 font-normal">
                    <History className="size-3" aria-hidden="true" />
                    {t.recentNote}
                  </Badge>
                ) : null}
              </div>
              <p className="text-sm tabular-nums">
                {t.suggestedQuantity}:{" "}
                <span className="font-medium">
                  {alternative.suggestedQuantityG} g
                </span>{" "}
                {alternative.householdEquivalence ? (
                  <span className="text-muted-foreground">
                    {t.householdEquivalence.replace(
                      "{equivalence}",
                      alternative.householdEquivalence,
                    )}
                  </span>
                ) : null}{" "}
                <MacroChip
                  type="calories"
                  value={alternative.macros.calories}
                  className="text-muted-foreground"
                />
              </p>
              <p className="text-muted-foreground flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs">
                <span>{t.differences}:</span>
                {DIFF_MACROS.map(({ type, key }) => (
                  <span key={type} className="tabular-nums">
                    {macroLabel(type)}{" "}
                    <span className="text-foreground font-medium">
                      {sign(alternative.diff[key])}
                    </span>{" "}
                    {macroUnit(type)}
                  </span>
                ))}
              </p>
              <CompatibilityScore score={alternative.compatibility} />
              <Button
                size="sm"
                className="w-full"
                disabled={pending}
                onClick={() =>
                  onConfirm(alternative.food.id, alternative.suggestedQuantityG)
                }
              >
                {pending ? messages.common.loading : t.confirmSwap}
              </Button>
            </li>
          ))}
        </ul>
      ) : null}

      {alternatives && alternatives.length > 0 ? (
        <>
          <p className="text-muted-foreground text-xs">{t.compatibilityNote}</p>
          {/*
            EQ-004: el filtro de alergenos compara el NOMBRE del alimento, y
            un producto empacado puede contener un alergeno sin llevarlo en el
            nombre. La sustitucion no puede ser la ultima linea de defensa.
          */}
          <p className="text-caution text-xs">{t.allergenNote}</p>
        </>
      ) : null}
    </div>
  );
}
