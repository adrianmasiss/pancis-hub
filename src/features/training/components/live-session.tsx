"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Timer, X } from "lucide-react";
import { SubstituteExercise } from "./substitute-exercise";
import { ExerciseDetailSheet } from "./exercise-detail-sheet";
import { QuantityStepper } from "@/features/foods/components/quantity-stepper";
import type { MeasureUnit } from "@/features/foods/lib/units";
import { triggerHaptic } from "@/lib/haptics";
import type { LiveSet, PlanExerciseView } from "../queries";
import type { ExerciseHistory } from "../lib/stats";
import { EquipmentIcon, descanso, kg, numero, reps } from "./training-ui";

/* ── Reloj ───────────────────────────────────────────────────────────── */
/* Un solo «ahora» por segundo para toda la pantalla: el reloj de la sesión y
   el del descanso laten juntos, sin un intervalo por componente. */
const listeners = new Set<() => void>();
let tick: number | undefined;
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (tick === undefined)
    tick = window.setInterval(() => listeners.forEach((l) => l()), 250);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.clearInterval(tick);
      tick = undefined;
    }
  };
}
const nowSnapshot = () => Math.floor(Date.now() / 250) * 250;
export function useNow(): number {
  return useSyncExternalStore(subscribe, nowSnapshot, () => 0);
}

export const mmss = (ms: number) => {
  const total = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
};

/* ── Temporizador (descanso o trabajo) ───────────────────────────────── */
type TimerState = {
  kind: "descanso" | "trabajo";
  label: string;
  endsAt: number;
  total: number;
  /** Al terminar un temporizador de trabajo se registra la serie. */
  onDone?: () => void;
} | null;

type TimerApi = {
  start: (timer: NonNullable<TimerState>) => void;
  stop: () => void;
};
const TimerContext = createContext<TimerApi | null>(null);
export const useTimer = () => useContext(TimerContext);

/** Un pitido corto, generado: sin archivo de audio que descargar. */
function beep() {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    const ctx = new Ctx();
    [0, 0.22].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(
        0.25,
        ctx.currentTime + offset + 0.02,
      );
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        ctx.currentTime + offset + 0.18,
      );
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.2);
    });
    setTimeout(() => void ctx.close(), 800);
  } catch {
    /* Sin audio, queda la vibración y el aviso visual. */
  }
}

/**
 * El temporizador flotante. Va encima de la barra de navegación, en una
 * cápsula oscura con su anillo: se ve desde cualquier punto de la lista sin
 * tapar la serie que se está por hacer.
 *
 * Se guarda la hora de fin, no los segundos que faltan: si el teléfono
 * bloquea la pestaña o se recarga la página, al volver marca lo correcto.
 */
export function TimerProvider({
  sessionId,
  children,
}: {
  sessionId: string;
  children: React.ReactNode;
}) {
  const key = `pancis:temporizador:${sessionId}`;
  const [timer, setTimer] = useState<TimerState>(() => {
    if (typeof window === "undefined") return null;
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(key) ?? "null");
      return saved && saved.endsAt > Date.now() ? saved : null;
    } catch {
      return null;
    }
  });
  const [done, setDone] = useState<string | null>(null);
  const onDoneRef = useRef<(() => void) | undefined>(undefined);
  /* El aviso de «listo» se oculta solo; vive aparte del temporizador para
     que terminar uno no cancele el otro. */
  const hideRef = useRef<number | undefined>(undefined);
  const now = useNow();
  /* El portal sólo existe en el navegador; en el servidor no hay `body`. */
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const save = useCallback(
    (next: TimerState) => {
      try {
        if (next) {
          const { onDone: _ignored, ...plain } = next;
          void _ignored;
          window.sessionStorage.setItem(key, JSON.stringify(plain));
        } else window.sessionStorage.removeItem(key);
      } catch {
        /* Sin almacenamiento, el temporizador vive sólo en esta pantalla. */
      }
    },
    [key],
  );

  const api = useMemo<TimerApi>(
    () => ({
      start: (next) => {
        onDoneRef.current = next.onDone;
        setDone(null);
        setTimer(next);
        save(next);
      },
      stop: () => {
        onDoneRef.current = undefined;
        setTimer(null);
        save(null);
      },
    }),
    [save],
  );

  const remaining = timer ? timer.endsAt - now : 0;
  /* El fin se programa al arrancar, con la hora de fin guardada: si la
     pestaña estuvo dormida, el aviso sale en cuanto despierta. */
  useEffect(() => {
    if (!timer) return;
    const end = window.setTimeout(
      () => {
        const callback = onDoneRef.current;
        onDoneRef.current = undefined;
        setTimer(null);
        save(null);
        setDone(
          timer.kind === "descanso"
            ? "¡A la siguiente serie!"
            : `${timer.label}: listo`,
        );
        navigator.vibrate?.([180, 90, 180]);
        beep();
        callback?.();
        window.clearTimeout(hideRef.current);
        hideRef.current = window.setTimeout(() => setDone(null), 4000);
      },
      Math.max(0, timer.endsAt - Date.now()),
    );
    return () => window.clearTimeout(end);
  }, [timer, save]);
  useEffect(() => () => window.clearTimeout(hideRef.current), []);

  const progress = timer ? 1 - remaining / timer.total : 0;
  const pill =
    timer || done ? (
      <div
        className="live-timer"
        data-kind={timer?.kind ?? "listo"}
        role="timer"
        aria-live="polite"
      >
        {timer ? (
          <>
            <svg viewBox="0 0 36 36" aria-hidden="true">
              <circle cx="18" cy="18" r="15.5" className="live-timer-track" />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                className="live-timer-ring"
                style={{ strokeDashoffset: `${97.4 * progress}` }}
              />
            </svg>
            <span className="live-timer-text">
              <small>{timer.label}</small>
              <strong>{mmss(remaining)}</strong>
            </span>
            {timer.kind === "descanso" && (
              <button
                type="button"
                onClick={() => {
                  const next = {
                    ...timer,
                    endsAt: timer.endsAt + 15000,
                    total: timer.total + 15000,
                  };
                  setTimer(next);
                  save(next);
                }}
              >
                +15 s
              </button>
            )}
            <button
              type="button"
              aria-label={
                timer.kind === "descanso" ? "Saltar descanso" : "Detener"
              }
              onClick={() => api.stop()}
            >
              {timer.kind === "descanso" ? "Saltar" : <X size={15} />}
            </button>
          </>
        ) : (
          <span className="live-timer-done">
            <Check size={16} strokeWidth={2.4} aria-hidden="true" />
            {done}
          </span>
        )}
      </div>
    ) : null;

  return (
    <TimerContext.Provider value={api}>
      {children}
      {isClient && pill ? createPortal(pill, document.body) : null}
    </TimerContext.Provider>
  );
}

