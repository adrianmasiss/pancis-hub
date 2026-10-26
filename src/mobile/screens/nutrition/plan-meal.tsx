"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ChefHat,
  ChevronDown,
  Clock,
  Ellipsis,
  Plus,
  Scale,
  SlidersHorizontal,
  Trash2,
  Undo2,
} from "lucide-react";
import { toast } from "sonner";
import type {
  DietTemplateItemView,
  DietTemplateMealView,
} from "@/features/dashboard/queries";
import type { MealItemView, MealView } from "@/features/nutrition/queries";
import {
  addMealItem,
  deleteMeal,
  deleteMealItem,
  logMeal,
  updateMealItemQuantity,
  updateMealTime,
} from "@/features/nutrition/actions";
import {
  setDietItemOmittedForDay,
  swapDietItemForDay,
} from "@/features/nutrition/day-swap-actions";
import {
  clearMealTimeForDay,
  setMealTimeForDay,
} from "@/features/nutrition/meal-time-actions";
import type { MacroSet } from "@/features/nutrition/lib/macros";
import { CheckCircle } from "@/mobile/ui/controls";
import { SwipeRow } from "@/mobile/ui/swipe-row";
import {
  ActionSheet,
  QuantitySheet,
  RecipeSwapSheet,
  TimeWheelSheet,
} from "./day-sheets";
import { ExtraSheet } from "./extra-sheet";
import { MacroSplitBar, TRES } from "./macro-split";
import { addMacros, gramos, kcal, mealLabel, mealTypeLabel } from "./format";

export { MacroSplitBar } from "./macro-split";

type LongPress = Partial<React.HTMLAttributes<HTMLDivElement>>;

/** Lo que se edita de un alimento: nombre, gramos y macros de esos gramos. */
type Editing = { name: string; grams: number; macros: MacroSet } & (
  | { kind: "plan"; item: DietTemplateItemView }
  | { kind: "registrado"; item: MealItemView }
);

const ok = (r: { error?: string } | { success: true }) => {
  if ("error" in r && r.error) {
    toast.error(r.error);
    return false;
  }
  return true;
};

/**
 * Una comida del plan que se despliega ahi mismo. Cerrada: su hora, nombre,
 * kcal y de donde salen. Abierta: cada ingrediente con gramos, kcal y P/C/G
 * en sus colores; tocarlo lo sustituye y deslizarlo cambia la cantidad o lo
 * quita, solo hoy. Debajo, los extras de hoy, la hora y el menu «⋯».
 */
