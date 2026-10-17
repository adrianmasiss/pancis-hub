"use client";

import { useOptimistic, useTransition } from "react";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { triggerHaptic } from "@/lib/haptics";
import { addWater, undoLastWater } from "../water-actions";
import { WATER_GLASS_ML } from "../lib/reference-limits";

const liters = (ml: number) =>
  (ml / 1000).toLocaleString("es-419", {
    maximumFractionDigits: 2,
  });

/**
 * Agua del dia: la cifra, su barra contra la meta de NUT-007 y dos toques
 * (+250 ml el vaso, +500 la botella) para registrar de pie y con prisa. «−» quita el ultimo
 * toque. La cifra cambia al instante (optimista) y se corrige si falla.
 */
export function WaterCard({
  date,
  ml,
  targetMl,
}: {
  date: string;
  ml: number;
  targetMl: number | null;
}) {
  const [pending, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(ml);
  const hasTarget = Boolean(targetMl && targetMl > 0);
  const progress = hasTarget ? Math.min(100, (shown / targetMl!) * 100) : 0;
  const glasses = Math.round(shown / WATER_GLASS_ML);
  const left = hasTarget ? Math.max(0, targetMl! - shown) : 0;

  const add = (amountMl: number) =>
    startTransition(async () => {
      setShown((current) => current + amountMl);
      const result = await addWater({ date, amountMl });
      if (result.error) toast.error(result.error);
      else triggerHaptic("success");
    });
  const undo = () =>
    startTransition(async () => {
      const result = await undoLastWater({ date });
      if (result.error) toast.error(result.error);
    });

  return (
    <div
      className="v11-card nutrition-home-card nutrition-stat nutrition-water"
      data-metric="water"
    >
      <h3>Agua</h3>
      <p className="nutrition-stat-value" aria-live="polite">
        <strong>{liters(shown)}</strong>
        <span>
          {hasTarget ? (
            <span className="nutrition-stat-target">{` / ${liters(targetMl!)}`}</span>
          ) : null}{" "}
          L
        </span>
      </p>
      <div className="nutrition-water-actions">
        <button
          type="button"
          className="nutrition-water-undo"
          onClick={undo}
          disabled={pending || shown <= 0}
          aria-label="Quitar el último registro de agua"
        >
          <Minus size={16} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="nutrition-water-add"
          onClick={() => add(WATER_GLASS_ML)}
          disabled={pending}
          aria-label={`Sumar un vaso, ${WATER_GLASS_ML} ml`}
        >
          <Plus size={13} aria-hidden="true" />
          {WATER_GLASS_ML}
        </button>
        <button
          type="button"
          className="nutrition-water-add"
          data-tone="soft"
          onClick={() => add(500)}
          disabled={pending}
          aria-label="Sumar una botella, 500 ml"
        >
          <Plus size={13} aria-hidden="true" />
          500
        </button>
      </div>
      <div
        className="nutrition-stat-track"
        data-inert={hasTarget ? undefined : ""}
        aria-hidden="true"
      >
        <i style={{ width: `${progress}%` }} />
      </div>
      <p className="nutrition-stat-note">
        {glasses} {glasses === 1 ? "vaso" : "vasos"}
        {hasTarget
          ? left > 0
            ? ` · faltan ${liters(left)} L`
            : " · meta cumplida"
          : " · sin meta configurada"}
      </p>
    </div>
  );
}