/* ── Fila de ejercicio en vivo ───────────────────────────────────────── */

/* Las unidades del contador de la ficha de alimentos, con paso de gimnasio:
   el mismo control redondo, para que la app se sienta una. */
const KG: MeasureUnit = {
  id: "kg",
  short: "kg",
  plural: "kg",
  label: "Kilogramos",
  basePerUnit: 1,
  step: 2.5,
  decimals: 1,
  min: 0,
  max: 500,
  start: 0,
  approx: false,
  kind: "masa",
};
const REPS: MeasureUnit = {
  id: "reps",
  short: "rep",
  plural: "reps",
  label: "Repeticiones",
  basePerUnit: 1,
  step: 1,
  decimals: 0,
  min: 1,
  max: 200,
  start: 10,
  approx: false,
  kind: "porcion",
};

/** «1 minuto», «45 segundos» en las notas: el ejercicio va por tiempo. */
export function workSeconds(e: PlanExerciseView): number | null {
  const m = (e.notes ?? "").match(/(\d+)\s*(minutos?|min|segundos?|seg|s)\b/i);
  if (!m) return null;
  const n = Number(m[1]);
  return /^m/i.test(m[2]!) ? n * 60 : n;
}

export function LiveExerciseRow({
  exercise: e,
  sets,
  history,
  open,
  onToggle,
  onLog,
  onUndo,
}: {
  exercise: PlanExerciseView;
  sets: LiveSet[];
  history: ExerciseHistory | undefined;
  open: boolean;
  onToggle: () => void;
  onLog: (set: { weightKg: number | null; repetitions: number | null }) => void;
  onUndo: (set: LiveSet) => void;
}) {
  const panelId = useId();
  const timer = useTimer();
  const planned = e.sets ?? 0;
  const effective = sets.filter((s) => !s.isWarmup);
  const doneCount = effective.length;
  const complete = planned > 0 ? doneCount >= planned : false;
  const last = effective.at(-1);
  const seconds = workSeconds(e);

  /* De dónde parte el contador: lo de la serie anterior de hoy; si no, lo de
     la última vez; si no, cero y el objetivo de repeticiones. */
  const [weight, setWeight] = useState(
    last?.weightKg ?? history?.last?.weightKg ?? 0,
  );
  const [count, setCount] = useState(
    last?.repetitions ?? e.repsMax ?? e.repsMin ?? 10,
  );
  const [armed, setArmed] = useState<string | null>(null);

  const log = (repetitions: number | null) => {
    onLog({ weightKg: weight > 0 ? weight : null, repetitions });
    triggerHaptic("success");
    const isLast = planned > 0 && doneCount + 1 >= planned;
    if (!isLast)
      timer?.start({
        kind: "descanso",
        label: "Descanso",
        total: (e.restSeconds ?? 90) * 1000,
        endsAt: Date.now() + (e.restSeconds ?? 90) * 1000,
      });
  };

  const chips = Math.max(planned, doneCount + (complete ? 0 : 1));

  return (
    <li
      className="today-row live-row"
      data-open={open ? "" : undefined}
      data-complete={complete ? "" : undefined}
    >
      <button
        type="button"
        className="today-row-head"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="today-row-icon" aria-hidden="true">
          {complete ? (
            <Check size={20} strokeWidth={2.4} />
          ) : (
            <EquipmentIcon equipment={e.equipment} />
          )}
        </span>
        <span className="today-row-name">
          <strong>{e.name}</strong>
          <small>
            {[
              e.daySwap ? `En lugar de ${e.daySwap.name}` : null,
              last?.weightKg ? kg(last.weightKg) : null,
              `${e.sets ?? "—"} × ${reps(e)}`,
              descanso(e.restSeconds),
            ]
              .filter(Boolean)
              .join(" · ")}
          </small>
        </span>
        <span className="today-row-dose">
          <strong>
            {doneCount}
            <i>/</i>
            {planned || "—"}
          </strong>
          <small>{complete ? "completado" : "series"}</small>
        </span>
        <span className="today-row-chevron" aria-hidden="true">
          <ChevronDown size={16} strokeWidth={2} />
        </span>
      </button>
      <div className="today-row-panel" id={panelId}>
        <div>
          <div className="live-logger">
            <div className="live-field">
              <span>Peso</span>
              <QuantityStepper
                value={weight}
                onChange={setWeight}
                unit={KG}
                units={[KG]}
                onUnitChange={() => {}}
              />
            </div>
            {seconds === null && (
              <div className="live-field">
                <span>Repeticiones</span>
                <QuantityStepper
                  value={count}
                  onChange={setCount}
                  unit={REPS}
                  units={[REPS]}
                  onUnitChange={() => {}}
                />
              </div>
            )}
          </div>
          {history?.last && (
            <p className="live-hint">
              La última vez: {kg(history.last.weightKg)} ×{" "}
              {history.last.repetitions}
            </p>
          )}
          {seconds !== null ? (
            <button
              type="button"
              className="live-log"
              onClick={() =>
                timer?.start({
                  kind: "trabajo",
                  label: e.name,
                  total: seconds * 1000,
                  endsAt: Date.now() + seconds * 1000,
                  onDone: () => log(null),
                })
              }
            >
              <Timer size={17} aria-hidden="true" />
              Empezar {mmss(seconds * 1000)} · serie {doneCount + 1}
            </button>
          ) : (
            <button
              type="button"
              className="live-log"
              onClick={() => log(count)}
            >
              <Check size={17} strokeWidth={2.4} aria-hidden="true" />
              {complete ? "Serie extra" : `Registrar serie ${doneCount + 1}`}
            </button>
          )}
          <ol className="live-sets" aria-label="Series de hoy">
            {Array.from({ length: chips }, (_, i) => {
              const set = effective[i];
              const pendiente = !set;
              const isNext = i === doneCount;
              return (
                <li key={i}>
                  {set ? (
                    <button
                      type="button"
                      data-armed={armed === set.id ? "" : undefined}
                      aria-label={
                        armed === set.id
                          ? `Confirmar: quitar la serie ${i + 1}`
                          : `Serie ${i + 1}: ${set.weightKg !== null ? kg(set.weightKg) : "sin peso"} × ${set.repetitions ?? "—"}. Tocar para quitar`
                      }
                      onClick={() => {
                        if (armed === set.id) {
                          setArmed(null);
                          onUndo(set);
                          return;
                        }
                        setArmed(set.id);
                        window.setTimeout(
                          () => setArmed((a) => (a === set.id ? null : a)),
                          3000,
                        );
                      }}
                    >
                      {armed === set.id ? (
                        <span>Quitar</span>
                      ) : (
                        <>
                          <span>
                            {set.weightKg !== null ? numero(set.weightKg) : "—"}
                            <i>×</i>
                            {set.repetitions ?? "✓"}
                          </span>
                          <small>S{i + 1}</small>
                        </>
                      )}
                    </button>
                  ) : (
                    <span
                      className="live-set-empty"
                      data-next={isNext && pendiente ? "" : undefined}
                    >
                      <span>S{i + 1}</span>
                      <small>{reps(e)}</small>
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
          {e.notes && <p className="today-row-notes">{e.notes}</p>}
          <div className="today-row-help">
            <SubstituteExercise exercise={e} live />
            <ExerciseDetailSheet
              planExerciseId={e.daySwap ? undefined : e.id}
              exerciseId={e.exerciseId}
              exerciseName={e.name}
              triggerLabel="Cómo hacerlo"
            />
          </div>
        </div>
      </div>
    </li>
  );
}

/* ── Reloj de la sesión, para la tarjeta naranja ─────────────────────── */
export function SessionClock({ startedAt }: { startedAt: string }) {
  const now = useNow();
  return <>{now ? mmss(now - Date.parse(startedAt)) : "—"}</>;
}