export function PlanMeal({
  meal,
  date,
  today,
  open,
  onOpenChange,
  done,
  canToggle,
  onToggle,
  movedFrom,
  logged,
  extras,
  ensureLogged,
  longPress,
}: {
  meal: DietTemplateMealView;
  date: string;
  today: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  done: boolean;
  canToggle: boolean;
  onToggle: () => void;
  movedFrom: string | undefined;
  /** La comida registrada hoy a partir de esta, si la hay. */
  logged: MealView | undefined;
  /** Extras de hoy dentro de esta comida. */
  extras: MealView[];
  /** Registra la comida si aun no lo esta; devuelve su id. */
  ensureLogged: () => Promise<string | null>;
  /** Mantener presionada la cabecera para moverla de lugar. */
  longPress: LongPress;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [timeOpen, setTimeOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [recipeOpen, setRecipeOpen] = useState(false);
  const [extraOpen, setExtraOpen] = useState(false);
  const [editing, setEditing] = useState<Editing | null>(null);

  const time = meal.scheduledTime?.slice(0, 5);
  const items = meal.items.filter((i) => !i.omitted);
  const omitted = meal.items.filter((i) => i.omitted);
  const quitada = items.length === 0 && omitted.length > 0;
  const swapped = meal.items.some((i) => i.daySwap && !i.omitted);
  /* Cambiada por receta: lo que cuenta es lo registrado, no el plan. */
  const changed = done && logged?.status === "completada_con_cambios";
  const shown = changed ? logged!.items : null;
  const foods = (shown ?? items).map((i) => i.foodName).join(", ");
  const name = mealLabel(meal.mealType, meal.name);
  const title = meal.name?.trim() || foods || mealLabel(meal.mealType);
  const fecha = date !== today ? `&fecha=${date}` : "";
  const bodyId = `m-meal-${meal.id}`;

  const base = changed ? logged!.totals : meal.totals;
  const totals = extras.reduce((t, e) => addMacros(t, e.totals), base);

  const refresh = () => router.refresh();

  /* Quitar o devolver sin perder una sustitucion previa del dia. */
  const omitir = (item: DietTemplateItemView, omitted: boolean) =>
    setDietItemOmittedForDay({ templateItemId: item.id, date, omitted });

  const quitarItem = (item: DietTemplateItemView) =>
    startTransition(async () => {
      if (!ok(await omitir(item, true))) return;
      refresh();
      toast(`${item.foodName} quitado hoy`, {
        action: {
          label: "Deshacer",
          onClick: async () => {
            if (ok(await omitir(item, false))) refresh();
          },
        },
      });
    });

  const quitarComida = () =>
    startTransition(async () => {
      const results = await Promise.all(items.map((i) => omitir(i, true)));
      refresh();
      if (!results.every(ok)) return;
      toast(`${name} quitada hoy`, {
        action: { label: "Deshacer", onClick: restaurar },
      });
    });

  async function restaurar() {
    const targets = quitada ? omitted : items;
    await Promise.all(targets.map((i) => omitir(i, false)));
    refresh();
  }

  return (
    <div
      className="m-plan-meal"
      data-open={open ? "" : undefined}
      data-done={done ? "" : undefined}
    >
      <div className="m-plan-meal-head" {...longPress}>
        <button
          type="button"
          className="m-plan-meal-toggle m-press"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => onOpenChange(!open)}
        >
          <span className="m-plan-meal-main">
            <span className="m-meal-meta">
              {time && <span className="m-num">{time}</span>}
              {time && " · "}
              {mealTypeLabel(meal.mealType)}
              {quitada ? (
                <Tag tone="neutral">Quitada hoy</Tag>
              ) : changed ? (
                <Tag tone="warn">Cambiada hoy</Tag>
              ) : (
                swapped && <Tag tone="warn">Ajustada hoy</Tag>
              )}
              {movedFrom !== undefined && <Tag tone="neutral">Movida hoy</Tag>}
            </span>
            <span className="m-plan-meal-title">{title}</span>
            <MacroSplitBar macros={totals} />
          </span>
          <span className="m-plan-meal-kcal">
            <span className="m-num">{kcal(totals.calories)}</span>
            <small>kcal</small>
          </span>
          <ChevronDown
            className="m-chevron m-disclosure-chevron"
            size={18}
            aria-hidden="true"
          />
        </button>
        <CheckCircle
          checked={done}
          label={done ? `Desmarcar ${name}` : `Marcar ${name} como comida`}
          disabled={!canToggle}
          onToggle={onToggle}
        />
      </div>

      <div id={bodyId} className="m-disclosure-body" inert={!open}>
        <div>
          <div className="m-plan-meal-body">
            <IngHead />
            <ul className="m-ing-list">
              {shown
                ? shown.map((item) => (
                    <li key={item.id} className="m-ing">
                      <IngCells
                        name={item.foodName}
                        grams={item.quantityG}
                        macros={item.macros}
                      />
                    </li>
                  ))
                : items.map((item) => (
                    <SwipeRow
                      key={item.id}
                      rootClassName="m-ing-swipe"
                      className="m-ing"
                      deleteLabel={`Quitar ${item.foodName} hoy`}
                      disabled={done}
                      onDelete={() => quitarItem(item)}
                      secondary={
                        item.daySwap?.source === "asistente"
                          ? undefined
                          : {
                              label: "Cantidad",
                              icon: <Scale size={18} aria-hidden="true" />,
                              onClick: () =>
                                setEditing({
                                  kind: "plan",
                                  item,
                                  name: item.foodName,
                                  grams: item.quantityG,
                                  macros: item.macros,
                                }),
                            }
                      }
                    >
                      <IngCells
                        name={item.foodName}
                        grams={item.quantityG}
                        macros={item.macros}
                        note={
                          item.daySwap &&
                          item.daySwap.originalFoodName !== item.foodName
                            ? `en lugar de ${item.daySwap.originalFoodName}`
                            : undefined
                        }
                        href={
                          done
                            ? undefined
                            : `/nutricion?vista=comparar&item=${item.id}`
                        }
                      />
                    </SwipeRow>
                  ))}
              {extras.flatMap((extra) =>
                extra.items.map((item) => (
                  <SwipeRow
                    key={item.id}
                    rootClassName="m-ing-swipe"
                    className="m-ing"
                    data-extra=""
                    deleteLabel={`Quitar ${item.foodName}`}
                    onDelete={() =>
                      startTransition(() =>
                        quitarRegistrado(extra, item, date, refresh),
                      )
                    }
                  >
                    <IngCells
                      name={item.foodName}
                      grams={item.quantityG}
                      macros={item.macros}
                      tag="Extra de hoy"
                    />
                  </SwipeRow>
                )),
              )}
            </ul>
            {quitada && (
              <p className="m-ing-note">
                Hoy no la comes. Tu plan sigue igual mañana.
              </p>
            )}
            <IngTotal totals={totals} />
            {!quitada && !changed && (
              <p className="m-ing-hint">
                {done
                  ? "Desmarca la comida para cambiar sus alimentos."
                  : "Toca un alimento para sustituirlo. Deslízalo para cambiar la cantidad o quitarlo hoy."}
              </p>
            )}

            <div className="m-meal-tools">
              <button
                type="button"
                className="m-time-chip m-press"
                aria-label={
                  time ? `Hora: ${time}. Cambiar solo hoy` : "Poner hora"
                }
                onClick={() => setTimeOpen(true)}
              >
                <Clock size={16} aria-hidden="true" />
                <span className="m-num">{time ?? "--:--"}</span>
              </button>
              {quitada ? (
                <button
                  type="button"
                  className="m-btn m-press"
                  onClick={() => startTransition(restaurar)}
                >
                  <Undo2 size={16} aria-hidden="true" />
                  Restaurar comida
                </button>
              ) : (
                <button
                  type="button"
                  className="m-btn m-press"
                  onClick={() => setExtraOpen(true)}
                >
                  <Plus size={16} aria-hidden="true" />
                  Agregar extra
                </button>
              )}
              <button
                type="button"
                className="m-icon-btn m-press"
                data-variant="soft"
                aria-label={`Más acciones de ${name}`}
                onClick={() => setMenuOpen(true)}
              >
                <Ellipsis size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ActionSheet
        open={menuOpen}
        onOpenChange={setMenuOpen}
        title={name}
        description="Los cambios son solo por hoy."
        actions={[
          {
            label: "Cambiar por una receta",
            icon: <ChefHat size={18} aria-hidden="true" />,
            disabled: quitada || meal.items.length === 0,
            onClick: () => setRecipeOpen(true),
          },
          {
            label: "Editar gramos",
            icon: <SlidersHorizontal size={18} aria-hidden="true" />,
            disabled: quitada,
            onClick: () => router.push(`/nutricion?comida=${meal.id}${fecha}`),
          },
          ...(movedFrom
            ? [
                {
                  label: `Volver a las ${movedFrom}`,
                  icon: <Undo2 size={18} aria-hidden="true" />,
                  onClick: () =>
                    startTransition(async () => {
                      if (
                        ok(
                          await clearMealTimeForDay({
                            templateMealId: meal.id,
                            date,
                          }),
                        )
                      )
                        refresh();
                    }),
                },
              ]
            : []),
          {
            label: "Quitar hoy",
            icon: <Trash2 size={18} aria-hidden="true" />,
            tone: "danger" as const,
            disabled: done || quitada || items.length === 0,
            onClick: quitarComida,
          },
        ]}
      />

      <TimeWheelSheet
        open={timeOpen}
        onOpenChange={setTimeOpen}
        title={`¿A qué hora ${name.toLowerCase()}?`}
        description="Solo por hoy. Mañana vuelve a la hora de tu plan."
        value={time ?? "12:00"}
        onSave={async (hora) => {
          const r = await setMealTimeForDay({
            templateMealId: meal.id,
            date,
            time: hora,
          });
          if (!ok(r)) return false;
          toast.success(`Hoy a las ${hora}.`);
          refresh();
          return true;
        }}
        reset={
          movedFrom
            ? {
                label: `Volver a las ${movedFrom}`,
                onClick: async () => {
                  const r = await clearMealTimeForDay({
                    templateMealId: meal.id,
                    date,
                  });
                  if (!ok(r)) return false;
                  refresh();
                  return true;
                },
              }
            : undefined
        }
      />

      <RecipeSwapSheet
        open={recipeOpen}
        onOpenChange={setRecipeOpen}
        mealName={name}
        mealId={logged?.id ?? null}
        planned={meal.totals}
        ensureMeal={ensureLogged}
      />

      <ExtraSheet
        open={extraOpen}
        onOpenChange={setExtraOpen}
        date={date}
        destino={{
          kind: "extra",
          templateMealId: meal.id,
          mealName: name,
          time: meal.scheduledTime,
        }}
      />

      {editing && (
        <QuantitySheet
          open
          onOpenChange={(o) => !o && setEditing(null)}
          name={editing.name}
          grams={editing.grams}
          macros={editing.macros}
          onSave={async (grams) => {
            if (editing.kind !== "plan") return false;
            const r = await swapDietItemForDay({
              templateItemId: editing.item.id,
              date,
              quantityG: grams,
              foodId: editing.item.foodId,
            });
            if (!ok(r)) return false;
            refresh();
            return true;
          }}
        />
      )}
    </div>
  );
}

/**
 * Una comida que no es del plan: la que se agrego con «+ Nueva comida». Mismo
 * diseño desplegable; ya cuenta en el dia, asi que el check viene marcado y
 * desmarcarlo la elimina (con «Deshacer»).
 */
export function LooseMeal({
  meal,
  date,
  open,
  onOpenChange,
  longPress,
}: {
  meal: MealView;
  date: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  longPress: LongPress;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [timeOpen, setTimeOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Editing | null>(null);

  const time = meal.scheduledTime?.slice(0, 5);
  const name = mealLabel(meal.mealType, meal.name);
  const title =
    meal.name?.trim() ||
    meal.items.map((i) => i.foodName).join(", ") ||
    mealLabel(meal.mealType);
  const bodyId = `m-meal-${meal.id}`;
  const refresh = () => router.refresh();

  const eliminar = () =>
    startTransition(async () => {
      if (!ok(await deleteMeal({ mealId: meal.id }))) return;
      refresh();
      toast(`${name} eliminada`, {
        action: {
          label: "Deshacer",
          onClick: () => relog(meal, date, refresh),
        },
      });
    });

  return (
    <div className="m-plan-meal" data-open={open ? "" : undefined} data-done="">
      <div className="m-plan-meal-head" {...longPress}>
        <button
          type="button"
          className="m-plan-meal-toggle m-press"
          aria-expanded={open}
          aria-controls={bodyId}
          onClick={() => onOpenChange(!open)}
        >
          <span className="m-plan-meal-main">
            <span className="m-meal-meta">
              {time && <span className="m-num">{time}</span>}
              {time && " · "}
              {mealTypeLabel(meal.mealType)}
              <Tag tone="neutral">Fuera del plan</Tag>
            </span>
            <span className="m-plan-meal-title">{title}</span>
            <MacroSplitBar macros={meal.totals} />
          </span>
          <span className="m-plan-meal-kcal">
            <span className="m-num">{kcal(meal.totals.calories)}</span>
            <small>kcal</small>
          </span>
          <ChevronDown
            className="m-chevron m-disclosure-chevron"
            size={18}
            aria-hidden="true"
          />
        </button>
        <CheckCircle checked label={`Eliminar ${name}`} onToggle={eliminar} />
      </div>

      <div id={bodyId} className="m-disclosure-body" inert={!open}>
        <div>
          <div className="m-plan-meal-body">
            <IngHead />
            <ul className="m-ing-list">
              {meal.items.map((item) => (
                <SwipeRow
                  key={item.id}
                  rootClassName="m-ing-swipe"
                  className="m-ing"
                  deleteLabel={`Quitar ${item.foodName}`}
                  onDelete={() =>
                    startTransition(() =>
                      quitarRegistrado(meal, item, date, refresh),
                    )
                  }
                  secondary={{
                    label: "Cantidad",
                    icon: <Scale size={18} aria-hidden="true" />,
                    onClick: () =>
                      setEditing({
                        kind: "registrado",
                        item,
                        name: item.foodName,
                        grams: item.quantityG,
                        macros: item.macros,
                      }),
                  }}
                >
                  <IngCells
                    name={item.foodName}
                    grams={item.quantityG}
                    macros={item.macros}
                  />
                </SwipeRow>
              ))}
            </ul>
            <IngTotal totals={meal.totals} />
            <p className="m-ing-hint">
              Desliza un alimento para cambiar la cantidad o quitarlo.
            </p>
            <div className="m-meal-tools">
              <button
                type="button"
                className="m-time-chip m-press"
                aria-label={time ? `Hora: ${time}. Cambiar` : "Poner hora"}
                onClick={() => setTimeOpen(true)}
              >
                <Clock size={16} aria-hidden="true" />
                <span className="m-num">{time ?? "--:--"}</span>
              </button>
              <button
                type="button"
                className="m-btn m-press"
                onClick={() => setAddOpen(true)}
              >
                <Plus size={16} aria-hidden="true" />
                Agregar alimento
              </button>
              <button
                type="button"
                className="m-icon-btn m-press"
                data-variant="soft"
                aria-label={`Más acciones de ${name}`}
                onClick={() => setMenuOpen(true)}
              >
                <Ellipsis size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <ActionSheet
        open={menuOpen}
        onOpenChange={setMenuOpen}
        title={name}
        actions={[
          {
            label: "Eliminar comida",
            icon: <Trash2 size={18} aria-hidden="true" />,
            tone: "danger",
            onClick: eliminar,
          },
        ]}
      />

      <TimeWheelSheet
        open={timeOpen}
        onOpenChange={setTimeOpen}
        title={`¿A qué hora ${name.toLowerCase()}?`}
        value={time ?? "12:00"}
        onSave={async (hora) => {
          if (
            !ok(await updateMealTime({ mealId: meal.id, scheduledTime: hora }))
          )
            return false;
          refresh();
          return true;
        }}
      />

      <ExtraSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        date={date}
        destino={{ kind: "agregar", mealId: meal.id, mealName: name }}
      />

      {editing && (
        <QuantitySheet
          open
          onOpenChange={(o) => !o && setEditing(null)}
          name={editing.name}
          grams={editing.grams}
          macros={editing.macros}
          description="Cambia lo registrado hoy."
          onSave={async (grams) => {
            const r = await updateMealItemQuantity({
              itemId: editing.item.id,
              quantityG: grams,
            });
            if (!ok(r)) return false;
            refresh();
            return true;
          }}
        />
      )}
    </div>
  );
}

/**
 * Quita un alimento registrado; si era el ultimo, la comida entera. Las dos
 * cosas se pueden deshacer.
 */
async function quitarRegistrado(
  meal: MealView,
  item: MealItemView,
  date: string,
  refresh: () => void,
) {
  const last = meal.items.length === 1;
  const r = last
    ? await deleteMeal({ mealId: meal.id })
    : await deleteMealItem({ itemId: item.id });
  if (!ok(r)) return;
  refresh();
  toast(`${item.foodName} quitado`, {
    action: {
      label: "Deshacer",
      onClick: async () => {
        if (last) return relog(meal, date, refresh);
        if (
          item.foodId &&
          ok(
            await addMealItem({
              mealId: meal.id,
              foodId: item.foodId,
              quantityG: item.quantityG,
            }),
          )
        )
          refresh();
      },
    },
  });
}

/** Vuelve a registrar una comida eliminada, con sus alimentos y su hora. */
async function relog(meal: MealView, date: string, refresh: () => void) {
  const items = meal.items
    .filter((i) => i.foodId)
    .map((i) => ({ foodId: i.foodId!, quantityG: i.quantityG }));
  if (items.length === 0) return;
  const time = meal.scheduledTime?.slice(0, 5);
  const r = await logMeal({
    date,
    mealType: meal.mealType,
    name: meal.name ?? undefined,
    scheduledTime: time,
    extraOfTemplateMealId: meal.extraOfTemplateMealId ?? undefined,
    items,
  });
  if (ok(r)) refresh();
}

function Tag({
  tone,
  children,
}: {
  tone: "warn" | "neutral";
  children: React.ReactNode;
}) {
  return (
    <span className="m-tag" data-tone={tone} style={{ marginLeft: 6 }}>
      {children}
    </span>
  );
}

function IngHead() {
  return (
    <div className="m-ing m-ing-head" aria-hidden="true">
      <span>Ingrediente</span>
      <span>kcal</span>
      {TRES.map((m) => (
        <span key={m.key} style={{ color: m.color }}>
          {m.short.charAt(0)}
        </span>
      ))}
    </div>
  );
}

function IngCells({
  name,
  grams,
  macros,
  note,
  tag,
  href,
}: {
  name: string;
  grams: number;
  macros: MacroSet;
  note?: string;
  tag?: string;
  href?: string;
}) {
  const label = (
    <>
      <span>{name}</span>
      <small>
        {tag && <span className="m-ing-tag">{tag} · </span>}
        <span className="m-num">{gramos(grams)}</span> g{note && ` · ${note}`}
      </small>
    </>
  );
  return (
    <>
      {href ? (
        <Link
          href={href}
          className="m-ing-name"
          aria-label={`Sustituir ${name}`}
          draggable={false}
        >
          {label}
        </Link>
      ) : (
        <span className="m-ing-name">{label}</span>
      )}
      <span className="m-num">{kcal(macros.calories)}</span>
      {TRES.map((m) => (
        <span
          key={m.key}
          className="m-num"
          style={{ color: m.color }}
          aria-label={`${m.label} ${gramos(macros[m.key])} g`}
        >
          {gramos(macros[m.key])}
        </span>
      ))}
    </>
  );
}

function IngTotal({ totals }: { totals: MacroSet }) {
  return (
    <div className="m-ing m-ing-total">
      <span>Total</span>
      <span className="m-num">{kcal(totals.calories)}</span>
      {TRES.map((m) => (
        <span key={m.key} className="m-num" style={{ color: m.color }}>
          {gramos(totals[m.key])}
        </span>
      ))}
    </div>
  );
}
