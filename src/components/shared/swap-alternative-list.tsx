"use client";

import { useEffect, useState, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import {
  CompactStep,
  OptionPager,
  useOptionPageSize,
} from "@/features/nutrition/components/compact-nutrition";
import { FoodFormDialog } from "@/features/foods/components/food-form-dialog";
import { BackArrowButton } from "./back-arrow-button";
import { AlternativeRow } from "./alternative-row";
import { ComparisonToolbar, type ComparisonMode } from "./comparison-toolbar";
import { Button } from "@/components/ui/button";
import {
  compatibilityScore,
  SWAP_FILTERS,
  type SwapCandidate,
  type SwapFilter,
} from "@/features/foods/lib/equivalence";
import { scaleMacros, type MacroSet } from "@/features/nutrition/lib/macros";
import { macroDifference } from "@/features/nutrition/lib/compare";
import { ComparisonChat } from "@/features/nutrition/components/comparison-chat";
import { SwapComparisonBoard } from "@/features/nutrition/components/swap-comparison-board";
import { messages } from "@/i18n/es-419";
import "@/features/nutrition/components/alternative-explorer.css";

export type AlternativeRequest = {
  filter: SwapFilter;
  query?: string;
  sameGroupOnly?: boolean;
};
export type AlternativeLoader = (
  request: AlternativeRequest,
) => Promise<{ error: string } | { alternatives: SwapCandidate[] }>;
type View = "similar" | "macros" | "search";
const views: ComparisonMode<View>[] = [
  { id: "similar", label: "Similares" },
  { id: "macros", label: "Más cercanas en macros", short: "Macros cercanos" },
  { id: "search", label: "Buscar", icon: "search" },
];

export function SwapAlternativeList({
  sourceName,
  sourceQuantityG,
  sourceMacros,
  sourceImageUrl,
  sourceGroup,
  load,
  pending,
  onPick,
  children,
  dayImpact,
}: {
  sourceName: string;
  sourceQuantityG: number;
  sourceMacros: MacroSet;
  sourceImageUrl?: string | null;
  sourceGroup?: string | null;
  load: AlternativeLoader;
  pending: boolean;
  onPick: (candidate: SwapCandidate | null) => void;
  children?: ReactNode;
  dayImpact?: ReactNode;
}) {
  const [view, setView] = useState<View>("similar");
  const [filter, setFilter] = useState<SwapFilter>("similar");
  const [query, setQuery] = useState("");
  const [alternatives, setAlternatives] = useState<SwapCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [choosing, setChoosing] = useState(true);
  const [base, setBase] = useState<SwapCandidate | null>(null);
  const [quantity, setQuantity] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = useOptionPageSize();
  const currentPage = Math.min(
    page,
    Math.max(0, Math.ceil(alternatives.length / pageSize) - 1),
  );
  const canSearch = view !== "search" || query.trim().length >= 2;

  useEffect(() => {
    if (!canSearch) return;
    let cancelled = false;
    const timer = setTimeout(
      async () => {
        try {
          const result = await load({
            filter: view === "similar" ? filter : "macros",
            query: view === "search" ? query : undefined,
            sameGroupOnly: view === "similar",
          });
          if (cancelled) return;
          if ("error" in result) setError(result.error);
          else setAlternatives(result.alternatives);
        } catch {
          if (!cancelled)
            setError("No pudimos cargar las alternativas. Inténtalo de nuevo.");
        } finally {
          if (!cancelled) setLoading(false);
        }
      },
      view === "search" ? 300 : 0,
    );
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [view, filter, query, retry, load, canSearch]);

  const reset = () => {
    setPage(0);
    setAlternatives([]);
    setLoading(true);
    setError("");
    setBase(null);
    onPick(null);
  };
  const adjusted = (candidate: SwapCandidate, grams: number): SwapCandidate => {
    const macros = scaleMacros(candidate.food.per100g, grams);
    return {
      ...candidate,
      suggestedQuantityG: grams,
      macros,
      diff: macroDifference(sourceMacros, macros),
      compatibility: compatibilityScore(sourceMacros, macros),
      householdEquivalence:
        grams === candidate.suggestedQuantityG
          ? candidate.householdEquivalence
          : null,
    };
  };
  const validQuantity =
    Number.isFinite(Number(quantity)) &&
    Number(quantity) > 0 &&
    Number(quantity) <= 5000;
  const selected =
    base && validQuantity ? adjusted(base, Number(quantity)) : null;

  return (
    <CompactStep className="alternative-explorer swap-workbench">
      <SwapComparisonBoard
        dayImpact={selected ? dayImpact : undefined}
        alternativeControls={
          <>
            {" "}
            <ComparisonToolbar
              label="Encontrar alternativas"
              disabled={pending}
              active={view}
              modes={views}
              onSelect={(id) => {
                setChoosing(true);
                if (id === view) return;
                reset();
                setView(id);
              }}
              leading={
                !choosing &&
                base && (
                  <BackArrowButton
                    label="Elegir otra alternativa"
                    disabled={pending}
                    onClick={() => setChoosing(true)}
                  />
                )
              }
              add={
                <FoodFormDialog
                  trigger="icon"
                  onCreated={(name) => {
                    reset();
                    setView("search");
                    setQuery(name);
                    setChoosing(true);
                    setRetry((value) => value + 1);
                  }}
                />
              }
            />
          </>
        }
        alternativePicker={
          choosing ? (
            <>
              <div className="swap-selection-controls">
                <div className="swap-browse-tools">
                  <div className="compact-filter">
                    {view === "search" ? (
                      <input
                        aria-label="¿Qué te gustaría comer?"
                        type="search"
                        // Choosing search is the request to type: no extra tap.
                        autoFocus
                        placeholder="Buscar un alimento…"
                        value={query}
                        maxLength={100}
                        disabled={pending}
                        onChange={(e) => {
                          reset();
                          setQuery(e.target.value);
                        }}
                      />
                    ) : view === "similar" ? (
                      <>
                        <span>Mismo grupo</span>
                        <select
                          aria-label="Priorizar alternativas"
                          value={filter}
                          disabled={pending}
                          onChange={(e) => {
                            reset();
                            setFilter(e.target.value as SwapFilter);
                          }}
                        >
                          {SWAP_FILTERS.filter((f) => f !== "macros").map(
                            (f) => (
                              <option key={f} value={f}>
                                {messages.swap.filters[f]}
                              </option>
                            ),
                          )}
                        </select>
                      </>
                    ) : (
                      <span title="Ordenadas por cercanía en todos los macros">
                        Por cercanía en todos los macros
                      </span>
                    )}
                  </div>
                </div>
                <div
                  className="compact-results"
                  aria-live="polite"
                  aria-busy={loading && canSearch}
                >
                  {!canSearch ? (
                    <p className="compact-empty">
                      Escribe al menos dos letras para buscar.
                    </p>
                  ) : error ? (
                    <div role="alert" className="compact-empty">
                      <p>{error}</p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          reset();
                          setRetry(retry + 1);
                        }}
                      >
                        Reintentar
                      </Button>
                    </div>
                  ) : loading ? (
                    <div className="alternative-list swap-choice-strip">
                      <span className="sr-only">Buscando alternativas…</span>
                      {[0, 1].map((i) => (
                        <div className="alternative-skeleton" key={i} />
                      ))}
                    </div>
                  ) : alternatives.length ? (
                    <ul className="alternative-list swap-choice-strip">
                      {alternatives
                        .slice(
                          currentPage * pageSize,
                          (currentPage + 1) * pageSize,
                        )
                        .map((candidate, index) => {
                          const current = adjusted(
                            candidate,
                            candidate.suggestedQuantityG,
                          );
                          return (
                            <li key={candidate.food.id}>
                              <AlternativeRow
                                name={candidate.food.name}
                                meta={[
                                  `${candidate.suggestedQuantityG} g`,
                                  candidate.householdEquivalence,
                                  candidate.food.cookedState,
                                  `${Math.round(candidate.macros.calories)} kcal`,
                                ]
                                  .filter(Boolean)
                                  .join(" · ")}
                                group={candidate.food.foodGroup}
                                imageUrl={candidate.food.imageUrl}
                                cookedState={candidate.food.cookedState}
                                deltaKcal={current.diff.calories}
                                featured={
                                  currentPage === 0 &&
                                  index === 0 &&
                                  view !== "search"
                                }
                                pressed={base?.food.id === candidate.food.id}
                                disabled={pending}
                                onClick={() => {
                                  setChoosing(false);
                                  setBase(candidate);
                                  setQuantity(
                                    String(candidate.suggestedQuantityG),
                                  );
                                  onPick(current);
                                }}
                              />
                            </li>
                          );
                        })}
                    </ul>
                  ) : (
                    <p className="compact-empty">
                      {view === "search"
                        ? "No encontramos ese alimento. Prueba otro nombre."
                        : "No hay opciones para este criterio. Prueba Macros cercanos o Buscar."}
                    </p>
                  )}
                </div>
                <div className="swap-workbench-bottom">
                  <OptionPager
                    page={currentPage}
                    size={pageSize}
                    count={alternatives.length}
                    onPage={setPage}
                    disabled={pending || loading}
                  />
                </div>
              </div>
            </>
          ) : undefined
        }
        source={{
          name: sourceName,
          quantityG: sourceQuantityG,
          macros: sourceMacros,
          imageUrl: sourceImageUrl,
          group: sourceGroup,
        }}
        alternative={
          base
            ? {
                name: base.food.name,
                quantityG: Number(quantity),
                macros: selected?.macros ?? null,
                imageUrl: base.food.imageUrl,
                group: base.food.foodGroup,
                cookedState: base.food.cookedState,
              }
            : null
        }
        portionControl={
          <>
            <label>
              <span className="sr-only">Cantidad (g)</span>
              <input
                type="number"
                aria-label="Cantidad (g)"
                inputMode="decimal"
                min="0.1"
                max="5000"
                step="0.1"
                value={quantity}
                placeholder="—"
                disabled={pending || !base}
                aria-invalid={Boolean(base) && !validQuantity}
                onChange={(e) => {
                  const value = e.target.value;
                  setQuantity(value);
                  const grams = Number(value);
                  onPick(
                    base && Number.isFinite(grams) && grams > 0 && grams <= 5000
                      ? adjusted(base, grams)
                      : null,
                  );
                }}
              />
              <span>g</span>
            </label>
            {base && (
              <button
                type="button"
                className="swap-reset-portion"
                aria-label={`Usar sugerida · ${base.suggestedQuantityG} g`}
                title={`Usar sugerida · ${base.suggestedQuantityG} g`}
                disabled={pending}
                onClick={() => {
                  setQuantity(String(base.suggestedQuantityG));
                  onPick(adjusted(base, base.suggestedQuantityG));
                }}
              >
                <RotateCcw size={14} strokeWidth={1.5} />
              </button>
            )}
          </>
        }
      />
      {base && !validQuantity && (
        <p role="alert" className="compact-note">
          Ingresa una cantidad mayor que 0 y hasta 5000 g para continuar.
        </p>
      )}
      {!choosing && selected && children}
      <p className="comparison-portions-note">
        Porciones aproximadas · revisa ingredientes y alérgenos.
      </p>
      <ComparisonChat
        key={`${sourceName}-${base?.food.id ?? "none"}`}
        source={{
          name: sourceName,
          quantityG: sourceQuantityG,
          macros: sourceMacros,
        }}
        alternative={
          base
            ? {
                name: base.food.name,
                quantityG: Number(quantity) || 0,
                macros: selected?.macros ?? null,
              }
            : null
        }
      />
    </CompactStep>
  );
}
