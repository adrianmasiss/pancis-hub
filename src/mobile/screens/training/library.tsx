"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  Dumbbell,
  Heart,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import type { BibliotecaEjercicio } from "@/features/training/queries";
import { capital, musculo } from "@/features/training/components/training-ui";
import {
  GRUPOS_MUSCULARES,
  rotuloCatalogo,
} from "@/features/training/lib/library-groups";
import { triggerHaptic } from "@/lib/haptics";
import { Tag } from "@/mobile/ui/display";
import { Sheet } from "@/mobile/ui/sheet";

const POR_PAGINA = 24;

type Filtros = {
  q?: string;
  favoritos?: boolean;
  grupo?: string | null;
  sec?: string[];
  pagina?: number;
};

/** La URL de la biblioteca con sus filtros (sin los que no aplican). */
function libraryHref({ q, favoritos, grupo, sec, pagina }: Filtros) {
  const p = new URLSearchParams({ vista: "biblioteca" });
  if (q) p.set("q", q);
  if (favoritos) p.set("filtro", "favoritos");
  if (grupo) p.set("grupo", grupo);
  if (grupo && sec?.length) p.set("sec", sec.join(","));
  if (pagina && pagina > 1) p.set("pagina", String(pagina));
  return `/entrenamiento?${p}`;
}

/**
 * Biblioteca: el catalogo con foto, buscable por nombre o musculo. «Filtrar»
 * abre una hoja: el musculo principal y, al elegirlo, los secundarios que
 * trabajan sus ejercicios. Fuera de la hoja solo se ve lo que esta activo.
 * Tocar un ejercicio abre la ficha.
 */
export function ExerciseLibrary({
  exercises,
  total,
  query,
  page,
  favorites,
  onlyFavorites,
  group,
  secondary,
  secondaryByGroup,
}: {
  exercises: BibliotecaEjercicio[];
  total: number;
  query: string;
  page: number;
  favorites: string[];
  onlyFavorites: boolean;
  group: string | null;
  secondary: string[];
  /** Por grupo, los secundarios de sus ejercicios (los mas comunes antes). */
  secondaryByGroup: Record<string, string[]>;
}) {
  const router = useRouter();
  const [term, setTerm] = useState(query);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    if (term === query) return;
    const id = window.setTimeout(() => {
      router.replace(
        libraryHref({
          q: term.trim(),
          favoritos: onlyFavorites,
          grupo: group,
          sec: secondary,
        }),
        { scroll: false },
      );
    }, 300);
    return () => window.clearTimeout(id);
  }, [term, query, router, onlyFavorites, group, secondary]);

  const actual: Filtros = {
    q: query,
    favoritos: onlyFavorites,
    grupo: group,
    sec: secondary,
  };
  const pageHref = (n: number) => libraryHref({ ...actual, pagina: n });
  const grupo = GRUPOS_MUSCULARES.find((g) => g.id === group);
  const activos = (grupo ? 1 : 0) + secondary.length;

  return (
    <div className="m-body">
      <div className="m-row" style={{ gap: 10 }}>
        <label className="m-search" style={{ flex: 1 }}>
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Buscar ejercicio</span>
          <input
            type="search"
            placeholder="Buscar ejercicio o músculo"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="m-filter-btn m-press"
          aria-label={
            activos
              ? `Filtrar por músculo (${activos} activos)`
              : "Filtrar por músculo"
          }
          aria-haspopup="dialog"
          data-on={activos ? "" : undefined}
          onClick={() => setFilterOpen(true)}
        >
          <SlidersHorizontal size={18} aria-hidden="true" />
          {activos > 0 && <span className="m-filter-count">{activos}</span>}
        </button>
      </div>

      {grupo && (
        <div className="m-active-filters">
          <Link
            href={libraryHref({ ...actual, grupo: null, sec: [] })}
            className="m-active-filter m-press"
            scroll={false}
            aria-label={`Quitar ${grupo.label}`}
          >
            {grupo.label}
            <X size={14} aria-hidden="true" />
          </Link>
          {secondary.map((m) => (
            <Link
              key={m}
              href={libraryHref({
                ...actual,
                sec: secondary.filter((x) => x !== m),
              })}
              className="m-active-filter m-press"
              data-tone="soft"
              scroll={false}
              aria-label={`Quitar ${musculo(m)} como secundario`}
            >
              + {capital(musculo(m))}
              <X size={14} aria-hidden="true" />
            </Link>
          ))}
        </div>
      )}

      <div className="m-row">
        <Link
          href={libraryHref({ ...actual, favoritos: false })}
          className="m-filter m-press"
          aria-current={!onlyFavorites ? "page" : undefined}
          scroll={false}
        >
          Todos
        </Link>
        <Link
          href={libraryHref({ ...actual, favoritos: true })}
          className="m-filter m-press"
          aria-current={onlyFavorites ? "page" : undefined}
          scroll={false}
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
                {[
                  capital(musculo(e.primaryMuscle)),
                  e.equipment && rotuloCatalogo(e.equipment),
                ]
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
      <MuscleFilterSheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        group={group}
        secondary={secondary}
        secondaryByGroup={secondaryByGroup}
        onApply={(g, sec) => {
          setFilterOpen(false);
          router.replace(libraryHref({ ...actual, grupo: g, sec }), {
            scroll: false,
          });
        }}
      />
    </div>
  );
}

