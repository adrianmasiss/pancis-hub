"use client";

import { useEffect, useRef, useState } from "react";
import { Droplet, Minus, Plus } from "lucide-react";
import type { MacroSet } from "../lib/macros";
import { WATER_GLASS_ML } from "../lib/reference-limits";
import { useWater, waterLiters } from "./use-water";
import "./nutrition-summary.css";

/**
 * Resumen del día (elegido entre cuatro variantes, oct 2026): las calorías al
 * frente, con el agua debajo porque son las dos que se TOCAN durante el día,
 * y los macros como lista, que es como se comparan.
 *
 * Cada cifra dice una sola cosa. La barra de calorías distingue lo comido de
 * lo que el plan aún tiene pendiente; los macros llevan su meta y su % y se
 * tiñen de ámbar si se pasan. El color de cada macro vive sólo en su punto y
 * en su barra.
 */

const MACROS = [
  { key: "proteinG", label: "Proteína" },
  { key: "carbohydrateG", label: "Carbohidratos" },
  { key: "fatG", label: "Grasas" },
  { key: "fiberG", label: "Fibra" },
] as const;

const fmt = (n: number) => Math.round(n).toLocaleString("es-419");
const ratio = (value: number, target: number | undefined) =>
  target && target > 0 ? value / target : 0;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** La cifra cuenta hasta el valor nuevo (sólo cuando cambia, no al montar). */
