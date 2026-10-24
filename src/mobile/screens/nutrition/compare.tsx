"use client";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type CSSProperties,
} from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Check } from "lucide-react";
import { toast } from "sonner";
import {
  getDietItemSwapSuggestions,
  type DietSwapSuggestions,
} from "@/features/dashboard/actions";
import { swapDietItemForDay } from "@/features/nutrition/day-swap-actions";
import type { DietTemplateMealView } from "@/features/dashboard/queries";
import { triggerHaptic } from "@/lib/haptics";
import type { MacroSet } from "@/features/nutrition/lib/macros";
import { Ring } from "@/mobile/ui/display";
import { FoodThumb } from "@/mobile/ui/food-thumb";
import { Sheet } from "@/mobile/ui/sheet";
import { MacroSplitBar } from "./plan-meal";
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
    imageUrl: selected.item.imageUrl,
    foodGroup: selected.item.foodGroup,
    grams: selected.item.quantityG,
    portion: selected.item.servingEquivalence,
    macros: selected.item.macros,
  };
  const sub = alt
    ? {
        name: alt.food.name,
        imageUrl: alt.food.imageUrl ?? null,
        foodGroup: alt.food.foodGroup,
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
        d: sub.macros[m.key] - plan.macros[m.key],
      })).filter((x) => Math.abs(x.d) >= 0.5)
    : [];
  const ganas = resumen
    .filter((x) => x.d > 0)
    .map((x) => `${gramos(x.d)} g de ${x.label}`);
  const pierdes = resumen
    .filter((x) => x.d < 0)
    .map((x) => `${gramos(-x.d)} g de ${x.label}`);

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
    <div className="m-body m-stagger m-compare-screen">
      <button
        type="button"
        className="m-list-row m-press"
        onClick={() => setPickOpen(true)}
      >
        <FoodThumb
          imageUrl={selected.item.imageUrl}
          foodGroup={selected.item.foodGroup}
          size={40}
        />
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
          <ArrowLeftRight size={18} strokeWidth={2.4} aria-hidden="true" />
        </button>
        <CompareSide
          label={flipped ? "En tu plan" : "Sustituto"}
          food={right}
          loading={loading}
        />
      </div>

      {sub && alt && (
        <>
          <p className="m-compare-verdict">
            <strong>
              {porcion(plan)} de {plan.name.toLowerCase()}
            </strong>{" "}
            {plan.grams === 1 ? "equivale" : "equivalen"} a{" "}
            <strong>
              {porcion(sub)} de {sub.name.toLowerCase()}
            </strong>
            {ganas.length === 0 && pierdes.length === 0
              ? ", con casi los mismos macros."
              : ": "}
            {ganas.length > 0 && `ganas ${lista(ganas)}`}
            {ganas.length > 0 && pierdes.length > 0 && " y "}
            {pierdes.length > 0 && `pierdes ${lista(pierdes)}`}
            {(ganas.length > 0 || pierdes.length > 0) && "."}
          </p>

          <div className="m-card m-compare-score" data-size="sm">
            <Ring
              value={(similarity ?? 0) / 100}
              size={56}
              stroke={5}
              label={`${similarity}% de similitud`}
            >
              <span className="m-num">{similarity}</span>
            </Ring>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="m-compare-score-label">
                {parecido(similarity ?? 0)}
              </div>
              <div className="m-sub" style={{ fontSize: 12 }}>
                <span className="m-num">{similarity}%</span> de similitud en
                calorías y macros
              </div>
            </div>
          </div>

          <div className="m-card m-compare-macros" data-size="sm">
            <div className="m-compare-legend" aria-hidden="true">
              <span>
                <i data-kind="plan" /> {flipped ? "Sustituto" : "Plan"}
              </span>
              <span>
                <i data-kind="sub" /> {flipped ? "Plan" : "Sustituto"}
              </span>
            </div>
            {MACROS.map((m) => {
              const a = left!.macros[m.key];
              const b = right!.macros[m.key];
              const d = sub.macros[m.key] - plan.macros[m.key];
              const max = Math.max(a, b, 0.001);
              const igual = Math.abs(d) < 0.5;
              return (
                <div
                  key={m.key}
                  className="m-compare-macro"
                  style={{ "--c": m.color } as CSSProperties}
                >
                  <div className="m-compare-macro-head">
                    <span className="m-macro-name">
                      <span className="m-dot" aria-hidden="true" />
                      {m.label}
                    </span>
                    <span
                      className="m-compare-delta m-num"
                      data-tone={igual ? "same" : d > 0 ? "up" : "down"}
                      aria-label={
                        igual
                          ? "Igual"
                          : `${d > 0 ? "Ganas" : "Pierdes"} ${gramos(Math.abs(d))} gramos`
                      }
                    >
                      {igual ? "=" : d > 0 ? "↑" : "↓"}{" "}
                      {igual ? "igual" : `${gramos(Math.abs(d))} g`}
                    </span>
                  </div>
                  {[
                    { v: a, kind: "plan" },
                    { v: b, kind: "sub" },
                  ].map(({ v, kind }) => (
                    <div key={kind} className="m-compare-bar">
                      <span data-kind={kind}>
                        <span style={{ width: `${(v / max) * 100}%` }} />
                      </span>
                      <span className="m-num">{gramos(v)} g</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {alternatives.length > 1 && (
            <>
              <h2 className="m-section">Otras opciones</h2>
              <div
                className="m-stack"
                style={{ gap: 8 }}
                role="radiogroup"
                aria-label="Sustitutos"
              >
                {alternatives.slice(0, 6).map((c, i) => {
                  const on = c === alt;
                  return (
                    <button
                      key={c.food.id}
                      type="button"
                      role="radio"
                      aria-checked={on}
                      className="m-swap-card m-press"
                      onClick={() => {
                        setIndex(i);
                        setFlipped(false);
                      }}
                    >
                      <FoodThumb
                        imageUrl={c.food.imageUrl}
                        foodGroup={c.food.foodGroup}
                      />
                      <span className="m-list-row-main">
                        <span className="m-list-row-title">{c.food.name}</span>
                        <span className="m-list-row-sub">
                          {c.householdEquivalence
                            ? `${c.householdEquivalence} · `
                            : ""}
                          <span className="m-num">
                            {Math.round(c.suggestedQuantityG)}
                          </span>{" "}
                          g ·{" "}
                          <span className="m-num">
                            {kcal(c.macros.calories)}
                          </span>{" "}
                          kcal
                        </span>
                        <MacroSplitBar macros={c.macros} />
                      </span>
                      <span className="m-swap-card-score">
                        <span className="m-num">
                          {Math.round(c.compatibility.overall * 10)}%
                        </span>
                        <small>similitud</small>
                      </span>
                      <span className="m-swap-card-check" aria-hidden="true">
                        {on && <Check size={14} strokeWidth={3} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          <div className="m-compare-cta">
            <button
              type="button"
              className="m-btn m-press"
              data-variant="primary"
              data-block=""
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
        <div className="m-stack" style={{ gap: 8 }}>
          {options.map(({ meal, item }) => (
            <button
              key={item.id}
              type="button"
              className="m-swap-card m-press"
              role="radio"
              aria-checked={item.id === selectedId}
              onClick={() => {
                setSelectedId(item.id);
                setIndex(0);
                setFlipped(false);
                setPickOpen(false);
              }}
            >
              <FoodThumb imageUrl={item.imageUrl} foodGroup={item.foodGroup} />
              <span className="m-list-row-main">
                <span className="m-list-row-title">{item.foodName}</span>
                <span className="m-list-row-sub">
                  {mealLabel(meal.mealType, meal.name)} ·{" "}
                  <span className="m-num">{Math.round(item.quantityG)}</span> g
                  · <span className="m-num">{kcal(item.macros.calories)}</span>{" "}
                  kcal
                </span>
                <MacroSplitBar macros={item.macros} />
              </span>
              <span className="m-swap-card-check" aria-hidden="true">
                {item.id === selectedId && <Check size={14} strokeWidth={3} />}
              </span>
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

/** «1 taza» si hay porcion casera; si no, «110 g». */
function porcion(f: { grams: number; portion: string | null }) {
  return f.portion ?? `${Math.round(f.grams)} g`;
}

/** «a, b y c». */
function lista(xs: string[]) {
  return xs.length < 2
    ? (xs[0] ?? "")
    : `${xs.slice(0, -1).join(", ")} y ${xs[xs.length - 1]}`;
}

function parecido(pct: number) {
  return pct >= 85 ? "Muy parecido" : pct >= 65 ? "Parecido" : "Diferente";
}

type SideFood = {
  name: string;
  imageUrl: string | null;
  foodGroup: string | null;
  grams: number;
  portion: string | null;
  macros: MacroSet;
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
          <FoodThumb imageUrl={food.imageUrl} foodGroup={food.foodGroup} />
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
