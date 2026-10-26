"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChefHat } from "lucide-react";
import { toast } from "sonner";
import {
  getRecipeSwapSuggestions,
  replaceMealWithRecipe,
  type RecipeSwapSuggestions,
} from "@/features/nutrition/recipe-swap-actions";
import type { MacroSet } from "@/features/nutrition/lib/macros";
import { triggerHaptic } from "@/lib/haptics";
import { Stepper } from "@/mobile/ui/controls";
import { Sheet } from "@/mobile/ui/sheet";
import { WheelColumn, WheelGroup, Wheels, range } from "@/mobile/ui/wheel";
import { MacroSplitBar } from "./macro-split";
import { gramos, kcal } from "./format";

/**
 * Hojas del plan del dia en el telefono (4.1): la hora con rueda, la
 * cantidad de un alimento, el menu de una comida y cambiarla por una receta.
 */

const HORAS = range(0, 23, 1, (v) => String(v).padStart(2, "0"));
const MINUTOS = range(0, 55, 5, (v) => String(v).padStart(2, "0"));

/** «08:00» en minutos desde medianoche. */
export const toMinutes = (hhmm: string) => {
  const [h = 0, m = 0] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
export const fromMinutes = (min: number) => {
  const m = Math.max(0, Math.min(23 * 60 + 59, Math.round(min)));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};

/** La hora en dos ruedas, horas y minutos de cinco en cinco. */
export function TimeWheelSheet({
  open,
  onOpenChange,
  title,
  description,
  value,
  onSave,
  reset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  /** `HH:MM`. */
  value: string;
  onSave: (hhmm: string) => Promise<boolean>;
  /** «Volver a las 07:30»: la hora del plan, si hoy se movio. */
  reset?: { label: string; onClick: () => Promise<boolean> };
}) {
  const [h, setH] = useState(0);
  const [m, setM] = useState(0);
  const [pending, startTransition] = useTransition();

  // Cada vez que se abre arranca en la hora actual de la comida.
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      const min = toMinutes(value);
      setH(Math.floor(min / 60));
      setM(Math.min(55, Math.round((min % 60) / 5) * 5));
    }
  }

  const run = (fn: () => Promise<boolean>) =>
    startTransition(async () => {
      if (await fn()) onOpenChange(false);
    });

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
    >
      {open && (
        <Wheels>
          <WheelGroup label="Hora">
            <WheelColumn
              label="Hora"
              options={HORAS}
              value={h}
              onChange={setH}
            />
            <span className="m-wheel-sep" aria-hidden="true">
              :
            </span>
            <WheelColumn
              label="Minutos"
              options={MINUTOS}
              value={m}
              onChange={setM}
            />
          </WheelGroup>
        </Wheels>
      )}
      <button
        type="button"
        className="m-btn m-press"
        data-variant="primary"
        data-block=""
        disabled={pending}
        onClick={() => run(() => onSave(fromMinutes(h * 60 + m)))}
      >
        {pending ? "Guardando…" : "Listo"}
      </button>
      {reset && (
        <button
          type="button"
          className="m-btn m-press"
          data-variant="ghost"
          data-block=""
          disabled={pending}
          onClick={() => run(reset.onClick)}
        >
          {reset.label}
        </button>
      )}
    </Sheet>
  );
}

/** Cuantos gramos de un alimento, con sus kcal y macros al momento. */
export function QuantitySheet({
  open,
  onOpenChange,
  name,
  grams,
  macros,
  description = "Solo por hoy. Tu plan no cambia.",
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  grams: number;
  /** Macros de `grams`: se escalan en proporcion. */
  macros: MacroSet;
  description?: string;
  onSave: (grams: number) => Promise<boolean>;
}) {
  const [value, setValue] = useState(grams);
  const [pending, startTransition] = useTransition();
  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setValue(grams);
  }

  const f = grams > 0 ? value / grams : 0;
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={name}
      description={description}
    >
      <div className="m-row" style={{ justifyContent: "space-between" }}>
        <Stepper
          label="Gramos"
          value={value}
          step={value >= 100 ? 10 : 5}
          min={5}
          max={2000}
          unit="g"
          onChange={setValue}
        />
        <span className="m-stat-value">
          {kcal(macros.calories * f)}
          <small>kcal</small>
        </span>
      </div>
      <p className="m-sub">
        P {gramos(macros.proteinG * f)} · C {gramos(macros.carbohydrateG * f)} ·
        G {gramos(macros.fatG * f)}
      </p>
      <button
        type="button"
        className="m-btn m-press"
        data-variant="primary"
        data-block=""
        disabled={pending || value === grams}
        onClick={() =>
          startTransition(async () => {
            if (await onSave(value)) onOpenChange(false);
          })
        }
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </Sheet>
  );
}

