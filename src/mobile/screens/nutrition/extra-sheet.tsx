"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Clock, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { addMealItem, logMeal } from "@/features/nutrition/actions";
import type { MealType } from "@/features/nutrition/schemas";
import { triggerHaptic } from "@/lib/haptics";
import { Sheet } from "@/mobile/ui/sheet";
import { Stepper } from "@/mobile/ui/controls";
import { DayFoodSearch } from "./day-food-search";
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
  nutritionBasis?: "100g" | "100ml";
  /** Porciones caseras con su peso, para elegir la cantidad de un toque. */
  portions?: { label: string; grams: number }[];
};

/**
 * Atajos de cantidad: las porciones del alimento primero (las que tiene
 * cargadas la biblioteca) y después cantidades redondas. Sin repetir pesos.
 */
function quantityShortcuts(food: PickedFood) {
  const unit = food.nutritionBasis === "100ml" ? "ml" : "g";
  const own = (food.portions ?? [])
    .filter((p) => p.grams >= 1 && p.grams <= 2000)
    .slice(0, 4)
    .map((p) => ({
      grams: Math.round(p.grams),
      label: `${p.label} · ${Math.round(p.grams)} ${unit}`,
    }));
  const round = [50, 100, 150, 200, 250].map((grams) => ({
    grams,
    label: `${grams} ${unit}`,
  }));
  const seen = new Set<number>();
  return [...own, ...round].filter((s) =>
    seen.has(s.grams) ? false : (seen.add(s.grams), true),
  );
}

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
  destino: defaultDestino = { kind: "suelto" },
  completedMeals = [],
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  /** Alimento ya elegido (desde la biblioteca); sin el, se busca. */
  initial?: { food: PickedFood; grams: number } | null;
  title?: string;
  destino?: ExtraDestino;
  completedMeals?: Omit<Extract<ExtraDestino, { kind: "extra" }>, "kind">[];
}) {
  const router = useRouter();
  const [selectedMeal, setSelectedMeal] = useState("");
  const target = completedMeals.find(
    (meal) => meal.templateMealId === selectedMeal,
  );
  const canChooseDestination = defaultDestino.kind === "nueva";
  const destino: ExtraDestino =
    canChooseDestination && target
      ? { kind: "extra", ...target }
      : defaultDestino;
  const [picked, setPicked] = useState<{ food: PickedFood; grams: number }[]>(
    initial ? [initial] : [],
  );
  const [searching, setSearching] = useState(!initial);
  const [nombre, setNombre] = useState("");
  const [hora, setHora] = useState(ahora);
  const [horaOpen, setHoraOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const close = () => {
    onOpenChange(false);
    setNombre("");
    setSelectedMeal("");
    setHora(ahora());
    setPicked(initial ? [initial] : []);
    setSearching(!initial);
  };

  const add = (food: PickedFood) => {
    setPicked((p) =>
      p.some((x) => x.food.id === food.id) ? p : [...p, { food, grams: 100 }],
    );
    setSearching(false);
  };

  const total = picked.reduce(
    (t, p) => t + per100(p.food, p.grams).calories,
    0,
  );

  const save = () =>
    picked.length > 0 &&
    startTransition(async () => {
      if (canChooseDestination && selectedMeal && !target) {
        toast.error(
          "Esa comida ya no está registrada. Elige dónde agregar el alimento.",
        );
        return;
      }
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
      layout="screen"
      title={searching ? "Buscar alimento" : heading}
      description={`Se registra para el ${date.split("-").reverse().join("/")}. Tu plan no cambia.`}
    >
      {!searching && picked.length > 0 && (
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
                    label={`Cantidad de ${p.food.name}`}
                    value={p.grams}
                    step={10}
                    min={10}
                    max={2000}
                    unit={p.food.nutritionBasis === "100ml" ? "ml" : "g"}
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
                <div
                  className="m-portions"
                  role="group"
                  aria-label={`Cantidades rápidas de ${p.food.name}`}
                >
                  {quantityShortcuts(p.food).map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      className="m-portion m-press"
                      aria-pressed={p.grams === s.grams}
                      onClick={() =>
                        setPicked((all) =>
                          all.map((x, j) =>
                            j === i ? { ...x, grams: s.grams } : x,
                          ),
                        )
                      }
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <p className="m-picked-macros m-num">
                  <span data-macro="p">Proteína {gramos(m.proteinG)} g</span>
                  <span data-macro="c">Carbos {gramos(m.carbohydrateG)} g</span>
                  <span data-macro="g">Grasa {gramos(m.fatG)} g</span>
                  {m.fiberG > 0 && (
                    <span data-macro="f">Fibra {gramos(m.fiberG)} g</span>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      )}

      {searching ? (
        <DayFoodSearch onSelect={add} />
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

      {!searching && canChooseDestination && (
        <label className="m-field">
          <span>¿Dónde lo agregamos?</span>
          <select
            className="m-input"
            value={selectedMeal}
            disabled={pending}
            onChange={(event) => setSelectedMeal(event.target.value)}
          >
            <option value="">Como comida fuera del plan</option>
            {completedMeals.length > 0 && (
              <optgroup label="Comidas del plan ya hechas">
                {completedMeals.map((meal) => (
                  <option key={meal.templateMealId} value={meal.templateMealId}>
                    {meal.mealName}
                    {meal.time ? ` · ${meal.time.slice(0, 5)}` : ""}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
          <small className="m-sub">
            {target
              ? `Se suma como extra a ${target.mealName}, solo para este día.`
              : completedMeals.length
                ? "Aparecerá separada de las comidas del plan."
                : "También puedes sumar extras a una comida del plan después de marcarla como hecha."}
          </small>
        </label>
      )}
      {!searching && destino.kind === "nueva" && (
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

      {!searching && picked.length > 0 && (
        <button
          type="button"
          className="m-btn m-press"
          data-variant="primary"
          data-block=""
          disabled={pending}
          onClick={save}
        >
          {pending
            ? "Guardando…"
            : `Agregar${destino.kind === "extra" ? ` a ${destino.mealName}` : ""} · ${kcal(total)} kcal`}
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
