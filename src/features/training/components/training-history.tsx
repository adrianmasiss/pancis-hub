"use client";
import { useDeferredValue, useId, useMemo, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import {
  buildExerciseLog,
  searchExerciseLog,
  type ExerciseLogEntry,
} from "../lib/exercise-log";
import type { LogSession } from "../queries";
import {
  EquipmentIcon,
  capital,
  fecha,
  hace,
  kg,
  musculo,
  numero,
} from "./training-ui";
import { TrainingCalendar } from "./training-calendar";
import "./training-today.css";

type Vista = "calendario" | "ejercicios";

/**
 * El historial de lo entrenado, como una base de datos que se consulta:
 *
 * - Ejercicios: cada uno en su tarjeta redonda, con la mejor marca a la
 *   derecha. Se busca por nombre o músculo y, al abrirlo, salen todas sus
 *   series por fecha: peso × repeticiones.
 * - Sesiones: cada entrenamiento con sus ejercicios y series.
 *
 * Los calentamientos se ven (fueron series hechas) pero marcados, y no
 * cuentan para la mejor marca.
 */
export function TrainingHistory({
  sessions,
  muscleSets7d,
  timezone,
  today,
}: {
  sessions: LogSession[];
  muscleSets7d: [string, number][];
  timezone: string;
  today: string;
}) {
  const [vista, setVista] = useState<Vista>("calendario");
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const [open, setOpen] = useState<string | null>(null);
  const log = useMemo(() => buildExerciseLog(sessions), [sessions]);
  const found = useMemo(
    () => searchExerciseLog(log, deferred),
    [log, deferred],
  );
  const max = Math.max(1, ...muscleSets7d.map(([, n]) => n));

  if (sessions.length === 0)
    return (
      <div className="today hist">
        <p className="hist-empty">
          Aquí aparecerá todo lo que entrenes: cada ejercicio con sus pesos,
          repeticiones y fechas. Termina tu primera sesión para empezar.
        </p>
      </div>
    );

  return (
    <div className="today hist">
      {muscleSets7d.length > 0 && (
        <section className="hist-week" aria-labelledby="hist-week-title">
          <h3 id="hist-week-title">
            Últimos 7 días <span>series por músculo</span>
          </h3>
          <ul>
            {muscleSets7d.slice(0, 6).map(([m, n]) => (
              <li key={m}>
                <span>{capital(musculo(m))}</span>
                <i aria-hidden="true">
                  <b style={{ width: `${(n / max) * 100}%` }} />
                </i>
                <strong>{n}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="hist-controls">
        <div className="hist-segments" role="tablist" aria-label="Ver por">
          {(["calendario", "ejercicios"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={vista === v}
              onClick={() => {
                setVista(v);
                setOpen(null);
              }}
            >
              {v === "ejercicios" ? "Ejercicios" : "Calendario"}
            </button>
          ))}
        </div>
        {vista === "ejercicios" && (
          <label className="hist-search">
            <Search size={17} strokeWidth={1.8} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setOpen(null);
              }}
              placeholder="Buscar ejercicio o músculo"
              aria-label="Buscar ejercicio o músculo"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Borrar búsqueda"
              >
                <X size={15} aria-hidden="true" />
              </button>
            )}
          </label>
        )}
      </div>

      {vista === "ejercicios" ? (
        <>
          <p className="hist-count" role="status">
            {found.length} {found.length === 1 ? "ejercicio" : "ejercicios"}
            {deferred ? ` para «${deferred}»` : " registrados"}
          </p>
          <ul className="hist-list">
            {found.map((entry) => (
              <ExerciseCard
                key={entry.exerciseId}
                entry={entry}
                open={open === entry.exerciseId}
                onToggle={() =>
                  setOpen(open === entry.exerciseId ? null : entry.exerciseId)
                }
              />
            ))}
          </ul>
          {found.length === 0 && (
            <p className="hist-empty">
              Ningún ejercicio registrado coincide con «{deferred}».
            </p>
          )}
        </>
      ) : (
        <TrainingCalendar
          sessions={sessions}
          timezone={timezone}
          today={today}
        />
      )}
    </div>
  );
}

function SetChip({
  set,
}: {
  set: {
    weightKg: number | null;
    repetitions: number | null;
    isWarmup: boolean;
  };
}) {
  return (
    <li data-warmup={set.isWarmup ? "" : undefined}>
      {set.weightKg !== null ? numero(set.weightKg) : "—"}
      <small>kg</small>
      <i>×</i>
      {set.repetitions ?? "—"}
      {set.isWarmup && <span className="hist-tag">calent.</span>}
    </li>
  );
}

function ExerciseCard({
  entry,
  open,
  onToggle,
}: {
  entry: ExerciseLogEntry;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = useId();
  const last = entry.days[0];
  const lastTop = last?.sets
    .filter((s) => !s.isWarmup && s.weightKg !== null)
    .sort((a, b) => (b.weightKg ?? 0) - (a.weightKg ?? 0))[0];
  return (
    <li className="today-row" data-open={open ? "" : undefined}>
      <button
        type="button"
        className="today-row-head"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="today-row-icon" aria-hidden="true">
          <EquipmentIcon equipment={entry.equipment} />
        </span>
        <span className="today-row-name">
          <strong>{entry.name}</strong>
          <small>
            {lastTop
              ? `${kg(lastTop.weightKg!)} × ${lastTop.repetitions ?? "—"} · ${hace(last!.date)}`
              : last
                ? hace(last.date)
                : ""}
          </small>
        </span>
        <span className="today-row-dose">
          <strong>{entry.best ? numero(entry.best.weightKg) : "—"}</strong>
          <small>mejor · kg</small>
        </span>
        <span className="today-row-chevron" aria-hidden="true">
          <ChevronDown size={16} strokeWidth={2} />
        </span>
      </button>
      <div className="today-row-panel" id={panelId}>
        <div>
          {entry.best && (
            <p className="hist-best">
              Mejor marca: <strong>{kg(entry.best.weightKg)}</strong> ×{" "}
              {entry.best.repetitions} · {fecha(entry.best.date)} ·{" "}
              {entry.effectiveSets} series en total
            </p>
          )}
          <ol className="hist-days">
            {entry.days.map((day) => (
              <li key={day.sessionId}>
                <time dateTime={day.date}>{capital(fecha(day.date))}</time>
                <ul className="hist-sets">
                  {day.sets.map((set, i) => (
                    <SetChip key={i} set={set} />
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </li>
  );
}
