"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  useEffect,
  useMemo,
  useOptimistic,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  ChevronLeft,
  Dumbbell,
  Pause,
  Play,
  Plus,
  Search,
  Timer,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { canGoBackInApp } from "@/mobile/ui/back-button";
import { animateBack, markNav } from "@/mobile/nav-direction";
import { SwipeRow } from "@/mobile/ui/swipe-row";
import { useExitGuard } from "@/mobile/use-exit-guard";
import {
  WheelColumn,
  WheelGroup,
  Wheels,
  range,
  type WheelOption,
} from "@/mobile/ui/wheel";
import {
  clearLive,
  liveKeys,
  pruneLive,
  updateLive,
  useStored,
  type LivePause,
} from "./live-store";
import { notifyRestEnd } from "@/mobile/rest-notice";
import {
  addSessionPause,
  deleteSet,
  discardSession,
  finishSession,
  logSet,
  searchExercises,
} from "@/features/training/actions";
import type {
  PlanExerciseView,
  SessionDetail,
  SessionSummary,
} from "@/features/training/queries";
import type { ExerciseHistory } from "@/features/training/lib/stats";
import { useNow, mmss } from "@/features/training/components/live-session";
import { capital, musculo } from "@/features/training/components/training-ui";
import { triggerHaptic } from "@/lib/haptics";
import { Sheet } from "@/mobile/ui/sheet";
import { CheckCircle } from "@/mobile/ui/controls";
import { Ring } from "@/mobile/ui/display";
import { useSearch } from "@/mobile/ui/use-search";
import { ModelDisclosure } from "@/mobile/ui/exercise-model";
import { useUnits } from "@/mobile/units";
import { WorkoutSummary } from "./summary";
import { SwapSheet } from "./swap-sheet";

type LoggedSet = {
  id: string;
  exerciseId: string;
  isWarmup: boolean;
  weightKg: number | null;
  repetitions: number | null;
  rir: number | null;
};

type Draft = { kg: number; reps: number; rir: number };

/** Por donde ibas: se guarda en el telefono (live-store.ts). */
type Progress = {
  index?: number;
  drafts: Record<string, Draft>;
  /** Filas de mas (o de menos) sobre las series del plan, por ejercicio. */
  rows: Record<string, number>;
  /** Ejercicios sumados en una sesion libre que aun no tienen series. */
  added: PlanExerciseView[];
  /** El ejercicio en pantalla, para la mini barra «Entrenando». */
  name?: string;
};

const NO_PROGRESS: Progress = { drafts: {}, rows: {}, added: [] };

/** Con barra se suman discos fraccionados; el resto va de medio en medio. */
function weightStep(equipment: string | null) {
  return equipment === "barra" ? 0.25 : 0.5;
}

const DECIMALES = (paso: number): WheelOption<number>[] =>
  range(0, 1 - paso, paso, (v) =>
    v === 0 ? ",0" : `,${String(v).split(".")[1]}`,
  );

/** Un descanso que termina dentro de `ms`. */
function restFor(ms: number) {
  return { endsAt: Date.now() + ms, total: ms };
}

/** Ejercicio de una sesion libre, armado desde el catalogo. */
function freeExercise(ex: {
  id: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: string | null;
}): PlanExerciseView {
  return {
    id: `libre-${ex.id}`,
    exerciseId: ex.id,
    name: ex.name,
    primaryMuscle: ex.primaryMuscle,
    secondaryMuscles: ex.secondaryMuscles,
    equipment: ex.equipment,
    position: 0,
    sets: 3,
    repsMin: null,
    repsMax: null,
    rir: null,
    rpe: null,
    tempo: null,
    restSeconds: 90,
    notes: null,
    daySwap: null,
  };
}

/**
 * Entrenamiento activo, a pantalla completa.
 *
 * Arriba la foto con el reloj de la sesion y la pausa; en medio una fila por
 * serie (#, peso, reps, RIR y check). Los valores en gris son los de la vez
 * anterior y un punto marca la serie actual. Abajo, el anillo del avance por
 * ejercicio, el siguiente y «Siguiente». Lo registrado se ve al instante; el
 * servidor lo confirma detras (las mismas acciones que escritorio).
 */
