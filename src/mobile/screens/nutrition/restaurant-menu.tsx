"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  CupSoda,
  ExternalLink,
  IceCreamCone,
  Plus,
  Salad,
  Search,
  Sparkles,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  addRestaurantItem,
  researchRestaurant,
} from "@/features/restaurants/actions";
import type {
  RestaurantItem,
  RestaurantSummary,
} from "@/features/restaurants/queries";
import {
  CATEGORY_LABEL,
  MENU_SECTIONS,
  SECTION_LABEL,
  bestForToday,
  fitOf,
  type Fit,
  type MenuSection,
} from "@/features/restaurants/lib/menu";
import { triggerHaptic } from "@/lib/haptics";
import { BackButton } from "@/mobile/ui/back-button";
import { Haptic } from "@/mobile/ui/haptic";
import { Sheet } from "@/mobile/ui/sheet";
import { VerifiedBadge } from "@/mobile/ui/verified-badge";
import { RestaurantAvatar, restaurantHref } from "./eat-out";
import { gramos, kcal } from "./format";

export const SECTION_ICON: Record<MenuSection, LucideIcon> = {
  plato: Utensils,
  acompanamiento: Salad,
  bebida: CupSoda,
  postre: IceCreamCone,
};

export const FIT_TAG: Record<Fit, { tone: string; label: string }> = {
  cabe: { tone: "ok", label: "Cabe" },
  justo: { tone: "neutral", label: "Justo" },
  "te-pasas": { tone: "warn", label: "Te pasas" },
};

export const dishHref = (restaurantId: string, itemId: string) =>
  `${restaurantHref(restaurantId)}&plato=${itemId}`;

/**
 * El menu de un restaurante: quien es y cuanto te queda, buscar en el menu,
 * la mejor opcion para hoy, filtro por seccion y los platos agrupados con si
 * caben en tu dia. Cada plato abre su ficha.
 */
