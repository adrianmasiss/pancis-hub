"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { duplicateDay } from "@/features/nutrition/actions";
import { MonthCalendar } from "@/mobile/ui/calendar";
import { kcal } from "./format";

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
 * Tocar un dia muestra sus kcal y permite copiar sus comidas a hoy.
 */
export function NutritionHistory({
  days,
  today,
  targetCalories,
  planMealCount,
}: {
  days: HistoryDay[];
  today: string;
  targetCalories: number | null;
  planMealCount: number;
}) {
  const router = useRouter();
  const byDate = new Map(days.map((d) => [d.date, d]));
  const last = [...days]
    .sort((a, b) => b.date.localeCompare(a.date))
    .find((d) => d.date < today);
  const [month, setMonth] = useState(today.slice(0, 7));
  const [selected, setSelected] = useState<string | null>(last?.date ?? today);
  const [pending, startTransition] = useTransition();

  const tone = (d: HistoryDay) =>
    d.offPlan === 0 ? ("soft" as const) : ("warn" as const);
  const marks = Object.fromEntries(days.map((d) => [d.date, tone(d)]));
  const comoPlan = days.filter(
    (d) => d.date.startsWith(month) && d.offPlan === 0,
  ).length;
  const day = selected ? byDate.get(selected) : undefined;

  const copy = () =>
    selected &&
    startTransition(async () => {
      const result = await duplicateDay({ fromDate: selected, toDate: today });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Comidas copiadas a hoy.");
      router.push("/nutricion");
    });

  return (
    <div className="m-body m-stagger">
      <p className="m-sub">
        {comoPlan} {comoPlan === 1 ? "día" : "días"} como el plan este mes
      </p>
      <MonthCalendar
        variant="dots"
        month={month}
        onMonthChange={setMonth}
        marks={marks}
        selected={selected}
        onSelect={setSelected}
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
      {selected && (
        <section className="m-card" aria-live="polite">
          <div className="m-sub" style={{ fontSize: 12, fontWeight: 700 }}>
            {fechaLarga(selected)}
          </div>
          {day ? (
            <>
              <div
                className="m-row"
                style={{ alignItems: "baseline", flexWrap: "wrap" }}
              >
                <span className="m-stat-value" style={{ fontSize: 30 }}>
                  {kcal(day.calories)}
                </span>
                <span className="m-sub">
                  {targetCalories ? `/ ${kcal(targetCalories)} kcal` : "kcal"} ·{" "}
                  {day.offPlan === 0
                    ? `${day.meals} ${day.meals === 1 ? "comida" : "comidas"} como el plan${planMealCount && day.meals < planMealCount ? ` (de ${planMealCount})` : ""}`
                    : `${day.meals} comidas · ${day.offPlan} fuera del plan`}
                </span>
              </div>
              {selected !== today && (
                <button
                  type="button"
                  className="m-btn m-press"
                  data-variant="primary"
                  data-block=""
                  disabled={pending}
                  onClick={copy}
                >
                  <Copy size={18} aria-hidden="true" />
                  {pending ? "Copiando…" : "Copiar comidas a hoy"}
                </button>
              )}
            </>
          ) : (
            <div className="m-card-title" style={{ fontSize: 20 }}>
              Sin registro
            </div>
          )}
        </section>
      )}
    </div>
  );
}
