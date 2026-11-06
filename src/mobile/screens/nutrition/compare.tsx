"use client";

import {
  useEffect,
  useMemo,
  useState,
  useTransition,
  type CSSProperties,
} from "react";
import { useRouter } from "next/navigation";
import { ArrowDownUp, Check, ChevronDown, Search } from "lucide-react";
import { toast } from "sonner";
import {
  getDietItemSwapSuggestions,
  type DietSwapSuggestions,
} from "@/features/dashboard/actions";
import { swapDietItemForDay } from "@/features/nutrition/day-swap-actions";
import type { DietTemplateMealView } from "@/features/dashboard/queries";
import { triggerHaptic } from "@/lib/haptics";
import type { MacroSet } from "@/features/nutrition/lib/macros";
import { FoodThumb } from "@/mobile/ui/food-thumb";
import { Haptic } from "@/mobile/ui/haptic";
import { Sheet } from "@/mobile/ui/sheet";
import { useCountUp } from "@/mobile/ui/use-count-up";
import { compatibilityScore } from "@/features/foods/lib/equivalence";
import { searchFoods } from "@/features/nutrition/actions";
import { Segmented, Stepper } from "@/mobile/ui/controls";
import { useSearch } from "@/mobile/ui/use-search";
import { MacroRing } from "./macro-ring";
import { MACROS, gramos, kcal, mealLabel, per100 } from "./format";

/**
 * Comparar y sustituir (nov 2026, segun la referencia del usuario, pero mas
 * despejada): una tarjeta con la pareja —lo del plan arriba, el sustituto
 * abajo y resaltado—, la similitud en una barra de segmentos, la cantidad del
 * sustituto (arranca en las mismas kcal) y los macros en anillos con lo que
 * cambia. Las otras opciones y la busqueda viven en una hoja, no en la
 * pantalla. «Sustituir» lo cambia SOLO hoy; el plan queda igual.
 */
export function CompareFoods({
  meals,
  date,
  initialItemId,
  targets,
}: {
  meals: DietTemplateMealView[];
  date: string;
  initialItemId: string | null;
  /** Metas del dia: los anillos dicen cuanto de cada una pone el alimento. */
  targets: MacroSet | null;
}) {
  const hasPlan = meals.some((m) => m.items.length > 0);
  const [mode, setMode] = useState<"plan" | "libre">(
    hasPlan ? "plan" : "libre",
  );
  const bar = (context: string | null) => (
    <div className="m-cmp-mode">
      <div style={{ flex: "none" }}>
        <Segmented
          label="Qué comparar"
          value={mode}
          onChange={setMode}
          options={[
            { value: "plan", label: "Desde mi plan" },
            { value: "libre", label: "Libre" },
          ]}
        />
      </div>
      {context && (
        <span className="m-cmp-context">
          de <strong>{context}</strong>
        </span>
      )}
    </div>
  );
  return mode === "plan" ? (
    <PlanCompare
      meals={meals}
      date={date}
      initialItemId={initialItemId}
      targets={targets}
      bar={bar}
    />
  ) : (
    <FreeCompare targets={targets} bar={bar} />
  );
}

/** Un alimento listo para comparar: sus valores por 100 g y su cantidad. */
type Cand = {
  id: string;
  name: string;
  imageUrl: string | null;
  foodGroup: string | null;
  per100: MacroSet;
  /** La cantidad a las mismas kcal (o la del plan). */
  baseG: number;
  /** Porcion casera de `baseG` («1 taza»), si se conoce. */
  portion: string | null;
  /** Similitud del servidor en `baseG`, 0 a 10. Sin ella se calcula aqui. */
  overall: number | null;
};

type SideFood = {
  name: string;
  imageUrl: string | null;
  foodGroup: string | null;
  grams: number;
  portion: string | null;
  macros: MacroSet;
};

type FoodHit = {
  id: string;
  name: string;
  imageUrl: string | null;
  foodGroup: string | null;
  per100: MacroSet;
};

/** Gramos que dan las mismas kcal que `kcalObjetivo`. */
function mismasKcal(per100g: MacroSet, kcalObjetivo: number) {
  return per100g.calories > 0
    ? Math.max(1, Math.round((kcalObjetivo / per100g.calories) * 100))
    : 100;
}