export function RestaurantMenu({
  restaurant,
  items,
  remainingKcal,
}: {
  restaurant: RestaurantSummary;
  items: RestaurantItem[];
  remainingKcal: number | null;
}) {
  const router = useRouter();
  const [term, setTerm] = useState("");
  const [section, setSection] = useState<MenuSection | null>(null);
  const [soloVerificados, setSoloVerificados] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const best = bestForToday(items, remainingKcal);
  const q = term.trim().toLowerCase();
  const verificados = items.filter((i) => i.status === "verificado").length;
  const buscados = items.filter(
    (i) =>
      (!q || i.name.toLowerCase().includes(q)) &&
      (!soloVerificados || i.status === "verificado"),
  );
  const presentes = MENU_SECTIONS.filter((s) =>
    items.some((i) => i.section === s),
  );
  const grupos = MENU_SECTIONS.filter((s) => !section || s === section)
    .map((s) => ({ s, items: buscados.filter((i) => i.section === s) }))
    .filter((g) => g.items.length > 0);

  const investigar = () =>
    startTransition(async () => {
      toast("Buscando el menú en internet…");
      const r = await researchRestaurant({ restaurantId: restaurant.id });
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

  const fuentes = new Set(items.map((i) => i.status));
  const nota = fuentes.has("verificado")
    ? fuentes.size === 1
      ? "Valores de la tabla oficial del restaurante, revisados."
      : "Unos valores son de la tabla oficial revisada; otros, estimados."
    : "Valores estimados: buscados por la IA o escritos por usuarios.";

  return (
    <div className="m-screen" data-m-fullscreen="" style={{ paddingBottom: 0 }}>
      <div className="m-step-head">
        <BackButton fallback="/nutricion?vista=fuera" />
        <span className="m-sub">Comer fuera</span>
      </div>

      <div className="m-body m-stagger" style={{ paddingTop: 4 }}>
        <header className="m-rest-hero">
          <RestaurantAvatar
            name={restaurant.name}
            logoUrl={restaurant.logoUrl}
            size={56}
          />
          <div style={{ minWidth: 0 }}>
            <h1 className="m-title" style={{ fontSize: 28 }}>
              {restaurant.name}
            </h1>
            <p className="m-sub">
              {CATEGORY_LABEL[restaurant.category ?? "otro"]}
              {remainingKcal !== null && (
                <>
                  {" "}
                  · Te quedan{" "}
                  <strong className="m-num">{kcal(remainingKcal)} kcal</strong>
                </>
              )}
            </p>
          </div>
        </header>

        {items.length > 0 && (
          <label className="m-search">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">Buscar en el menú</span>
            <input
              type="search"
              placeholder="Buscar en el menú"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
          </label>
        )}

        {best && !q && (
          <Link
            href={dishHref(restaurant.id, best.id)}
            className="m-rest-best m-press"
          >
            <DishThumb section={best.section} size={48} />
            <span style={{ flex: 1, minWidth: 0 }}>
              <span className="m-eyebrow" data-tone="accent">
                Mejor opción para hoy
              </span>
              <span className="m-verified-line">
                <span className="m-list-row-title">{best.name}</span>
                {best.status === "verificado" && <VerifiedBadge size={15} />}
              </span>
              <span className="m-list-row-sub m-num">
                {kcal(best.calories ?? 0)} kcal · el que más proteína te aporta
                ({gramos(best.proteinG ?? 0)} g)
              </span>
            </span>
            <ChevronRight size={18} aria-hidden="true" />
          </Link>
        )}

        {(presentes.length > 1 || verificados > 0) && (
          <div
            className="m-chips-scroll"
            role="group"
            aria-label="Filtrar menú"
          >
            <button
              type="button"
              className="m-filter m-press"
              aria-pressed={section === null && !soloVerificados}
              onClick={() => {
                setSection(null);
                setSoloVerificados(false);
              }}
            >
              <Haptic />
              Todo
            </button>
            {verificados > 0 && (
              <button
                type="button"
                className="m-filter m-press"
                aria-pressed={soloVerificados}
                onClick={() => {
                  triggerHaptic("selection");
                  setSoloVerificados(!soloVerificados);
                }}
              >
                <Haptic />
                <VerifiedBadge size={14} decorative />
                Verificados
              </button>
            )}
            {presentes.length > 1 &&
              presentes.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="m-filter m-press"
                  aria-pressed={section === s}
                  onClick={() => {
                    triggerHaptic("selection");
                    setSection(section === s ? null : s);
                  }}
                >
                  <Haptic />
                  {SECTION_LABEL[s]}
                </button>
              ))}
          </div>
        )}

        {items.length === 0 && (
          <section className="m-card m-rest-empty">
            <Utensils size={22} aria-hidden="true" />
            <p className="m-sheet-text">
              Aún no hay platos de {restaurant.name}. Pídele a la IA que busque
              su menú o agrégalos a mano.
            </p>
          </section>
        )}
        {items.length > 0 && grupos.length === 0 && (
          <p className="m-sub">
            {soloVerificados && !q
              ? "Ningún plato verificado en esta sección."
              : "Ningún plato con ese nombre."}
          </p>
        )}

        {grupos.map((g) => (
          <section key={g.s} className="m-stack" style={{ gap: 8 }}>
            <h2 className="m-eyebrow">{SECTION_LABEL[g.s]}</h2>
            <div className="m-stack m-stagger" style={{ gap: 8 }}>
              {g.items.map((item) => {
                const fit =
                  item.calories !== null
                    ? fitOf(item.calories, remainingKcal)
                    : null;
                return (
                  <Link
                    key={item.id}
                    href={dishHref(restaurant.id, item.id)}
                    className="m-list-row m-press"
                  >
                    <DishThumb section={item.section} />
                    <span className="m-list-row-main">
                      <span className="m-verified-line">
                        <span className="m-list-row-title">{item.name}</span>
                        {item.status === "verificado" && (
                          <VerifiedBadge size={15} />
                        )}
                      </span>
                      <span className="m-rest-item-sub">
                        <span className="m-list-row-sub m-num">
                          {item.calories !== null
                            ? `${kcal(item.calories)} kcal · P ${gramos(item.proteinG ?? 0)} g`
                            : "Sin valores aún"}
                        </span>
                        {fit && (
                          <span className="m-tag" data-tone={FIT_TAG[fit].tone}>
                            {FIT_TAG[fit].label}
                          </span>
                        )}
                        {item.status === "pendiente" && (
                          <span className="m-tag" data-tone="warn">
                            Pendiente
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
                );
              })}
            </div>
          </section>
        ))}

        <div className="m-grid-2">
          <button
            type="button"
            className="m-btn m-press"
            onClick={() => setNewOpen(true)}
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
        {items.length > 0 && (
          <p className="m-sub m-rest-note">
            {nota}
            {items.find((i) => i.sourceUrl)?.sourceUrl && (
              <>
                {" "}
                <a
                  href={items.find((i) => i.sourceUrl)!.sourceUrl!}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver fuente
                  <ExternalLink size={12} aria-hidden="true" />
                </a>
              </>
            )}
          </p>
        )}
      </div>

      <NewItemSheet
        open={newOpen}
        onOpenChange={setNewOpen}
        restaurant={restaurant}
      />
    </div>
  );
}

/** Baldosa del plato: sin fotos de los restaurantes, el icono de su seccion. */
export function DishThumb({
  section,
  size = 44,
}: {
  section: MenuSection;
  size?: number;
}) {
  const Icon = SECTION_ICON[section];
  return (
    <span
      className="m-food-thumb"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <Icon size={size * 0.45} strokeWidth={1.6} />
    </span>
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
  const vacio = {
    name: "",
    servingLabel: "",
    servingG: "",
    calories: "",
    proteinG: "",
    carbohydrateG: "",
    fatG: "",
  };
  const [form, setForm] = useState(vacio);
  const [section, setSection] = useState<MenuSection>("plato");
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
        section,
      });
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      toast.success(`${form.name} agregado a ${restaurant.name}.`);
      onOpenChange(false);
      setForm(vacio);
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
      <div className="m-chips-scroll" role="group" aria-label="Sección">
        {MENU_SECTIONS.map((s) => (
          <button
            key={s}
            type="button"
            className="m-filter m-press"
            aria-pressed={section === s}
            onClick={() => setSection(s)}
          >
            <Haptic />
            {SECTION_LABEL[s]}
          </button>
        ))}
      </div>
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
