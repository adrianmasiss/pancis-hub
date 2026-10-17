"use client";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { animate, useReducedMotion } from "motion/react";
import { ArrowLeftRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  FocusCard,
  FocusCardContent,
  FocusCardDescription,
  FocusCardHeader,
  FocusCardTitle,
} from "@/components/ui/focus-card";
import type { DietTemplateView } from "@/features/dashboard/queries";
import type { LibraryCardFood } from "../library-types";
import { sourceName } from "../lib/source-agreement";
import { FoodPhoto } from "./food-photo";
import { FoodRow } from "./food-row";
import { QuantityStepper } from "./quantity-stepper";
import {
  convertAmount,
  defaultUnit,
  formatAmount,
  unitsFor,
} from "../lib/units";
import { SourceSeal } from "./source-seal";
import { messages } from "@/i18n/es-419";
import "./food-detail-card.css";

const format = (n: number, decimals = 1) =>
  new Intl.NumberFormat("es-CR", { maximumFractionDigits: decimals }).format(n);
const number = (n: number | null) => (n === null ? "—" : format(n));

/* Una cifra que viaja desde lo que mostraba hasta su valor nuevo. Al abrir
   sale de cero; al cambiar los gramos, parte de la cifra que había en
   pantalla (no de cero, ni del destino), así que escribir rápido encadena
   el movimiento sin saltos. Con movimiento reducido cambia sin más. */
function AnimatedNumber({
  value,
  decimals = 1,
}: {
  value: number;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef(0);
  const reduce = useReducedMotion();
  /* El texto lo escribe sólo este efecto, antes de pintar: si React lo
     pusiera en el render, el valor final se vería un fotograma antes de que
     la animación arrancara desde el anterior. */
  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (reduce) {
      shown.current = value;
      node.textContent = format(value, decimals);
      return;
    }
    node.textContent = format(shown.current, decimals);
    const controls = animate(shown.current, value, {
      duration: 0.55,
      ease: [0.22, 0.61, 0.36, 1],
      onUpdate: (v) => {
        shown.current = v;
        node.textContent = format(v, decimals);
      },
    });
    return () => controls.stop();
  }, [value, decimals, reduce]);
  return <span ref={ref} />;
}

/* La unidad elegida se recuerda por alimento: quien mide la leche en tazas
   la quiere en tazas la próxima vez. Sólo es una comodidad del navegador;
   si no hay almacenamiento, la ficha abre en su unidad por defecto. */
const unitKey = (key: string) => `pancis:unidad:${key}`;
function rememberedUnit(key: string): string | null {
  try {
    return window.localStorage.getItem(unitKey(key));
  } catch {
    return null;
  }
}
function rememberUnit(key: string, id: string) {
  try {
    window.localStorage.setItem(unitKey(key), id);
  } catch {
    /* Sin almacenamiento no se recuerda; no pasa nada más. */
  }
}

const MACROS = [
  { key: "proteinG", label: "Proteína", tone: "protein", kcalPerG: 4 },
  { key: "carbohydrateG", label: "Carbohidratos", tone: "carbs", kcalPerG: 4 },
  { key: "fatG", label: "Grasas", tone: "fat", kcalPerG: 9 },
] as const;

/**
 * La ficha de un alimento, en la tarjeta de foco de la casa.
 *
 * Responde tres preguntas en este orden: qué es (foto, nombre, fuente),
 * cuánta energía da la cantidad que vas a comer, y qué aporta. Los gramos se
 * editan y todo lo que depende de ellos se recalcula y se anima.
 *
 * Las barras miden lo que esa cantidad cubre de los objetivos diarios de tu
 * dieta activa: es la única escala que cambia con la porción y que significa
 * algo para ti. Sin dieta activa no hay objetivo que inventar, y las barras
 * vuelven a medir composición (gramos sobre la porción). El reparto de
 * energía usa los factores de Atwater (4·4·9) y lo dice debajo.
 */
export function FoodDetailCard({
  food,
  diet,
  onClose,
  onUse,
}: {
  food: LibraryCardFood | null;
  diet: DietTemplateView | null;
  onClose: () => void;
  onUse: (food: LibraryCardFood) => void;
}) {
  return (
    <FocusCard
      open={!!food}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      {food && (
        <FocusCardContent className="food-detail">
          <FoodDetailBody food={food} diet={diet} onUse={() => onUse(food)} />
        </FocusCardContent>
      )}
    </FocusCard>
  );
}

