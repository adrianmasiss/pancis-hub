"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { toast } from "sonner";
import { ActionButton } from "@/components/ui/action";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ChoicePills,
  FormGroup,
  MetricField,
} from "@/components/shared/form-kit";
import { logMeal, searchFoods } from "@/features/nutrition/actions";
import { MEAL_TYPES } from "@/features/nutrition/schemas";
import { messages } from "@/i18n/es-419";
import "./add-meal-dialog.css";

const t = messages.nutrition;
const fmt = (n: number) => Math.round(n).toLocaleString("es-419");

type MealType = (typeof MEAL_TYPES)[number];

type Found = {
  id: string;
  name: string;
  brand: string | null;
  imageUrl: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbohydratePer100g: number;
  fatPer100g: number;
  defaultServingAmount: number;
  defaultServingUnit: string;
};

type Picked = Found & { grams: string };

/** La foto del alimento o, sin ella, su inicial: la fila nunca queda coja. */
function Thumb({ name, src }: { name: string; src: string | null }) {
  const [broken, setBroken] = useState(false);
  return (
    <span className="amd-thumb" aria-hidden="true">
      {src && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element -- storage propio, sin next/image en el resto del proyecto
        <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  );
}

/** Comida del plan que ya ocupa ese tipo: para sugerir la hora y avisar. */
export type PlanSlot = { mealType: string; time: string | null; label: string };

/**
 * Agregar comida = registrar lo que se comió fuera del plan, en un paso:
 * qué alimentos y cuánto (con lo que suman, en vivo), y cuándo. Se guarda
 * ya registrada, así que suma al día al momento; el plan habitual no se toca
 * y el pie lo dice.
 */
export function AddMealDialog({
  date,
  trigger = "primary",
  remainingKcal = null,
  planSlots = [],
}: {
  date: string;
  trigger?: "primary" | "plan-row";
  /** Lo que falta hoy hasta la meta de calorías, si hay meta. */
  remainingKcal?: number | null;
  planSlots?: PlanSlot[];
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [results, setResults] = useState<Found[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [items, setItems] = useState<Picked[]>([]);
  const [mealType, setMealType] = useState<MealType>("snack");
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = () => {
    setTerm("");
    setResults(null);
    setItems([]);
    setMealType("snack");
    setTime("");
    setName("");
  };

  const onTerm = (value: string) => {
    setTerm(value);
    if (debounce.current) clearTimeout(debounce.current);
    if (value.trim().length < 2) {
      setResults(null);
      return;
    }
    debounce.current = setTimeout(async () => {
      setSearching(true);
      const response = await searchFoods({ term: value });
      setSearching(false);
      if ("results" in response) setResults(response.results);
    }, 280);
  };

  const add = (food: Found) => {
    const grams =
      food.defaultServingUnit === "g" && food.defaultServingAmount > 0
        ? food.defaultServingAmount
        : 100;
    setItems((list) =>
      list.some((i) => i.id === food.id)
        ? list
        : [...list, { ...food, grams: String(grams) }],
    );
    setTerm("");
    setResults(null);
  };

  const totals = useMemo(() => {
    const sum = { kcal: 0, p: 0, c: 0, f: 0 };
    for (const i of items) {
      const k = (Number(i.grams) || 0) / 100;
      sum.kcal += i.caloriesPer100g * k;
      sum.p += i.proteinPer100g * k;
      sum.c += i.carbohydratePer100g * k;
      sum.f += i.fatPer100g * k;
    }
    return sum;
  }, [items]);

  const slot = planSlots.find((s) => s.mealType === mealType);
  const chooseType = (type: MealType) => {
    setMealType(type);
    const match = planSlots.find((s) => s.mealType === type);
    if (match?.time && !time) setTime(match.time);
  };

  const valid = items.length > 0 && items.every((i) => Number(i.grams) > 0);

  const save = () =>
    startTransition(async () => {
      const result = await logMeal({
        date,
        mealType,
        name,
        scheduledTime: time,
        items: items.map((i) => ({ foodId: i.id, quantityG: Number(i.grams) })),
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(t.mealLogged);
      setOpen(false);
      reset();
    });

  const after =
    remainingKcal === null ? null : Math.round(remainingKcal - totals.kcal);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        {/* La misma familia de creación en la cabecera y en la fila del plan. */}
        <ActionButton
          family="add"
          className={trigger === "plan-row" ? "w-full" : undefined}
        >
          {t.addMeal}
        </ActionButton>
      </DialogTrigger>
      <DialogContent className="amd max-w-lg">
        <DialogHeader>
          <DialogTitle>{t.addMeal}</DialogTitle>
          <DialogDescription>{t.addMealHint}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <FormGroup title={t.addMealWhat}>
            <label className="amd-search">
              <Search size={16} aria-hidden="true" />
              <input
                value={term}
                onChange={(e) => onTerm(e.target.value)}
                placeholder={t.addMealSearch}
                aria-label={t.addMealSearch}
                autoFocus
              />
              {searching ? (
                <span className="amd-spin" aria-hidden="true" />
              ) : null}
            </label>

            {results ? (
              results.length ? (
                <ul className="amd-results" aria-label="Resultados">
                  {results.slice(0, 6).map((food) => (
                    <li key={food.id}>
                      <button type="button" onClick={() => add(food)}>
                        <Thumb name={food.name} src={food.imageUrl} />
                        <span className="amd-name">
                          <strong>{food.name}</strong>
                          {food.brand ? <small>{food.brand}</small> : null}
                        </span>
                        <span className="amd-kcal">
                          {fmt(food.caloriesPer100g)} <small>kcal/100 g</small>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="amd-empty">{t.addMealNoResults}</p>
              )
            ) : null}

            {items.length ? (
              <ul className="amd-items" aria-label={t.addMealWhat}>
                {items.map((item) => {
                  const kcal =
                    (item.caloriesPer100g * (Number(item.grams) || 0)) / 100;
                  return (
                    <li key={item.id}>
                      <Thumb name={item.name} src={item.imageUrl} />
                      <span className="amd-name">
                        <strong>{item.name}</strong>
                        <small>{fmt(kcal)} kcal</small>
                      </span>
                      <span className="amd-grams">
                        <input
                          type="number"
                          inputMode="decimal"
                          min={1}
                          value={item.grams}
                          aria-label={`Gramos de ${item.name}`}
                          onChange={(e) =>
                            setItems((list) =>
                              list.map((i) =>
                                i.id === item.id
                                  ? { ...i, grams: e.target.value }
                                  : i,
                              ),
                            )
                          }
                        />
                        <small>g</small>
                      </span>
                      <button
                        type="button"
                        className="amd-remove"
                        aria-label={`Quitar ${item.name}`}
                        onClick={() =>
                          setItems((list) =>
                            list.filter((i) => i.id !== item.id),
                          )
                        }
                      >
                        <X size={14} aria-hidden="true" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : !results ? (
              <p className="amd-empty">{t.addMealEmpty}</p>
            ) : null}
          </FormGroup>

          <FormGroup title={t.addMealWhen}>
            <ChoicePills
              label={t.mealType}
              options={MEAL_TYPES.map((type) => ({
                value: type,
                label: t.mealTypes[type],
              }))}
              value={mealType}
              onChange={chooseType}
            />
            {slot ? (
              <p className="pc-form-note">
                {t.addMealInPlan.replace("{meal}", slot.label)}
              </p>
            ) : null}
            <div className="pc-metrics" data-pair="">
              <MetricField
                type="time"
                label={t.mealTime}
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
              <MetricField
                type="text"
                label={t.mealName}
                value={name}
                maxLength={80}
                placeholder={t.addMealNamePlaceholder}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </FormGroup>
        </div>

        <DialogFooter className="amd-foot flex-col sm:flex-col">
          <div className="amd-total" aria-live="polite">
            <p>
              <strong>{fmt(totals.kcal)}</strong> kcal
              <span>
                P {fmt(totals.p)} · C {fmt(totals.c)} · G {fmt(totals.f)} g
              </span>
            </p>
            <small>
              {after === null
                ? t.addMealOnlyToday
                : after >= 0
                  ? t.addMealLeft.replace("{kcal}", fmt(after))
                  : t.addMealOver.replace("{kcal}", fmt(-after))}
            </small>
          </div>
          <ActionButton
            family="add"
            loading={pending}
            className="w-full"
            disabled={!valid}
            onClick={save}
          >
            {t.addMealSave}
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