function similitud(
  base: MacroSet,
  cand: Cand,
  grams: number,
  macros: MacroSet,
) {
  const overall =
    cand.overall !== null && Math.round(grams) === Math.round(cand.baseG)
      ? cand.overall
      : compatibilityScore(base, macros).overall;
  return Math.round(overall * 10);
}

/**
 * «Libre»: dos alimentos cualquiera del catalogo, el segundo a las mismas
 * calorias que el primero. Solo informa; no cambia nada del dia.
 */
function FreeCompare({
  targets,
  bar,
}: {
  targets: MacroSet | null;
  bar: (context: string | null) => React.ReactNode;
}) {
  const [a, setA] = useState<FoodHit | null>(null);
  const [b, setB] = useState<FoodHit | null>(null);
  const [gramsA, setGramsA] = useState(100);
  const [searching, setSearching] = useState<"a" | "b" | null>(null);

  const left: SideFood | null = a
    ? { ...a, grams: gramsA, portion: null, macros: per100(a.per100, gramsA) }
    : null;
  const gramsB = left && b ? mismasKcal(b.per100, left.macros.calories) : 100;
  const right: SideFood | null = b
    ? { ...b, grams: gramsB, portion: null, macros: per100(b.per100, gramsB) }
    : null;
  const pct =
    left && right
      ? Math.round(compatibilityScore(left.macros, right.macros).overall * 10)
      : null;

  return (
    <>
      {bar(null)}
      <div className="m-body m-stagger m-cmp">
        <div className="m-card m-cmp-pair">
          <FoodRow
            eyebrow="Alimento A"
            food={left}
            empty="Elige el primero"
            onPress={() => setSearching("a")}
          />
          <FoodRow
            eyebrow="Alimento B"
            food={right}
            empty="Elige con qué compararlo"
            highlight
            swapKey={b?.id}
            onPress={() => setSearching("b")}
          />
        </div>

        {left && right && pct !== null ? (
          <>
            <div className="m-card m-cmp-qty">
              <div className="m-cmp-qty-text">
                <span className="m-eyebrow">Cantidad de A</span>
                <span className="m-cmp-qty-hint">
                  B se ajusta a sus mismas kcal
                </span>
              </div>
              <Stepper
                label={`Gramos de ${left.name}`}
                value={gramsA}
                step={10}
                min={10}
                max={1000}
                unit="g"
                onChange={setGramsA}
              />
            </div>
            <SimilarityMeter pct={pct} />
            <MacroRows
              from={left}
              to={right}
              targets={targets}
              legend="A → B"
              popKey={b?.id ?? ""}
            />
          </>
        ) : (
          <p className="m-cmp-help">
            Elige dos alimentos: el segundo se ajusta a las calorías del primero
            para ver qué cambia en proteína, carbohidratos y grasas.
          </p>
        )}

        <FoodSearchSheet
          open={searching !== null}
          onOpenChange={(o) => !o && setSearching(null)}
          title={searching === "b" ? "Alimento B" : "Alimento A"}
          onPick={(f) => {
            if (searching === "b") setB(f);
            else setA(f);
            setSearching(null);
          }}
        />
      </div>
    </>
  );
}