/**
 * La hoja de filtros: un musculo principal y, al elegirlo, sus secundarios
 * (varios a la vez: basta con que el ejercicio trabaje uno). Se aplica al
 * tocar «Ver ejercicios».
 */
function MuscleFilterSheet({
  open,
  onOpenChange,
  group,
  secondary,
  secondaryByGroup,
  onApply,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: string | null;
  secondary: string[];
  secondaryByGroup: Record<string, string[]>;
  onApply: (group: string | null, secondary: string[]) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Filtrar por músculo">
      {/* Se monta al abrir: arranca de lo que esta aplicado. */}
      {open && (
        <FilterBody
          initialGroup={group}
          initialSecondary={secondary}
          secondaryByGroup={secondaryByGroup}
          onApply={onApply}
        />
      )}
    </Sheet>
  );
}

function FilterBody({
  initialGroup,
  initialSecondary,
  secondaryByGroup,
  onApply,
}: {
  initialGroup: string | null;
  initialSecondary: string[];
  secondaryByGroup: Record<string, string[]>;
  onApply: (group: string | null, secondary: string[]) => void;
}) {
  const [g, setG] = useState(initialGroup);
  const [sec, setSec] = useState(initialSecondary);
  const opciones = g ? (secondaryByGroup[g] ?? []) : [];
  const elegido = GRUPOS_MUSCULARES.find((x) => x.id === g);

  return (
    <div className="m-filter-sheet">
      <h3 className="m-filter-label">Músculo principal</h3>
      <div className="m-filter-grid">
        {GRUPOS_MUSCULARES.map((x) => (
          <button
            key={x.id}
            type="button"
            className="m-filter m-press"
            aria-pressed={g === x.id}
            onClick={() => {
              triggerHaptic("selection");
              setG(g === x.id ? null : x.id);
              setSec([]);
            }}
          >
            {x.label}
          </button>
        ))}
      </div>

      {elegido && opciones.length > 0 && (
        <>
          <h3 className="m-filter-label">
            Que también trabajen
            <span> · opcional</span>
          </h3>
          <div className="m-filter-grid">
            {opciones.map((m) => {
              const on = sec.includes(m);
              return (
                <button
                  key={m}
                  type="button"
                  className="m-filter m-press"
                  data-tone="soft"
                  aria-pressed={on}
                  onClick={() => {
                    triggerHaptic("selection");
                    setSec(on ? sec.filter((x) => x !== m) : [...sec, m]);
                  }}
                >
                  {capital(musculo(m))}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="m-row" style={{ gap: 10, marginTop: 6 }}>
        <button
          type="button"
          className="m-btn m-press"
          disabled={!g}
          onClick={() => onApply(null, [])}
        >
          Limpiar
        </button>
        <button
          type="button"
          className="m-btn m-press"
          data-variant="primary"
          style={{ flex: 1 }}
          onClick={() => onApply(g, g ? sec : [])}
        >
          Ver ejercicios
        </button>
      </div>
    </div>
  );
}
