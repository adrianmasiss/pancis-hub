"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MacroSet } from "@/features/nutrition/lib/macros";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

const v = messages.swap.verdict;
const d = messages.dashboard.nutrition;
const n = messages.nutrition;

type MacroKey = keyof MacroSet;

/** Los cinco ejes del veredicto del handoff, en su orden. */
const AXES: { key: MacroKey; label: string; unit: string }[] = [
  { key: "calories", label: n.kcal, unit: "" },
  { key: "proteinG", label: d.protein, unit: " g" },
  { key: "carbohydrateG", label: d.carbs, unit: " g" },
  { key: "fatG", label: d.fat, unit: " g" },
  { key: "fiberG", label: d.fiber, unit: " g" },
];

/** Lo que el prototipo da por sentado cuando no hay objetivo contra el que medir. */
const HIGHER_IS_BETTER: Record<MacroKey, boolean> = {
  calories: false,
  proteinG: true,
  carbohydrateG: false,
  fatG: false,
  fiberG: true,
};

const fmt = (value: number) =>
  (Math.round(value * 10) / 10).toLocaleString("es-419");

type Direction = "closer" | "farther" | "same";

/**
 * Si el cambio acerca o aleja del objetivo del dia.
 *
 * Aqui el veredicto se separa del prototipo a proposito. El prototipo fija
 * "menos carbohidrato es mejor", que es una opinion sobre la dieta de alguien;
 * este producto tiene el objetivo del dia en la base de datos, asi que puede
 * medir lo unico que importa de verdad: si el cambio te deja mas cerca o mas
 * lejos de lo que tu plan dice. Sin objetivos se cae a la regla del prototipo,
 * y se avisa de que es una regla general y no tu plan.
 */
function directionFor(
  key: MacroKey,
  delta: number,
  consumed?: number,
  target?: number,
): Direction {
  if (Math.abs(delta) < 0.05) return "same";
  if (consumed === undefined || target === undefined || target <= 0) {
    return HIGHER_IS_BETTER[key] === delta > 0 ? "closer" : "farther";
  }
  const before = Math.abs(target - consumed);
  const after = Math.abs(target - (consumed + delta));
  if (Math.abs(after - before) < 0.05) return "same";
  return after < before ? "closer" : "farther";
}

const DIRECTION_CLASS: Record<Direction, string> = {
  closer: "text-positive",
  farther: "text-caution",
  same: "text-subtle-foreground",
};

export type SwapVerdictProps = {
  fromName: string;
  toName: string;
  /** Diferencia alternativa - original, ya calculada por el motor. */
  diff: MacroSet;
  /** Totales y objetivo del dia, para medir el acercamiento real. */
  dayTotals?: MacroSet;
  dayTargets?: MacroSet | null;
  pending?: boolean;
  onConfirm: () => void;
  confirmLabel?: string;
  /** El contenedor puede mantener la confirmación fuera del área desplazable. */
  confirmationInFooter?: boolean;
};

/**
 * El veredicto de una sustitucion, en los tres niveles del handoff: la frase
 * arriba, las cifras debajo y el efecto en el dia al final. El detalle
 * nutriente a nutriente queda plegado, como pide el handoff: la mayoria de las
 * veces la frase basta para decidir.
 */
