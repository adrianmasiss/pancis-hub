"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Barcode,
  Camera,
  ChevronRight,
  PenLine,
  Search,
  SlidersHorizontal,
  Star,
  X,
} from "lucide-react";
import type { LibraryFood } from "@/features/foods/queries";
import { FOOD_GROUPS, type FoodGroup } from "@/features/foods/schemas";
import { messages } from "@/i18n/es-419";
import { triggerHaptic } from "@/lib/haptics";
import { Fab } from "@/mobile/ui/fab";
import { FoodThumb } from "@/mobile/ui/food-thumb";
import { Haptic } from "@/mobile/ui/haptic";
import { Sheet } from "@/mobile/ui/sheet";
import { VerifiedBadge } from "@/mobile/ui/verified-badge";
import { gramos, kcal } from "./format";

const GRUPO = messages.foods.groups;

/** Todos, sólo favoritos o sólo los que llevan el check de verificado. */
export type LibraryFilter = "todos" | "favoritos" | "verificados";

const VISTAS: { id: LibraryFilter; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "favoritos", label: "Favoritos" },
  { id: "verificados", label: "Verificados" },
];

type Filtros = {
  q?: string;
  filtro?: LibraryFilter;
  grupo?: FoodGroup | null;
  pagina?: number;
};

/** La URL de la biblioteca con sus filtros (sin los que no aplican). */
function libraryHref({ q, filtro, grupo, pagina }: Filtros) {
  const p = new URLSearchParams({ vista: "biblioteca" });
  if (q) p.set("q", q);
  if (filtro && filtro !== "todos") p.set("filtro", filtro);
  if (grupo) p.set("grupo", grupo);
  if (pagina && pagina > 1) p.set("pagina", String(pagina));
  return `/nutricion?${p}`;
}

/**
 * Biblioteca de alimentos, armada igual que la de ejercicios: buscador con
 * «Filtrar» (aqui por grupo de alimento), Todos / Favoritos / Verificados
 * con la cuenta,
 * filas con foto y chevron, y paginas. El favorito se marca en la ficha
 * (`?alimento=`), como en los ejercicios; en la lista solo se ve. El «+»
 * agrega alimentos (codigo de barras, foto de etiqueta o manual).
 */
