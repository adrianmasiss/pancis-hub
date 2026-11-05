"use client";

import { useOptimistic, useState, useTransition, type ReactNode } from "react";
import { Apple, ChevronDown, Plus, Star, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { toggleFavoriteFood } from "@/features/foods/actions";
import type { LibraryFood } from "@/features/foods/queries";
import { messages } from "@/i18n/es-419";
import { triggerHaptic } from "@/lib/haptics";
import { BackButton } from "@/mobile/ui/back-button";
import { Stepper } from "@/mobile/ui/controls";
import { Bar } from "@/mobile/ui/display";
import { UseTodaySheet, type UseTodayMeal } from "./use-today-sheet";
import { foodFacts, MICROS } from "./food-facts";
import { MACROS, gramos, kcal } from "./format";
import { Haptic } from "@/mobile/ui/haptic";
import { VerifiedBadge } from "@/mobile/ui/verified-badge";

const KCAL_POR_G = { proteinG: 4, carbohydrateG: 4, fatG: 9, fiberG: 0 };

/**
 * De donde salen las calorias: un anillo partido en los colores de cada macro,
 * las kcal en el centro y al lado cada macro con su valor, su parte del total
 * y una barra de esa parte (nov 2026: el usuario quiso el anillo Y las
 * barras, en vez de elegir). La fibra no suma (o casi) kcal: va con su valor,
 * sin porcentaje, y su barra cuenta sobre 10 g. Debajo, en la misma
 * tarjeta, va lo plegable («Más detalle»).
 */
function MacroBreakdown({
  food,
  factor,
  children,
}: {
  food: LibraryFood;
  factor: number;
  children?: ReactNode;
}) {
  const parts = MACROS.map((m) => {
    const g = food[m.key] * factor;
    return { ...m, g, kcal: g * KCAL_POR_G[m.key] };
  });
  const total = parts.reduce((t, p) => t + p.kcal, 0);
  const size = 104;
  const stroke = 11;
  const r = (size - stroke) / 2;
  const len = 2 * Math.PI * r;
  const gap = total > 0 ? 3 : 0;
  let offset = 0;
  return (
    <div className="m-card m-macro-break">
      <div className="m-macro-break-top">
        <div
          className="m-macro-donut"
          role="img"
          aria-label={`${kcal(food.calories * factor)} kcal`}
        >
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={stroke}
              className="m-ring-track"
            />
            {total > 0 &&
              parts
                .filter((p) => p.kcal > 0)
                .map((p) => {
                  const seg = (p.kcal / total) * len;
                  const el = (
                    <circle
                      key={p.key}
                      cx={size / 2}
                      cy={size / 2}
                      r={r}
                      fill="none"
                      stroke={p.color}
                      strokeWidth={stroke}
                      strokeDasharray={`${Math.max(0, seg - gap)} ${len}`}
                      strokeDashoffset={-offset}
                    />
                  );
                  offset += seg;
                  return el;
                })}
          </svg>
          <span className="m-macro-donut-center">
            <span className="m-num">{kcal(food.calories * factor)}</span>
            <small>kcal</small>
          </span>
        </div>
        <ul className="m-macro-legend">
          {parts.map((p) => (
            <li key={p.key}>
              <span className="m-macro-legend-head">
                <span className="m-dot" style={{ background: p.color }} />
                <span className="m-macro-legend-name">{p.label}</span>
                <span className="m-num m-macro-legend-g">
                  {gramos(p.g)} g
                  {p.key !== "fiberG" && total > 0 && (
                    <small> · {Math.round((p.kcal / total) * 100)}%</small>
                  )}
                </span>
              </span>
              <Bar
                value={
                  p.key === "fiberG"
                    ? Math.min(1, p.g / 10)
                    : total > 0
                      ? p.kcal / total
                      : 0
                }
                color={p.color}
              />
            </li>
          ))}
        </ul>
      </div>
      {children}
    </div>
  );
}

/** De donde salen los numeros, dicho para personas. */
function sourceOf(food: LibraryFood): { nombre: string; detalle: string } {
  if (food.isOwn)
    return {
      nombre: "Lo agregaste tú",
      detalle: "Los valores son los que escribiste o escaneaste.",
    };
  switch (food.source) {
    case "USDA FoodData Central":
      if (food.branded)
        return {
          nombre: "USDA FoodData Central",
          detalle:
            "Producto de marca: es la etiqueta que declara el fabricante, recopilada por el Departamento de Agricultura de EE. UU.",
        };
      return {
        nombre: "USDA FoodData Central",
        detalle:
          "Base pública del Departamento de Agricultura de EE. UU., medida en laboratorio.",
      };
    case "Open Food Facts (ODbL)":
      return {
        nombre: "Open Food Facts",
        detalle:
          "Etiqueta del empaque, subida por la comunidad (licencia ODbL).",
      };
    case "Datos demostrativos":
      return {
        nombre: "Datos demostrativos",
        detalle: "Valores de ejemplo para probar la app.",
      };
    default:
      return {
        nombre: food.source ?? "Sin fuente",
        detalle: "No sabemos de dónde salen estos valores.",
      };
  }
}

/** Que tanto fiarse: verificado, estimado o pendiente de revisar. */
function confidenceOf(food: LibraryFood): {
  label: string;
  tone: "ok" | "neutral" | "warn";
  detalle: string;
} {
  if (food.dataIssue)
    return {
      label: "Pendiente",
      tone: "warn",
      detalle: "Sus números no cuadran: está pendiente de revisión.",
    };
  if (food.confirmed)
    return {
      label: "Verificado",
      tone: "ok",
      detalle: "Sin correcciones y sin desacuerdo con otras fuentes.",
    };
  return {
    label: "Estimado",
    tone: "neutral",
    detalle: "Úsalo como aproximación.",
  };
}

/**
 * Ficha de alimento, hermana del detalle de ejercicio: foto arriba, gramos
 * ajustables (con las porciones caseras), la informacion nutricional de esa
 * cantidad junto a la de 100 g, lo que aporta y de donde salen los datos.
 */
export function FoodDetail({
  food,
  date,
  meals,
}: {
  food: LibraryFood;
  date: string;
  /** Comidas del plan de hoy, para «Usar hoy» dentro de una de ellas. */
  meals: UseTodayMeal[];
}) {
  const unit = food.nutritionBasis === "100ml" ? "ml" : "g";
  const portions = (food.portions ?? []).filter((p) => p.grams > 0).slice(0, 4);
  const [grams, setGrams] = useState(
    portions[0] ? Math.round(portions[0].grams) : 100,
  );
  const [, startTransition] = useTransition();
  const [fav, setFav] = useOptimistic(food.isFavorite);
  const [useOpen, setUseOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
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

  // null = el alimento no trae el dato; se dice, no se pone 0.
  // Proteina, carbohidratos y grasas van en la tarjeta de colores; aqui el
  // resto, mas discreto.
  const rows: {
    label: string;
    per100: number | null;
    suffix: string;
    /** Referencia de la barra; `vd` = es un valor diario de la FDA. */
    dv: { ref: number; vd: boolean };
    /** Como los macros: la saturada es grasa y el azucar, carbohidrato. */
    color: string;
  }[] = [
    ...(food.micronutrients?.sat_fat_g !== undefined
      ? [
          {
            label: "Saturada",
            per100: food.micronutrients.sat_fat_g,
            suffix: "g",
            dv: { ref: 20, vd: true },
            color: "var(--m-fat)",
          },
        ]
      : []),
    {
      label: "Azúcar",
      per100: food.sugarG ?? null,
      suffix: "g",
      dv: { ref: 50, vd: false },
      color: "var(--m-carbs)",
    },
    {
      label: "Sodio",
      per100: food.sodiumMg ?? null,
      suffix: "mg",
      dv: { ref: 2300, vd: true },
      color: "var(--m-sodium)",
    },
    ...(food.micronutrients?.cholesterol_mg !== undefined
      ? [
          {
            label: "Colesterol",
            per100: food.micronutrients.cholesterol_mg,
            suffix: "mg",
            dv: { ref: 300, vd: true },
            color: "var(--m-cholesterol)",
          },
        ]
      : []),
  ];
  // Vitaminas y minerales medidos; los que USDA no midió no se listan.
  const micros = MICROS.flatMap((m) => {
    const v = food.micronutrients?.[m.key];
    return v === undefined ? [] : [{ ...m, amount: v * f }];
  });
  const fuente = sourceOf(food);
  const confianza = confidenceOf(food);
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
            <Haptic />
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
          <h1 className="m-active-name">
            {food.name}
            {food.confirmed && <VerifiedBadge size={22} />}
          </h1>
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
          <MacroBreakdown food={food} factor={f}>
            <div className="m-more">
              <button
                type="button"
                className="m-more-toggle m-press"
                aria-expanded={moreOpen}
                aria-controls="m-food-more"
                onClick={() => setMoreOpen(!moreOpen)}
              >
                <span className="m-more-title">Más detalle</span>
                <span className="m-more-hint">
                  {rows.map((r) => r.label).join(", ")}
                </span>
                <ChevronDown
                  size={18}
                  className="m-more-chevron"
                  aria-hidden="true"
                />
              </button>
              <div className="m-more-panel" id="m-food-more" inert={!moreOpen}>
                <div className="m-more-inner">
                  {/* Se vuelve a montar al abrir: las barras se dibujan desde 0
                  con la misma animacion que las de los macros. */}
                  <ul className="m-macro-legend" key={moreOpen ? "on" : "off"}>
                    {rows.map((r) => {
                      const v = r.per100 === null ? null : r.per100 * f;
                      return (
                        <li key={r.label}>
                          <span className="m-macro-legend-head">
                            <span
                              className="m-dot"
                              style={{ background: r.color }}
                            />
                            <span className="m-macro-legend-name">
                              {r.label}
                            </span>
                            {v === null ? (
                              <span className="m-nutri-none">Sin dato</span>
                            ) : (
                              <span className="m-num m-macro-legend-g">
                                {r.suffix === "mg" ? kcal(v) : gramos(v)}{" "}
                                {r.suffix}
                                {r.dv.vd && (
                                  <small>
                                    {" "}
                                    · {Math.round((v / r.dv.ref) * 100)}% VD
                                  </small>
                                )}
                              </span>
                            )}
                          </span>
                          <Bar
                            value={moreOpen && v !== null ? v / r.dv.ref : 0}
                            color={r.color}
                          />
                        </li>
                      );
                    })}
                  </ul>
                  <p className="m-sub">
                    Las barras van contra el valor diario de referencia (FDA);
                    el azúcar, contra el límite de 50 g de azúcares añadidos.
                  </p>
                </div>
              </div>
            </div>
          </MacroBreakdown>
        </section>

        {micros.length > 0 && (
          <section
            className="m-stack"
            style={{ gap: 8 }}
            aria-labelledby="m-food-micros"
          >
            <h2 id="m-food-micros" className="m-eyebrow">
              Vitaminas y minerales
            </h2>
            <div className="m-card m-nutri" data-size="sm" data-quiet="">
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
            Fuente de los datos
          </h2>
          <div className="m-card m-food-source" data-size="sm">
            <div className="m-food-source-head">
              <span className="m-list-row-title">{fuente.nombre}</span>
              <span className="m-tag" data-tone={confianza.tone}>
                {confianza.tone === "ok" && (
                  <VerifiedBadge size={13} decorative />
                )}
                {confianza.label}
              </span>
            </div>
            <p className="m-sub">
              {fuente.detalle} {confianza.detalle}
            </p>
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
          onClick={() => setUseOpen(true)}
        >
          <Plus size={18} aria-hidden="true" />
          {`Usar hoy · ${kcal(food.calories * f)} kcal`}
        </button>
      </div>

      <UseTodaySheet
        open={useOpen}
        onOpenChange={setUseOpen}
        food={food}
        grams={grams}
        unit={unit}
        date={date}
        meals={meals}
      />
    </div>
  );
}
