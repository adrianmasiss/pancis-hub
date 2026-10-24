"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { logMeal, searchFoods } from "@/features/nutrition/actions";
import { triggerHaptic } from "@/lib/haptics";
import { Sheet } from "@/mobile/ui/sheet";
import { Stepper } from "@/mobile/ui/controls";
import { useSearch } from "@/mobile/ui/use-search";
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
 * Registra un alimento suelto en el dia: «Extra solo hoy», «Usar hoy» de la
 * biblioteca. No toca el plan: crea una comida registrada aparte, la misma
 * accion que «Registrar comida» de escritorio.
 */
export function ExtraSheet({
  open,
  onOpenChange,
  date,
  initial,
  title = "Extra solo hoy",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  /** Alimento ya elegido (desde la biblioteca); sin el, se busca. */
  initial?: { food: PickedFood; grams: number } | null;
  title?: string;
}) {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [picked, setPicked] = useState<PickedFood | null>(
    initial?.food ?? null,
  );
  const [grams, setGrams] = useState(initial?.grams ?? 100);
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
    if (!initial) setPicked(null);
  };

  const save = () =>
    picked &&
    startTransition(async () => {
      const result = await logMeal({
        date,
        mealType: "snack",
        name: picked.name,
        items: [{ foodId: picked.id, quantityG: grams }],
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      triggerHaptic("success");
      toast.success(`${picked.name} sumado a hoy.`);
      close();
      router.refresh();
    });

  const m = picked ? per100(picked, grams) : null;

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => (o ? onOpenChange(true) : close())}
      title={title}
      description="Se suma a lo de hoy. Tu plan no cambia."
    >
      {!picked ? (
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
                onClick={() => setPicked(f)}
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
        <>
          <div className="m-row" style={{ justifyContent: "space-between" }}>
            <span className="m-list-row-title">{picked.name}</span>
            {!initial && (
              <button
                type="button"
                className="m-btn"
                data-variant="ghost"
                onClick={() => setPicked(null)}
              >
                Cambiar
              </button>
            )}
          </div>
          <div className="m-row" style={{ justifyContent: "space-between" }}>
            <Stepper
              label="Gramos"
              value={grams}
              step={10}
              min={10}
              max={2000}
              unit="g"
              onChange={setGrams}
            />
            <span className="m-stat-value">
              {kcal(m!.calories)}
              <small>kcal</small>
            </span>
          </div>
          <p className="m-sub">
            P {gramos(m!.proteinG)} · C {gramos(m!.carbohydrateG)} · G{" "}
            {gramos(m!.fatG)} · Fibra {gramos(m!.fiberG)}
          </p>
          <button
            type="button"
            className="m-btn m-press"
            data-variant="primary"
            data-block=""
            disabled={pending}
            onClick={save}
          >
            {pending ? "Guardando…" : "Sumar a hoy"}
          </button>
        </>
      )}
    </Sheet>
  );
}
