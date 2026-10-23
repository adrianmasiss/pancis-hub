"use client";

import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { triggerHaptic } from "@/lib/haptics";
import { addWater, undoLastWater } from "../water-actions";

const liters = (ml: number) =>
  (ml / 1000).toLocaleString("es-419", {
    maximumFractionDigits: 2,
  });

/**
 * Registro de agua del resumen del día: +250 ml el vaso, +500 la botella
 * y «−» quita el último toque. La cifra cambia al instante (optimista) y se
 * corrige si falla.
 */
export function useWater({
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
  return { pending, shown, hasTarget, add, undo };
}

export { liters as waterLiters };
