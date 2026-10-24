"use client";

import Link from "next/link";
import { useEffect, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Barcode, Camera, PenLine, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { toggleFavoriteFood } from "@/features/foods/actions";
import { logMeal } from "@/features/nutrition/actions";
import type { LibraryFood } from "@/features/foods/queries";
import { triggerHaptic } from "@/lib/haptics";
import { Stepper } from "@/mobile/ui/controls";
import { gramos, kcal, per100 } from "./format";

/**
 * Biblioteca: busqueda, alta (codigo de barras, foto de etiqueta o manual,
 * con las herramientas que ya existen) y la lista con valores por 100 g.
 * Al abrir un alimento: gramos ajustables, kcal de la porcion y «Usar hoy».
 */
export function FoodLibrary({
  foods,
  query,
  view,
  date,
}: {
  foods: LibraryFood[];
  query: string;
  view: "todos" | "favoritos";
  date: string;
}) {
  const router = useRouter();
  const [term, setTerm] = useState(query);
  const [open, setOpen] = useState<string | null>(null);
  const [grams, setGrams] = useState(100);
  const [pending, startTransition] = useTransition();
  const [favs, setFav] = useOptimistic(
    Object.fromEntries(foods.map((f) => [f.id, f.isFavorite])) as Record<
      string,
      boolean
    >,
    (state, [id, value]: [string, boolean]) => ({ ...state, [id]: value }),
  );

  useEffect(() => {
    if (term === query) return;
    const id = window.setTimeout(() => {
      const p = new URLSearchParams({ vista: "biblioteca" });
      if (term.trim()) p.set("q", term.trim());
      if (view === "favoritos") p.set("filtro", "favoritos");
      router.replace(`/nutricion?${p}`, { scroll: false });
    }, 300);
    return () => window.clearTimeout(id);
  }, [term, query, view, router]);

  const filterHref = (v: "todos" | "favoritos") => {
    const p = new URLSearchParams({ vista: "biblioteca" });
    if (query) p.set("q", query);
    if (v === "favoritos") p.set("filtro", "favoritos");
    return `/nutricion?${p}`;
  };

  const toggleFav = (food: LibraryFood) =>
    startTransition(async () => {
      setFav([food.id, !favs[food.id]]);
      const result = await toggleFavoriteFood({ foodId: food.id });
      if ("error" in result) toast.error(result.error);
      else router.refresh();
    });

  const logToday = (food: LibraryFood) =>
    startTransition(async () => {
      const result = await logMeal({
        date,
        mealType: "snack",
        name: food.name,
        items: [{ foodId: food.id, quantityG: grams }],
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      triggerHaptic("success");
      toast.success(`${food.name} sumado a hoy.`);
      setOpen(null);
    });

  return (
    <div className="m-body">
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

      <div className="m-grid-3">
        <Link href="/nutricion/alimentos" className="m-add-tile m-press">
          <Barcode size={20} aria-hidden="true" />
          Código de barras
        </Link>
        <Link href="/nutricion/alimentos" className="m-add-tile m-press">
          <Camera size={20} aria-hidden="true" />
          Foto de etiqueta
        </Link>
        <Link href="/nutricion/alimentos" className="m-add-tile m-press">
          <PenLine size={20} aria-hidden="true" />
          Manual
        </Link>
      </div>

      <div className="m-row">
        <Link
          href={filterHref("todos")}
          className="m-filter m-press"
          aria-current={view === "todos" ? "page" : undefined}
        >
          Todos
        </Link>
        <Link
          href={filterHref("favoritos")}
          className="m-filter m-press"
          aria-current={view === "favoritos" ? "page" : undefined}
        >
          Favoritos
        </Link>
        <span style={{ flex: 1 }} />
        <span className="m-sub">Por 100 g</span>
      </div>

      <div className="m-stack m-stagger">
        {foods.length === 0 && (
          <p className="m-sub">
            {view === "favoritos"
              ? "Aún no tienes favoritos."
              : "Sin resultados."}
          </p>
        )}
        {foods.map((food) => {
          const isOpen = open === food.id;
          const m = per100(food, grams);
          return (
            <div
              key={food.id}
              className="m-food"
              data-open={isOpen ? "" : undefined}
            >
              <div className="m-row">
                <button
                  type="button"
                  className="m-food-main"
                  aria-expanded={isOpen}
                  onClick={() => {
                    setOpen(isOpen ? null : food.id);
                    setGrams(
                      food.portions?.[0]?.grams
                        ? Math.round(food.portions[0].grams)
                        : 100,
                    );
                  }}
                >
                  <span className="m-list-row-title">{food.name}</span>
                  <span className="m-list-row-sub m-num">
                    {kcal(food.calories)} kcal · P {gramos(food.proteinG)} · C{" "}
                    {gramos(food.carbohydrateG)} · G {gramos(food.fatG)}
                  </span>
                </button>
                <button
                  type="button"
                  className="m-icon-btn m-press"
                  style={{ background: "transparent" }}
                  aria-pressed={favs[food.id]}
                  aria-label={
                    favs[food.id]
                      ? `Quitar ${food.name} de favoritos`
                      : `Agregar ${food.name} a favoritos`
                  }
                  onClick={() => toggleFav(food)}
                >
                  <Star
                    size={20}
                    strokeWidth={2}
                    aria-hidden="true"
                    className={favs[food.id] ? "m-accent-text" : undefined}
                    fill={favs[food.id] ? "currentColor" : "none"}
                  />
                </button>
              </div>
              {isOpen && (
                <div className="m-row" style={{ marginTop: 10 }}>
                  <Stepper
                    label={`Gramos de ${food.name}`}
                    value={grams}
                    step={10}
                    min={10}
                    max={2000}
                    unit="g"
                    onChange={setGrams}
                  />
                  <span
                    className="m-stat-value"
                    style={{ fontSize: 18, flex: 1 }}
                  >
                    {kcal(m.calories)}
                    <small>kcal</small>
                  </span>
                  <button
                    type="button"
                    className="m-btn m-press"
                    data-variant="primary"
                    style={{ height: 44, padding: "0 18px", fontSize: 15 }}
                    disabled={pending}
                    onClick={() => logToday(food)}
                  >
                    Usar hoy
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