export function FoodLibrary({
  foods,
  total,
  query,
  page,
  pageSize,
  filter,
  group,
}: {
  foods: LibraryFood[];
  total: number;
  query: string;
  page: number;
  /** Lo fija el servidor, que es quien pide la pagina. */
  pageSize: number;
  filter: LibraryFilter;
  group: FoodGroup | null;
}) {
  const router = useRouter();
  const [term, setTerm] = useState(query);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    if (term === query) return;
    const id = window.setTimeout(() => {
      router.replace(
        libraryHref({ q: term.trim(), filtro: filter, grupo: group }),
        { scroll: false },
      );
    }, 300);
    return () => window.clearTimeout(id);
  }, [term, query, router, filter, group]);

  const actual: Filtros = { q: query, filtro: filter, grupo: group };
  const pageHref = (n: number) => libraryHref({ ...actual, pagina: n });

  return (
    <div className="m-body">
      <div className="m-row" style={{ gap: 10 }}>
        <label className="m-search" style={{ flex: 1 }}>
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Buscar alimento</span>
          <input
            type="search"
            placeholder="Buscar alimento o marca"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
          />
        </label>
        <button
          type="button"
          className="m-filter-btn m-press"
          aria-label={
            group ? "Filtrar por grupo (1 activo)" : "Filtrar por grupo"
          }
          aria-haspopup="dialog"
          data-on={group ? "" : undefined}
          onClick={() => setFilterOpen(true)}
        >
          <Haptic />
          <SlidersHorizontal size={18} aria-hidden="true" />
          {group && <span className="m-filter-count">1</span>}
        </button>
      </div>

      {group && (
        <div className="m-active-filters">
          <Link
            href={libraryHref({ ...actual, grupo: null })}
            className="m-active-filter m-press"
            scroll={false}
            aria-label={`Quitar ${GRUPO[group]}`}
          >
            {GRUPO[group]}
            <X size={14} aria-hidden="true" />
          </Link>
        </div>
      )}

      <div className="m-row">
        {VISTAS.map((v) => (
          <Link
            key={v.id}
            href={libraryHref({ ...actual, filtro: v.id })}
            className="m-filter m-press"
            aria-current={filter === v.id ? "page" : undefined}
            scroll={false}
          >
            <Haptic />
            {v.id === "verificados" && <VerifiedBadge size={14} decorative />}
            {v.label}
          </Link>
        ))}
      </div>
      {/* En su propia linea: con tres filtros ya no cabe al lado. */}
      <span className="m-sub m-num" style={{ marginTop: -4 }}>
        {total} {total === 1 ? "alimento" : "alimentos"}
      </span>
      {foods.length === 0 && (
        <p className="m-sub">
          {filter === "favoritos"
            ? "Aún no tienes favoritos. Toca la estrella en la ficha de un alimento."
            : filter === "verificados"
              ? "Ningún alimento verificado con esta búsqueda."
              : "Sin resultados."}
        </p>
      )}
      <div className="m-stack m-stagger">
        {foods.map((food) => (
          <Link
            key={food.id}
            href={`/nutricion?vista=biblioteca&alimento=${food.id}`}
            className="m-list-row m-press"
          >
            <FoodThumb imageUrl={food.imageUrl} foodGroup={food.foodGroup} />
            <span className="m-list-row-main">
              <span className="m-verified-line">
                <span className="m-list-row-title">{food.name}</span>
                {food.confirmed && <VerifiedBadge size={15} />}
              </span>
              <span className="m-list-row-sub m-num">
                {kcal(food.calories)} kcal · P {gramos(food.proteinG)} · C{" "}
                {gramos(food.carbohydrateG)} · G {gramos(food.fatG)}
              </span>
            </span>
            {food.isFavorite && (
              <Star
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
      {total > pageSize && (
        <div className="m-row" style={{ justifyContent: "space-between" }}>
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="m-btn m-press">
              Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="m-sub">
            {page} / {Math.ceil(total / pageSize)}
          </span>
          {page * pageSize < total ? (
            <Link href={pageHref(page + 1)} className="m-btn m-press">
              Siguiente
            </Link>
          ) : (
            <span />
          )}
        </div>
      )}

      <Fab
        label="Agregar alimento"
        actions={[
          {
            label: "Código de barras",
            sub: "Escanéalo con la cámara.",
            icon: Barcode,
            href: "/nutricion?vista=escanear",
          },
          {
            label: "Foto de etiqueta",
            sub: "La tabla nutricional, leída de una foto.",
            icon: Camera,
            href: "/nutricion/alimentos?metodo=foto",
          },
          {
            label: "Manual",
            sub: "Escribe tú los valores por 100 g.",
            icon: PenLine,
            href: "/nutricion/alimentos?metodo=manual",
          },
        ]}
      />

      <Sheet
        open={filterOpen}
        onOpenChange={setFilterOpen}
        title="Filtrar por grupo"
      >
        {/* Se monta al abrir: arranca de lo que esta aplicado. */}
        {filterOpen && (
          <GroupFilter
            initialGroup={group}
            onApply={(g) => {
              setFilterOpen(false);
              router.replace(libraryHref({ ...actual, grupo: g }), {
                scroll: false,
              });
            }}
          />
        )}
      </Sheet>
    </div>
  );
}

/** Un grupo a la vez; se aplica al tocar «Ver alimentos». */
function GroupFilter({
  initialGroup,
  onApply,
}: {
  initialGroup: FoodGroup | null;
  onApply: (group: FoodGroup | null) => void;
}) {
  const [g, setG] = useState(initialGroup);

  return (
    <div className="m-filter-sheet">
      <h3 className="m-filter-label">Grupo de alimento</h3>
      <div className="m-filter-grid">
        {FOOD_GROUPS.map((x) => (
          <button
            key={x}
            type="button"
            className="m-filter m-press"
            aria-pressed={g === x}
            onClick={() => {
              triggerHaptic("selection");
              setG(g === x ? null : x);
            }}
          >
            <Haptic />
            {GRUPO[x]}
          </button>
        ))}
      </div>

      <div className="m-row" style={{ gap: 10, marginTop: 6 }}>
        <button
          type="button"
          className="m-btn m-press"
          disabled={!g}
          onClick={() => onApply(null)}
        >
          Limpiar
        </button>
        <button
          type="button"
          className="m-btn m-press"
          data-variant="primary"
          style={{ flex: 1 }}
          onClick={() => onApply(g)}
        >
          Ver alimentos
        </button>
      </div>
    </div>
  );
}
