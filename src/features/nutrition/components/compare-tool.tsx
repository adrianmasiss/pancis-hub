"use client";

import { useEffect, useId, useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { BackArrowButton } from "@/components/shared/back-arrow-button";
import { ComparisonToolbar } from "@/components/shared/comparison-toolbar";
import { Button } from "@/components/ui/button";
import { BarcodeScanner } from "@/features/foods/components/barcode-scanner";
import { FoodFormDialog } from "@/features/foods/components/food-form-dialog";
import { searchCatalogFoodsFull, type CatalogFoodMatch } from "../ai-actions";
import { scaleMacros, sumMacros, type MacroSet } from "../lib/macros";
import { MacroSummary } from "./macro-comparison";
import { MealAlternatives, type MealExploreMode } from "./meal-alternatives";
import { mealKind, CompactStep, OptionPager } from "./compact-nutrition";
import { SwapComparisonBoard } from "./swap-comparison-board";
import { ComparisonChat } from "./comparison-chat";
import type { ComparisonMeal } from "../compare-queries";
import "./alternative-explorer.css";

type Role = "A" | "B";
type Screen = "browse" | "compare" | "compose" | "ingredients";
type Item = {
  key: string;
  name: string;
  quantityG: number;
  per100g: MacroSet;
  macros: MacroSet;
};
type Slot = { mealId: string; label: string; items: Item[]; mealType?: string };
const emptySlot = (): Slot => ({
  mealId: "",
  label: "Tu combinación",
  items: [],
});
const fromMeal = (meal: ComparisonMeal): Slot => ({
  mealId: meal.id,
  label: meal.label,
  mealType: meal.mealType,
  items: meal.items.map((item, index) => ({
    ...item,
    key: `${meal.id}-${index}`,
    per100g: scaleMacros(
      item.macros,
      item.quantityG > 0 ? 10000 / item.quantityG : 0,
    ),
  })),
});

function Composer({
  onAdd,
}: {
  onAdd: (food: CatalogFoodMatch, grams: number) => void;
}) {
  const [term, setTerm] = useState("");
  const [quantity, setQuantity] = useState("100");
  const [results, setResults] = useState<CatalogFoodMatch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [retry, setRetry] = useState(0);
  const grams = Number(quantity);
  const valid = Number.isFinite(grams) && grams > 0 && grams <= 5000;
  useEffect(() => {
    if (term.trim().length < 2) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const result = await searchCatalogFoodsFull(term);
        if (!cancelled) {
          if ("error" in result) setError(result.error);
          else setResults(result.results);
        }
      } catch {
        if (!cancelled) setError("No pudimos buscar. Inténtalo de nuevo.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term, retry]);
  return (
    <div className="compact-step">
      <div className="compact-search-row">
        <input
          className="compact-search-input"
          type="search"
          aria-label="Buscar alimento"
          placeholder="Buscar alimento…"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setResults([]);
            setError("");
            setPage(0);
            setLoading(e.target.value.trim().length >= 2);
          }}
        />
        <label>
          <span className="sr-only">Cantidad para añadir</span>
          <input
            type="number"
            min="0.1"
            max="5000"
            step="0.1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            aria-invalid={!valid}
          />
          <span>g</span>
        </label>
      </div>
      {!valid && (
        <p role="alert" className="compact-note">
          Usa una cantidad mayor que 0 y hasta 5000 g.
        </p>
      )}
      <div aria-live="polite" aria-busy={loading}>
        {error ? (
          <div className="compact-empty" role="alert">
            <p>{error}</p>
            <Button
              variant="outline"
              onClick={() => {
                setError("");
                setLoading(true);
                setRetry(retry + 1);
              }}
            >
              Reintentar
            </Button>
          </div>
        ) : loading ? (
          <div className="alternative-list">
            {[0, 1].map((i) => (
              <div key={i} className="alternative-skeleton" />
            ))}
          </div>
        ) : results.length ? (
          <ul className="alternative-list compare-results-compact">
            {results.slice(page * 2, page * 2 + 2).map((food) => (
              <li key={food.id}>
                <button
                  className="alternative-option v11-card"
                  type="button"
                  disabled={!valid}
                  onClick={() => {
                    onAdd(food, grams);
                    setTerm("");
                    setResults([]);
                    setPage(0);
                  }}
                >
                  <span className="alternative-option-head">
                    <span>
                      <strong title={food.name}>{food.name}</strong>
                      <small>
                        {food.brand ?? food.cookedState ?? "Catálogo"}
                      </small>
                    </span>
                    <span className="compact-arrow">
                      <Plus size={16} strokeWidth={1.5} />
                    </span>
                  </span>
                  <MacroSummary macros={scaleMacros(food, valid ? grams : 0)} />
                  <span className="compact-note">
                    Añadir {valid ? grams : "—"} g
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="compact-empty">
            {term.trim().length < 2
              ? "Busca un alimento para añadirlo a tu combinación."
              : "No encontramos ese alimento. Prueba otro nombre."}
          </p>
        )}
      </div>
      <OptionPager
        page={page}
        count={results.length}
        onPage={setPage}
        disabled={loading}
      />
      <div className="compact-actions">
        <BarcodeScanner />
        <FoodFormDialog />
      </div>
    </div>
  );
}

export function CompareTool({
  dietMeals,
  todayMeals,
  initialMealId,
  initialSource = "diet",
}: {
  dietMeals: ComparisonMeal[];
  todayMeals: ComparisonMeal[];
  initialMealId?: string;
  initialSource?: "diet" | "today";
}) {
  const allMeals = [...dietMeals, ...todayMeals];
  const initialMeals = initialSource === "diet" ? dietMeals : todayMeals;
  const initialMeal =
    initialMeals.find((meal) => meal.id === initialMealId) ??
    initialMeals[0] ??
    allMeals[0];
  const [a, setA] = useState<Slot>(() =>
    initialMeal ? fromMeal(initialMeal) : emptySlot(),
  );
  const [b, setB] = useState<Slot>(emptySlot);
  const [screen, setScreen] = useState<Screen>("browse");
  const [mode, setMode] = useState<MealExploreMode>("similar");
  const [target, setTarget] = useState<Role>("B");
  const [page, setPage] = useState(0);
  const keyPrefix = useId();
  const [seq, setSeq] = useState(0);
  const totalsA = sumMacros(a.items.map((item) => item.macros));
  const totalsB = sumMacros(b.items.map((item) => item.macros));
  const reference: ComparisonMeal | null = a.items.length
    ? {
        id: a.mealId || "custom",
        label: a.label,
        mealType: a.mealType,
        items: a.items,
        totals: totalsA,
      }
    : null;
  const active = target === "A" ? a : b;
  const setActive = target === "A" ? setA : setB;
  const ready = a.items.length > 0 && b.items.length > 0;
  const edit = (role: Role) => {
    setTarget(role);
    setPage(0);
    setScreen("ingredients");
  };
  const back = () => setScreen(ready ? "compare" : "browse");
  const activePage = Math.min(
    page,
    Math.max(0, Math.ceil(active.items.length / 2) - 1),
  );
  const add = (food: CatalogFoodMatch, grams: number) => {
    setActive((slot) => ({
      ...slot,
      mealId: "",
      label: "Tu combinación",
      items: [
        ...slot.items,
        {
          key: `${keyPrefix}-${seq}`,
          name: food.name,
          quantityG: grams,
          per100g: food,
          macros: scaleMacros(food, grams),
        },
      ],
    }));
    setSeq(seq + 1);
  };

  return (
    <div className="compact-comparison-standalone">
      {screen === "browse" || screen === "compare" ? (
        <CompactStep key="workspace" className="swap-workbench">
          <SwapComparisonBoard
            source={{
              name: a.items.length === 1 ? a.items[0]!.name : a.label,
              quantityG: a.items.reduce((sum, item) => sum + item.quantityG, 0),
              macros: totalsA,
              category: mealKind(a.items, totalsA),
            }}
            alternative={
              b.items.length
                ? {
                    name: b.items.length === 1 ? b.items[0]!.name : b.label,
                    quantityG: b.items.reduce(
                      (sum, item) => sum + item.quantityG,
                      0,
                    ),
                    macros: totalsB,
                    category: mealKind(b.items, totalsB),
                  }
                : null
            }
            sourceControls={
              <select
                aria-label="Tu comida actual"
                value={a.mealId || "custom"}
                onChange={(event) => {
                  const value = event.target.value;
                  if (value === "custom") {
                    setA(emptySlot());
                    setTarget("A");
                    setScreen("compose");
                    return;
                  }
                  const meal = allMeals.find((entry) => entry.id === value);
                  if (meal) {
                    setA(fromMeal(meal));
                    return;
                  }
                  for (const entry of allMeals) {
                    const index = entry.items.findIndex(
                      (_, i) => `${entry.id}:food:${i}` === value,
                    );
                    if (index >= 0) {
                      const next = fromMeal(entry);
                      setA({
                        ...next,
                        mealId: value,
                        label: entry.items[index]!.name,
                        items: [next.items[index]!],
                      });
                      break;
                    }
                  }
                }}
              >
                <option value="custom">Buscar alimento / crear comida</option>
                <optgroup label="Comidas completas">
                  {allMeals.map((meal) => (
                    <option key={meal.id} value={meal.id}>
                      {meal.label}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Alimentos">
                  {allMeals.flatMap((meal) =>
                    meal.items.map((item, index) => (
                      <option
                        key={`${meal.id}:food:${index}`}
                        value={`${meal.id}:food:${index}`}
                      >
                        {item.name}
                      </option>
                    )),
                  )}
                </optgroup>
              </select>
            }
            alternativeControls={
              <ComparisonToolbar
                label="Encontrar comidas"
                active={mode}
                modes={[
                  { id: "similar", label: "Similares" },
                  {
                    id: "macros",
                    label: "Más cercanas en macros",
                    short: "Macros cercanos",
                  },
                  { id: "search", label: "Buscar / crear", icon: "search" },
                ]}
                onSelect={(value) => {
                  if (value === "search") {
                    setTarget("B");
                    setScreen("compose");
                  } else {
                    setMode(value);
                    setScreen("browse");
                  }
                }}
                leading={
                  screen === "compare" &&
                  b.items.length > 0 && (
                    <BackArrowButton
                      label="Elegir otra alternativa"
                      onClick={() => setScreen("browse")}
                    />
                  )
                }
                add={() => {
                  setTarget("B");
                  setScreen("compose");
                }}
              />
            }
            alternativePicker={
              screen === "browse" ? (
                <MealAlternatives
                  compact
                  reference={reference}
                  meals={allMeals}
                  mode={mode}
                  selectedId={b.mealId}
                  onMode={setMode}
                  onSelect={(meal) => {
                    setB(fromMeal(meal));
                    setScreen("compare");
                  }}
                />
              ) : undefined
            }
            sourcePortionControl={
              <button
                type="button"
                className="compact-text-button"
                onClick={() => edit("A")}
              >
                Editar ingredientes
              </button>
            }
            portionControl={
              b.items.length ? (
                <button
                  type="button"
                  className="compact-text-button"
                  onClick={() => edit("B")}
                >
                  Editar ingredientes
                </button>
              ) : (
                <span>Selecciona una opción</span>
              )
            }
          />
          {/* Other options open from Similares / Macros cercanos and adding
              a food from the + above, so only the way back stays here. */}
          {ready && screen === "browse" && (
            <div className="comparison-workspace-actions">
              <button
                type="button"
                className="compact-back"
                onClick={() => setScreen("compare")}
              >
                Volver a la comparación
              </button>
            </div>
          )}
          <p className="comparison-portions-note">
            Porciones aproximadas · revisa ingredientes y alérgenos.
          </p>
          <ComparisonChat
            key={`${a.mealId}-${b.mealId}`}
            source={{
              name: a.label,
              quantityG: a.items.reduce((sum, item) => sum + item.quantityG, 0),
              macros: totalsA,
            }}
            alternative={
              b.items.length
                ? {
                    name: b.label,
                    quantityG: b.items.reduce(
                      (sum, item) => sum + item.quantityG,
                      0,
                    ),
                    macros: totalsB,
                  }
                : null
            }
          />
        </CompactStep>
      ) : (
        <CompactStep key={`${screen}-${target}`}>
          <div className="compact-meal-toolbar">
            <button className="compact-back" type="button" onClick={back}>
              <ArrowLeft size={16} strokeWidth={1.5} />{" "}
              {ready ? "Comparación" : "Opciones"}
            </button>
            <span className="alternative-eyebrow">
              {target === "A" ? "Tu comida" : "Alternativa"} ·{" "}
              {active.items.length}{" "}
              {active.items.length === 1 ? "alimento" : "alimentos"}
            </span>
          </div>
          {screen === "compose" ? (
            <MacroSummary macros={target === "A" ? totalsA : totalsB} />
          ) : (
            <div className="alternative-reference v11-card">
              <div>
                <p className="alternative-eyebrow">Ingredientes y cantidades</p>
                <h3>{active.label}</h3>
              </div>
              <MacroSummary macros={target === "A" ? totalsA : totalsB} />
            </div>
          )}
          {screen === "compose" ? (
            <Composer onAdd={add} />
          ) : (
            <div className="compact-meal-editor">
              {active.items.length ? (
                <ul className="compact-step">
                  {active.items
                    .slice(activePage * 2, activePage * 2 + 2)
                    .map((item) => (
                      <li key={item.key} className="compact-ingredient">
                        <span title={item.name}>{item.name}</span>
                        <label>
                          <span className="sr-only">
                            Cantidad de {item.name} (g)
                          </span>
                          <input
                            type="number"
                            min="0.1"
                            max="5000"
                            step="0.1"
                            defaultValue={item.quantityG}
                            onBlur={(event) => {
                              event.target.value = String(item.quantityG);
                            }}
                            onChange={(event) => {
                              const grams = Number(event.target.value);
                              if (
                                !Number.isFinite(grams) ||
                                grams <= 0 ||
                                grams > 5000
                              )
                                return;
                              setActive({
                                ...active,
                                mealId: "",
                                label: "Tu combinación",
                                items: active.items.map((entry) =>
                                  entry.key === item.key
                                    ? {
                                        ...entry,
                                        quantityG: grams,
                                        macros: scaleMacros(
                                          entry.per100g,
                                          grams,
                                        ),
                                      }
                                    : entry,
                                ),
                              });
                            }}
                          />
                        </label>
                        <small>g</small>
                        <button
                          type="button"
                          aria-label={`Quitar ${item.name}`}
                          onClick={() =>
                            setActive({
                              ...active,
                              mealId: "",
                              label: "Tu combinación",
                              items: active.items.filter(
                                (entry) => entry.key !== item.key,
                              ),
                            })
                          }
                        >
                          <Trash2 size={15} strokeWidth={1.5} />
                        </button>
                      </li>
                    ))}
                </ul>
              ) : (
                <p className="compact-empty">Añade tu primer alimento.</p>
              )}
              <OptionPager
                page={activePage}
                count={active.items.length}
                onPage={setPage}
              />
            </div>
          )}
          <div className="compact-actions">
            <Button
              variant="outline"
              onClick={() => {
                setScreen(screen === "compose" ? "ingredients" : "compose");
                setPage(0);
              }}
            >
              {screen === "compose" ? "Editar cantidades" : "Añadir alimento"}
            </Button>
            <Button
              variant="brand"
              disabled={!active.items.length}
              onClick={() => {
                if (ready) setScreen("compare");
                else if (target === "A") setScreen("browse");
                else {
                  setTarget("A");
                  setScreen("compose");
                }
              }}
            >
              {ready
                ? "Ver comparación"
                : target === "A"
                  ? "Elegir alternativa"
                  : "Elegir comida actual"}
            </Button>
          </div>
        </CompactStep>
      )}
    </div>
  );
}
