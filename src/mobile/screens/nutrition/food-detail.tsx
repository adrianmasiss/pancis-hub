"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Apple, BadgeCheck, Plus, Star, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { toggleFavoriteFood } from "@/features/foods/actions";
import { logMeal } from "@/features/nutrition/actions";
import type { LibraryFood } from "@/features/foods/queries";
import { messages } from "@/i18n/es-419";
import { triggerHaptic } from "@/lib/haptics";
import { BackButton } from "@/mobile/ui/back-button";
import { Stepper } from "@/mobile/ui/controls";
import { foodFacts, MICROS } from "./food-facts";
import { gramos, kcal } from "./format";

/**
 * Ficha de alimento, hermana del detalle de ejercicio: foto arriba, gramos
 * ajustables (con las porciones caseras), la informacion nutricional de esa
 * cantidad junto a la de 100 g, lo que aporta y de donde salen los datos.
 */
export function FoodDetail({
  food,
  date,
}: {
  food: LibraryFood;
  date: string;
}) {
  const unit = food.nutritionBasis === "100ml" ? "ml" : "g";
  const portions = (food.portions ?? []).filter((p) => p.grams > 0).slice(0, 4);
  const [grams, setGrams] = useState(
    portions[0] ? Math.round(portions[0].grams) : 100,
  );
  const [pending, startTransition] = useTransition();
  const [fav, setFav] = useOptimistic(food.isFavorite);
  const f = grams / 100;
  const group =
    messages.foods.groups[food.foodGroup as keyof typeof messages.foods.groups];

  const toggleFav = () =>
    startTransition(async () => {
      setFav(!fav);
      triggerHaptic("selection");
      const r = await toggleFavoriteFood({ foodId: food.id });
      if ("error" in r) toast.error(r.error);
    });

  const logToday = () =>
    startTransition(async () => {
      const r = await logMeal({
        date,
        mealType: "snack",
        name: food.name,
        items: [{ foodId: food.id, quantityG: grams }],
      });
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      triggerHaptic("success");
      toast.success(`${food.name} sumado a hoy.`);
    });

  // null = el alimento no trae el dato; se dice, no se pone 0.
  const rows: { label: string; per100: number | null; suffix: string }[] = [
    { label: "Proteína", per100: food.proteinG, suffix: "g" },
    { label: "Carbohidratos", per100: food.carbohydrateG, suffix: "g" },
    { label: "Grasas", per100: food.fatG, suffix: "g" },
    ...(food.micronutrients?.sat_fat_g !== undefined
      ? [
          {
            label: "Saturada",
            per100: food.micronutrients.sat_fat_g,
            suffix: "g",
          },
        ]
      : []),
    { label: "Fibra", per100: food.fiberG, suffix: "g" },
    { label: "Azúcar", per100: food.sugarG ?? null, suffix: "g" },
    { label: "Sodio", per100: food.sodiumMg ?? null, suffix: "mg" },
    ...(food.micronutrients?.cholesterol_mg !== undefined
      ? [
          {
            label: "Colesterol",
            per100: food.micronutrients.cholesterol_mg,
            suffix: "mg",
          },
        ]
      : []),
  ];
  // Vitaminas y minerales medidos; los que USDA no midió no se listan.
  const micros = MICROS.flatMap((m) => {
    const v = food.micronutrients?.[m.key];
    return v === undefined ? [] : [{ ...m, amount: v * f }];
  });
  // Con números que no se sostienen, sacar conclusiones sería engañar.
  const facts = food.dataIssue ? [] : foodFacts(food);

  return (
    <div className="m-active" data-m-fullscreen="">
      <div className="m-active-hero" style={{ height: 280 }}>
        {food.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- foto del catalogo
          <img src={food.imageUrl} alt="" className="m-active-photo" />
        ) : (
          <div className="m-active-placeholder" aria-hidden="true">
            <Apple size={40} strokeWidth={1.5} />
          </div>
        )}
        <div className="m-active-fade" aria-hidden="true" />
        <div className="m-active-top">
          <BackButton fallback="/nutricion?vista=biblioteca" glass />
          <button
            type="button"
            className="m-icon-btn m-press"
            data-glass=""
            aria-pressed={fav}
            aria-label={fav ? "Quitar de favoritos" : "Agregar a favoritos"}
            onClick={toggleFav}
          >
            <Star
              size={20}
              aria-hidden="true"
              className={fav ? "m-accent-text" : undefined}
              fill={fav ? "currentColor" : "none"}
            />
          </button>
        </div>
        <div className="m-active-title">
          <div className="m-sub">Biblioteca · {group ?? "Alimento"}</div>
          <h1 className="m-active-name">{food.name}</h1>
          {food.brand && <div className="m-sub">{food.brand}</div>}
        </div>
      </div>

      <div className="m-body m-stagger" style={{ paddingTop: 14, gap: 18 }}>
        {food.dataIssue && (
          <div className="m-notice" data-tone="warn" role="status">
            <TriangleAlert
              size={16}
              aria-hidden="true"
              style={{ flex: "none" }}
            />
            {food.dataIssue === "macros_imposibles"
              ? "Esta etiqueta trae valores imposibles por 100 g (probablemente son por porción). No la uses sin revisarla."
              : "Las calorías de esta etiqueta no cuadran con sus macros. Revísala antes de usarla."}
          </div>
        )}
        <section className="m-stack" style={{ gap: 10 }} aria-label="Cantidad">
          <div className="m-row" style={{ justifyContent: "space-between" }}>
            <Stepper
              label={`Cantidad de ${food.name}`}
              value={grams}
              step={10}
              min={10}
              max={2000}
              unit={unit}
              onChange={setGrams}
            />
            <div className="m-stat" style={{ alignItems: "flex-end" }}>
              <span className="m-stat-value">
                {kcal(food.calories * f)}
                <small>kcal</small>
              </span>
              <span className="m-stat-label">
                {kcal(food.calories)} por 100 {unit}
              </span>
            </div>
          </div>
          {portions.length > 0 && (
            <div className="m-food-portions">
              <button
                type="button"
                className="m-chip-toggle m-press"
                aria-pressed={grams === 100}
                onClick={() => setGrams(100)}
              >
                100 {unit}
              </button>
              {portions.map((p) => {
                const g = Math.round(p.grams);
                return (
                  <button
                    key={p.label}
                    type="button"
                    className="m-chip-toggle m-press"
                    aria-pressed={grams === g}
                    onClick={() => setGrams(g)}
                  >
                    {p.label} · {g} {unit}
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section
          className="m-stack"
          style={{ gap: 8 }}
          aria-labelledby="m-food-nutri"
        >
          <h2 id="m-food-nutri" className="m-section">
            Información nutricional
          </h2>
          <div className="m-card m-nutri" data-size="sm">
            <div className="m-nutri-row" data-head="">
              <span />
              <span>
                {grams} {unit}
              </span>
              <span>100 {unit}</span>
            </div>
            <div className="m-nutri-row" data-strong="">
              <span>Calorías</span>
              <span>{kcal(food.calories * f)} kcal</span>
              <span>{kcal(food.calories)}</span>
            </div>
            {rows.map((r) => (
              <div key={r.label} className="m-nutri-row">
                <span>{r.label}</span>
                {r.per100 === null ? (
                  <span className="m-nutri-none">Sin dato</span>
                ) : (
                  <span>
                    {r.suffix === "mg"
                      ? kcal(r.per100 * f)
                      : gramos(r.per100 * f)}{" "}
                    {r.suffix}
                  </span>
                )}
                <span>
                  {r.per100 === null
                    ? "—"
                    : r.suffix === "mg"
                      ? kcal(r.per100)
                      : gramos(r.per100)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {micros.length > 0 && (
          <section
            className="m-stack"
            style={{ gap: 8 }}
            aria-labelledby="m-food-micros"
          >
            <h2 id="m-food-micros" className="m-section">
              Vitaminas y minerales
            </h2>
            <div className="m-card m-nutri" data-size="sm">
              <div className="m-nutri-row" data-head="">
                <span />
                <span>
                  {grams} {unit}
                </span>
                <span>% VD</span>
              </div>
              {micros.map((m) => (
                <div key={m.key} className="m-nutri-row">
                  <span>{m.label}</span>
                  <span>
                    {m.amount >= 10 ? kcal(m.amount) : gramos(m.amount)}{" "}
                    {m.unit}
                  </span>
                  <span>{Math.round((m.amount / m.dv) * 100)} %</span>
                </div>
              ))}
            </div>
            <p className="m-sub">
              % del valor diario de referencia para adultos (FDA).
            </p>
          </section>
        )}

        {facts.length > 0 && (
          <section
            className="m-stack"
            style={{ gap: 10 }}
            aria-labelledby="m-food-facts"
          >
            <h2 id="m-food-facts" className="m-section">
              Qué aporta y qué no
            </h2>
            <div className="m-food-portions">
              {facts.map((x) => (
                <span key={x.text} className="m-tag" data-tone={x.tone}>
                  {x.text}
                </span>
              ))}
            </div>
            <p className="m-sub">Según los umbrales de etiquetado por 100 g.</p>
          </section>
        )}

        <section
          className="m-stack"
          style={{ gap: 6 }}
          aria-labelledby="m-food-source"
        >
          <h2 id="m-food-source" className="m-section">
            De dónde sale
          </h2>
          <p className="m-sheet-text">
            {food.isOwn ? "Lo agregaste tú" : (food.source ?? "Sin fuente")}
          </p>
          <div className="m-food-portions">
            {food.verified && !food.dataIssue && (
              <span className="m-tag" data-tone="ok">
                <BadgeCheck size={12} aria-hidden="true" />
                Verificado
              </span>
            )}
            {food.isCorrected && (
              <span className="m-tag" data-tone="neutral">
                Corregido por ti
              </span>
            )}
          </div>
        </section>
      </div>

      <div className="m-active-spacer" />
      <div className="m-step-foot">
        <button
          type="button"
          className="m-btn m-press"
          data-variant="primary"
          disabled={pending}
          onClick={logToday}
        >
          <Plus size={18} aria-hidden="true" />
          {pending ? "Sumando…" : `Usar hoy · ${kcal(food.calories * f)} kcal`}
        </button>
      </div>
    </div>
  );
}
