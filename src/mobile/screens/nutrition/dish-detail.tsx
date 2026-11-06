"use client";

import Link from "next/link";
import { useState, useTransition, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ExternalLink, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { logRestaurantItem } from "@/features/restaurants/actions";
import type {
  RestaurantItem,
  RestaurantItemOption,
  RestaurantSummary,
} from "@/features/restaurants/queries";
import {
  dishFacts,
  dishMacros,
  fitOf,
  type DishMacros,
} from "@/features/restaurants/lib/menu";
import type { MacroSet } from "@/features/nutrition/lib/macros";
import { triggerHaptic } from "@/lib/haptics";
import { BackButton } from "@/mobile/ui/back-button";
import { Segmented, Switch } from "@/mobile/ui/controls";
import { Bar } from "@/mobile/ui/display";
import { useCountUp } from "@/mobile/ui/use-count-up";
import { VerifiedBadge } from "@/mobile/ui/verified-badge";
import { RestaurantAvatar, restaurantHref } from "./eat-out";
import { MACROS, gramos, kcal } from "./format";
import { DishThumb } from "./restaurant-menu";

/** Una comida del plan de hoy que todavia no se registra. */
export type OpenPlanMeal = {
  id: string;
  label: string;
  kcal: number;
};

const PORCIONES = [
  { value: "0.5", label: "½" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
] as const;

const FACT_COLOR = {
  protein: "var(--m-protein)",
  fat: "var(--m-fat)",
  fiber: "var(--m-fiber)",
} as const;

const firmado = (v: number) =>
  `${v > 0 ? "+" : v < 0 ? "−" : ""}${gramos(Math.abs(v))}`;

/** «−45 kcal · −4 g de grasa»: las kcal y el macro que mas cambia. */
function optionDelta(o: RestaurantItemOption) {
  const macros = [
    { v: o.proteinG, n: "proteína" },
    { v: o.carbohydrateG, n: "carbohidratos" },
    { v: o.fatG, n: "grasa" },
    { v: o.fiberG, n: "fibra" },
  ].sort((a, b) => Math.abs(b.v) - Math.abs(a.v));
  const top = macros[0];
  const kc = `${o.calories > 0 ? "+" : o.calories < 0 ? "−" : ""}${kcal(Math.abs(o.calories))} kcal`;
  return top && top.v !== 0 ? `${kc} · ${firmado(top.v)} g de ${top.n}` : kc;
}

/**
 * Ficha de un plato de restaurante (nov 2026, segun la referencia): si cabe
 * en tu dia, que aporta, sus macros contra tu meta, las opciones que publica
 * el restaurante, la porcion, como registrarlo (extra o en lugar de una
 * comida del plan) y como quedaria el dia. Todo se recalcula al tocar.
 */
export function DishDetail({
  restaurant,
  item,
  date,
  consumed,
  targets,
  openPlanMeals,
  suggestedMealId,
  pendingPlanKcal,
}: {
  restaurant: RestaurantSummary;
  item: RestaurantItem;
  date: string;
  /** Lo registrado hoy. */
  consumed: MacroSet;
  targets: MacroSet | null;
  /** Comidas del plan de hoy sin registrar, en orden. */
  openPlanMeals: OpenPlanMeal[];
  /** La que toca ahora (o la proxima): la que se ofrece reemplazar. */
  suggestedMealId: string | null;
  /** Kcal de las comidas del plan que faltan por registrar hoy. */
  pendingPlanKcal: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [optionIds, setOptionIds] = useState<string[]>([]);
  const [portions, setPortions] =
    useState<(typeof PORCIONES)[number]["value"]>("1");
  const [mode, setMode] = useState<"extra" | "plan">("extra");
  const [mealId, setMealId] = useState(
    suggestedMealId ?? openPlanMeals[0]?.id ?? null,
  );
  const [tableOpen, setTableOpen] = useState(false);

  const p = Number(portions);
  const dish = dishMacros(item, optionIds, p);
  const target = targets?.calories ?? null;
  const reemplazada =
    mode === "plan"
      ? (openPlanMeals.find((m) => m.id === mealId) ?? null)
      : null;

  const dishKcal = useCountUp(Math.round(dish?.calories ?? 0));
  const despues =
    target !== null && dish ? target - consumed.calories - dish.calories : null;
  const despuesShown = useCountUp(Math.round(despues ?? 0));

  if (!dish) {
    return (
      <Shell restaurant={restaurant}>
        <div className="m-body">
          <h1 className="m-title" style={{ fontSize: 28 }}>
            {item.name}
          </h1>
          <p className="m-sub">
            Este plato todavía no tiene sus valores. Pídele a la IA que busque
            el menú desde la pantalla del restaurante.
          </p>
        </div>
      </Shell>
    );
  }

  const remaining = target !== null ? target - consumed.calories : null;
  const fit = fitOf(dish.calories, remaining);
  const facts = dishFacts(dish);
  // Como quedaria el plan del dia: lo registrado, este plato y lo que falta
  // del plan (menos la comida que este plato reemplaza).
  const proyectado =
    consumed.calories +
    dish.calories +
    pendingPlanKcal -
    (reemplazada?.kcal ?? 0);

  const proteinaFalta = targets
    ? Math.max(0, targets.proteinG - consumed.proteinG)
    : null;
  const mejorOpcion = item.options
    // Solo vale la pena sugerirla si suma proteina de verdad.
    .filter((o) => !optionIds.includes(o.id) && o.proteinG >= 3)
    .sort((a, b) => b.proteinG - a.proteinG)[0];
  const consejo =
    proteinaFalta === null
      ? null
      : mejorOpcion
        ? `Pídelo con ${mejorOpcion.label.toLowerCase()}: sumas ${gramos(mejorOpcion.proteinG * p)} g de proteína por ${kcal(mejorOpcion.calories * p)} kcal${proteinaFalta > 0 ? ` y te acercas a tu meta de proteína (te faltan ${gramos(proteinaFalta)} g).` : "."}`
        : proteinaFalta <= 0
          ? "Ya cumpliste tu proteína de hoy: aquí solo cuentan las kcal."
          : dish.proteinG >= proteinaFalta
            ? `Con este plato completas tu proteína de hoy (te faltaban ${gramos(proteinaFalta)} g).`
            : `Este plato cubre ${gramos(dish.proteinG)} g de los ${gramos(proteinaFalta)} g de proteína que te faltan hoy.`;

  const registrar = () =>
    startTransition(async () => {
      const r = await logRestaurantItem({
        itemId: item.id,
        date,
        portions: p,
        optionIds,
        insteadOfTemplateMealId: reemplazada?.id,
      });
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      triggerHaptic("success");
      toast.success(
        reemplazada
          ? `${item.name} registrado en lugar de ${reemplazada.label.toLowerCase()}.`
          : `${item.name} sumado a tu día.`,
      );
      router.push("/nutricion");
    });

  const toggleOption = (id: string, on: boolean) =>
    setOptionIds((ids) => (on ? [...ids, id] : ids.filter((x) => x !== id)));

  return (
    <Shell restaurant={restaurant}>
      <div className="m-body m-stagger" style={{ paddingTop: 4, gap: 18 }}>
        <div className="m-dish-hero">
          <DishThumb section={item.section} size={96} />
          {fit && remaining !== null && (
            <span
              key={fit}
              className="m-tag m-dish-fit"
              data-tone={
                fit === "te-pasas" ? "warn" : fit === "justo" ? "neutral" : "ok"
              }
            >
              <span className="m-dot" aria-hidden="true" />
              {fit === "te-pasas"
                ? `Te pasas ${kcal(dish.calories - remaining)} kcal`
                : fit === "justo"
                  ? "Justo para hoy"
                  : "Cabe en tu día"}
            </span>
          )}
        </div>

        <div className="m-stack" style={{ gap: 8 }}>
          <h1 className="m-title m-dish-name">
            {item.name}
            {item.status === "verificado" && <VerifiedBadge size={22} />}
          </h1>
          <p className="m-sub">
            {restaurant.name}
            {item.servingLabel && ` · ${item.servingLabel}`}
          </p>
          {facts.length > 0 && (
            <div className="m-dish-facts">
              {facts.map((f) => (
                <span key={f.label} className="m-dish-fact">
                  <span
                    className="m-dot"
                    style={{ background: FACT_COLOR[f.tone] }}
                    aria-hidden="true"
                  />
                  {f.label}
                </span>
              ))}
            </div>
          )}
        </div>

        <MacroCard
          dish={dish}
          dishKcal={dishKcal}
          portions={p}
          targets={targets}
        >
          <NutritionTable
            item={item}
            dish={dish}
            portions={p}
            withOptions={optionIds.length > 0}
            open={tableOpen}
            onToggle={() => setTableOpen(!tableOpen)}
          />
        </MacroCard>

        {item.options.length > 0 && (
          <section className="m-stack" style={{ gap: 8 }}>
            <h2 className="m-eyebrow">Personaliza</h2>
            <div className="m-card m-dish-options" data-size="sm">
              {item.options.map((o) => (
                <div key={o.id} className="m-dish-option">
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      className="m-list-row-title"
                      style={{ display: "block" }}
                    >
                      {o.label}
                    </span>
                    <span className="m-list-row-sub m-num">
                      {optionDelta(o)}
                    </span>
                  </span>
                  <Switch
                    label={o.label}
                    checked={optionIds.includes(o.id)}
                    onCheckedChange={(on) => toggleOption(o.id, on)}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="m-stack" style={{ gap: 8 }}>
          <h2 className="m-eyebrow">Porción</h2>
          <Segmented
            label="Porción"
            value={portions}
            onChange={setPortions}
            options={PORCIONES}
          />
        </section>

        <section className="m-stack" style={{ gap: 8 }}>
          <h2 className="m-eyebrow">Cómo lo registro</h2>
          {openPlanMeals.length > 0 ? (
            <Segmented
              label="Cómo lo registro"
              value={mode}
              onChange={setMode}
              options={[
                { value: "extra", label: "Como extra" },
                {
                  value: "plan",
                  label:
                    openPlanMeals.length === 1 && openPlanMeals[0]
                      ? `En lugar de ${openPlanMeals[0].label.toLowerCase()}`
                      : "En lugar de una comida",
                },
              ]}
            />
          ) : null}
          {mode === "plan" && openPlanMeals.length > 1 && (
            <div
              className="m-chips-scroll m-dish-meals"
              role="group"
              aria-label="Comida del plan"
            >
              {openPlanMeals.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className="m-filter m-press"
                  aria-pressed={mealId === m.id}
                  onClick={() => {
                    triggerHaptic("selection");
                    setMealId(m.id);
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          )}
          <p className="m-sub m-dish-explain">
            {reemplazada
              ? `Reemplaza ${reemplazada.label.toLowerCase()} del plan (${kcal(reemplazada.kcal)} kcal) y la cuenta como hecha.`
              : `Se suma a lo que ya llevas (${kcal(consumed.calories)} kcal).`}
            {target !== null &&
              ` Tu plan de hoy quedaría en ${kcal(proyectado)} kcal, con meta de ${kcal(target)}.`}
          </p>
        </section>

        {target !== null && despues !== null && (
          <AfterCard
            despues={despues}
            shown={despuesShown}
            consumed={consumed.calories}
            dish={dish.calories}
            target={target}
          />
        )}

        {consejo && (
          <Link
            href={`/asistente?q=${encodeURIComponent(
              `Voy a pedir ${item.name} en ${restaurant.name}. ¿Cómo lo ajusto a lo que me queda hoy?`,
            )}`}
            className="m-copilot-card m-press"
          >
            <span className="m-copilot-icon" aria-hidden="true">
              <Sparkles size={16} />
            </span>
            <span className="m-copilot-sub" style={{ flex: 1, marginTop: 0 }}>
              {consejo}
            </span>
          </Link>
        )}

        <p className="m-sub m-rest-note">
          {item.status === "verificado"
            ? "Valores de la tabla oficial del restaurante, revisados."
            : (item.sourceNote ?? "Valores estimados.")}
          {item.sourceUrl && (
            <>
              {" "}
              <a href={item.sourceUrl} target="_blank" rel="noreferrer">
                Ver fuente
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            </>
          )}
        </p>
      </div>

      <div className="m-step-foot">
        <button
          type="button"
          className="m-btn m-press"
          data-variant="primary"
          disabled={pending}
          onClick={registrar}
        >
          {pending
            ? "Guardando…"
            : `Registrar en mi día · ${kcal(dish.calories)} kcal`}
        </button>
      </div>
    </Shell>
  );
}

function Shell({
  restaurant,
  children,
}: {
  restaurant: RestaurantSummary;
  children: React.ReactNode;
}) {
  return (
    <div className="m-screen" data-m-fullscreen="" style={{ paddingBottom: 0 }}>
      <div className="m-step-head">
        <BackButton fallback={restaurantHref(restaurant.id)} />
        <span className="m-dish-head">
          <RestaurantAvatar
            name={restaurant.name}
            logoUrl={restaurant.logoUrl}
            size={28}
          />
          <span className="m-sub">{restaurant.name}</span>
        </span>
      </div>
      {children}
    </div>
  );
}

/** Kcal grandes y cada macro con su barra contra la meta del dia. */
function MacroCard({
  dish,
  dishKcal,
  portions,
  targets,
  children,
}: {
  dish: DishMacros;
  dishKcal: number;
  portions: number;
  targets: MacroSet | null;
  /** Al pie, la tabla nutricional plegada. */
  children?: React.ReactNode;
}) {
  // La descripcion de la porcion ya va bajo el nombre: aqui solo cuantas.
  const porcion =
    portions === 1
      ? "1 porción"
      : portions === 0.5
        ? "½ porción"
        : `${portions} porciones`;
  return (
    <div className="m-card m-dish-macros">
      <div className="m-dish-macros-head">
        <span className="m-dish-kcal">
          <span className="m-num">{kcal(dishKcal)}</span>
          <small>kcal</small>
        </span>
        <span className="m-sub m-num">
          {porcion}
          {targets && targets.calories > 0 && (
            <>
              {" "}
              · {Math.round((dish.calories / targets.calories) * 100)} % de tu
              meta
            </>
          )}
        </span>
      </div>
      <ul className="m-dish-macro-rows">
        {MACROS.map((m) => {
          const meta = targets?.[m.key] ?? 0;
          return (
            <li key={m.key}>
              <span
                className="m-dot"
                style={{ background: m.color }}
                aria-hidden="true"
              />
              <span className="m-dish-macro-name">{m.label}</span>
              <Bar value={meta > 0 ? dish[m.key] / meta : 0} color={m.color} />
              <span className="m-num m-dish-macro-g">
                {gramos(dish[m.key])}
                <small>g</small>
              </span>
            </li>
          );
        })}
      </ul>
      {targets && (
        <p className="m-sub m-dish-macros-foot">
          Las barras, contra tu meta del día.
        </p>
      )}
      {children}
    </div>
  );
}

/** Lo que quedaria del dia: lo comido y este plato sobre la meta. */
function AfterCard({
  despues,
  shown,
  consumed,
  dish,
  target,
}: {
  despues: number;
  shown: number;
  consumed: number;
  dish: number;
  target: number;
}) {
  const a = Math.min(1, consumed / target);
  const b = Math.min(1 - a, dish / target);
  return (
    <div
      className="m-card m-dish-after"
      data-over={despues < 0 ? "" : undefined}
    >
      <div className="m-row" style={{ justifyContent: "space-between" }}>
        <span className="m-list-row-title">
          {despues < 0 ? "Te pasarías por" : "Después te quedarían"}
        </span>
        <span className="m-dish-after-value">
          <span className="m-num">{kcal(Math.abs(shown))}</span>
          <small>kcal</small>
        </span>
      </div>
      <div
        className="m-dish-track"
        role="img"
        aria-label={`Ya consumido ${kcal(consumed)} kcal, este plato ${kcal(dish)} kcal, meta ${kcal(target)} kcal`}
      >
        <span
          className="m-dish-track-a"
          style={{ "--k": a } as CSSProperties}
        />
        <span
          className="m-dish-track-b"
          style={{ "--k": b, "--x": a } as CSSProperties}
        />
      </div>
      <div className="m-dish-legend">
        <span>
          <span className="m-dot" data-tone="consumed" aria-hidden="true" />
          Ya consumido · <span className="m-num">{kcal(consumed)}</span>
        </span>
        <span>
          <span className="m-dot" data-tone="dish" aria-hidden="true" />
          Este plato · <span className="m-num">{kcal(dish)}</span>
        </span>
      </div>
    </div>
  );
}

/**
 * La tabla nutricional de la porcion elegida, plegada al pie de la tarjeta
 * como «Más detalle» en la ficha de alimento: mismas filas, puntos de color
 * y barras, aqui contra el valor diario de referencia de la FDA. Lo que la
 * tabla del restaurante no publica no se lista (no se pone 0).
 */
function NutritionTable({
  item,
  dish,
  portions,
  withOptions,
  open,
  onToggle,
}: {
  item: RestaurantItem;
  dish: DishMacros;
  portions: number;
  withOptions: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const extra = (v: number | null) => (v === null ? null : v * portions);
  const filas = (
    [
      {
        label: "Energía",
        v: dish.calories,
        unit: "kcal",
        vd: 2000,
        color: "var(--m-accent)",
      },
      {
        label: "Proteína",
        v: dish.proteinG,
        unit: "g",
        vd: 50,
        color: "var(--m-protein)",
      },
      {
        label: "Carbohidratos",
        v: dish.carbohydrateG,
        unit: "g",
        vd: 275,
        color: "var(--m-carbs)",
      },
      {
        label: "Azúcar",
        v: extra(item.sugarG),
        unit: "g",
        vd: 50,
        color: "var(--m-carbs)",
        sub: true,
      },
      {
        label: "Grasas",
        v: dish.fatG,
        unit: "g",
        vd: 78,
        color: "var(--m-fat)",
      },
      {
        label: "Saturada",
        v: extra(item.satFatG),
        unit: "g",
        vd: 20,
        color: "var(--m-fat)",
        sub: true,
      },
      {
        label: "Fibra",
        v: dish.fiberG,
        unit: "g",
        vd: 28,
        color: "var(--m-fiber)",
      },
      {
        label: "Sodio",
        v: extra(item.sodiumMg),
        unit: "mg",
        vd: 2300,
        color: "var(--m-sodium)",
      },
    ] as const
  ).filter((f) => f.v !== null) as {
    label: string;
    v: number;
    unit: string;
    vd: number;
    color: string;
    sub?: boolean;
  }[];
  const faltan = [
    item.satFatG === null && "grasa saturada",
    item.sugarG === null && "azúcar",
    item.sodiumMg === null && "sodio",
  ].filter(Boolean) as string[];
  const porcion = `${item.servingLabel ?? "1 porción"}${
    item.servingG ? ` · ${gramos(item.servingG * portions)} g` : ""
  }${portions !== 1 ? ` × ${portions === 0.5 ? "½" : portions}` : ""}`;

  return (
    <div className="m-more">
      <button
        type="button"
        className="m-more-toggle m-press"
        aria-expanded={open}
        aria-controls="m-dish-table"
        onClick={onToggle}
      >
        <span className="m-more-title">Tabla nutricional</span>
        <span className="m-more-hint">
          {filas
            .slice(3)
            .map((f) => f.label)
            .join(", ")}
        </span>
        <ChevronDown size={18} className="m-more-chevron" aria-hidden="true" />
      </button>
      <div className="m-more-panel" id="m-dish-table" inert={!open}>
        <div className="m-more-inner">
          <p className="m-sub m-num">{porcion}</p>
          {/* Se vuelve a montar al abrir: las barras se dibujan desde 0. */}
          <ul className="m-macro-legend" key={open ? "on" : "off"}>
            {filas.map((f) => (
              <li key={f.label} data-sub={f.sub ? "" : undefined}>
                <span className="m-macro-legend-head">
                  <span className="m-dot" style={{ background: f.color }} />
                  <span className="m-macro-legend-name">{f.label}</span>
                  <span className="m-num m-macro-legend-g">
                    {f.unit === "g" ? gramos(f.v) : kcal(f.v)} {f.unit}
                    <small> · {Math.round((f.v / f.vd) * 100)}% VD</small>
                  </span>
                </span>
                <Bar value={open ? f.v / f.vd : 0} color={f.color} />
              </li>
            ))}
          </ul>
          <p className="m-sub">
            Las barras van contra el valor diario de referencia (FDA), con una
            dieta de 2.000 kcal.
            {faltan.length > 0 &&
              ` La tabla del restaurante no trae ${faltan.join(", ").replace(/, ([^,]*)$/, " ni $1")}.`}
            {withOptions &&
              item.satFatG !== null &&
              " La saturada, el azúcar y el sodio no cuentan las opciones."}
          </p>
        </div>
      </div>
    </div>
  );
}