export function SwapVerdict({
  fromName,
  toName,
  diff,
  dayTotals,
  dayTargets,
  pending = false,
  onConfirm,
  confirmLabel,
  confirmationInFooter = false,
}: SwapVerdictProps) {
  const [detailOpen, setDetailOpen] = useState(false);
  const hasTargets = Boolean(dayTargets && dayTotals);

  // Nivel 1. La frase usa proteina y energia porque son los dos ejes con los
  // que se decide una sustitucion; el resto vive en las cifras de abajo.
  const dp = diff.proteinG;
  const dk = diff.calories;
  const phrase =
    Math.abs(dp) < 0.5 && Math.abs(dk) < 10
      ? v.even(toName)
      : dp > 0
        ? v.gain(toName, fmt(dp), fmt(Math.abs(dk)), dk > 0 ? v.more : v.less)
        : v.loss(fromName, fmt(Math.abs(dp)));

  const energy = dayTotals
    ? {
        before: dayTotals.calories,
        after: dayTotals.calories + diff.calories,
        target: dayTargets?.calories,
      }
    : null;

  return (
    <div className="border-border bg-card-raised/45 flex flex-col gap-4 rounded-[14px] border p-4">
      <p className="text-subtle-foreground text-[10px] font-semibold tracking-[0.14em] uppercase">
        {v.heading}
      </p>

      <p className="text-[15px] leading-[1.55] text-pretty">{phrase}</p>

      {/* Nivel 2. Cinco cifras con signo explicito; el color dice si el cambio
          te acerca al objetivo, no si el numero sube o baja. */}
      {/* Cinco ejes no caben en cinco columnas a 390px: los rotulos se
          truncaban a "Pro…" y "Car…", y el valor se partia en dos lineas. En
          telefono van en filas, que es donde hay ancho; desde `sm` recuperan
          la rejilla del handoff. */}
      <ul className="swap-verdict-axes flex flex-col gap-1.5 sm:grid sm:grid-cols-5">
        {AXES.map((axis) => {
          const delta = diff[axis.key];
          const direction = directionFor(
            axis.key,
            delta,
            dayTotals?.[axis.key],
            dayTargets?.[axis.key],
          );
          const same = direction === "same";
          return (
            <li
              key={axis.key}
              className="border-hairline bg-card flex min-w-0 items-center justify-between gap-2 rounded-[10px] border px-3 py-2 sm:flex-col sm:gap-1 sm:px-2 sm:text-center"
            >
              <span className="text-subtle-foreground min-w-0 truncate text-[12px] sm:text-[10px]">
                {axis.label}
              </span>
              <span
                className={cn(
                  "num shrink-0 text-[13px] font-semibold",
                  DIRECTION_CLASS[direction],
                )}
              >
                {same
                  ? "="
                  : `${delta > 0 ? "+" : "−"}${fmt(Math.abs(delta))}${axis.unit}`}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Nivel 3. El efecto en el dia: la cifra que de verdad cambia. */}
      {energy ? (
        <div className="border-hairline flex flex-col gap-2 border-t pt-3">
          <span className="text-subtle-foreground text-[10px] font-semibold tracking-[0.14em] uppercase">
            {v.dayEffect}
          </span>
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px]">
            <span className="text-muted-foreground">{v.before}</span>
            <span className="num font-medium">
              {Math.round(energy.before).toLocaleString("es-419")}
            </span>
            <span className="text-subtle-foreground">→</span>
            <span className="text-muted-foreground">{v.after}</span>
            <span className="num font-semibold">
              {Math.round(energy.after).toLocaleString("es-419")}
            </span>
            <span className="text-muted-foreground">
              {n.kcal}
              {energy.target
                ? ` · ${v.ofTarget(Math.round(energy.target).toLocaleString("es-419"))}`
                : ""}
            </span>
          </span>
          {!hasTargets ? (
            <p className="text-subtle-foreground text-[12px] leading-relaxed">
              {v.noTargets}
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setDetailOpen((open) => !open)}
          aria-expanded={detailOpen}
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/40 flex items-center gap-1.5 rounded-sm text-[13px] font-medium outline-none focus-visible:ring-2"
        >
          {detailOpen ? v.detailHide : v.detail}
          <ChevronDown
            className={cn(
              "size-3.5 transition-transform duration-[var(--dur-base)]",
              detailOpen && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>

        {!confirmationInFooter && (
          <Button
            type="button"
            variant="brand"
            onClick={onConfirm}
            disabled={pending}
            className="shrink-0"
          >
            {pending ? messages.common.loading : (confirmLabel ?? v.confirm)}
          </Button>
        )}
      </div>

      {detailOpen ? (
        <ul className="border-hairline flex flex-col border-t pt-2">
          {AXES.map((axis) => {
            const delta = diff[axis.key];
            const consumed = dayTotals?.[axis.key];
            const target = dayTargets?.[axis.key];
            const direction = directionFor(axis.key, delta, consumed, target);
            return (
              <li
                key={axis.key}
                className="border-hairline flex items-center justify-between gap-3 border-b py-2 text-[13px] last:border-b-0"
              >
                <span className="text-muted-foreground">{axis.label}</span>
                <span className="flex items-baseline gap-2">
                  {consumed !== undefined ? (
                    <span className="num text-subtle-foreground text-[12px]">
                      {fmt(consumed)} → {fmt(consumed + delta)}
                      {target ? ` / ${fmt(target)}` : ""}
                    </span>
                  ) : null}
                  <span
                    className={cn(
                      "num font-medium",
                      DIRECTION_CLASS[direction],
                    )}
                  >
                    {direction === "same"
                      ? v.same
                      : direction === "closer"
                        ? v.closer
                        : v.farther}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