function useCountUp(value: number) {
  const [shown, setShown] = useState(value);
  const from = useRef(value);
  useEffect(() => {
    const start = from.current;
    from.current = value;
    if (start === value) return;
    // Sin movimiento, un solo paso: la cifra salta al valor en el próximo cuadro.
    const duration = window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches
      ? 0
      : 650;
    const t0 = performance.now();
    let frame = 0;
    const step = (now: number) => {
      const p = duration ? Math.min(1, (now - t0) / duration) : 1;
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(start + (value - start) * eased);
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return shown;
}

function Count({ value }: { value: number }) {
  return <>{fmt(useCountUp(value))}</>;
}

export function NutritionSummary({
  consumed,
  targets,
  pending,
  date,
  waterMl,
  waterTargetMl,
}: {
  consumed: MacroSet;
  targets: MacroSet | null;
  pending: MacroSet;
  date: string;
  waterMl: number;
  waterTargetMl: number | null;
}) {
  const calTarget = targets?.calories ?? 0;
  const eaten = ratio(consumed.calories, calTarget);
  const planned = ratio(pending.calories, calTarget);
  const left = calTarget - consumed.calories;
  const percent = Math.round(eaten * 100);

  return (
    <div className="ns">
      {/* Doble bisel: un marco casi invisible con borde especular por fuera
          y la placa negra por dentro, con esquinas concéntricas. */}
      <div
        className="ns-shell"
        data-tone="energy"
        style={{ "--i": 0 } as React.CSSProperties}
      >
        <div className="ns-core ns-energy">
          <header className="ns-head">
            <p className="ns-label">Calorías</p>
            {calTarget > 0 ? (
              <span className="ns-chip" data-over={left < 0 ? "" : undefined}>
                {percent} %
              </span>
            ) : null}
          </header>

          <p className="ns-energy-value nutrition-energy-value">
            <strong>
              <Count value={consumed.calories} />
            </strong>
            <span>{calTarget > 0 ? ` / ${fmt(calTarget)} ` : " "}kcal</span>
          </p>

          <div
            className="ns-energy-bar"
            role="img"
            aria-label={
              calTarget > 0
                ? `${percent} % de la meta; ${fmt(pending.calories)} kcal más en tu plan de hoy`
                : "Sin objetivo configurado"
            }
          >
            <i
              className="ns-seg"
              data-kind="eaten"
              style={{ transform: `scaleX(${clamp01(eaten)})` }}
            />
            {/* Lo pendiente del plan empieza donde acaba lo comido y nunca
              pasa del final de la barra. */}
            <i
              className="ns-seg"
              data-kind="planned"
              style={{
                left: `${clamp01(eaten) * 100}%`,
                width: `${Math.min(clamp01(planned), 1 - clamp01(eaten)) * 100}%`,
              }}
            />
            {[0.25, 0.5, 0.75].map((t) => (
              <span
                key={t}
                className="ns-tick"
                style={{ left: `${t * 100}%` }}
              />
            ))}
          </div>

          <p className="ns-energy-foot">
            <span data-over={left < 0 ? "" : undefined}>
              {calTarget <= 0
                ? "Sin objetivo configurado"
                : left >= 0
                  ? `faltan ${fmt(left)} kcal`
                  : `${fmt(-left)} kcal sobre la meta`}
            </span>
            {pending.calories > 0 ? (
              <span className="ns-planned">
                <i aria-hidden="true" />
                {fmt(pending.calories)} en tu plan
              </span>
            ) : null}
          </p>

          <Water date={date} ml={waterMl} targetMl={waterTargetMl} />
        </div>
      </div>

      <div
        className="ns-shell"
        data-tone="macros"
        style={{ "--i": 1 } as React.CSSProperties}
      >
        <div className="ns-core ns-macros-core">
          <header className="ns-head">
            <p className="ns-label" data-tone="neutral">
              Macronutrientes
            </p>
            <span className="ns-head-note">de tu meta diaria</span>
          </header>
          <ul className="ns-macros" aria-label="Macronutrientes">
            {MACROS.map((m, index) => {
              const target = targets?.[m.key];
              const r = ratio(consumed[m.key], target);
              const over = r > 1;
              return (
                <li
                  key={m.key}
                  className="ns-macro"
                  data-macro={m.key}
                  data-over={over ? "" : undefined}
                  style={{ "--i": index + 2 } as React.CSSProperties}
                >
                  <span className="ns-macro-name">{m.label}</span>
                  <span className="ns-macro-bar" aria-hidden="true">
                    <i style={{ transform: `scaleX(${clamp01(r)})` }} />
                    {r > 0 ? (
                      <b style={{ left: `${clamp01(r) * 100}%` }} />
                    ) : null}
                  </span>
                  <span className="ns-macro-value">
                    <strong>
                      <Count value={consumed[m.key]} />
                    </strong>
                    {target ? <span> / {fmt(target)} g</span> : <span> g</span>}
                  </span>
                  <span className="ns-macro-pct">
                    {target ? `${Math.round(r * 100)} %` : "—"}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

/**
 * El agua como vasos: uno por cada 250 ml de la meta (hasta 12). Se llenan
 * de izquierda a derecha; el que acaba de llenarse rebota apenas.
 */
function Water({
  date,
  ml,
  targetMl,
}: {
  date: string;
  ml: number;
  targetMl: number | null;
}) {
  const w = useWater({ date, ml, targetMl });
  const total = w.hasTarget
    ? Math.min(12, Math.max(1, Math.round(targetMl! / WATER_GLASS_ML)))
    : 8;
  const full = Math.min(total, Math.floor(w.shown / WATER_GLASS_ML));

  return (
    <section className="ns-water" aria-label="Agua">
      <div className="ns-water-row">
        <p className="ns-water-value" aria-live="polite">
          <Droplet size={14} aria-hidden="true" />
          <strong>{waterLiters(w.shown)}</strong>
          <span>{w.hasTarget ? ` / ${waterLiters(targetMl!)} L` : " L"}</span>
        </p>
        <span className="ns-water-actions">
          <button
            type="button"
            onClick={w.undo}
            disabled={w.pending || w.shown <= 0}
            aria-label="Quitar el último registro de agua"
          >
            <Minus size={13} aria-hidden="true" />
          </button>
          <button
            type="button"
            data-add=""
            onClick={() => w.add(WATER_GLASS_ML)}
            disabled={w.pending}
            aria-label={`Sumar un vaso, ${WATER_GLASS_ML} ml`}
          >
            <Plus size={12} aria-hidden="true" />
            {WATER_GLASS_ML}
          </button>
          <button
            type="button"
            data-add=""
            onClick={() => w.add(500)}
            disabled={w.pending}
            aria-label="Sumar una botella, 500 ml"
          >
            <Plus size={12} aria-hidden="true" />
            500
          </button>
        </span>
      </div>
      <ol className="ns-glasses" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <li key={i} data-full={i < full ? "" : undefined} />
        ))}
      </ol>
    </section>
  );
}