export type MenuAction = {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  tone?: "danger";
  disabled?: boolean;
};

/** Hoja de acciones, como la de iOS: una fila por accion. */
export function ActionSheet({
  open,
  onOpenChange,
  title,
  description,
  actions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  actions: MenuAction[];
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
    >
      <div className="m-action-list">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            className="m-action-row m-press"
            data-tone={a.tone}
            disabled={a.disabled}
            onClick={() => {
              onOpenChange(false);
              a.onClick();
            }}
          >
            {a.icon}
            <span>{a.label}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

/**
 * Cambiar una comida completa por una receta. Las sugerencias salen de la
 * comida registrada (`mealId`) o, si aun no lo esta, de lo previsto en el plan
 * (`planned`): mirar recetas no registra nada. Solo al elegir una,
 * `ensureMeal` registra la comida para poder cambiarla.
 */
export function RecipeSwapSheet({
  open,
  onOpenChange,
  mealName,
  mealId,
  planned,
  ensureMeal,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mealName: string;
  /** La comida ya registrada hoy, si la hay. */
  mealId: string | null;
  /** Macros previstos del plan, para cuando aun no esta registrada. */
  planned: MacroSet;
  /** Devuelve el id de la comida registrada, o null si fallo. */
  ensureMeal: () => Promise<string | null>;
}) {
  const router = useRouter();
  const [data, setData] = useState<RecipeSwapSuggestions | null>(null);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();

  const [wasOpen, setWasOpen] = useState(false);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setData(null);
      setFailed(false);
    }
  }

  useEffect(() => {
    if (!open) return;
    let vivo = true;
    void getRecipeSwapSuggestions(
      mealId ? { mealId } : { planned: { name: mealName, macros: planned } },
    ).then((r) => {
      if (!vivo) return;
      if ("error" in r) setFailed(true);
      else setData(r);
    });
    return () => {
      vivo = false;
    };
    // Lo previsto cambia en cada render; basta con abrir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const pick = (recipeId: string, servings: number, name: string) =>
    startTransition(async () => {
      const id = mealId ?? (await ensureMeal());
      if (!id) {
        toast.error("No se pudo cambiar la comida.");
        return;
      }
      const r = await replaceMealWithRecipe({
        mealId: id,
        recipeId,
        servings,
      });
      if ("error" in r) {
        toast.error(r.error);
        router.refresh();
        return;
      }
      triggerHaptic("success");
      toast.success(`${mealName}: hoy va ${name}.`);
      onOpenChange(false);
      router.refresh();
    });

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Cambiar comida"
      description="Al elegir una receta, la comida queda registrada como hecha con ella. Solo por hoy: tu plan no cambia."
    >
      {failed ? (
        <p className="m-sheet-text">No se pudieron cargar las recetas.</p>
      ) : !data ? (
        <p className="m-sheet-text" aria-busy="true">
          Buscando recetas parecidas…
        </p>
      ) : data.matches.length === 0 ? (
        <p className="m-sheet-text">No hay recetas parecidas a esta comida.</p>
      ) : (
        <div className="m-stack" style={{ gap: 8 }}>
          {data.matches.slice(0, 6).map((match) => (
            <button
              key={match.recipe.id}
              type="button"
              className="m-swap-card m-press"
              disabled={pending}
              onClick={() =>
                pick(match.recipe.id, match.servings, match.recipe.name)
              }
            >
              <span className="m-recipe-icon" aria-hidden="true">
                <ChefHat size={18} />
              </span>
              <span className="m-list-row-main">
                <span className="m-list-row-title">{match.recipe.name}</span>
                <span className="m-list-row-sub">
                  <span className="m-num">{gramos(match.servings)}</span>{" "}
                  {match.servings === 1 ? "porción" : "porciones"} ·{" "}
                  <span className="m-num">{kcal(match.macros.calories)}</span>{" "}
                  kcal
                </span>
                <MacroSplitBar macros={match.macros} />
              </span>
              <span className="m-tag" data-tone="neutral">
                <span className="m-num">
                  {Math.round(match.compatibility.overall * 10)}%
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}
