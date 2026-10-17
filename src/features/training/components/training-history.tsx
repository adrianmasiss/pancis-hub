"use client";
import { useDeferredValue, useId, useMemo, useState } from "react";
import { CalendarDays, ChevronDown, Search, X } from "lucide-react";
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
import "./training-today.css";

type Vista = "ejercicios" | "sesiones";

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
}: {
  sessions: LogSession[];
  muscleSets7d: [string, number][];
}) {
  const [vista, setVista] = useState<Vista>("ejercicios");
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
          {(["ejercicios", "sesiones"] as const).map((v) => (
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
              {v === "ejercicios" ? "Ejercicios" : "Sesiones"}
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
        <ul className="hist-list">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              open={open === session.id}
              onToggle={() => setOpen(open === session.id ? null : session.id)}
            />
          ))}
        </ul>
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

function SessionCard({
  session,
  open,
  onToggle,
}: {
  session: LogSession;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = useId();
  const effective = session.sets.filter((s) => !s.isWarmup);
  const volume = Math.round(
    effective.reduce((t, s) => t + (s.weightKg ?? 0) * (s.repetitions ?? 0), 0),
  );
  const byExercise = new Map<string, typeof session.sets>();
  for (const set of session.sets)
    byExercise.set(set.exerciseName, [
      ...(byExercise.get(set.exerciseName) ?? []),
      set,
    ]);
  const day = new Date(session.startedAt);
  return (
    <li className="today-row" data-open={open ? "" : undefined}>
      <button
        type="button"
        className="today-row-head"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="today-row-icon hist-date" aria-hidden="true">
          <b>{day.getDate()}</b>
          <small>
            {new Intl.DateTimeFormat("es-CR", { month: "short" }).format(day)}
          </small>
        </span>
        <span className="today-row-name">
          <strong>
            {session.dayName ?? session.planName ?? "Sesión libre"}
          </strong>
          <small>
            {capital(hace(session.startedAt))} · {effective.length} series
            {session.durationMinutes ? ` · ${session.durationMinutes} min` : ""}
          </small>
        </span>
        <span className="today-row-dose">
          <strong>{numero(volume, 0)}</strong>
          <small>volumen · kg</small>
        </span>
        <span className="today-row-chevron" aria-hidden="true">
          <ChevronDown size={16} strokeWidth={2} />
        </span>
      </button>
      <div className="today-row-panel" id={panelId}>
        <div>
          <p className="hist-best">
            <CalendarDays size={14} aria-hidden="true" />{" "}
            {capital(fecha(session.startedAt))}
            {session.planName ? ` · ${session.planName}` : ""}
          </p>
          <ol className="hist-days">
            {[...byExercise].map(([name, sets]) => (
              <li key={name}>
                <span className="hist-exercise">{name}</span>
                <ul className="hist-sets">
                  {sets.map((set, i) => (
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
