"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Plus, Search, Sparkles, Store } from "lucide-react";
import { toast } from "sonner";
import {
  addRestaurantItem,
  createRestaurant,
  logRestaurantItem,
  researchRestaurant,
} from "@/features/restaurants/actions";
import type {
  RestaurantItem,
  RestaurantSummary,
} from "@/features/restaurants/queries";
import { triggerHaptic } from "@/lib/haptics";
import { Sheet } from "@/mobile/ui/sheet";
import { Stepper } from "@/mobile/ui/controls";
import { PendingTag, Tag } from "@/mobile/ui/display";
import { gramos, kcal } from "./format";

const ESTADO = {
  verificado: { tone: "ok", label: "Verificado" },
  estimado: { tone: "neutral", label: "Estimado" },
  pendiente: { tone: "warn", label: "Pendiente" },
} as const;

/**
 * Comer fuera: restaurantes de una base compartida, con su menu y el estado
 * de cada cifra (verificado, estimado o pendiente). «+» suma un plato a hoy;
 * se pueden agregar restaurantes y platos a mano, o pedirle a la IA que
 * busque el menu en internet (queda «estimado», con su fuente).
 */
export function EatOut({
  date,
  query,
  restaurants,
  selected,
  items,
  remainingKcal,
}: {
  date: string;
  query: string;
  restaurants: RestaurantSummary[];
  selected: RestaurantSummary | null;
  items: RestaurantItem[];
  remainingKcal: number | null;
}) {
  const router = useRouter();
  const [term, setTerm] = useState(query);
  const [pending, startTransition] = useTransition();
  const [adding, setAdding] = useState<RestaurantItem | null>(null);
  const [portions, setPortions] = useState(1);
  const [newItemOpen, setNewItemOpen] = useState(false);

  /* La URL sigue a lo que se escribe (no a cualquier cambio de `term`): asi
     elegir o crear un restaurante no queda pisado por la busqueda. */
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

  const crear = () =>
    startTransition(async () => {
      const r = await createRestaurant({ name: nombre });
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      toast.success(`${nombre} agregado. Ahora suma sus platos.`);
      window.clearTimeout(timer.current);
      setTerm("");
      router.replace(`/nutricion?vista=fuera&r=${r.id}`, { scroll: false });
    });

  const investigar = () =>
    selected &&
    startTransition(async () => {
      toast("Buscando el menú en internet…");
      const r = await researchRestaurant({ restaurantId: selected.id });
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      toast.success(
        r.added
          ? `${r.added} platos agregados para todos, marcados como estimados.`
          : "No encontré platos nuevos con sus valores.",
      );
      router.refresh();
    });

  const sumar = () =>
    adding &&
    startTransition(async () => {
      const r = await logRestaurantItem({
        itemId: adding.id,
        date,
        portions,
      });
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      triggerHaptic("success");
      toast.success(`${adding.name} sumado a hoy.`);
      setAdding(null);
      router.refresh();
    });

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

      {restaurants.length > 0 && (
        <div className="m-chips-scroll" role="group" aria-label="Restaurantes">
          {restaurants.map((r) => (
            <Link
              key={r.id}
              href={`/nutricion?vista=fuera&r=${r.id}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
              scroll={false}
              replace
              className="m-tab"
              aria-current={r.id === selected?.id ? "page" : undefined}
            >
              {r.name}
            </Link>
          ))}
        </div>
      )}

      {sinCoincidencia && (
        <button
          type="button"
          className="m-list-row m-press"
          disabled={pending}
          onClick={crear}
        >
          <Plus size={18} aria-hidden="true" />
          <span className="m-list-row-main">
            <span className="m-list-row-title">Agregar «{nombre}»</span>
            <span className="m-list-row-sub">Queda en la base para todos</span>
          </span>
        </button>
      )}

      {selected ? (
        <section className="m-stack" aria-labelledby="m-rest-name">
          <div className="m-row" style={{ justifyContent: "space-between" }}>
            <h2 id="m-rest-name" className="m-section">
              {selected.name}
            </h2>
            {items.some((i) => i.status !== "verificado") && (
              <PendingTag>
                {items.every((i) => i.status === "pendiente")
                  ? "Datos pendientes"
                  : "Datos estimados"}
              </PendingTag>
            )}
          </div>
          {items.length === 0 && (
            <p className="m-sub">
              Aún no hay platos de {selected.name}. Pídeselo a la IA o agrégalos
              a mano.
            </p>
          )}
          {items.map((item) => (
            <div key={item.id} className="m-food">
              <div className="m-row">
                <div className="m-food-main">
                  <span className="m-list-row-title">{item.name}</span>
                  <span className="m-list-row-sub m-num">
                    {item.calories !== null
                      ? `${kcal(item.calories)} kcal · P ${gramos(item.proteinG ?? 0)} · C ${gramos(item.carbohydrateG ?? 0)} · G ${gramos(item.fatG ?? 0)}`
                      : "[kcal] · P [g] · C [g] · G [g]"}
                  </span>
                  <span className="m-row" style={{ gap: 6, marginTop: 4 }}>
                    <Tag tone={ESTADO[item.status].tone}>
                      {ESTADO[item.status].label}
                    </Tag>
                    {item.servingLabel && (
                      <span className="m-sub" style={{ fontSize: 12 }}>
                        {item.servingLabel}
                      </span>
                    )}
                    {item.sourceUrl && (
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="m-sub"
                        aria-label={`Fuente de ${item.name}`}
                        style={{ display: "inline-flex" }}
                      >
                        <ExternalLink size={13} aria-hidden="true" />
                      </a>
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  className="m-check m-press"
                  data-size="sm"
                  aria-label={`Agregar ${item.name} a hoy`}
                  disabled={item.calories === null}
                  onClick={() => {
                    setPortions(1);
                    setAdding(item);
                  }}
                  style={{ transform: "none" }}
                >
                  <Plus size={20} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
          <div className="m-grid-2">
            <button
              type="button"
              className="m-btn m-press"
              onClick={() => setNewItemOpen(true)}
            >
              <Plus size={16} aria-hidden="true" />
              Agregar plato
            </button>
            <button
              type="button"
              className="m-btn m-press"
              disabled={pending}
              onClick={investigar}
            >
              <Sparkles size={16} aria-hidden="true" />
              {pending ? "Buscando…" : "Buscar con IA"}
            </button>
          </div>
        </section>
      ) : (
        restaurants.length === 0 &&
        !sinCoincidencia && (
          <section className="m-card">
            <Store size={22} aria-hidden="true" />
            <p className="m-sheet-text">
              Busca tu restaurante. Si no está, agrégalo: queda para todos.
            </p>
          </section>
        )
      )}

      <Link
        href={`/asistente?q=${encodeURIComponent(
          `Voy a comer fuera${selected ? ` en ${selected.name}` : ""}. ${remainingKcal !== null ? `Me quedan ${kcal(remainingKcal)} kcal hoy. ` : ""}¿Qué me conviene pedir?`,
        )}`}
        className="m-copilot-card m-press"
      >
        <span style={{ flex: 1 }}>
          <span className="m-list-row-title" style={{ display: "block" }}>
            ¿Qué me conviene pedir?
          </span>
          <span className="m-copilot-sub">
            El copiloto lo calcula con lo que te queda hoy.
          </span>
        </span>
      </Link>

      <Sheet
        open={adding !== null}
        onOpenChange={(o) => !o && setAdding(null)}
        title={adding?.name ?? ""}
        description={
          adding
            ? `${adding.servingLabel ?? "1 porción"} · ${ESTADO[adding.status].label.toLowerCase()}`
            : undefined
        }
      >
        {adding && adding.calories !== null && (
          <>
            <div className="m-row" style={{ justifyContent: "space-between" }}>
              <Stepper
                label="Porciones"
                value={portions}
                step={0.5}
                min={0.5}
                max={5}
                unit="porc."
                onChange={setPortions}
              />
              <span className="m-stat-value">
                {kcal(adding.calories * portions)}
                <small>kcal</small>
              </span>
            </div>
            <button
              type="button"
              className="m-btn m-press"
              data-variant="primary"
              data-block=""
              disabled={pending}
              onClick={sumar}
            >
              {pending ? "Guardando…" : "Agregar a hoy"}
            </button>
          </>
        )}
      </Sheet>

      {selected && (
        <NewItemSheet
          open={newItemOpen}
          onOpenChange={setNewItemOpen}
          restaurant={selected}
        />
      )}
    </div>
  );
}

function NewItemSheet({
  open,
  onOpenChange,
  restaurant,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  restaurant: RestaurantSummary;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    name: "",
    servingLabel: "",
    servingG: "",
    calories: "",
    proteinG: "",
    carbohydrateG: "",
    fatG: "",
  });
  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));
  const num = (v: string) => Number(v.replace(",", "."));
  const valido =
    form.name.trim().length >= 2 &&
    [form.calories, form.proteinG, form.carbohydrateG, form.fatG].every(
      (v) => v !== "" && Number.isFinite(num(v)),
    );

  const guardar = () =>
    startTransition(async () => {
      const r = await addRestaurantItem({
        restaurantId: restaurant.id,
        name: form.name,
        servingLabel: form.servingLabel || undefined,
        servingG: form.servingG ? num(form.servingG) : undefined,
        calories: num(form.calories),
        proteinG: num(form.proteinG),
        carbohydrateG: num(form.carbohydrateG),
        fatG: num(form.fatG),
      });
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      toast.success(`${form.name} agregado a ${restaurant.name}.`);
      onOpenChange(false);
      setForm({
        name: "",
        servingLabel: "",
        servingG: "",
        calories: "",
        proteinG: "",
        carbohydrateG: "",
        fatG: "",
      });
      router.refresh();
    });

  const campo = (k: keyof typeof form, label: string, decimal = true) => (
    <label className="m-field">
      <span>{label}</span>
      <input
        className="m-input"
        inputMode={decimal ? "decimal" : "text"}
        value={form[k]}
        onChange={set(k)}
      />
    </label>
  );

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={`Plato de ${restaurant.name}`}
      description="Por porción, tal como lo vende el restaurante. Queda como estimado para todos."
    >
      {campo("name", "Nombre", false)}
      <div className="m-grid-2">
        {campo("servingLabel", "Porción (opcional)", false)}
        {campo("servingG", "Gramos (opcional)")}
      </div>
      <div className="m-grid-2">
        {campo("calories", "Calorías")}
        {campo("proteinG", "Proteína (g)")}
        {campo("carbohydrateG", "Carbohidratos (g)")}
        {campo("fatG", "Grasas (g)")}
      </div>
      <button
        type="button"
        className="m-btn m-press"
        data-variant="primary"
        data-block=""
        disabled={!valido || pending}
        onClick={guardar}
      >
        {pending ? "Guardando…" : "Agregar plato"}
      </button>
    </Sheet>
  );
}
