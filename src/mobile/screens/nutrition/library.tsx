"use client";

import Link from "next/link";
import { useEffect, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Barcode, Camera, PenLine, Search, Star } from "lucide-react";
import { toast } from "sonner";
import { toggleFavoriteFood } from "@/features/foods/actions";
import type { LibraryFood } from "@/features/foods/queries";
import { gramos, kcal } from "./format";

/**
 * Biblioteca: busqueda, alta (codigo de barras, foto de etiqueta o manual,
 * con las herramientas que ya existen) y la lista con valores por 100 g.
 * Cada alimento abre su ficha (`?alimento=`), como los ejercicios.
 */
export function FoodLibrary({
  foods,
  query,
  view,
}: {
  foods: LibraryFood[];
  query: string;
  view: "todos" | "favoritos";
}) {
  const router = useRouter();
  const [term, setTerm] = useState(query);
  const [, startTransition] = useTransition();
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
        <Link href="/nutricion?vista=escanear" className="m-add-tile m-press">
          <Barcode size={20} aria-hidden="true" />
          Código de barras
        </Link>
        <Link
          href="/nutricion/alimentos?metodo=foto"
          className="m-add-tile m-press"
        >
          <Camera size={20} aria-hidden="true" />
          Foto de etiqueta
        </Link>
        <Link
          href="/nutricion/alimentos?metodo=manual"
          className="m-add-tile m-press"
        >
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
        {foods.map((food) => (
          <div key={food.id} className="m-food m-row">
            <Link
              href={`/nutricion?vista=biblioteca&alimento=${food.id}`}
              className="m-food-main m-press"
            >
              <span className="m-list-row-title">{food.name}</span>
              <span className="m-list-row-sub m-num">
                {kcal(food.calories)} kcal · P {gramos(food.proteinG)} · C{" "}
                {gramos(food.carbohydrateG)} · G {gramos(food.fatG)}
              </span>
            </Link>
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
        ))}
      </div>
    </div>
  );
}
