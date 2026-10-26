"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, Plus, Search, X } from "lucide-react";
import { toast } from "sonner";
import {
  addMealItem,
  logMeal,
  searchFoods,
} from "@/features/nutrition/actions";
import type { MealType } from "@/features/nutrition/schemas";
import { triggerHaptic } from "@/lib/haptics";
import { Sheet } from "@/mobile/ui/sheet";
import { Stepper } from "@/mobile/ui/controls";
import { useSearch } from "@/mobile/ui/use-search";
import { TimeWheelSheet } from "./day-sheets";
import { gramos, kcal, per100 } from "./format";

export type PickedFood = {
  id: string;
  name: string;
  calories: number;
  proteinG: number;
  carbohydrateG: number;
  fatG: number;
  fiberG: number;
};

/**
 * A donde va lo que se registra:
 * - `suelto`: un alimento aparte («Usar hoy» de la biblioteca).
 * - `extra`: dentro de una comida del plan, como «Extra de hoy».
 * - `nueva`: una comida nueva con su nombre y su hora.
 * - `agregar`: mas alimentos en una comida ya registrada.
 */
export type ExtraDestino =
  | { kind: "suelto" }
  | {
      kind: "extra";
      templateMealId: string;
      mealName: string;
      time: string | null;
    }
  | { kind: "nueva" }
  | { kind: "agregar"; mealId: string; mealName: string };

/** El tipo de comida sale de la hora: lo usan el historial y escritorio. */
export function mealTypeAt(hhmm: string): MealType {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  const min = h * 60 + m;
  if (min < 10 * 60 + 30) return "desayuno";
  if (min < 15 * 60) return "almuerzo";
  if (min < 18 * 60 + 30) return "snack";
  return "cena";
}

