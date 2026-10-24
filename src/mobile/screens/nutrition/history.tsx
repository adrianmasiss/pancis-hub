"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  copyMealsToDate,
  getDayMeals,
  undoCopiedMeals,
  type DayMealSummary,
} from "@/features/nutrition/copy-meals-actions";
import { triggerHaptic } from "@/lib/haptics";
import { MonthCalendar } from "@/mobile/ui/calendar";
import { Sheet } from "@/mobile/ui/sheet";
import { kcal, mealLabel, mealTypeLabel } from "./format";

export type HistoryDay = {
  date: string;
  calories: number;
  meals: number;
  /** Comidas registradas que no salieron del plan. */
  offPlan: number;
};

function fechaLarga(dateISO: string): string {
  const s = new Intl.DateTimeFormat("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(`${dateISO}T12:00:00Z`));
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Historial de Nutricion: calendario con los dias como el plan (todo lo
 * registrado salio del plan), ajustados (hubo algo fuera) o sin registro.
 * Tocar un dia abre su resumen en un sheet, y desde ahi se copian a hoy (o a
 * otra fecha) todas sus comidas o solo las elegidas, con «Deshacer».
 */
export function NutritionHistory({
  days,
  today,
  targetCalories,
  planMealCount,
  copyMode,
}: {
  days: HistoryDay[];
  today: string;
  targetCalories: number | null;
  planMealCount: number;
  /** Llego desde «Copiar de otro dia»: se le dice que toque un dia. */
  copyMode: boolean;
}) {
  const router = useRouter();
  const byDate = new Map(days.map((d) => [d.date, d]));
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [meals, setMeals] = useState<{
    date: string;
    list: DayMealSummary[];
  } | null>(null);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [otherOpen, setOtherOpen] = useState(false);
  const [otherDate, setOtherDate] = useState(today);
  const [pending, startTransition] = useTransition();

  const tone = (d: HistoryDay) =>
    d.offPlan === 0 ? ("soft" as const) : ("warn" as const);
  const marks = Object.fromEntries(days.map((d) => [d.date, tone(d)]));
  const comoPlan = days.filter(
    (d) => d.date.startsWith(month) && d.offPlan === 0,
  ).length;
  const day = selected ? byDate.get(selected) : undefined;
  const list = meals && meals.date === selected ? meals.list : null;

  const pick = (date: string) => {
    setSelected(date);
    setOtherOpen(false);
    setOpen(true);
    if (!byDate.has(date)) {
      setMeals({ date, list: [] });
      return;
    }
    setMeals(null);
    void getDayMeals({ date }).then((r) => {
      if ("error" in r) {
        toast.error(r.error);
        setOpen(false);
        return;
      }
      setMeals({ date, list: r.meals });
      setChecked(new Set(r.meals.map((m) => m.id)));
    });
  };

  const toggle = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const copy = (toDate: string) =>
    startTransition(async () => {
      const ids = (list ?? [])
        .filter((m) => checked.has(m.id))
        .map((m) => m.id);
      const r = await copyMealsToDate({ mealIds: ids, toDate });
      if ("error" in r) {
        toast.error(r.error);
        return;
      }
      triggerHaptic("success");
      setOpen(false);
      const n = r.created.length;
      const destino =
        toDate === today ? "a hoy" : `al ${fechaLarga(toDate).toLowerCase()}`;
      toast.success(
        `Copiaste ${n} ${n === 1 ? "comida" : "comidas"} ${destino}.`,
        {
          action: {
            label: "Deshacer",
            onClick: async () => {
              const u = await undoCopiedMeals({ mealIds: r.created });
              if (u.error) toast.error(u.error);
              else toast("Copia deshecha.");
              router.refresh();
            },
          },
        },
      );
      router.refresh();
    });

  const nSel = (list ?? []).filter((m) => checked.has(m.id)).length;

  return (
    <div className="m-body m-stagger">
      {copyMode ? (
        <div className="m-notice" role="status">
          <Copy size={16} aria-hidden="true" style={{ flex: "none" }} />
          Toca el día que quieres copiar. Puedes elegir qué comidas.
        </div>
      ) : (
        <p className="m-sub">
          {comoPlan} {comoPlan === 1 ? "día" : "días"} como el plan este mes ·
          toca un día para ver o copiar sus comidas
        </p>
      )}
      <MonthCalendar
        variant="dots"
        month={month}
        onMonthChange={setMonth}
        marks={marks}
        selected={selected}
        onSelect={pick}
        today={today}
        legend={[
          { tone: "soft", label: "Como el plan" },
          { tone: "warn", label: "Ajustado" },
          { tone: "off", label: "Sin registro" },
        ]}
        describe={(d) => {
          const x = byDate.get(d);
          return !x
            ? "sin registro"
            : x.offPlan === 0
              ? "como el plan"
              : "ajustado";
        }}
      />

      <Sheet
        open={open}
        onOpenChange={setOpen}
        title={selected ? fechaLarga(selected) : ""}
        description={
          day
            ? `${kcal(day.calories)}${targetCalories ? ` / ${kcal(targetCalories)}` : ""} kcal · ${
                day.offPlan === 0
                  ? `${day.meals} ${day.meals === 1 ? "comida" : "comidas"} como el plan${planMealCount && day.meals < planMealCount ? ` (de ${planMealCount})` : ""}`
                  : `${day.meals} ${day.meals === 1 ? "comida" : "comidas"} · ${day.offPlan} fuera del plan`
              }`
            : "Sin registro"
        }
      >
        {!list ? (
          <p className="m-sub" aria-live="polite">
            Cargando comidas…
          </p>
        ) : list.length === 0 ? (
          <p className="m-sheet-text">Ese día no registraste comidas.</p>
        ) : (
          <>
            <div className="m-row" style={{ justifyContent: "space-between" }}>
              <span className="m-eyebrow">Qué copiar</span>
              <button
                type="button"
                className="m-accent-text"
                style={{ fontSize: 13, fontWeight: 700 }}
                onClick={() =>
                  setChecked(
                    nSel === list.length
                      ? new Set()
                      : new Set(list.map((m) => m.id)),
                  )
                }
              >
                {nSel === list.length ? "Ninguna" : "Todas"}
              </button>
            </div>
            <div className="m-stack" style={{ gap: 8 }}>
              {list.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  role="checkbox"
                  aria-checked={checked.has(m.id)}
                  className="m-swap-card m-press"
                  onClick={() => toggle(m.id)}
                >
                  <span className="m-list-row-main">
                    <span className="m-list-row-sub">
                      {m.time && <span className="m-num">{m.time} · </span>}
                      {mealTypeLabel(m.mealType)}
                    </span>
                    <span className="m-list-row-title">
                      {m.name?.trim() ||
                        m.foods.join(", ") ||
                        mealLabel(m.mealType)}
                    </span>
                  </span>
                  <span className="m-swap-card-score">
                    <span className="m-num">{kcal(m.calories)}</span>
                    <small>kcal</small>
                  </span>
                  <span className="m-swap-card-check" aria-hidden="true">
                    {checked.has(m.id) && <Check size={14} strokeWidth={3} />}
                  </span>
                </button>
              ))}
            </div>

            {otherOpen ? (
              <div className="m-stack" style={{ gap: 10 }}>
                <label className="m-field">
                  <span>Copiar al día</span>
                  <input
                    type="date"
                    className="m-input"
                    value={otherDate}
                    onChange={(e) => setOtherDate(e.target.value)}
                  />
                </label>
                <button
                  type="button"
                  className="m-btn m-press"
                  data-variant="primary"
                  data-block=""
                  disabled={
                    pending ||
                    nSel === 0 ||
                    !/^\d{4}-\d{2}-\d{2}$/.test(otherDate) ||
                    otherDate === selected
                  }
                  onClick={() => copy(otherDate)}
                >
                  <Copy size={18} aria-hidden="true" />
                  {pending
                    ? "Copiando…"
                    : `Copiar ${nSel} ${nSel === 1 ? "comida" : "comidas"}`}
                </button>
              </div>
            ) : (
              <div className="m-stack" style={{ gap: 8 }}>
                {selected !== today && (
                  <button
                    type="button"
                    className="m-btn m-press"
                    data-variant="primary"
                    data-block=""
                    disabled={pending || nSel === 0}
                    onClick={() => copy(today)}
                  >
                    <Copy size={18} aria-hidden="true" />
                    {pending
                      ? "Copiando…"
                      : nSel === list.length
                        ? "Copiar a hoy"
                        : `Copiar ${nSel} a hoy`}
                  </button>
                )}
                <button
                  type="button"
                  className="m-btn m-press"
                  data-block=""
                  disabled={pending || nSel === 0}
                  onClick={() => {
                    setOtherDate(selected === today ? "" : today);
                    setOtherOpen(true);
                  }}
                >
                  <CalendarDays size={18} aria-hidden="true" />
                  Copiar a otra fecha
                </button>
              </div>
            )}
          </>
        )}
      </Sheet>
    </div>
  );
}
