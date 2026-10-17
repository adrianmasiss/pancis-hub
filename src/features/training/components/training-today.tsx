"use client";
import {
  useId,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Play,
  Layers,
  RotateCcw,
  X,
} from "lucide-react";
import { CreatePlanDialog } from "./create-plan-dialog";
import { ExerciseDetailSheet } from "./exercise-detail-sheet";
import { StartSessionButton } from "./start-session-button";
import { ModelCredit } from "./model-credit";
import { LiveExerciseRow, SessionClock, TimerProvider } from "./live-session";
import {
  deleteSet,
  discardSession,
  finishSession,
  logSet,
} from "@/features/training/actions";
import {
  ROTULOS,
  resaltadoDeEjercicios,
} from "@/features/training/lib/muscle-map";
import { encuadreDe } from "@/features/training/lib/model-regions";
import {
  DEFAULT_REST_SECONDS,
  SECONDS_PER_SET,
  estimatedMinutes,
} from "@/features/training/lib/stats";
import type { LiveSet, PlanExerciseView, TrainingOverview } from "../queries";
import {
  EquipmentIcon,
  capital,
  descanso,
  enumerar,
  hace,
  kg,
  musculosDelDia,
  reps,
} from "./training-ui";
import "./training-today.css";

/* Igual que en el mapa muscular: `three` sólo viaja si se abre la pantalla,
   y WebGL no existe en el servidor. */
const MuscleModel = dynamic(
  () => import("./muscle-model").then((m) => m.MuscleModel),
  {
    ssr: false,
    loading: () => <div className="muscle-model-stage" aria-hidden="true" />,
  },
);

/* Los vientres que se ven de espaldas. Si el día trabaja sobre todo estos, el
   maniquí abre de espaldas: un día de isquios visto de frente no muestra
   nada encendido. */
const POSTERIORES = new Set([
  "dorsal",
  "trapecio",
  "lumbar",
  "deltoides-post",
  "triceps",
  "gluteo",
  "isquios",
  "gemelo",
]);

/**
 * La sesión de hoy, en el orden en que se piensa antes de entrenar: qué toca
 * (tarjeta naranja, donde el maniquí manda: los músculos del día laten
 * encendidos), cuánto va a costar (una línea: duración, series, la última
 * marca). Al lado o debajo, los días de la rutina en tarjetas redondas: al
 * tocar uno, el maniquí pasa a ese día; al abrir uno de sus ejercicios, la
 * cámara se acerca a los músculos que trabaja y apaga el resto.
 *
 * Todo número dice de dónde sale: la duración es una estimación y lo pone;
 * «la última vez» es la serie más pesada del último día registrado.
 */