function ahora() {
  const d = new Date();
  const m = Math.round((d.getHours() * 60 + d.getMinutes()) / 5) * 5;
  const min = Math.min(m, 23 * 60 + 55);
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

/**
 * Registra alimentos en el dia sin tocar el plan: crea una comida registrada
 * aparte, la misma accion que «Registrar comida» de escritorio. Uno o varios
 * alimentos, cada uno con sus gramos.
 */
export function ExtraSheet({
  open,
  onOpenChange,
  date,
  initial,
  title,
  destino = { kind: "suelto" },
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  /** Alimento ya elegido (desde la biblioteca); sin el, se busca. */
  initial?: { food: PickedFood; grams: number } | null;
  title?: string;
  destino?: ExtraDestino;
}) {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [picked, setPicked] = useState<{ food: PickedFood; grams: number }[]>(
    initial ? [initial] : [],
  );
  const [searching, setSearching] = useState(!initial);
  const [nombre, setNombre] = useState("");
  const [hora, setHora] = useState(ahora);
  const [horaOpen, setHoraOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const results = useSearch(term, async (q) => {
    const r = await searchFoods({ term: q });
    if ("error" in r) return null;
    return r.results.map((f) => ({
      id: f.id,
      name: f.name,
      calories: f.caloriesPer100g,
      proteinG: f.proteinPer100g,
      carbohydrateG: f.carbohydratePer100g,
      fatG: f.fatPer100g,
      fiberG: f.fiberPer100g,
    }));
  });

  const close = () => {
    onOpenChange(false);
    setTerm("");
    setNombre("");
    setHora(ahora());
    setPicked(initial ? [initial] : []);
    setSearching(!initial);
  };

  const add = (food: PickedFood) => {
    setPicked((p) =>
      p.some((x) => x.food.id === food.id) ? p : [...p, { food, grams: 100 }],
    );
    setTerm("");
    setSearching(false);
  };

  const total = picked.reduce(
    (t, p) => t + per100(p.food, p.grams).calories,
    0,
  );

  const save = () =>
    picked.length > 0 &&
    startTransition(async () => {
      const items = picked.map((p) => ({
        foodId: p.food.id,
        quantityG: p.grams,
      }));
      const nombres = picked.map((p) => p.food.name).join(", ");
      if (destino.kind === "agregar") {
        for (const item of items) {
          const r = await addMealItem({ mealId: destino.mealId, ...item });
          if ("error" in r) {
            toast.error(r.error);
            router.refresh();
            return;
          }
        }
        triggerHaptic("success");
        toast.success(`Sumado a ${destino.mealName}.`);
        close();
        router.refresh();
        return;
      }
      const input =
        destino.kind === "extra"
          ? {
              date,
              mealType: "snack" as const,
              name: nombres.slice(0, 80),
              scheduledTime: destino.time?.slice(0, 5),
              extraOfTemplateMealId: destino.templateMealId,
              items,
            }
          : destino.kind === "nueva"
            ? {
                date,
                mealType: mealTypeAt(hora),
                name: nombre.trim() || undefined,
                scheduledTime: hora,
                items,
              }
            : {
                date,
                mealType: "snack" as const,
                name: nombres.slice(0, 80),
                items,
              };
      const result = await logMeal(input);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      triggerHaptic("success");
      toast.success(
        destino.kind === "extra"
          ? `Extra sumado a ${destino.mealName}.`
          : destino.kind === "nueva"
            ? `${nombre.trim() || "Comida"} a las ${hora}.`
            : `${nombres} sumado a hoy.`,
      );
      close();
      router.refresh();
    });

  const heading =
    title ??
    (destino.kind === "extra"
      ? `Extra en ${destino.mealName}`
      : destino.kind === "agregar"
        ? `Agregar a ${destino.mealName}`
        : destino.kind === "nueva"
          ? "Nueva comida"
          : "Extra solo hoy");

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => (o ? onOpenChange(true) : close())}
      title={heading}
      description="Se suma a lo de hoy. Tu plan no cambia."
    >
      {destino.kind === "nueva" && (
        <div className="m-new-meal-fields">
          <label className="m-field">
            <span>Nombre</span>
            <input
              className="m-input"
              placeholder="Merienda"
              maxLength={80}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="m-time-chip m-press"
            aria-label={`Hora: ${hora}. Cambiar`}
            onClick={() => setHoraOpen(true)}
          >
            <Clock size={16} aria-hidden="true" />
            <span className="m-num">{hora}</span>
          </button>
        </div>
      )}

      {picked.length > 0 && (
        <ul className="m-picked">
          {picked.map((p, i) => {
            const m = per100(p.food, p.grams);
            return (
              <li key={p.food.id} className="m-picked-row">
                <div className="m-picked-head">
                  <span className="m-list-row-title">{p.food.name}</span>
                  <button
                    type="button"
                    className="m-icon-btn m-press"
                    aria-label={`Quitar ${p.food.name}`}
                    onClick={() => {
                      setPicked((all) => all.filter((_, j) => j !== i));
                      if (picked.length === 1) setSearching(true);
                    }}
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                </div>
                <div
                  className="m-row"
                  style={{ justifyContent: "space-between" }}
                >
                  <Stepper
                    label={`Gramos de ${p.food.name}`}
                    value={p.grams}
                    step={10}
                    min={10}
                    max={2000}
                    unit="g"
                    onChange={(g) =>
                      setPicked((all) =>
                        all.map((x, j) => (j === i ? { ...x, grams: g } : x)),
                      )
                    }
                  />
                  <span className="m-picked-kcal">
                    <span className="m-num">{kcal(m.calories)}</span>
                    <small>kcal</small>
                  </span>
                </div>
                <p className="m-sub">
                  P {gramos(m.proteinG)} · C {gramos(m.carbohydrateG)} · G{" "}
                  {gramos(m.fatG)}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      {searching ? (
        <>
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
                onClick={() => add(f)}
              >
                <span className="m-list-row-main">
                  <span className="m-list-row-title">{f.name}</span>
                  <span className="m-list-row-sub">
                    {kcal(f.calories)} kcal · por 100 g
                  </span>
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        !initial && (
          <button
            type="button"
            className="m-set-add m-press"
            onClick={() => setSearching(true)}
          >
            <Plus size={16} aria-hidden="true" />
            Otro alimento
          </button>
        )
      )}

      {picked.length > 0 && (
        <button
          type="button"
          className="m-btn m-press"
          data-variant="primary"
          data-block=""
          disabled={pending}
          onClick={save}
        >
          {pending ? "Guardando…" : `Agregar · ${kcal(total)} kcal`}
        </button>
      )}

      {destino.kind === "nueva" && (
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
      )}
    </Sheet>
  );
}