function PlanCompare({
  meals,
  date,
  initialItemId,
  targets,
  bar,
}: {
  meals: DietTemplateMealView[];
  date: string;
  initialItemId: string | null;
  targets: MacroSet | null;
  bar: (context: string | null) => React.ReactNode;
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
  /* El sustituto elegido: uno de los sugeridos o uno buscado a mano. */
  const [picked, setPicked] = useState<Cand | null>(null);
  /* Gramos del sustituto; null = los de mismas kcal. */
  const [grams, setGrams] = useState<number | null>(null);
  const [flips, setFlips] = useState(0);
  const [pickOpen, setPickOpen] = useState(false);
  const [subOpen, setSubOpen] = useState(false);
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
      <>
        {bar(null)}
        <div className="m-body">
          <div className="m-card">
            <p className="m-sheet-text">
              Cuando tengas un plan con alimentos, aquí encuentras sustitutos a
              calorías parecidas.
            </p>
          </div>
        </div>
      </>
    );
  }

  const loading = data?.id !== selectedId;
  const suggested: Cand[] = ((!loading && data?.result?.alternatives) || [])
    .slice(0, 10)
    .map((alt) => ({
      id: alt.food.id,
      name: alt.food.name,
      imageUrl: alt.food.imageUrl ?? null,
      foodGroup: alt.food.foodGroup,
      per100: alt.food.per100g,
      baseG: alt.suggestedQuantityG,
      portion: alt.householdEquivalence ?? null,
      overall: alt.compatibility.overall,
    }));
  const cand = picked ?? suggested[0] ?? null;
  const plan: SideFood = {
    name: selected.item.foodName,
    imageUrl: selected.item.imageUrl,
    foodGroup: selected.item.foodGroup,
    grams: selected.item.quantityG,
    portion: selected.item.servingEquivalence,
    macros: selected.item.macros,
  };
  const subG = grams ?? (cand ? Math.round(cand.baseG) : 0);
  const sub: SideFood | null = cand
    ? {
        name: cand.name,
        imageUrl: cand.imageUrl,
        foodGroup: cand.foodGroup,
        grams: subG,
        portion: grams === null ? cand.portion : null,
        macros: per100(cand.per100, subG),
      }
    : null;
  const pct = cand && sub ? similitud(plan.macros, cand, subG, sub.macros) : 0;
  const flipped = flips % 2 === 1;
  const mealName = mealLabel(selected.meal.mealType, selected.meal.name);

  const choose = (c: Cand) => {
    setPicked(c);
    setGrams(null);
    setFlips(0);
    setSubOpen(false);
  };

  const apply = () =>
    cand &&
    startTransition(async () => {
      const result = await swapDietItemForDay({
        templateItemId: selected.item.id,
        date,
        quantityG: subG,
        foodId: cand.id,
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      triggerHaptic("success");
      toast.success(
        `Hoy: ${cand.name} en ${mealName.toLowerCase()}. Tu plan no cambia.`,
      );
      router.push("/nutricion");
    });

  const planRow = (
    <FoodRow
      key="plan"
      eyebrow="En tu plan"
      food={plan}
      onPress={() => setPickOpen(true)}
      trail={<ChevronDown size={16} aria-hidden="true" />}
      ariaLabel={`En tu plan: ${plan.name}. Cambiar alimento`}
    />
  );
  const subRow = (
    <FoodRow
      key="sub"
      eyebrow="Sustituto sugerido"
      food={sub}
      empty={loading ? "Buscando sustitutos…" : "Sin sustitutos parecidos"}
      highlight
      swapKey={cand?.id}
    />
  );

  return (
    <>
      {bar(mealName)}
      <div className="m-body m-stagger m-cmp">
        <div className="m-card m-cmp-pair" data-flips={flips || undefined}>
          <div className="m-cmp-pair-top">
            {/* Al intercambiar, cada fila llega desde el lugar de la otra. */}
            <div className="m-cmp-pair-rows" key={flips}>
              {flipped ? [subRow, planRow] : [planRow, subRow]}
            </div>
            <button
              type="button"
              className="m-cmp-flip m-press"
              aria-label="Intercambiar el orden"
              disabled={!sub}
              style={{ "--turns": flips } as CSSProperties}
              onClick={() => setFlips(flips + 1)}
            >
              <Haptic />
              <ArrowDownUp size={16} strokeWidth={2.2} aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            className="m-cmp-search m-press"
            onClick={() => setSubOpen(true)}
          >
            <Search size={16} aria-hidden="true" />
            Buscar otro sustituto…
          </button>
        </div>

        {sub && cand && (
          <>
            <div className="m-card m-cmp-qty">
              <div className="m-cmp-qty-text">
                <span className="m-eyebrow">Cantidad</span>
                {grams === null ? (
                  <span className="m-cmp-qty-hint">
                    Mismas kcal que el plan
                  </span>
                ) : (
                  <button
                    type="button"
                    className="m-cmp-qty-reset"
                    onClick={() => setGrams(null)}
                  >
                    Igualar kcal ({Math.round(cand.baseG)} g)
                  </button>
                )}
              </div>
              <Stepper
                label={`Gramos de ${sub.name}`}
                value={subG}
                step={subG >= 100 ? 10 : 5}
                min={5}
                max={2000}
                unit="g"
                onChange={setGrams}
              />
            </div>
            <SimilarityMeter pct={pct} />
            <MacroRows
              from={flipped ? sub : plan}
              to={flipped ? plan : sub}
              targets={targets}
              legend={flipped ? "Sustituto → Plan" : "Plan → Sustituto"}
              popKey={`${cand.id}-${flips}`}
            />

            <div className="m-cmp-cta">
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
                  : "Sustituir hoy"}
              </button>
              <p className="m-cmp-cta-note">
                {selected.meal.loggedToday
                  ? "Desmárcala para cambiar sus alimentos"
                  : `Solo en ${mealName.toLowerCase()} de hoy · tu plan no cambia`}
              </p>
            </div>
          </>
        )}

        <SubstituteSheet
          open={subOpen}
          onOpenChange={setSubOpen}
          suggested={suggested}
          current={cand?.id ?? null}
          planMacros={plan.macros}
          onPick={choose}
        />

        <Sheet
          open={pickOpen}
          onOpenChange={setPickOpen}
          title="¿Qué alimento quieres cambiar?"
        >
          <div className="m-stack" style={{ gap: 16 }}>
            {meals
              .filter((meal) => options.some((o) => o.meal.id === meal.id))
              .map((meal) => (
                <section
                  key={meal.id}
                  className="m-stack"
                  style={{ gap: 8 }}
                  aria-label={mealLabel(meal.mealType, meal.name)}
                >
                  <h3 className="m-pick-group">
                    {meal.scheduledTime && (
                      <span className="m-num">
                        {meal.scheduledTime.slice(0, 5)} ·{" "}
                      </span>
                    )}
                    {mealLabel(meal.mealType, meal.name)}
                  </h3>
                  {options
                    .filter((o) => o.meal.id === meal.id)
                    .map(({ item }) => (
                      <button
                        key={item.id}
                        type="button"
                        className="m-swap-card m-press"
                        role="radio"
                        aria-checked={item.id === selectedId}
                        onClick={() => {
                          setSelectedId(item.id);
                          setPicked(null);
                          setGrams(null);
                          setFlips(0);
                          setPickOpen(false);
                        }}
                      >
                        <FoodThumb
                          imageUrl={item.imageUrl}
                          foodGroup={item.foodGroup}
                        />
                        <span className="m-list-row-main">
                          <span className="m-list-row-title">
                            {item.foodName}
                          </span>
                          <span className="m-list-row-sub">
                            <span className="m-num">
                              {Math.round(item.quantityG)}
                            </span>{" "}
                            g ·{" "}
                            <span className="m-num">
                              {kcal(item.macros.calories)}
                            </span>{" "}
                            kcal
                          </span>
                        </span>
                        <span className="m-swap-card-check" aria-hidden="true">
                          {item.id === selectedId && (
                            <Check size={14} strokeWidth={3} />
                          )}
                        </span>
                      </button>
                    ))}
                </section>
              ))}
          </div>
        </Sheet>
      </div>
    </>
  );
}