export function ActiveWorkout({
  session,
  history,
  images,
  backHref,
  today,
  timezone,
  recentSessions,
  doneThisWeek,
}: {
  session: SessionDetail;
  history: Record<string, ExerciseHistory>;
  images: Record<string, string>;
  backHref: string;
  today: string;
  timezone: string;
  recentSessions: SessionSummary[];
  doneThisWeek: Record<string, string>;
}) {
  const now = useNow();
  const u = useUnits();
  const reduceMotion = useReducedMotion();
  const [pendingLog, startLog] = useTransition();
  const [finishing, startFinish] = useTransition();

  /* ── Series registradas (optimistas) ── */
  const [sets, applySet] = useOptimistic(
    session.sets as LoggedSet[],
    (state: LoggedSet[], action: { add: LoggedSet } | { remove: string }) =>
      "add" in action
        ? [...state, action.add]
        : state.filter((s) => s.id !== action.remove),
  );

  /* ── Por donde ibas (en el telefono: sobrevive a cerrar la app) ── */
  const keys = liveKeys(session.id);
  const [progress] = useStored<Progress>(keys.progress, NO_PROGRESS);
  const update = (fn: (p: Progress) => Progress) =>
    updateLive(keys.progress, NO_PROGRESS, fn);
  useEffect(() => pruneLive(session.id), [session.id]);

  /* ── Ejercicios: los del plan; en sesion libre, los que se van sumando ── */
  const added = progress.added;
  const exercises = useMemo(() => {
    if (session.plannedExercises.length) return session.plannedExercises;
    const fromSets = new Map<string, PlanExerciseView>();
    for (const s of session.sets) {
      if (!fromSets.has(s.exerciseId))
        fromSets.set(
          s.exerciseId,
          freeExercise({
            id: s.exerciseId,
            name: s.exerciseName,
            primaryMuscle: "",
            secondaryMuscles: [],
            equipment: null,
          }),
        );
    }
    for (const a of added)
      if (!fromSets.has(a.exerciseId)) fromSets.set(a.exerciseId, a);
    return [...fromSets.values()];
  }, [session.plannedExercises, session.sets, added]);

  const effective = (exerciseId: string) =>
    sets.filter((s) => s.exerciseId === exerciseId && !s.isWarmup);

  // Sin nada guardado, el primer ejercicio con series pendientes.
  const [firstPending] = useState(() => {
    const i = session.plannedExercises.findIndex(
      (e) =>
        sets.filter((s) => s.exerciseId === e.exerciseId && !s.isWarmup)
          .length < (e.sets ?? 1),
    );
    return i >= 0 ? i : 0;
  });
  const index = Math.min(
    progress.index ?? firstPending,
    Math.max(0, exercises.length - 1),
  );
  const setIndex = (i: number) => update((p) => ({ ...p, index: i }));
  const e = exercises[index] ?? null;
  const next = exercises[index + 1] ?? null;
  const done = e ? effective(e.exerciseId) : [];
  // Las series del plan, mas las añadidas y menos las borradas; nunca menos
  // que las ya hechas.
  const rowsOf = (ex: PlanExerciseView, p: Progress) =>
    Math.max(
      (ex.sets ?? 3) + (p.rows[ex.exerciseId] ?? 0),
      effective(ex.exerciseId).length,
    );
  const rowsCount = e ? rowsOf(e, progress) : 0;
  const shiftRows = (ex: PlanExerciseView, delta: number) =>
    update((p) => ({
      ...p,
      rows: {
        ...p.rows,
        [ex.exerciseId]: Math.max(0, rowsOf(ex, p) + delta) - (ex.sets ?? 3),
      },
    }));

  // El nombre en pantalla, para la mini barra de la app.
  const name = e?.name;
  useEffect(() => {
    if (name) update((p) => (p.name === name ? p : { ...p, name }));
    // `update` escribe en el almacen; solo importa el nombre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  /* Lo de la ultima vez: si «la ultima vez» ya es hoy, la anterior. */
  const prev = e ? history[e.exerciseId] : undefined;
  const before =
    prev?.last && prev.last.date.slice(0, 10) < today
      ? prev.last
      : prev?.previous;

  /* ── Valores de la serie actual ── */
  const drafts = progress.drafts;
  const setDraft = (ex: PlanExerciseView, d: Draft) =>
    update((p) => ({ ...p, drafts: { ...p.drafts, [ex.exerciseId]: d } }));
  const draftFor = (ex: PlanExerciseView): Draft => {
    const own = drafts[ex.exerciseId];
    if (own) return own;
    const last = effective(ex.exerciseId).at(-1);
    const h = history[ex.exerciseId]?.last;
    return {
      kg: last?.weightKg ?? h?.weightKg ?? 0,
      reps: last?.repetitions ?? ex.repsMax ?? ex.repsMin ?? 10,
      rir: last?.rir ?? ex.rir ?? 2,
    };
  };
  const draft = e ? draftFor(e) : { kg: 0, reps: 10, rir: 2 };
  const [editing, setEditing] = useState(false);

  /* ── Descanso y pausa ── */
  const [rest, setRest] = useStored<{ endsAt: number; total: number } | null>(
    keys.rest,
    null,
  );
  /* Las pausas cerradas vienen del servidor (`pausedSeconds`); en la pestaña
     solo vive la pausa en curso y lo recien cerrado que el servidor aun no
     devolvio. Asi el reloj cuadra al recargar y en otro dispositivo. */
  const [pause, setPause] = useStored<LivePause>(keys.pause, {
    since: null,
    ms: 0,
  });
  // Lo enviado, atado al valor del servidor de ese momento: cuando el
  // servidor ya lo incluye (otra base), deja de sumarse.
  const [sent, setSent] = useState({ base: session.pausedSeconds, ms: 0 });
  const sentMs = sent.base === session.pausedSeconds ? sent.ms : 0;
  const paused = pause.since !== null;
  const pausedMs =
    session.pausedSeconds * 1000 +
    sentMs +
    (paused && now ? now - pause.since! : 0);
  const elapsed = now ? now - Date.parse(session.startedAt) - pausedMs : 0;
  const restLeft = rest && now ? rest.endsAt - now : 0;

  useEffect(() => {
    if (!rest || paused) return;
    const id = window.setTimeout(
      () => {
        setRest(null);
        triggerHaptic("success");
        toast("¡A la siguiente serie!");
        void notifyRestEnd();
      },
      Math.max(0, rest.endsAt - Date.now()),
    );
    return () => window.clearTimeout(id);
  }, [rest, paused, setRest]);

  const togglePause = () => {
    if (paused) {
      const extraMs = Date.now() - pause.since!;
      setPause({ since: null, ms: 0 });
      setSent({
        base: session.pausedSeconds,
        ms: sentMs + Math.round(extraMs / 1000) * 1000,
      });
      // La pausa se descuenta de la duracion guardada de la sesion.
      const seconds = Math.round(extraMs / 1000);
      if (seconds >= 1)
        void addSessionPause({ sessionId: session.id, seconds }).then((r) => {
          if (r && "error" in r) toast.error("No se guardó la pausa.");
        });
      // El descanso se congelo con la pausa: se corre lo mismo.
      if (rest) setRest({ ...rest, endsAt: rest.endsAt + extraMs });
    } else {
      setPause({ since: Date.now(), ms: 0 });
    }
  };

  /* ── Registrar y deshacer ── */
  const log = () => {
    if (!e) return;
    const isLast = e.sets ? done.length + 1 >= e.sets : false;
    startLog(async () => {
      applySet({
        add: {
          id: `tmp-${Date.now()}`,
          exerciseId: e.exerciseId,
          isWarmup: false,
          weightKg: draft.kg > 0 ? draft.kg : null,
          repetitions: draft.reps,
          rir: draft.rir,
        },
      });
      const result = await logSet({
        sessionId: session.id,
        exerciseId: e.exerciseId,
        isWarmup: false,
        weightKg: draft.kg > 0 ? draft.kg : undefined,
        repetitions: draft.reps,
        rir: draft.rir,
        restSeconds: e.restSeconds ?? undefined,
      });
      if (result && "error" in result)
        toast.error("No se guardó la serie. Intenta de nuevo.");
    });
    if (!isLast) {
      setRest(restFor((e.restSeconds ?? 90) * 1000));
    } else {
      setRest(null);
    }
  };

  const undo = (set: LoggedSet) => {
    if (set.id.startsWith("tmp-")) return;
    startLog(async () => {
      applySet({ remove: set.id });
      const result = await deleteSet({ setId: set.id });
      if (result && "error" in result)
        toast.error("No se pudo quitar la serie.");
    });
  };

  /* ── Borrar y sumar filas ── */
  /** Una serie hecha: se borra con su fila; «Deshacer» la vuelve a anotar. */
  const removeDone = (ex: PlanExerciseView, set: LoggedSet) => {
    undo(set);
    shiftRows(ex, -1);
    toast("Serie borrada", {
      action: {
        label: "Deshacer",
        onClick: () => {
          shiftRows(ex, 1);
          startLog(async () => {
            applySet({ add: { ...set, id: `tmp-${Date.now()}` } });
            const result = await logSet({
              sessionId: session.id,
              exerciseId: set.exerciseId,
              isWarmup: set.isWarmup,
              weightKg: set.weightKg ?? undefined,
              repetitions: set.repetitions ?? undefined,
              rir: set.rir ?? undefined,
              restSeconds: ex.restSeconds ?? undefined,
            });
            if (result && "error" in result)
              toast.error("No se pudo recuperar la serie.");
          });
        },
      },
    });
  };
  /** Una fila pendiente: solo deja de estar. */
  const removePending = (ex: PlanExerciseView) => {
    shiftRows(ex, -1);
    toast("Serie quitada", {
      action: { label: "Deshacer", onClick: () => shiftRows(ex, 1) },
    });
  };
  /** «+ Serie»: otra fila con el peso y las reps de la ultima hecha. */
  const addRow = (ex: PlanExerciseView) => {
    const last = effective(ex.exerciseId).at(-1);
    const pendientes = rowsOf(ex, progress) > effective(ex.exerciseId).length;
    if (last && !pendientes)
      setDraft(ex, {
        kg: last.weightKg ?? draft.kg,
        reps: last.repetitions ?? draft.reps,
        rir: last.rir ?? draft.rir,
      });
    shiftRows(ex, 1);
    triggerHaptic("selection");
  };

  /* ── Hojas ── */
  const [swapOpen, setSwapOpen] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [summary, setSummary] = useState(false);
  const [discardOpen, setDiscardOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);

  /* ── Salir: «Volver» y el atras del sistema preguntan ── */
  const router = useRouter();
  const guard = useExitGuard((rearm) => {
    // Desde el resumen, atras vuelve a la sesion.
    if (summary) {
      setSummary(false);
      rearm();
    } else setExitOpen(true);
  });
  const keepGoing = () => {
    setExitOpen(false);
    guard.arm();
  };
  /** «Dejar en curso»: a la pantalla de antes; la mini barra trae de vuelta. */
  const leave = () => {
    setExitOpen(false);
    // Recien empezada, la sesion se abre sobre Entrenar (sin `?vista=`): la
    // pantalla de antes es la misma URL, asi que se va directo a Hoy.
    const sobreEntrenar = !new URLSearchParams(window.location.search).has(
      "vista",
    );
    if (!canGoBackInApp() || sobreEntrenar) {
      guard.disarm();
      markNav("back");
      router.replace(backHref);
    } else if (guard.disarm()) {
      // Habia una entrada de guardia encima: se saltan las dos.
      animateBack(() => window.history.go(-2));
    } else {
      animateBack(() => router.back());
    }
  };

  const finish = () =>
    startFinish(async () => {
      clearLive(session.id);
      const result = await finishSession({
        sessionId: session.id,
        returnTo: "/",
      });
      if (result && "error" in result)
        toast.error("No se pudo guardar el entrenamiento.");
    });

  if (summary) {
    return (
      <WorkoutSummary
        session={session}
        exercises={exercises}
        sets={sets}
        history={history}
        elapsedMs={elapsed}
        today={today}
        timezone={timezone}
        recentSessions={recentSessions}
        doneThisWeek={doneThisWeek}
        saving={finishing}
        onSave={finish}
        onBack={() => setSummary(false)}
      />
    );
  }

  const image = e ? images[e.exerciseId] : undefined;
  const muscles = e
    ? [e.primaryMuscle, ...e.secondaryMuscles.slice(0, 2)]
        .filter(Boolean)
        .map((m) => capital(musculo(m)))
    : [];

  return (
    <div className="m-active" data-m-fullscreen="">
      <div className="m-active-hero">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- foto del catalogo
          <img src={image} alt="" className="m-active-photo" />
        ) : (
          <div className="m-active-placeholder" aria-hidden="true">
            <Dumbbell size={40} strokeWidth={1.5} />
          </div>
        )}
        <div className="m-active-fade" aria-hidden="true" />
        <div className="m-active-top">
          <button
            type="button"
            aria-label="Salir del entrenamiento"
            className="m-icon-btn m-press"
            data-glass=""
            onClick={() => setExitOpen(true)}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
          <div
            className="m-active-clock"
            role="timer"
            aria-label="Tiempo de la sesión"
          >
            <Timer size={16} strokeWidth={2} aria-hidden="true" />
            <span className="m-num">{now ? mmss(elapsed) : "—"}</span>
            {session.dayName && (
              <span className="m-active-day">{session.dayName}</span>
            )}
          </div>
          <button
            type="button"
            aria-label={
              paused ? "Reanudar entrenamiento" : "Pausar entrenamiento"
            }
            className="m-icon-btn m-press"
            data-variant="primary"
            onClick={() => {
              if (!paused) togglePause();
              setPauseOpen(true);
            }}
          >
            {paused ? (
              <Play size={16} fill="currentColor" aria-hidden="true" />
            ) : (
              <Pause size={16} fill="currentColor" aria-hidden="true" />
            )}
          </button>
        </div>
        <div className="m-active-title">
          <div className="m-sub">
            {exercises.length
              ? `Ejercicio ${index + 1} de ${exercises.length}`
              : "Sesión libre"}
          </div>
          <h1 className="m-active-name">
            {e?.name ?? "Agrega tu primer ejercicio"}
          </h1>
          {e?.daySwap && (
            <div className="m-sub">En lugar de {e.daySwap.name} · solo hoy</div>
          )}
          {muscles.length > 0 && (
            <div className="m-row" style={{ gap: 6, flexWrap: "wrap" }}>
              {muscles.map((m) => (
                <span key={m} className="m-chip">
                  {m}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {e ? (
        <div className="m-active-body">
          <div className="m-set-grid m-eyebrow" aria-hidden="true">
            <span>#</span>
            <span>Peso</span>
            <span>Reps</span>
            <span>RIR</span>
            <span />
          </div>
          <ol className="m-sets" aria-label="Series">
            {Array.from({ length: rowsCount }, (_, i) => {
              const set = done[i];
              const current = i === done.length;
              const vals = set
                ? {
                    kg: set.weightKg ?? 0,
                    reps: set.repetitions ?? 0,
                    rir: set.rir,
                  }
                : current
                  ? draft
                  : {
                      kg: before?.weightKg ?? draft.kg,
                      reps: before?.repetitions ?? draft.reps,
                      rir: e.rir ?? draft.rir,
                    };
              const tone = set ? "done" : current ? "current" : "future";
              const editable = current && !paused;
              return (
                <SwipeRow
                  key={set ? set.id : `p-${i}`}
                  className="m-set-grid m-set-row"
                  data-tone={tone}
                  deleteLabel={`Borrar serie ${i + 1}`}
                  disabled={set ? set.id.startsWith("tmp-") : false}
                  onDelete={() => (set ? removeDone(e, set) : removePending(e))}
                >
                  <span className="m-set-n">
                    {current ? (
                      <span
                        className="m-set-dot"
                        role="img"
                        aria-label="Serie actual"
                      />
                    ) : (
                      <span className="m-num">{i + 1}</span>
                    )}
                  </span>
                  <button
                    type="button"
                    className="m-set-pill"
                    disabled={!editable}
                    aria-label={`Serie ${i + 1}, peso ${vals.kg ? u.fmtWeight(vals.kg) : 0} ${u.weightUnit}${editable ? ". Editar" : ""}`}
                    onClick={() => setEditing(true)}
                  >
                    <span className="m-num">
                      {vals.kg ? u.fmtWeight(vals.kg) : "—"}
                    </span>
                    <small>{u.weightUnit}</small>
                  </button>
                  <button
                    type="button"
                    className="m-set-pill"
                    disabled={!editable}
                    aria-label={`Serie ${i + 1}, ${vals.reps} repeticiones${editable ? ". Editar" : ""}`}
                    onClick={() => setEditing(true)}
                  >
                    <span className="m-num">{vals.reps || "—"}</span>
                    <small>reps</small>
                  </button>
                  <button
                    type="button"
                    className="m-set-pill"
                    disabled={!editable}
                    aria-label={`Serie ${i + 1}, RIR ${vals.rir ?? "sin dato"}${editable ? ". Editar" : ""}`}
                    onClick={() => setEditing(true)}
                  >
                    <span className="m-num">{vals.rir ?? "—"}</span>
                  </button>
                  <CheckCircle
                    checked={Boolean(set)}
                    current={current}
                    disabled={(!set && !current) || pendingLog || paused}
                    label={
                      set
                        ? `Desmarcar serie ${i + 1}`
                        : `Completar serie ${i + 1}`
                    }
                    onToggle={() => (set ? undo(set) : log())}
                  />
                </SwipeRow>
              );
            })}
          </ol>
          <button
            type="button"
            className="m-set-add m-press"
            onClick={() => addRow(e)}
          >
            <Plus size={16} aria-hidden="true" />
            Serie
          </button>
          <p className="m-sub" style={{ fontSize: 12, fontWeight: 500 }}>
            {before ? "En gris, tu sesión anterior. " : ""}
            Toca un valor de la serie actual para editarlo; desliza una serie a
            la izquierda para borrarla.
          </p>
          <div className="m-row">
            {session.plannedExercises.length > 0 && (
              <button
                type="button"
                className="m-btn m-press"
                onClick={() => setSwapOpen(true)}
              >
                <ArrowLeftRight size={16} aria-hidden="true" />
                Cambiar solo hoy
              </button>
            )}
            {session.plannedExercises.length === 0 && (
              <button
                type="button"
                className="m-btn m-press"
                onClick={() => setAddOpen(true)}
              >
                <Dumbbell size={16} aria-hidden="true" />
                Ejercicio
              </button>
            )}
          </div>
          <ModelDisclosure key={e.exerciseId} exercises={[e]} />
        </div>
      ) : (
        <div className="m-active-body">
          <button
            type="button"
            className="m-btn m-press"
            data-variant="primary"
            data-block=""
            onClick={() => setAddOpen(true)}
          >
            <Plus size={18} aria-hidden="true" />
            Agregar ejercicio
          </button>
        </div>
      )}

      <div className="m-active-spacer" />

      <AnimatePresence>
        {rest && (paused || restLeft > 0) && (
          <motion.div
            key="rest"
            className="m-rest"
            role="timer"
            aria-live="polite"
            initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
            transition={{ duration: 0.15, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div style={{ flex: 1 }}>
              <div className="m-sub" style={{ fontSize: 12 }}>
                {paused ? "Descanso en pausa" : "Descanso"}
              </div>
              <div className="m-num m-rest-time">
                {mmss(paused ? rest.endsAt - pause.since! : restLeft)}
              </div>
            </div>
            <button
              type="button"
              className="m-btn m-press"
              data-variant="soft"
              aria-label="Restar 15 segundos"
              onClick={() => setRest({ ...rest, endsAt: rest.endsAt - 15000 })}
            >
              −15
            </button>
            <button
              type="button"
              className="m-btn m-press"
              data-variant="soft"
              aria-label="Sumar 15 segundos"
              onClick={() =>
                setRest({
                  endsAt: rest.endsAt + 15000,
                  total: rest.total + 15000,
                })
              }
            >
              +15
            </button>
            <button
              type="button"
              className="m-btn m-press"
              data-variant="soft"
              onClick={() => setRest(null)}
            >
              Saltar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="m-active-foot">
        <Ring
          value={exercises.length ? (index + 1) / exercises.length : 0}
          size={48}
          label={`Ejercicio ${index + 1} de ${exercises.length}`}
        >
          <span className="m-num" style={{ fontSize: 13 }}>
            {exercises.length ? `${index + 1}/${exercises.length}` : "—"}
          </span>
        </Ring>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="m-sub" style={{ fontSize: 12 }}>
            {next ? "Siguiente" : "Último ejercicio"}
          </div>
          <div className="m-list-row-title">
            {next?.name ?? "Terminar y revisar"}
          </div>
        </div>
        <button
          type="button"
          className="m-btn m-press"
          data-variant="primary"
          style={{ height: 48, padding: "0 18px", fontSize: 15 }}
          onClick={() => {
            triggerHaptic("selection");
            if (next) {
              setIndex(index + 1);
              setEditing(false);
            } else setSummary(true);
          }}
        >
          {next ? "Siguiente" : "Terminar"}
          <ArrowRight size={18} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>

      {e && (
        <SetWheelsSheet
          open={editing}
          onClose={() => setEditing(false)}
          title={`Serie ${done.length + 1}`}
          draft={draft}
          equipment={e.equipment}
          onChange={(d) => setDraft(e, d)}
        />
      )}

      <Sheet
        open={exitOpen}
        onOpenChange={(o) => !o && keepGoing()}
        title="¿Salir del entrenamiento?"
        description="Puedes terminarlo ahora o dejarlo abierto y volver desde la barra «Entrenando»."
      >
        <button
          type="button"
          className="m-btn m-press"
          data-variant="primary"
          data-block=""
          onClick={() => {
            setExitOpen(false);
            guard.arm();
            setSummary(true);
          }}
        >
          Terminar entrenamiento
        </button>
        <button
          type="button"
          className="m-btn m-press"
          data-block=""
          onClick={leave}
        >
          Dejar en curso
        </button>
        <button
          type="button"
          className="m-btn m-press"
          data-variant="danger"
          data-block=""
          disabled={finishing}
          onClick={() => {
            setExitOpen(false);
            guard.arm();
            if (!paused) togglePause();
            setDiscardOpen(true);
          }}
        >
          <Trash2 size={16} aria-hidden="true" />
          Descartar sesión
        </button>
      </Sheet>

      {e && session.plannedExercises.length > 0 && (
        <SwapSheet
          key={e.id}
          exercise={e}
          open={swapOpen}
          onOpenChange={setSwapOpen}
        />
      )}

      <Sheet
        open={pauseOpen}
        onOpenChange={(o) => {
          setPauseOpen(o);
          if (!o && paused && !discardOpen) togglePause();
        }}
        title="Entrenamiento en pausa"
        description="El reloj y el descanso se detienen hasta que sigas."
      >
        <button
          type="button"
          className="m-btn m-press"
          data-variant="primary"
          data-block=""
          onClick={() => {
            togglePause();
            setPauseOpen(false);
          }}
        >
          <Play size={16} fill="currentColor" aria-hidden="true" />
          Seguir entrenando
        </button>
        <button
          type="button"
          className="m-btn m-press"
          data-block=""
          onClick={() => {
            togglePause();
            setPauseOpen(false);
            setSummary(true);
          }}
        >
          Terminar y revisar
        </button>
        <button
          type="button"
          className="m-btn m-press"
          data-variant="danger"
          data-block=""
          disabled={finishing}
          onClick={() => {
            setPauseOpen(false);
            setDiscardOpen(true);
          }}
        >
          <Trash2 size={16} aria-hidden="true" />
          Descartar sesión
        </button>
      </Sheet>

      {/* Descartar es irreversible: hoja propia, roja, que dice que se pierde. */}
      <Sheet
        open={discardOpen}
        onOpenChange={(o) => {
          setDiscardOpen(o);
          if (!o && paused) togglePause();
        }}
        title="¿Descartar este entrenamiento?"
        description={(() => {
          const n = sets.filter((st) => !st.isWarmup).length;
          return n
            ? `Se perderán ${n === 1 ? "la serie registrada" : `las ${n} series registradas`} y el tiempo de la sesión. No se puede deshacer.`
            : "Se perderá el tiempo de la sesión. No se puede deshacer.";
        })()}
        icon={
          <span className="m-sheet-icon" data-tone="danger" aria-hidden="true">
            <AlertTriangle size={24} />
          </span>
        }
      >
        <button
          type="button"
          className="m-btn m-press"
          data-variant="destructive"
          data-block=""
          disabled={finishing}
          onClick={() =>
            startFinish(async () => {
              clearLive(session.id);
              await discardSession({ sessionId: session.id });
            })
          }
        >
          {finishing ? "Descartando…" : "Descartar"}
        </button>
        <button
          type="button"
          className="m-btn m-press"
          data-block=""
          onClick={() => {
            setDiscardOpen(false);
            if (paused) togglePause();
          }}
        >
          Seguir entrenando
        </button>
      </Sheet>

      <AddExerciseSheet
        open={addOpen}
        onOpenChange={setAddOpen}
        onPick={(ex) => {
          update((p) => ({ ...p, added: [...p.added, freeExercise(ex)] }));
          setIndex(exercises.length);
          setAddOpen(false);
        }}
      />
    </div>
  );
}

function AddExerciseSheet({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onPick: (ex: {
    id: string;
    name: string;
    primaryMuscle: string;
    secondaryMuscles: string[];
    equipment: string | null;
  }) => void;
}) {
  const [term, setTerm] = useState("");
  const results = useSearch(term, async (q) => {
    const r = await searchExercises({ term: q });
    return "error" in r ? null : r.results.slice(0, 12);
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Agregar ejercicio">
      <label className="m-search">
        <Search size={18} aria-hidden="true" />
        <span className="sr-only">Buscar ejercicio</span>
        <input
          type="search"
          placeholder="Buscar ejercicio"
          value={term}
          onChange={(ev) => setTerm(ev.target.value)}
        />
      </label>
      <div className="m-stack">
        {results.map((r) => (
          <button
            key={r.id}
            type="button"
            className="m-list-row m-press"
            onClick={() => onPick(r)}
          >
            <span className="m-list-row-main">
              <span className="m-list-row-title">{r.name}</span>
              <span className="m-list-row-sub">
                {capital(musculo(r.primaryMuscle))}
              </span>
            </span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

/**
 * Los valores de la serie en ruedas tipo iOS: peso en enteros y decimales
 * (en la unidad del usuario; se guarda en kg), reps y RIR. Arranca en el
 * valor anterior y cada giro se aplica al momento.
 */
function SetWheelsSheet({
  open,
  onClose,
  title,
  draft,
  equipment,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  draft: Draft;
  equipment: string | null;
  onChange: (d: Draft) => void;
}) {
  const u = useUnits();
  const paso = weightStep(equipment);
  const w = Math.round(u.weight(draft.kg) / paso) * paso;
  const entero = Math.floor(w + 1e-9);
  const decimal = Math.round((w - entero) * 100) / 100;
  const enteros = useMemo(
    () => range(0, u.imperial ? 1100 : 500),
    [u.imperial],
  );
  const decimales = useMemo(() => DECIMALES(paso), [paso]);
  const reps = useMemo(() => range(1, Math.max(30, draft.reps)), [draft.reps]);
  const rirs = useMemo(() => range(0, Math.max(5, draft.rir)), [draft.rir]);
  const peso = (ent: number, dec: number) =>
    onChange({ ...draft, kg: Math.round(u.toKg(ent + dec) * 100) / 100 });

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()} title={title}>
      <Wheels>
        <WheelGroup label="Peso" unit={u.weightUnit}>
          <WheelColumn
            label={`Peso, ${u.weightUnit} enteros`}
            options={enteros}
            value={entero}
            onChange={(v) => peso(v, decimal)}
          />
          <WheelColumn
            label="Peso, decimales"
            options={decimales}
            value={decimal}
            onChange={(v) => peso(entero, v)}
          />
        </WheelGroup>
        <WheelGroup label="Reps">
          <WheelColumn
            label="Repeticiones"
            options={reps}
            value={draft.reps}
            onChange={(v) => onChange({ ...draft, reps: v })}
          />
        </WheelGroup>
        <WheelGroup label="RIR">
          <WheelColumn
            label="Repeticiones en reserva"
            options={rirs}
            value={draft.rir}
            onChange={(v) => onChange({ ...draft, rir: v })}
          />
        </WheelGroup>
      </Wheels>
      <button
        type="button"
        className="m-btn m-press"
        data-variant="primary"
        data-block=""
        onClick={onClose}
      >
        Listo
      </button>
    </Sheet>
  );
}
