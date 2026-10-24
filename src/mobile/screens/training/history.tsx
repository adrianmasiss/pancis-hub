"use client";

import { useMemo, useState } from "react";
import type { LogSession } from "@/features/training/queries";
import { localDateOf } from "@/lib/dates";
import { MonthCalendar } from "@/mobile/ui/calendar";
import { Stat } from "@/mobile/ui/display";
import { useUnits } from "@/mobile/units";
import {
  capital,
  enumerar,
  musculo,
} from "@/features/training/components/training-ui";

function fechaLarga(dateISO: string): string {
  return capital(
    new Intl.DateTimeFormat("es-CR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    }).format(new Date(`${dateISO}T12:00:00Z`)),
  );
}

function horas(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h} h ${m} min` : `${m} min`;
}

/**
 * Historial de Entrenar: calendario del mes con los dias entrenados. Tocar
 * un dia muestra su duracion, series, volumen y los cambios que se hicieron.
 */
export function TrainingHistory({
  sessions,
  today,
  timezone,
}: {
  sessions: LogSession[];
  today: string;
  timezone: string;
}) {
  const u = useUnits();
  const byDate = useMemo(() => {
    const map = new Map<string, LogSession[]>();
    for (const s of sessions) {
      const d = localDateOf(s.startedAt, timezone);
      map.set(d, [...(map.get(d) ?? []), s]);
    }
    return map;
  }, [sessions, timezone]);

  const lastDate = sessions[0]
    ? localDateOf(sessions[0].startedAt, timezone)
    : null;
  const [month, setMonth] = useState((lastDate ?? today).slice(0, 7));
  const [selected, setSelected] = useState<string | null>(lastDate);

  const marks = Object.fromEntries(
    [...byDate.keys()].map((d) => [d, "on" as const]),
  );
  const inMonth = sessions.filter((s) =>
    localDateOf(s.startedAt, timezone).startsWith(month),
  );
  const minutes = inMonth.reduce((t, s) => t + (s.durationMinutes ?? 0), 0);
  const day = selected ? (byDate.get(selected) ?? []) : [];

  return (
    <div className="m-body m-stagger">
      <p className="m-sub">
        {inMonth.length} {inMonth.length === 1 ? "entreno" : "entrenos"} este
        mes
        {minutes ? ` · ${horas(minutes)}` : ""}
      </p>
      <MonthCalendar
        month={month}
        onMonthChange={setMonth}
        marks={marks}
        selected={selected}
        onSelect={setSelected}
        today={today}
        legend={[
          { tone: "on", label: "Entrenado" },
          { tone: "selected", label: "Seleccionado" },
        ]}
        describe={(d) => (byDate.has(d) ? "entrenado" : "sin entreno")}
      />
      {selected && (
        <section className="m-card" aria-live="polite">
          <div className="m-sub" style={{ fontSize: 12, fontWeight: 700 }}>
            {fechaLarga(selected)}
          </div>
          {day.length === 0 ? (
            <div className="m-card-title">
              Sin entreno
            </div>
          ) : (
            day.map((s) => {
              const eff = s.sets.filter((x) => !x.isWarmup);
              const volume = Math.round(
                eff.reduce(
                  (t, x) => t + (x.weightKg ?? 0) * (x.repetitions ?? 0),
                  0,
                ),
              );
              const muscles = [
                ...new Set(eff.map((x) => x.primaryMuscle).filter(Boolean)),
              ]
                .slice(0, 3)
                .map(musculo);
              const swaps = Object.entries(s.replaced);
              const names = new Map(
                eff.map((x) => [x.exerciseId, x.exerciseName]),
              );
              return (
                <div key={s.id} className="m-stack" style={{ gap: 10 }}>
                  <div className="m-card-title">
                    {s.dayName ??
                      (muscles.length
                        ? capital(enumerar(muscles))
                        : "Sesión libre")}
                  </div>
                  <div className="m-row" style={{ gap: 22 }}>
                    <Stat
                      value={s.durationMinutes ?? "—"}
                      unit="min"
                      label="Duración"
                    />
                    <Stat value={eff.length} label="Series" />
                    <Stat
                      value={u.fmtWeight(volume, 0)}
                      unit={u.weightUnit}
                      label="Volumen"
                    />
                  </div>
                  {swaps.length > 0 && (
                    <p
                      className="m-sheet-text"
                      style={{ fontSize: 13, fontWeight: 600 }}
                    >
                      {swaps
                        .map(
                          ([id, original]) =>
                            `${original} → ${names.get(id) ?? "otro"} (solo ese día)`,
                        )
                        .join(" · ")}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </section>
      )}
    </div>
  );
}