function FoodDetailBody({
  food,
  diet,
  onUse,
}: {
  food: LibraryCardFood;
  diet: DietTemplateView | null;
  onUse: () => void;
}) {
  const { macros } = food;
  const basis = food.basis ?? "100g";
  const baseUnit = basis === "100ml" ? "ml" : "g";
  const unitFood = useMemo(
    () => ({
      name: food.name,
      group: food.group,
      basis,
      density: food.density ?? null,
      portions: food.portions ?? [],
    }),
    [food.name, food.group, basis, food.density, food.portions],
  );
  const units = useMemo(() => unitsFor(unitFood), [unitFood]);
  const [measure, setMeasure] = useState(() => {
    const remembered = units.find((u) => u.id === rememberedUnit(food.key));
    const unit = remembered ?? defaultUnit(units, unitFood);
    return { unitId: unit.id, amount: unit.start };
  });
  const unit = units.find((u) => u.id === measure.unitId) ?? units[0]!;
  const amount = measure.amount;
  /* Todo se cuenta en la base de la etiqueta (g o ml): el factor sobre los
     valores por 100 es exacto respecto a la fuente. */
  const base = amount * unit.basePerUnit;
  const factor = base / 100;
  const amountText = formatAmount(unit, amount);
  /* Junto a cualquier unidad que no sea la de la etiqueta, lo que equivale
     en ella. Con «≈» si la conversión es estimada. */
  const equivalence =
    unit.id === baseUnit
      ? null
      : `${unit.approx ? "≈ " : ""}${format(base, 0)} ${baseUnit}`;
  const changeUnit = (id: string) => {
    const next = units.find((u) => u.id === id);
    if (!next) return;
    rememberUnit(food.key, id);
    setMeasure({ unitId: id, amount: convertAmount(unit, next, amount) });
  };
  const scaled = (n: number | null) => (n === null ? null : n * factor);
  const kcal = scaled(macros.calories);
  const targets: Record<string, number | undefined> = diet
    ? {
        proteinG: diet.targetProtein,
        carbohydrateG: diet.targetCarbs,
        fatG: diet.targetFat,
      }
    : {};
  const kcalShare =
    kcal !== null && diet?.targetCalories
      ? Math.round((kcal / diet.targetCalories) * 100)
      : null;
  const subtitle = [
    food.brand,
    food.cookedState ? `Alimento ${food.cookedState}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  /* Reparto de energía: sólo con los tres macros. Con uno ausente, los
     porcentajes de los otros dos serían falsos. */
  const complete = MACROS.every((m) => macros[m.key] !== null);
  const kcalParts = complete
    ? MACROS.map((m) => (macros[m.key] ?? 0) * m.kcalPerG)
    : [];
  const kcalTotal = kcalParts.reduce((a, b) => a + b, 0);
  const shares =
    complete && kcalTotal > 0
      ? kcalParts.map((part) => Math.round((part / kcalTotal) * 100))
      : null;

  /* La fibra no tiene objetivo en la dieta: con dieta activa va como dato
     suelto bajo las barras, en vez de una barra con una escala distinta. */
  const rows = [
    ...MACROS.map((m) => ({
      key: m.key as string,
      label: m.label,
      tone: m.tone as string,
      value: scaled(macros[m.key]),
      target: targets[m.key],
    })),
    ...(diet
      ? []
      : [
          {
            key: "fiberG",
            label: "Fibra",
            tone: "fiber",
            value: scaled(macros.fiberG),
            target: undefined,
          },
        ]),
  ];

  return (
    <>
      <div className="food-detail-hero library-food-photo">
        <FoodPhoto food={food} iconSize={64} />
        <span className="library-food-category">
          {messages.foods.groups[food.group]}
        </span>
      </div>

      <FocusCardHeader className="food-detail-header">
        <FocusCardTitle>{food.name}</FocusCardTitle>
        {subtitle && <p className="food-detail-subtitle">{subtitle}</p>}
        <FocusCardDescription>
          Información nutricional por 100 {baseUnit} · {food.source}
          {food.local?.isCorrected ? " · Corregido por ti" : ""}
        </FocusCardDescription>
      </FocusCardHeader>

      <div className="food-detail-sections">
        <section className="food-detail-energy" aria-label="Energía">
          <Flame
            className="food-detail-flame"
            size={44}
            strokeWidth={1.6}
            aria-hidden="true"
          />
          <div className="food-detail-energy-text">
            <p className="food-detail-kcal">
              {kcal === null ? (
                "—"
              ) : (
                <AnimatedNumber value={kcal} decimals={0} />
              )}{" "}
              <small>
                kcal en {amountText}
                {equivalence && (
                  <span className="food-detail-equivalence">
                    {" "}
                    · {equivalence}
                  </span>
                )}
              </small>
            </p>
            {kcalShare !== null && diet && (
              <p className="food-detail-energy-share">
                <AnimatedNumber value={kcalShare} decimals={0} /> % de tus{" "}
                {format(diet.targetCalories, 0)} kcal del día
              </p>
            )}
          </div>
          <QuantityStepper
            value={amount}
            onChange={(next) => setMeasure({ unitId: unit.id, amount: next })}
            unit={unit}
            units={units}
            onUnitChange={changeUnit}
          />
        </section>

        {shares && (
          <section className="food-detail-block">
            <h3 className="food-detail-kicker">De dónde vienen sus calorías</h3>
            <div
              className="food-detail-split"
              role="img"
              aria-label={MACROS.map(
                (m, i) => `${m.label} ${shares[i]} %`,
              ).join(", ")}
            >
              {MACROS.map((m, i) =>
                (shares[i] ?? 0) > 0 ? (
                  <span
                    key={m.key}
                    data-tone={m.tone}
                    style={{ flexGrow: shares[i] }}
                  />
                ) : null,
              )}
            </div>
            <ul className="food-detail-legend">
              {MACROS.map((m, i) => (
                <li key={m.key} data-tone={m.tone}>
                  <strong>{shares[i]} %</strong> {m.label.toLowerCase()}
                </li>
              ))}
            </ul>
            <p className="food-detail-note">
              Estimado con 4 kcal por gramo de proteína y de carbohidratos, y 9
              por gramo de grasa.
            </p>
          </section>
        )}

        <section className="food-detail-block">
          <h3 className="food-detail-kicker">
            {diet
              ? `Cuánto de tu día ${amount === 1 ? "cubre" : "cubren"} ${amountText}`
              : `Qué hay en ${amountText}`}
          </h3>
          <dl className="food-detail-bars">
            {rows.map((row, i) => {
              /* Con objetivo: porcentaje del objetivo diario. Sin él: gramos
                 (o ml) sobre la porción. Pasarse del 100 % llena la barra y lo dice
                 la cifra; la barra no se sale de su pista. */
              const ratio =
                row.value === null
                  ? null
                  : row.target
                    ? row.value / row.target
                    : row.value / base;
              return (
                <div
                  key={row.key}
                  data-tone={row.tone}
                  data-over={ratio !== null && ratio > 1 ? "" : undefined}
                  style={{ "--i": i } as React.CSSProperties}
                >
                  <dt>{row.label}</dt>
                  <dd>
                    {row.value === null ? (
                      "—"
                    ) : (
                      <AnimatedNumber value={row.value} />
                    )}{" "}
                    <small>
                      g
                      {row.target && ratio !== null && (
                        <>
                          {" · "}
                          <AnimatedNumber
                            value={Math.round(ratio * 100)}
                            decimals={0}
                          />{" "}
                          %
                        </>
                      )}
                    </small>
                  </dd>
                  {/* Un dato ausente deja la pista vacía en vez de un cero. */}
                  <span className="food-detail-track" aria-hidden="true">
                    {ratio !== null && (
                      <span
                        style={{ width: `${Math.min(100, ratio * 100)}%` }}
                      />
                    )}
                  </span>
                </div>
              );
            })}
          </dl>
          {diet && (
            <p className="food-detail-note">
              Fibra:{" "}
              {macros.fiberG === null ? (
                "—"
              ) : (
                <AnimatedNumber value={macros.fiberG * factor} />
              )}{" "}
              g · Objetivos de tu dieta «{diet.name}».
            </p>
          )}
        </section>

        {food.agreement && (
          <section className="food-detail-block library-detail-sources">
            <h3 className="food-detail-kicker">Qué dice cada fuente</h3>
            <SourceSeal agreement={food.agreement} />
            <ul>
              {food.agreement.readings.map((reading) => (
                <li key={`${reading.source}-${reading.externalId}`}>
                  <span>{sourceName(reading.source)}</span>
                  <span>
                    {number(reading.calories)} kcal · P
                    {number(reading.proteinG)} · C
                    {number(reading.carbohydrateG)} · G{number(reading.fatG)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="food-detail-note">
          {food.cookedState
            ? `Valores para el alimento ${food.cookedState}.`
            : "La fuente no especifica si el alimento está crudo o cocido."}{" "}
          Un guion indica un dato no disponible.
        </p>

        {food.local && (
          <details className="food-detail-more">
            <summary>Favoritos y ajustes del alimento</summary>
            <ul>
              <FoodRow food={food.local} />
            </ul>
          </details>
        )}
      </div>

      <div className="food-detail-footer">
        <Button
          variant="brand"
          size="lg"
          className="w-full"
          disabled={!food.canUse}
          onClick={onUse}
        >
          <ArrowLeftRight size={16} /> Usar en mi dieta
        </Button>
        {!food.canUse && (
          <p className="food-detail-note">
            {food.source.includes("IA")
              ? "Estimación IA: solo para consulta."
              : "Faltan datos para calcular una sustitución."}
          </p>
        )}
      </div>
    </>
  );
}