/**
 * Una fila de la pareja. El sustituto (`highlight`) va un punto mas grande y
 * con el borde del acento en la foto; al cambiar de sustituto (`swapKey`) su
 * contenido entra de nuevo, para que se note que es otro.
 */
function FoodRow({
  eyebrow,
  food,
  empty,
  highlight,
  swapKey,
  onPress,
  trail,
  ariaLabel,
}: {
  eyebrow: string;
  food: SideFood | null;
  empty?: string;
  highlight?: boolean;
  swapKey?: string;
  onPress?: () => void;
  trail?: React.ReactNode;
  ariaLabel?: string;
}) {
  const body = (
    <>
      <FoodThumb
        imageUrl={food?.imageUrl}
        foodGroup={food?.foodGroup}
        size={highlight ? 52 : 44}
      />
      <span className="m-cmp-row-main">
        <span className="m-cmp-row-eyebrow">{eyebrow}</span>
        {food ? (
          <>
            <span className="m-cmp-row-name">{food.name}</span>
            <span className="m-cmp-row-meta">
              {food.portion ? `${food.portion} · ` : ""}
              <span className="m-num">{Math.round(food.grams)} g</span> ·{" "}
              <strong className="m-num">{kcal(food.macros.calories)}</strong>{" "}
              kcal
            </span>
          </>
        ) : (
          <span className="m-cmp-row-empty">{empty}</span>
        )}
      </span>
      {trail && <span className="m-cmp-row-trail">{trail}</span>}
    </>
  );
  const props = {
    className: "m-cmp-row",
    "data-highlight": highlight ? "" : undefined,
  };
  return onPress ? (
    <button
      type="button"
      {...props}
      className={`${props.className} m-press`}
      onClick={onPress}
      aria-label={ariaLabel}
    >
      <span className="m-cmp-row-in" key={swapKey}>
        {body}
      </span>
    </button>
  ) : (
    <div {...props}>
      <span className="m-cmp-row-in" key={swapKey}>
        {body}
      </span>
    </div>
  );
}

