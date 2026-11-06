"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus, Search, Sparkles, Store } from "lucide-react";
import { toast } from "sonner";
import {
  createRestaurant,
  researchRestaurant,
} from "@/features/restaurants/actions";
import type { RestaurantSummary } from "@/features/restaurants/queries";
import {
  CATEGORY_LABEL,
  RESTAURANT_CATEGORIES,
  initials,
  type RestaurantCategory,
} from "@/features/restaurants/lib/menu";
import { triggerHaptic } from "@/lib/haptics";
import { Haptic } from "@/mobile/ui/haptic";
import { Sheet } from "@/mobile/ui/sheet";
import { VerifiedBadge } from "@/mobile/ui/verified-badge";
import { kcal } from "./format";

/** La ficha de un restaurante (su menu) dentro de «Comer fuera». */
export const restaurantHref = (id: string) => `/nutricion?vista=fuera&r=${id}`;

/**
 * El avatar de un restaurante: su logo real sobre blanco (como un icono de
 * app) o, si no hay o no carga, sus iniciales en una baldosa.
 */
export function RestaurantAvatar({
  name,
  logoUrl = null,
  size = 44,
}: {
  name: string;
  logoUrl?: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const logo = logoUrl && !failed;
  return (
    <span
      className="m-rest-avatar"
      data-logo={logo ? "" : undefined}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        padding: logo ? Math.round(size * 0.14) : undefined,
      }}
      aria-hidden="true"
    >
      {logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoUrl}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          ref={(img) => {
            // Si fallo antes de hidratar, onError ya no llega.
            if (img?.complete && img.naturalWidth === 0) setFailed(true);
          }}
          onError={() => setFailed(true)}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}

/**
 * Comer fuera, el directorio (nov 2026, segun la referencia): buscador, la
 * pregunta al copiloto, filtro por tipo de comida y la lista de restaurantes
 * de la base compartida. Cada uno abre su menu; si el tuyo no esta, se agrega
 * y la IA busca su menu para todos.
 */
