"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";
import {
  getDietItemSwapSuggestions,
  type DietSwapSuggestions,
} from "@/features/dashboard/actions";
import { swapDietItemForDay } from "@/features/nutrition/day-swap-actions";
import type { DietTemplateMealView } from "@/features/dashboard/queries";
import { triggerHaptic } from "@/lib/haptics";
import { Sheet } from "@/mobile/ui/sheet";
import { MACROS, gramos, kcal, mealLabel } from "./format";

/**
 * Comparar y sustituir: un alimento del plan frente a un sustituto a
 * calorias parecidas, con la equivalencia en porciones, el % de similitud y
 * la tabla de macros con el cambio de cada uno. «Sustituir» lo cambia SOLO
 * hoy; el plan queda igual.
 */
export function CompareFoods({
  meals,
  date,
  initialItemId,
}: {
  meals: DietTemplateMealView[];
  date: string;
  initialItemId: string | null;
}) {
  const router = useRouter();
  const options = useMemo(
    () =>
      meals.flatMap((meal) =>
        meal.items
          .filter((i) => !i.omitted && i.foodId)
          .map((item) => ({ meal, item })),
      ),
    [meals],
  );
  const firstPending =
    options.find((o) => !o.meal.loggedToday) ?? options[0] ?? null;
  const [selectedId, setSelectedId] = useState(
    options.some((o) => o.item.id === initialItemId)
      ? initialItemId
      : (firstPending?.item.id ?? null),
  );
  const selected = options.find((o) => o.item.id === selectedId) ?? null;
  const [data, setData] = useState<{
    id: string;
    result: DietSwapSuggestions | null;
  } | null>(null);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [pickOpen, setPickOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!selectedId) return;
    let alive = true;
    void getDietItemSwapSuggestions({ templateItemId: selectedId, date }).then(
      (r) => {
        if (!alive) return;
        if ("error" in r) toast.error(r.error);
        setData({ id: selectedId, result: "error" in r ? null : r });
      },
    );
    return () => {
      alive = false;
    };
  }, [selectedId, date]);

  if (!selected) {
    return (
      <div className="m-body">
        <div className="m-card">
          <p className="m-sheet-text">
            Cuando tengas un plan con alimentos, aquí encuentras sustitutos a
            calorías parecidas.
          </p>
        </div>
      </div>
    );
  }

  const loading = data?.id !== selectedId;
  const alternatives = (!loading && data?.result?.alternatives) || [];
  const alt = alternatives[index % Math.max(1, alternatives.length)] ?? null;
  const plan = {
    name: selected.item.foodName,
    grams: selected.item.quantityG,
    portion: selected.item.servingEquivalence,
    macros: selected.item.macros,
  };
  const sub = alt
    ? {
        name: alt.food.name,
        grams: alt.suggestedQuantityG,
        portion: alt.householdEquivalence ?? null,
        macros: alt.macros,
      }
    : null;
  const [left, right] = flipped && sub ? [sub, plan] : [plan, sub];
  const similarity = alt ? Math.round(alt.compatibility.overall * 10) : null;
  const mealName = mealLabel(
    selected.meal.mealType,
    selected.meal.name,
  ).toLowerCase();

  const resumen = sub
    ? MACROS.map((m) => ({
        label: m.label.toLowerCase(),
        d: Math.round(sub.macros[m.key] - plan.macros[m.key]),
      })).filter((x) => x.d !== 0)
    : [];
  const ganas = resumen
    .filter((x) => x.d > 0)
    .map((x) => `${x.d} g de ${x.label}`);
  const pierdes = resumen
    .filter((x) => x.d < 0)
    .map((x) => `${-x.d} g de ${x.label}`);

  const apply = () =>
    alt &&
    startTransition(async () => {
      const result = await swapDietItemForDay({
        templateItemId: selected.item.id,
        date,
        quantityG: alt.suggestedQuantityG,
        foodId: alt.food.id,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      triggerHaptic("success");
      toast.success(`Hoy: ${alt.food.name} en ${mealName}. Tu plan no cambia.`);
      router.push("/nutricion");
    });

  return (
    <div className="m-body m-stagger">
      <button
        type="button"
        className="m-list-row m-press"
        onClick={() => setPickOpen(true)}
      >
        <span className="m-list-row-main">
          <span className="m-list-row-sub">
            Alimento del plan ·{" "}
            {mealLabel(selected.meal.mealType, selected.meal.name)}
          </span>
          <span className="m-list-row-title">{selected.item.foodName}</span>
        </span>
        <span className="m-list-row-trail m-accent-text">Cambiar</span>
      </button>

      <div className="m-compare">
        <CompareSide
          label={flipped ? "Sustituto" : "En tu plan"}
          food={left}
          loading={loading}
        />
        <button
          type="button"
          className="m-compare-flip m-press"
          aria-label="Intercambiar"
          disabled={!sub}
          onClick={() => setFlipped(!flipped)}
        >
          <ArrowLeftRight size={20} strokeWidth={2.4} aria-hidden="true" />
        </button>
        <CompareSide
          label={flipped ? "En tu plan" : "Sustituto"}
          food={right}
          loading={loading}
        />
      </div>

      {sub && (
        <>
          <div
            className="m-card m-row"
            data-size="sm"
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="m-stat-label">Equivalencia</div>
              <div style={{ fontSize: 16, fontWeight: 800 }}>
                {Math.round(plan.grams)} g de {plan.name.toLowerCase()} ≈{" "}
                {sub.portion ?? `${Math.round(sub.grams)} g`}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div
                className="m-num m-accent-text"
                style={{ fontSize: 30, fontWeight: 700, lineHeight: 1 }}
              >
                {similarity}%
              </div>
              <div className="m-stat-label" style={{ fontSize: 11 }}>
                similitud
              </div>
            </div>
          </div>

          <div
            className="m-card m-macro-table"
            data-size="sm"
            role="table"
            aria-label="Macros comparados"
          >
            <div className="m-macro-tr m-eyebrow" role="row">
              <span role="columnheader">Macro</span>
              <span role="columnheader">Plan</span>
              <span role="columnheader">Sust.</span>
              <span role="columnheader">Cambio</span>
            </div>
            {MACROS.map((m) => {
              const d = sub.macros[m.key] - plan.macros[m.key];
              return (
                <div key={m.key} className="m-macro-tr" role="row">
                  <span role="cell" className="m-macro-name">
                    <span
                      className="m-dot"
                      style={{ background: m.color }}
                      aria-hidden="true"
                    />
                    {m.label}
                  </span>
                  <span role="cell" className="m-num">
                    {gramos(plan.macros[m.key])} g
                  </span>
                  <span role="cell" className="m-num">
                    {gramos(sub.macros[m.key])} g
                  </span>
                  <span role="cell">
                    <span className="m-delta m-num">
                      {d > 0 ? "+" : d < 0 ? "−" : ""}
                      {gramos(Math.abs(d))} g
                    </span>
                  </span>
                </div>
              );
            })}
          </div>

          {(ganas.length > 0 || pierdes.length > 0) && (
            <p className="m-sub" style={{ fontSize: 13 }}>
              {ganas.length > 0 && `Ganas ${ganas.join(", ")}`}
              {ganas.length > 0 && pierdes.length > 0 && " y pierdes "}
              {ganas.length === 0 && pierdes.length > 0 && "Pierdes "}
              {pierdes.join(", ")}.
            </p>
          )}

          <div className="m-row">
            <button
              type="button"
              className="m-btn m-press"
              style={{ height: 52, padding: "0 22px" }}
              disabled={alternatives.length < 2}
              onClick={() => {
                setIndex(index + 1);
                setFlipped(false);
              }}
            >
              Otro
            </button>
            <button
              type="button"
              className="m-btn m-press"
              data-variant="primary"
              style={{ flex: 1 }}
              disabled={pending || selected.meal.loggedToday}
              onClick={apply}
            >
              {selected.meal.loggedToday
                ? "Comida ya marcada"
                : `Sustituir en ${mealName}`}
            </button>
          </div>
        </>
      )}

      <Sheet
        open={pickOpen}
        onOpenChange={setPickOpen}
        title="¿Qué alimento quieres cambiar?"
      >
        <div className="m-stack">
          {options.map(({ meal, item }) => (
            <button
              key={item.id}
              type="button"
              className="m-option m-press"
              role="radio"
              aria-checked={item.id === selectedId}
              onClick={() => {
                setSelectedId(item.id);
                setIndex(0);
                setFlipped(false);
                setPickOpen(false);
              }}
            >
              <span className="m-list-row-main">
                <span className="m-list-row-title">{item.foodName}</span>
                <span className="m-list-row-sub">
                  {mealLabel(meal.mealType, meal.name)} ·{" "}
                  {Math.round(item.quantityG)} g
                </span>
              </span>
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

type SideFood = {
  name: string;
  grams: number;
  portion: string | null;
  macros: { calories: number };
};

function CompareSide({
  label,
  food,
  loading,
}: {
  label: string;
  food: SideFood | null;
  loading: boolean;
}) {
  return (
    <div className="m-card m-compare-side" data-size="sm">
      <span className="m-eyebrow">{label}</span>
      {food ? (
        <>
          <span
            className="m-list-row-title"
            style={{ whiteSpace: "normal", fontSize: 17 }}
          >
            {food.name}
          </span>
          <span className="m-sub" style={{ fontSize: 12 }}>
            {[food.portion, `${Math.round(food.grams)} g`]
              .filter(Boolean)
              .join(" · ")}
          </span>
          <span
            className="m-stat-value"
            style={{ fontSize: 26, marginTop: "auto" }}
          >
            {kcal(food.macros.calories)}
            <small>kcal</small>
          </span>
        </>
      ) : (
        <span className="m-sub">
          {loading ? "Buscando…" : "Sin sustitutos parecidos"}
        </span>
      )}
    </div>
  );
}