function parecido(pct: number) {
  return pct >= 85 ? "Muy parecido" : pct >= 65 ? "Parecido" : "Diferente";
}

const SEGMENTOS = 20;

/**
 * El % de similitud con su lectura y una barra de 20 segmentos que se
 * encienden en orden: la barra dice «cuanto» sin otro numero.
 */
function SimilarityMeter({ pct }: { pct: number }) {
  const shown = useCountUp(pct);
  const on = Math.round((pct / 100) * SEGMENTOS);
  return (
    <section className="m-cmp-sim" aria-label={`${pct}% de similitud`}>
      <div className="m-cmp-sim-head">
        <span className="m-cmp-sim-value" aria-hidden="true">
          <span className="m-num">{shown}</span>
          <small>%</small>
        </span>
        <span className="m-cmp-sim-label">{parecido(pct)}</span>
        <span className="m-cmp-sim-unit">similitud</span>
      </div>
      <div className="m-cmp-sim-bar" aria-hidden="true">
        {Array.from({ length: SEGMENTOS }, (_, i) => (
          <i
            key={i}
            data-on={i < on ? "" : undefined}
            style={{ "--i": i } as CSSProperties}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Cada macro en dos anillos —de donde vienes y a donde vas— y lo que cambia.
 * Los anillos dicen cuanto de la meta del dia pone cada uno.
 */
function MacroRows({
  from,
  to,
  targets,
  legend,
  popKey,
}: {
  from: SideFood;
  to: SideFood;
  targets: MacroSet | null;
  legend: string;
  /** Cambia con el sustituto: las diferencias entran de nuevo. */
  popKey: string;
}) {
  return (
    <section className="m-cmp-macros" aria-label="Macros">
      {/* Cada rotulo encima de su columna de anillos. */}
      <div className="m-cmp-macros-head">
        <span className="m-eyebrow">Macros</span>
        <span className="m-cmp-macros-col">{legend.split(" → ")[0]}</span>
        <span />
        <span className="m-cmp-macros-col">{legend.split(" → ")[1]}</span>
        <span />
      </div>
      {MACROS.map((m) => {
        const a = from.macros[m.key];
        const b = to.macros[m.key];
        const d = b - a;
        const igual = Math.abs(d) < 0.5;
        const goal = targets?.[m.key] ?? null;
        return (
          <div
            key={m.key}
            className="m-cmp-macro"
            style={{ "--c": m.color } as CSSProperties}
          >
            <span className="m-cmp-macro-name">
              <span className="m-dot" aria-hidden="true" />
              {m.label}
            </span>
            <MacroRing
              value={a}
              goal={goal}
              color={m.color}
              label={`${m.label}, ${legend.split(" → ")[0]}`}
              size={36}
            />
            <span className="m-cmp-macro-arrow" aria-hidden="true">
              →
            </span>
            <MacroRing
              value={b}
              goal={goal}
              color={m.color}
              label={`${m.label}, ${legend.split(" → ")[1]}`}
              size={36}
            />
            <span
              key={popKey}
              className="m-cmp-delta m-num"
              data-tone={igual ? "same" : d > 0 ? "up" : "down"}
            >
              {igual
                ? "= igual"
                : `${d > 0 ? "+" : "−"}${gramos(Math.abs(d))} g`}
            </span>
          </div>
        );
      })}
    </section>
  );
}

/**
 * Otro sustituto: los sugeridos (a las mismas kcal, con su similitud) y, al
 * escribir, cualquier alimento del catalogo, que tambien se ajusta a las
 * mismas kcal del plan.
 */
function SubstituteSheet({
  open,
  onOpenChange,
  suggested,
  current,
  planMacros,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggested: Cand[];
  current: string | null;
  planMacros: MacroSet;
  onPick: (c: Cand) => void;
}) {
  const [term, setTerm] = useState("");
  const hits = useSearch(term, async (q) => {
    const r = await searchFoods({ term: q });
    if ("error" in r) return null;
    return r.results.map(toHit);
  });
  const list: Cand[] = term.trim()
    ? hits.map((f) => ({
        ...f,
        baseG: mismasKcal(f.per100, planMacros.calories),
        portion: null,
        overall: null,
      }))
    : suggested;

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Otro sustituto">
      <label className="m-search">
        <Search size={18} aria-hidden="true" />
        <span className="sr-only">Buscar alimento</span>
        <input
          type="search"
          placeholder="Buscar en la biblioteca"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </label>
      {!term.trim() && suggested.length > 0 && (
        <h3 className="m-pick-group">Sugeridos a las mismas kcal</h3>
      )}
      <div className="m-stack" style={{ gap: 8 }} role="radiogroup">
        {list.map((c) => {
          const macros = per100(c.per100, c.baseG);
          const pct = similitud(planMacros, c, c.baseG, macros);
          const on = c.id === current;
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={on}
              className="m-swap-card m-press"
              onClick={() => {
                setTerm("");
                onPick(c);
              }}
            >
              <FoodThumb imageUrl={c.imageUrl} foodGroup={c.foodGroup} />
              <span className="m-list-row-main">
                <span className="m-list-row-title">{c.name}</span>
                <span className="m-list-row-sub">
                  <span className="m-num">{Math.round(c.baseG)}</span> g ·{" "}
                  <span className="m-num">{kcal(macros.calories)}</span> kcal
                </span>
              </span>
              <span className="m-swap-card-score">
                <span className="m-num">{pct}%</span>
                <small>similitud</small>
              </span>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

function toHit(f: {
  id: string;
  name: string;
  imageUrl?: string | null;
  foodGroup?: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbohydratePer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
}): FoodHit {
  return {
    id: f.id,
    name: f.name,
    imageUrl: f.imageUrl ?? null,
    foodGroup: f.foodGroup ?? null,
    per100: {
      calories: f.caloriesPer100g,
      proteinG: f.proteinPer100g,
      carbohydrateG: f.carbohydratePer100g,
      fatG: f.fatPer100g,
      fiberG: f.fiberPer100g,
    },
  };
}

/** Buscar un alimento del catalogo, valores por 100 g. */
function FoodSearchSheet({
  open,
  onOpenChange,
  title,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  onPick: (food: FoodHit) => void;
}) {
  const [term, setTerm] = useState("");
  const results = useSearch(term, async (q) => {
    const r = await searchFoods({ term: q });
    if ("error" in r) return null;
    return r.results.map(toHit);
  });
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title}>
      <label className="m-search">
        <Search size={18} aria-hidden="true" />
        <span className="sr-only">Buscar alimento</span>
        <input
          type="search"
          placeholder="Buscar alimento"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </label>
      <div className="m-stack">
        {results.map((f) => (
          <button
            key={f.id}
            type="button"
            className="m-list-row m-press"
            onClick={() => {
              setTerm("");
              onPick(f);
            }}
          >
            <FoodThumb imageUrl={f.imageUrl} foodGroup={f.foodGroup} />
            <span className="m-list-row-main">
              <span className="m-list-row-title">{f.name}</span>
              <span className="m-list-row-sub">
                {kcal(f.per100.calories)} kcal · por 100 g
              </span>
            </span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}