export function EatOut({
  query,
  restaurants,
  remainingKcal,
}: {
  query: string;
  restaurants: RestaurantSummary[];
  remainingKcal: number | null;
}) {
  const router = useRouter();
  const [term, setTerm] = useState(query);
  const [category, setCategory] = useState<RestaurantCategory | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  /* La URL sigue a lo que se escribe (no a cualquier cambio de `term`): asi
     crear un restaurante no queda pisado por la busqueda. */
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const buscar = (value: string) => {
    setTerm(value);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      const p = new URLSearchParams({ vista: "fuera" });
      if (value.trim()) p.set("q", value.trim());
      router.replace(`/nutricion?${p}`, { scroll: false });
    }, 300);
  };

  const nombre = term.trim();
  const sinCoincidencia =
    nombre.length >= 2 &&
    !restaurants.some((r) => r.name.toLowerCase() === nombre.toLowerCase());

  // Solo los tipos que hay: un filtro que no devuelve nada no sirve.
  const presentes = RESTAURANT_CATEGORIES.filter((c) =>
    restaurants.some((r) => (r.category ?? "otro") === c),
  );
  const visibles = category
    ? restaurants.filter((r) => (r.category ?? "otro") === category)
    : restaurants;

  return (
    <div className="m-body m-stagger">
      <label className="m-search">
        <Search size={18} aria-hidden="true" />
        <span className="sr-only">Buscar restaurante</span>
        <input
          type="search"
          placeholder="Buscar restaurante"
          value={term}
          onChange={(e) => buscar(e.target.value)}
        />
      </label>

      <Link
        href={`/asistente?q=${encodeURIComponent(
          `Voy a comer fuera. ${remainingKcal !== null ? `Me quedan ${kcal(remainingKcal)} kcal hoy. ` : ""}¿Qué me conviene pedir?`,
        )}`}
        className="m-copilot-card m-press"
      >
        <span className="m-copilot-icon" aria-hidden="true">
          <Sparkles size={18} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="m-list-row-title" style={{ display: "block" }}>
            ¿Qué me conviene pedir?
          </span>
          <span className="m-copilot-sub">
            El copiloto lo calcula con lo que te queda hoy.
          </span>
        </span>
        <ChevronRight size={18} aria-hidden="true" />
      </Link>

      {presentes.length > 1 && (
        <div
          className="m-chips-scroll"
          role="group"
          aria-label="Tipo de comida"
        >
          <button
            type="button"
            className="m-filter m-press"
            aria-pressed={category === null}
            onClick={() => setCategory(null)}
          >
            <Haptic />
            Todos
          </button>
          {presentes.map((c) => (
            <button
              key={c}
              type="button"
              className="m-filter m-press"
              aria-pressed={category === c}
              onClick={() => {
                triggerHaptic("selection");
                setCategory(category === c ? null : c);
              }}
            >
              <Haptic />
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
      )}

      {sinCoincidencia && (
        <button
          type="button"
          className="m-list-row m-press"
          onClick={() => setNewOpen(true)}
        >
          <span className="m-rest-avatar" data-add="" aria-hidden="true">
            <Plus size={18} />
          </span>
          <span className="m-list-row-main">
            <span className="m-list-row-title">Agregar «{nombre}»</span>
            <span className="m-list-row-sub">Queda en la base para todos</span>
          </span>
          <ChevronRight className="m-chevron" size={18} aria-hidden="true" />
        </button>
      )}

      {visibles.length > 0 ? (
        <section className="m-stack" style={{ gap: 8 }}>
          <h2 className="m-eyebrow">
            {category ? CATEGORY_LABEL[category] : "Restaurantes"}
          </h2>
          <div className="m-stack m-stagger" style={{ gap: 8 }}>
            {visibles.map((r) => (
              <Link
                key={r.id}
                href={restaurantHref(r.id)}
                className="m-list-row m-press"
              >
                <RestaurantAvatar name={r.name} logoUrl={r.logoUrl} />
                <span className="m-list-row-main">
                  <span className="m-list-row-title">{r.name}</span>
                  <span className="m-list-row-sub">
                    {CATEGORY_LABEL[r.category ?? "otro"]} ·{" "}
                    {r.itemCount > 0
                      ? `${r.itemCount} ${r.itemCount === 1 ? "plato" : "platos"}`
                      : "sin menú aún"}
                    {r.verifiedCount > 0 && " · "}
                    {r.verifiedCount > 0 && (
                      <span className="m-rest-verified">
                        <VerifiedBadge size={13} decorative />
                        {r.verifiedCount}{" "}
                        {r.verifiedCount === 1 ? "verificado" : "verificados"}
                      </span>
                    )}
                  </span>
                </span>
                <ChevronRight
                  className="m-chevron"
                  size={18}
                  aria-hidden="true"
                />
              </Link>
            ))}
          </div>
        </section>
      ) : (
        !sinCoincidencia && (
          <section className="m-card m-rest-empty">
            <Store size={22} aria-hidden="true" />
            <p className="m-sheet-text">
              {query
                ? "No hay restaurantes con ese nombre."
                : "Aún no hay restaurantes. Agrega el primero: queda para todos."}
            </p>
          </section>
        )
      )}

      <button
        type="button"
        className="m-rest-missing m-press"
        onClick={() => setNewOpen(true)}
      >
        <span className="m-rest-avatar" data-add="" aria-hidden="true">
          <Plus size={18} />
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span className="m-list-row-title" style={{ display: "block" }}>
            ¿No está tu restaurante?
          </span>
          <span className="m-list-row-sub" style={{ display: "block" }}>
            Agrégalo y la IA busca su menú; queda disponible para todos.
          </span>
        </span>
      </button>

      <Sheet open={newOpen} onOpenChange={setNewOpen} title="Nuevo restaurante">
        {/* Se monta al abrir: arranca con lo que se busco. */}
        {newOpen && (
          <NewRestaurant
            initialName={sinCoincidencia ? nombre : ""}
            onDone={(id) => {
              setNewOpen(false);
              window.clearTimeout(timer.current);
              router.push(restaurantHref(id));
            }}
          />
        )}
      </Sheet>
    </div>
  );
}

/** Nombre, tipo de comida y, si se quiere, la IA busca el menu enseguida. */
function NewRestaurant({
  initialName,
  onDone,
}: {
  initialName: string;
  onDone: (id: string) => void;
}) {
  const [name, setName] = useState(initialName);
  const [category, setCategory] = useState<RestaurantCategory | null>(null);
  const [pending, startTransition] = useTransition();

  const crear = (conIa: boolean) =>
    startTransition(async () => {
      const r = await createRestaurant({
        name: name.trim(),
        category: category ?? undefined,
      });
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      triggerHaptic("success");
      if (conIa) {
        toast("Buscando el menú en internet…");
        const m = await researchRestaurant({ restaurantId: r.id });
        if ("error" in m) toast.error(m.error);
        else
          toast.success(
            m.added
              ? `${m.added} platos agregados para todos, marcados como estimados.`
              : "No encontré platos con sus valores. Agrégalos a mano.",
          );
      } else {
        toast.success(`${name.trim()} agregado. Ahora suma sus platos.`);
      }
      onDone(r.id);
    });

  const valido = name.trim().length >= 2;

  return (
    <div className="m-filter-sheet">
      <label className="m-field">
        <span>Nombre</span>
        <input
          className="m-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Subway"
        />
      </label>
      <h3 className="m-filter-label">Tipo de comida</h3>
      <div className="m-filter-grid">
        {RESTAURANT_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            className="m-filter m-press"
            aria-pressed={category === c}
            onClick={() => {
              triggerHaptic("selection");
              setCategory(category === c ? null : c);
            }}
          >
            <Haptic />
            {CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>
      <div className="m-row" style={{ gap: 10, marginTop: 6 }}>
        <button
          type="button"
          className="m-btn m-press"
          disabled={!valido || pending}
          onClick={() => crear(false)}
        >
          Solo agregar
        </button>
        <button
          type="button"
          className="m-btn m-press"
          data-variant="primary"
          style={{ flex: 1 }}
          disabled={!valido || pending}
          onClick={() => crear(true)}
        >
          <Sparkles size={16} aria-hidden="true" />
          {pending ? "Buscando…" : "Agregar y buscar menú"}
        </button>
      </div>
    </div>
  );
}
