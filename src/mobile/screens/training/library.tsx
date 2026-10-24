"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Dumbbell, Heart, Search } from "lucide-react";
import type { BibliotecaEjercicio } from "@/features/training/queries";
import { capital, musculo } from "@/features/training/components/training-ui";
import { Tag } from "@/mobile/ui/display";

const POR_PAGINA = 24;

/** Biblioteca: el catalogo con foto, buscable. Tocar abre la ficha. */
export function ExerciseLibrary({
  exercises,
  total,
  query,
  page,
  favorites,
  onlyFavorites,
}: {
  exercises: BibliotecaEjercicio[];
  total: number;
  query: string;
  page: number;
  favorites: string[];
  onlyFavorites: boolean;
}) {
  const router = useRouter();
  const [term, setTerm] = useState(query);

  useEffect(() => {
    if (term === query) return;
    const id = window.setTimeout(() => {
      const p = new URLSearchParams({ vista: "biblioteca" });
      if (term.trim()) p.set("q", term.trim());
      router.replace(`/entrenamiento?${p}`, { scroll: false });
    }, 300);
    return () => window.clearTimeout(id);
  }, [term, query, router]);

  const pageHref = (n: number) => {
    const p = new URLSearchParams({ vista: "biblioteca", pagina: String(n) });
    if (query) p.set("q", query);
    return `/entrenamiento?${p}`;
  };

  return (
    <div className="m-body">
      <label className="m-search">
        <Search size={18} aria-hidden="true" />
        <span className="sr-only">Buscar ejercicio</span>
        <input
          type="search"
          placeholder="Buscar ejercicio"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
        />
      </label>
      <div className="m-row">
        <Link
          href="/entrenamiento?vista=biblioteca"
          className="m-filter m-press"
          aria-current={!onlyFavorites ? "page" : undefined}
        >
          Todos
        </Link>
        <Link
          href="/entrenamiento?vista=biblioteca&filtro=favoritos"
          className="m-filter m-press"
          aria-current={onlyFavorites ? "page" : undefined}
        >
          Favoritos
        </Link>
        <span style={{ flex: 1 }} />
        <span className="m-sub">
          {total} {total === 1 ? "ejercicio" : "ejercicios"}
        </span>
      </div>
      {onlyFavorites && exercises.length === 0 && (
        <p className="m-sub">
          Aún no tienes favoritos. Toca el corazón en la ficha de un ejercicio.
        </p>
      )}
      <div className="m-stack m-stagger">
        {exercises.map((e) => (
          <Link
            key={e.id}
            href={`/entrenamiento?vista=biblioteca&ejercicio=${e.id}`}
            className="m-list-row m-press"
          >
            <span className="m-thumb" aria-hidden="true">
              {e.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- foto del catalogo
                <img src={e.imageUrl} alt="" loading="lazy" />
              ) : (
                <Dumbbell size={18} />
              )}
            </span>
            <span className="m-list-row-main">
              <span className="m-list-row-title">{e.name}</span>
              <span className="m-list-row-sub">
                {[capital(musculo(e.primaryMuscle)), e.equipment]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </span>
            {e.inRoutine && <Tag>En rutina</Tag>}
            {favorites.includes(e.id) && (
              <Heart
                size={16}
                className="m-accent-text"
                fill="currentColor"
                aria-label="Favorito"
              />
            )}
            <ChevronRight className="m-chevron" size={18} aria-hidden="true" />
          </Link>
        ))}
      </div>
      {total > POR_PAGINA && (
        <div className="m-row" style={{ justifyContent: "space-between" }}>
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="m-btn m-press">
              Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="m-sub">
            {page} / {Math.ceil(total / POR_PAGINA)}
          </span>
          {page * POR_PAGINA < total ? (
            <Link href={pageHref(page + 1)} className="m-btn m-press">
              Siguiente
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}
    </div>
  );
}