export function TrainingToday({
  overview,
  initialDayId,
}: {
  overview: TrainingOverview;
  initialDayId?: string;
}) {
  const titleId = useId();
  const plan = overview.activePlan;
  const days = plan?.days ?? [];
  const enCurso = overview.sessionInProgress;
  /* Sesión de un día del plan en curso: se entrena aquí mismo. */
  const live =
    enCurso?.planDayId && days.some((d) => d.id === enCurso.planDayId)
      ? enCurso
      : null;
  const [dayId, setDayId] = useState(
    live?.planDayId ?? initialDayId ?? days[0]?.id,
  );
  const day = days.find((d) => d.id === dayId) ?? days[0];
  const exercises = useMemo(() => day?.exercises ?? [], [day]);
  const [open, setOpen] = useState<string | null>(null);
  const [openDay, setOpenDay] = useState<string | null>(day?.id ?? null);
  const heroRef = useRef<HTMLElement>(null);

  /* Elegir un día: se despliega su tarjeta y se sube al maniquí. En
     escritorio no hace falta subir: el maniquí está fijo a la izquierda y
     siempre a la vista. */
  const chooseDay = (id: string) => {
    if (id === day?.id && openDay === id) {
      setOpenDay(null);
      return;
    }
    setDayId(id);
    setOpenDay(id);
    setOpen(null);
    setVista(null);
    const hero = heroRef.current;
    if (!hero || window.matchMedia("(min-width: 1024px)").matches) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    requestAnimationFrame(() =>
      hero.scrollIntoView({
        behavior: reduce ? "auto" : "smooth",
        block: "start",
      }),
    );
  };

  const resaltado = useMemo(
    () => resaltadoDeEjercicios(exercises),
    [exercises],
  );
  const principales = Object.entries(resaltado)
    .filter(([, peso]) => peso >= 0.75)
    .map(([m]) => m);
  const posterior =
    principales.filter((m) => POSTERIORES.has(m)).length >
    principales.length / 2;
  const [vista, setVista] = useState<"front" | "back" | null>(null);

  /* El ejercicio abierto en la lista queda en foco: el maniquí sólo enciende
     lo suyo y la cámara se acerca a sus principales, del lado desde el que se
     ven. Al cerrarlo, vuelve al día entero. */
  const enFoco = exercises.find((e) => e.id === open) ?? null;
  const resaltadoFoco = useMemo(
    () => (enFoco ? resaltadoDeEjercicios([enFoco]) : null),
    [enFoco],
  );
  const principalesFoco = useMemo(
    () =>
      resaltadoFoco
        ? Object.keys(resaltadoFoco).filter((m) => resaltadoFoco[m]! >= 0.75)
        : null,
    [resaltadoFoco],
  );
  const encuadre = principalesFoco ? encuadreDe(principalesFoco) : null;
  const secundariosFoco = resaltadoFoco
    ? Object.keys(resaltadoFoco).filter((m) => resaltadoFoco[m]! < 0.75)
    : [];

  /* Los secundarios se encienden sólo si se piden: casi siempre lo que se
     quiere ver es qué trabaja de verdad, y con los asistentes el cuerpo
     entero sale manchado. Apagados, se quitan del mapa; el encuadre del zoom
     ya sólo usa los principales. */
  const [secundarios, setSecundarios] = useState(false);
  const encendidos = useMemo(() => {
    const mapa = resaltadoFoco ?? resaltado;
    return secundarios
      ? mapa
      : Object.fromEntries(
          Object.entries(mapa).filter(([, peso]) => peso >= 0.75),
        );
  }, [resaltadoFoco, resaltado, secundarios]);
  const view = vista ?? encuadre?.side ?? (posterior ? "back" : "front");
  const toggleExercise = (id: string) => {
    setOpen(open === id ? null : id);
    setVista(null);
  };

  const series = exercises.reduce((total, e) => total + (e.sets ?? 0), 0);
  const minutos = estimatedMinutes(exercises);
  const titulo = exercises.length
    ? capital(enumerar(musculosDelDia(exercises).slice(0, 3)))
    : plan
      ? (day?.name ?? "Día sin ejercicios")
      : "Tu primera rutina empieza aquí";

  const ultimaSesion = overview.recentSessions[0];

  /* Lo registrado se ve al instante; el servidor lo confirma detrás. */
  const [pendingLog, startLog] = useTransition();
  const [sets, applySet] = useOptimistic(
    live?.sets ?? [],
    (
      state: LiveSet[],
      action: { add: LiveSet } | { remove: string },
    ): LiveSet[] =>
      "add" in action
        ? [...state, action.add]
        : state.filter((set) => set.id !== action.remove),
  );
  const liveDay = live ? days.find((d) => d.id === live.planDayId) : null;
  const plannedSets = (liveDay?.exercises ?? []).reduce(
    (t, e) => t + (e.sets ?? 0),
    0,
  );
  const doneSets = sets.filter((s) => !s.isWarmup).length;
  const volumen = Math.round(
    sets
      .filter((s) => !s.isWarmup)
      .reduce((t, s) => t + (s.weightKg ?? 0) * (s.repetitions ?? 0), 0),
  );
  const [finishing, startFinish] = useTransition();
  const [discardArmed, setDiscardArmed] = useState(false);

  const logFor =
    (e: PlanExerciseView) =>
    (set: { weightKg: number | null; repetitions: number | null }) => {
      if (!live) return;
      const done = sets.filter(
        (s) => s.exerciseId === e.exerciseId && !s.isWarmup,
      ).length;
      /* Al completar un ejercicio se abre el siguiente que falte: el dedo
         ya está donde va. */
      if (e.sets && done + 1 >= e.sets) {
        const next = liveDay?.exercises.find(
          (x) =>
            x.id !== e.id &&
            sets.filter((s) => s.exerciseId === x.exerciseId).length <
              (x.sets ?? 1),
        );
        setOpen(next?.id ?? null);
      }
      startLog(async () => {
        applySet({
          add: {
            id: `tmp-${Date.now()}`,
            exerciseId: e.exerciseId,
            setNumber: done + 1,
            isWarmup: false,
            ...set,
          },
        });
        const result = await logSet({
          sessionId: live.id,
          exerciseId: e.exerciseId,
          isWarmup: false,
          weightKg: set.weightKg ?? undefined,
          repetitions: set.repetitions ?? undefined,
          restSeconds: e.restSeconds ?? undefined,
        });
        if (result && "error" in result)
          toast.error("No se guardó la serie. Intenta de nuevo.");
      });
    };
  const undo = (set: LiveSet) => {
    if (set.id.startsWith("tmp-")) return;
    startLog(async () => {
      applySet({ remove: set.id });
      const result = await deleteSet({ setId: set.id });
      if (result && "error" in result)
        toast.error("No se pudo quitar la serie.");
    });
  };

  const content = (
    <div className="today" data-live={live ? "" : undefined}>
      <header ref={heroRef} className="today-hero-head">
        <div key={day?.id ?? "sin-dia"} className="today-swap">
          <p className="today-eyebrow" data-live={live ? "" : undefined}>
            {live ? "En curso" : "Hoy"}
            {day?.name ? ` · ${day.name}` : ""}
          </p>
          <h2 id={titleId}>{titulo}</h2>
        </div>
      </header>

      <div
        className="today-model"
        data-focus={enFoco ? "" : undefined}
        role="group"
        aria-label={
          enFoco
            ? `Maniquí acercado a ${enFoco.name}: ${(principalesFoco ?? [])
                .map((m) => ROTULOS[m] ?? m)
                .join(", ")}.`
            : principales.length
              ? `Maniquí con los músculos del día encendidos: ${principales
                  .map((m) => ROTULOS[m] ?? m)
                  .join(", ")}.`
              : "Maniquí sin músculos encendidos."
        }
      >
        <MuscleModel
          tone="anatomia"
          highlight={encendidos}
          view={view}
          focus={principalesFoco}
          pulse
          onViewChange={setVista}
        />
        <button
          type="button"
          className="today-secondary"
          aria-pressed={secundarios}
          onClick={() => setSecundarios(!secundarios)}
          title={
            secundarios
              ? "Ocultar los músculos que asisten"
              : "Ver también los músculos que asisten"
          }
        >
          <Layers size={14} strokeWidth={2} aria-hidden="true" />
          Secundarios
        </button>
        <button
          type="button"
          className="today-turn"
          onClick={() => setVista(view === "front" ? "back" : "front")}
          aria-label={view === "front" ? "Ver de espaldas" : "Ver de frente"}
        >
          <RotateCcw size={15} strokeWidth={2} aria-hidden="true" />
        </button>
        <ModelCredit />
        {enFoco && (
          <p className="today-focus-label today-swap" key={enFoco.id}>
            <strong>{enFoco.name}</strong>
            <span data-kind="principal">
              {(principalesFoco ?? []).map((m) => ROTULOS[m] ?? m).join(" · ")}
            </span>
            {secundarios && secundariosFoco.length > 0 && (
              <span data-kind="asistente">
                {secundariosFoco.map((m) => ROTULOS[m] ?? m).join(" · ")}
              </span>
            )}
          </p>
        )}
        {enFoco && (
          <button
            type="button"
            className="today-unfocus"
            onClick={() => setOpen(null)}
          >
            <X size={13} strokeWidth={2.4} aria-hidden="true" />
            Ver el día
          </button>
        )}
      </div>

      <section className="today-hero" aria-labelledby={titleId}>
        {live ? (
          <dl className="today-stats" key="live">
            <div>
              <dt>Tiempo</dt>
              <dd>
                <SessionClock startedAt={live.startedAt} />
              </dd>
            </div>
            <div>
              <dt>Series</dt>
              <dd>
                {doneSets}
                <small>/ {plannedSets}</small>
              </dd>
              <span className="today-progress" aria-hidden="true">
                <i
                  style={{
                    width: `${plannedSets ? Math.min(100, (doneSets / plannedSets) * 100) : 0}%`,
                  }}
                />
              </span>
            </div>
            <div>
              <dt>Volumen</dt>
              <dd>
                {new Intl.NumberFormat("es-CR").format(volumen)}
                <small>kg</small>
              </dd>
            </div>
          </dl>
        ) : (
          plan &&
          exercises.length > 0 && (
            <dl className="today-stats today-swap" key={day?.id}>
              <div
                title={`Estimado: ${SECONDS_PER_SET} s por serie, el descanso del plan entre series (${DEFAULT_REST_SECONDS} s si no lo indica) y 1 min por cambio de ejercicio. Sin calentamiento.`}
              >
                <dt>Duración</dt>
                <dd>
                  <span className="today-approx">≈</span>
                  {minutos}
                  <small>min</small>
                </dd>
              </div>
              <div>
                <dt>Series</dt>
                <dd>
                  {series}
                  <small>· {exercises.length} ejerc.</small>
                </dd>
              </div>
              {overview.latestRecord ? (
                <div
                  title={`${overview.latestRecord.exerciseName} · ${hace(overview.latestRecord.date)}`}
                >
                  <dt>Última marca</dt>
                  <dd>
                    +{kg(overview.latestRecord.deltaKg)}
                    <small>{overview.latestRecord.exerciseName}</small>
                  </dd>
                </div>
              ) : (
                <div>
                  <dt>Última sesión</dt>
                  <dd>
                    {ultimaSesion ? capital(hace(ultimaSesion.startedAt)) : "—"}
                  </dd>
                </div>
              )}
            </dl>
          )
        )}

        <div className="today-actions">
          {live ? (
            <button
              type="button"
              className="today-cta"
              disabled={finishing || pendingLog}
              onClick={() =>
                startFinish(async () => {
                  const result = await finishSession({ sessionId: live.id });
                  if (result && "error" in result)
                    toast.error("No se pudo terminar la sesión.");
                })
              }
            >
              <Check size={17} strokeWidth={2.4} aria-hidden="true" />
              {finishing ? "Guardando…" : "Terminar entrenamiento"}
            </button>
          ) : enCurso ? (
            <Link
              className="today-cta"
              href={`/entrenamiento/sesion/${enCurso.id}`}
            >
              <Play size={16} fill="currentColor" aria-hidden="true" />
              Continuar sesión
            </Link>
          ) : (
            <StartSessionButton
              className="today-cta"
              planId={plan?.id}
              planDayId={day?.id}
              label={plan ? "Empezar entrenamiento" : "Iniciar sesión libre"}
            />
          )}
          {enCurso && !live && (
            <p role="status" className="today-status">
              Tienes una sesión en curso
            </p>
          )}
          {live && (
            <button
              type="button"
              className="today-discard"
              data-armed={discardArmed ? "" : undefined}
              onClick={() => {
                if (!discardArmed) {
                  setDiscardArmed(true);
                  window.setTimeout(() => setDiscardArmed(false), 3500);
                  return;
                }
                startFinish(async () => {
                  await discardSession({ sessionId: live.id });
                });
              }}
            >
              {discardArmed
                ? "Toca otra vez para descartar la sesión"
                : "Descartar sesión"}
            </button>
          )}
          {!plan && !enCurso && <CreatePlanDialog />}
          {plan && !live && (
            <Link
              className="today-plan"
              href={`/entrenamiento/rutinas/${plan.id}`}
            >
              {plan.name} <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          )}
        </div>
      </section>

      <div className="today-list">
        {days.length > 0 && <h3 className="today-list-title">Tus días</h3>}
        {days.map((d, i) => (
          <DayCard
            key={d.id}
            index={i}
            name={d.name ?? `Día ${i + 1}`}
            exercises={d.exercises}
            selected={d.id === day?.id}
            open={openDay === d.id}
            onChoose={() => chooseDay(d.id)}
          >
            {d.exercises.map((e) =>
              live && d.id === live.planDayId ? (
                <LiveExerciseRow
                  key={e.id}
                  exercise={e}
                  sets={sets.filter((s) => s.exerciseId === e.exerciseId)}
                  history={overview.history[e.exerciseId]}
                  open={open === e.id}
                  onToggle={() => toggleExercise(e.id)}
                  onLog={logFor(e)}
                  onUndo={undo}
                />
              ) : (
                <ExerciseRow
                  key={e.id}
                  exercise={e}
                  history={overview.history[e.exerciseId]}
                  open={open === e.id}
                  onToggle={() => toggleExercise(e.id)}
                />
              ),
            )}
          </DayCard>
        ))}
        {plan && days.length === 0 && (
          <p className="today-empty">
            Esta rutina todavía no tiene días. Agrégalos desde{" "}
            <Link href={`/entrenamiento/rutinas/${plan.id}`}>tu rutina</Link>.
          </p>
        )}
        {!plan && (
          <p className="today-empty">
            Crea una rutina, importa la tuya o empieza una sesión libre y añade
            los ejercicios sobre la marcha. También puedes{" "}
            <Link href="/entrenamiento?vista=biblioteca">
              explorar la biblioteca
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
  return live ? (
    <TimerProvider sessionId={live.id}>{content}</TimerProvider>
  ) : (
    content
  );
}

/**
 * Un día de la rutina: una tarjeta redonda con sus músculos por título, que
 * se despliega con todos sus ejercicios.
 */
function DayCard({
  index,
  name,
  exercises,
  selected,
  open,
  onChoose,
  children,
}: {
  index: number;
  name: string;
  exercises: PlanExerciseView[];
  selected: boolean;
  open: boolean;
  onChoose: () => void;
  children: React.ReactNode;
}) {
  const panelId = useId();
  const series = exercises.reduce((t, e) => t + (e.sets ?? 0), 0);
  const musculos = musculosDelDia(exercises);
  const letra =
    name.replace(/^d[ií]a\s+/i, "").slice(0, 2) || String(index + 1);
  return (
    <section
      className="today-day"
      data-open={open ? "" : undefined}
      data-selected={selected ? "" : undefined}
    >
      <button
        type="button"
        className="today-day-head"
        aria-expanded={open}
        aria-controls={panelId}
        aria-current={selected ? "true" : undefined}
        onClick={onChoose}
      >
        <span className="today-day-badge" aria-hidden="true">
          {letra}
        </span>
        <span className="today-day-name">
          <strong>
            {musculos.length ? capital(enumerar(musculos.slice(0, 3))) : name}
          </strong>
          <small>
            {name} · {exercises.length}{" "}
            {exercises.length === 1 ? "ejercicio" : "ejercicios"} · {series}{" "}
            series · ≈ {estimatedMinutes(exercises)} min
          </small>
        </span>
        <span className="today-row-chevron" aria-hidden="true">
          <ChevronDown size={16} strokeWidth={2} />
        </span>
      </button>
      <div className="today-row-panel" id={panelId}>
        <div>
          {exercises.length ? (
            <ul className="today-day-list">{children}</ul>
          ) : (
            <p className="today-empty">Este día todavía no tiene ejercicios.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function ExerciseRow({
  exercise: e,
  history,
  open,
  onToggle,
}: {
  exercise: PlanExerciseView;
  history: TrainingOverview["history"][string] | undefined;
  open: boolean;
  onToggle: () => void;
}) {
  const panelId = useId();
  const last = history?.last ?? null;
  const previous = history?.previous ?? null;
  const delta = last && previous ? last.weightKg - previous.weightKg : null;
  const meta = [
    last ? kg(last.weightKg) : e.equipment,
    descanso(e.restSeconds),
  ].filter(Boolean);

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
          <EquipmentIcon equipment={e.equipment} />
        </span>
        <span className="today-row-name">
          <strong>{e.name}</strong>
          <small>
            {meta.join(" · ")}
            {e.daySwap ? " · sustituido hoy" : ""}
          </small>
        </span>
        <span className="today-row-dose">
          <strong>
            {e.sets ?? "—"}
            <i>×</i>
            {reps(e)}
          </strong>
          <small>series × reps</small>
        </span>
        <span className="today-row-chevron" aria-hidden="true">
          <ChevronDown size={16} strokeWidth={2} />
        </span>
      </button>
      <div
        className="today-row-panel"
        id={panelId}
        role="region"
        aria-label={e.name}
      >
        <div>
          <div className="today-last">
            {last ? (
              <>
                <p className="today-last-value">
                  {new Intl.NumberFormat("es-CR", {
                    maximumFractionDigits: 1,
                  }).format(last.weightKg)}
                  <small>kg</small>
                </p>
                <p className="today-last-meta">
                  La última vez: {last.repetitions} reps · {hace(last.date)}
                </p>
                {delta !== null && delta !== 0 && (
                  <p
                    className="today-last-delta"
                    data-down={delta < 0 ? "" : undefined}
                  >
                    {delta > 0 ? "+" : "−"}
                    {kg(Math.abs(delta))} frente a la vez anterior
                  </p>
                )}
              </>
            ) : (
              <p className="today-last-meta">
                Sin registros todavía: la primera vez marca tu punto de partida.
              </p>
            )}
          </div>
          {e.sets ? (
            <ol className="today-sets" aria-label="Series previstas">
              {Array.from({ length: e.sets }, (_, i) => (
                <li key={i}>
                  <span>S{i + 1}</span>
                  <small>{reps(e)}</small>
                </li>
              ))}
            </ol>
          ) : null}
          {(e.rir !== null || e.tempo || e.notes) && (
            <p className="today-row-notes">
              {[
                e.rir !== null ? `RIR ${e.rir}` : null,
                e.tempo ? `Tempo ${e.tempo}` : null,
                e.notes,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          )}
          <div className="today-row-help">
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
