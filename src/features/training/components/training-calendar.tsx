"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { localDateOf } from "@/lib/dates";
import { groupByDate, monthGrid, shiftMonth } from "../lib/calendar";
import type { LogSession } from "../queries";
import { capital, numero } from "./training-ui";

const DIAS = ["L", "M", "X", "J", "V", "S", "D"];

const nombreMes = (month: string) =>
  capital(
    new Intl.DateTimeFormat("es-CR", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(new Date(`${month}-15T12:00:00Z`)),
  );

const nombreDia = (date: string) =>
  capital(
    new Intl.DateTimeFormat("es-CR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    }).format(new Date(`${date}T12:00:00Z`)),
  );

const hora = (iso: string, timeZone: string) => {
  try {
    return new Intl.DateTimeFormat("es-CR", {
      hour: "numeric",
      minute: "2-digit",
      timeZone,
    }).format(new Date(iso));
  } catch {
    return "";
  }
};

const duracion = (min: number) =>
  min >= 60 ? `${Math.floor(min / 60)} h ${min % 60} min` : `${min} min`;

/**
 * El mes entrenado: un punto en cada día con sesión y, al tocar un día, lo que
 * se hizo: rutina y día, duración real, cada ejercicio con sus series y, si se
 * sustituyó, a cuál reemplazó.
 */
export function TrainingCalendar({
  sessions,
  timezone,
  today,
}: {
  sessions: LogSession[];
  timezone: string;
  today: string;
}) {
  const porDia = useMemo(
    () => groupByDate(sessions, (s) => localDateOf(s.startedAt, timezone)),
    [sessions, timezone],
  );
  /* Se abre en el último día entrenado: es casi siempre lo que se busca. */
  const ultimo = sessions[0]
    ? localDateOf(sessions[0].startedAt, timezone)
    : today;
  const [month, setMonth] = useState(ultimo.slice(0, 7));
  const [selected, setSelected] = useState<string>(ultimo);
  const grid = monthGrid(month);
  const delMes = [...porDia.keys()].filter((d) => d.startsWith(month)).length;
  const delDia = porDia.get(selected) ?? [];

  return (
    <div className="hist-calendar">
      <section className="hist-month" aria-labelledby="hist-month-title">
        <header>
          <button
            type="button"
            onClick={() => setMonth(shiftMonth(month, -1))}
            aria-label="Mes anterior"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <h3 id="hist-month-title">
            {nombreMes(month)}
            <span>
              {delMes} {delMes === 1 ? "día entrenado" : "días entrenados"}
            </span>
          </h3>
          <button
            type="button"
            onClick={() => setMonth(shiftMonth(month, 1))}
            disabled={month >= today.slice(0, 7)}
            aria-label="Mes siguiente"
          >
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </header>
        <table>
          <thead>
            <tr>
              {DIAS.map((d) => (
                <th key={d} scope="col">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.weeks.map((week, w) => (
              <tr key={w}>
                {week.map((date, i) => {
                  if (!date) return <td key={i} />;
                  const n = porDia.get(date)?.length ?? 0;
                  return (
                    <td key={i}>
                      <button
                        type="button"
                        data-trained={n ? "" : undefined}
                        data-today={date === today ? "" : undefined}
                        aria-pressed={selected === date}
                        aria-label={`${nombreDia(date)}${n ? `, ${n} ${n === 1 ? "sesión" : "sesiones"}` : ""}`}
                        onClick={() => setSelected(date)}
                      >
                        {Number(date.slice(8))}
                        {n > 0 && <i aria-hidden="true" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section
        className="hist-day"
        aria-labelledby="hist-day-title"
        aria-live="polite"
      >
        <h3 id="hist-day-title">{nombreDia(selected)}</h3>
        {delDia.length === 0 ? (
          <p className="hist-empty">Este día no entrenaste.</p>
        ) : (
          delDia.map((s) => (
            <SessionDetail key={s.id} session={s} timezone={timezone} />
          ))
        )}
      </section>
    </div>
  );
}

function SessionDetail({
  session: s,
  timezone,
}: {
  session: LogSession;
  timezone: string;
}) {
  /* Los ejercicios en el orden en que se hicieron. */
  const ejercicios = [...groupByDate(s.sets, (set) => set.exerciseId)];
  const efectivas = s.sets.filter((set) => !set.isWarmup).length;
  const titulo = [
    s.planName ?? "Sesión libre",
    s.dayIndex ? `Día ${s.dayIndex}` : null,
    s.dayName && !/^d[ií]a\s*\d+$/i.test(s.dayName) ? s.dayName : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <article className="hist-session">
      <header>
        <strong>{titulo}</strong>
        <small>
          <Clock size={13} aria-hidden="true" />
          {hora(s.startedAt, timezone)}
          {s.durationMinutes ? ` · ${duracion(s.durationMinutes)}` : ""} ·{" "}
          {efectivas} {efectivas === 1 ? "serie" : "series"}
        </small>
      </header>
      {ejercicios.length === 0 ? (
        <p className="hist-best">Sin series registradas.</p>
      ) : (
        <ol className="hist-days">
          {ejercicios.map(([exerciseId, sets]) => (
            <li key={exerciseId}>
              <span className="hist-exercise">
                {sets[0]!.exerciseName}
                {s.replaced[exerciseId] && (
                  <span className="hist-swap">
                    <ArrowLeftRight size={12} aria-hidden="true" />
                    Sustituyó a {s.replaced[exerciseId]}
                  </span>
                )}
              </span>
              <ul className="hist-sets">
                {sets.map((set, i) => (
                  <li key={i} data-warmup={set.isWarmup ? "" : undefined}>
                    {set.weightKg !== null ? numero(set.weightKg) : "—"}
                    <small>kg</small>
                    <i>×</i>
                    {set.repetitions ?? "—"}
                    {set.rir !== null && (
                      <small> · RIR {numero(set.rir)}</small>
                    )}
                    {set.isWarmup && <span className="hist-tag">calent.</span>}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}
