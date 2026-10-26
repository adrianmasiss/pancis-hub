"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Clock } from "lucide-react";
import { toast } from "sonner";
import { logMeal } from "@/features/nutrition/actions";
import type { LibraryFood } from "@/features/foods/queries";
import { triggerHaptic } from "@/lib/haptics";
import { Stepper } from "@/mobile/ui/controls";
import { Sheet } from "@/mobile/ui/sheet";
import { TimeWheelSheet } from "./day-sheets";
import { mealTypeAt } from "./extra-sheet";
import { kcal } from "./format";

/** Una comida del plan de hoy a la que se puede sumar el alimento. */
export type UseTodayMeal = {
  id: string;
  name: string;
  time: string | null;
};

const NUEVA = "nueva";

/**
 * «Usar hoy» desde la ficha: a que comida va (como extra de una comida del
 * plan) o como comida nueva con su hora, y cuanto. El plan no cambia.
 */
export function UseTodaySheet({
  open,
  onOpenChange,
  food,
  grams: initialGrams,
  unit,
  date,
  meals,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  food: LibraryFood;
  grams: number;
  unit: string;
  date: string;
  meals: UseTodayMeal[];
}) {
  const router = useRouter();
  const [dest, setDest] = useState<string>(meals[0]?.id ?? NUEVA);
  const [grams, setGrams] = useState(initialGrams);
  const [hora, setHora] = useState("12:00");
  const [horaOpen, setHoraOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  // Al abrir, la cantidad es la que se estaba viendo en la ficha.
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setGrams(initialGrams);
  }

  const meal = meals.find((m) => m.id === dest) ?? null;

  const save = () =>
    startTransition(async () => {
      const items = [{ foodId: food.id, quantityG: grams }];
      const r = await logMeal(
        meal
          ? {
              date,
              mealType: "snack",
              name: food.name.slice(0, 80),
              scheduledTime: meal.time?.slice(0, 5),
              extraOfTemplateMealId: meal.id,
              items,
            }
          : {
              date,
              mealType: mealTypeAt(hora),
              name: food.name.slice(0, 80),
              scheduledTime: hora,
              items,
            },
      );
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      triggerHaptic("success");
      toast.success(
        meal
          ? `${food.name} sumado a ${meal.name}.`
          : `${food.name} a las ${hora}.`,
      );
      onOpenChange(false);
      router.refresh();
    });

  const options = [
    ...meals.map((m) => ({ id: m.id, name: m.name, time: m.time })),
    { id: NUEVA, name: "Como comida nueva", time: null },
  ];

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Usar hoy"
      description="Se suma a lo de hoy. Tu plan no cambia."
    >
      <div
        className="m-action-list"
        role="radiogroup"
        aria-label="¿En qué comida?"
      >
        {options.map((o) => {
          const on = o.id === dest;
          return (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={on}
              className="m-action-row m-press"
              onClick={() => setDest(o.id)}
            >
              <span className="m-use-time m-num">
                {o.id === NUEVA ? hora : (o.time?.slice(0, 5) ?? "")}
              </span>
              <span style={{ flex: 1 }}>{o.name}</span>
              <span className="m-swap-card-check" aria-hidden="true">
                {on && <Check size={14} strokeWidth={3} />}
              </span>
            </button>
          );
        })}
      </div>

      {dest === NUEVA && (
        <button
          type="button"
          className="m-time-chip m-press"
          style={{ alignSelf: "flex-start" }}
          aria-label={`Hora: ${hora}. Cambiar`}
          onClick={() => setHoraOpen(true)}
        >
          <Clock size={16} aria-hidden="true" />
          <span className="m-num">{hora}</span>
        </button>
      )}

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
        <span className="m-picked-kcal">
          <span className="m-num">{kcal((food.calories * grams) / 100)}</span>
          <small>kcal</small>
        </span>
      </div>

      <button
        type="button"
        className="m-btn m-press"
        data-variant="primary"
        data-block=""
        disabled={pending}
        onClick={save}
      >
        {pending ? "Agregando…" : "Agregar"}
      </button>

      <TimeWheelSheet
        open={horaOpen}
        onOpenChange={setHoraOpen}
        title="Hora de la comida"
        value={hora}
        onSave={async (h) => {
          setHora(h);
          return true;
        }}
      />
    </Sheet>
  );
}
