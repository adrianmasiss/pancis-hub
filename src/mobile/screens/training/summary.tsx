"use client";

import { Check, TrendingUp } from "lucide-react";
import type {
  PlanExerciseView,
  SessionDetail,
  SessionSummary,
} from "@/features/training/queries";
import type { ExerciseHistory } from "@/features/training/lib/stats";
import { mmss } from "@/features/training/components/live-session";
import { Stat } from "@/mobile/ui/display";
import { useUnits } from "@/mobile/units";
import { WeekStrip, buildWeek } from "./week";

type LoggedSet = {
  exerciseId: string;
  isWarmup: boolean;
  weightKg: number | null;
  repetitions: number | null;
};

/**
 * Resumen del entrenamiento, ANTES de guardar: duracion, volumen, series y
 * ejercicios; la semana; las mejoras del dia y los cambios hechos. «Guardar»
 * cierra la sesion; «Volver» sigue entrenando.
 */
export function WorkoutSummary({
  session,
  exercises,
  sets,
  history,
  elapsedMs,
  today,
  timezone,
  recentSessions,
  doneThisWeek,
  saving,
  onSave,
  onBack,
}: {
  session: SessionDetail;
  exercises: PlanExerciseView[];
  sets: LoggedSet[];
  history: Record<string, ExerciseHistory>;
  elapsedMs: number;
  today: string;
  timezone: string;
  recentSessions: SessionSummary[];
  doneThisWeek: Record<string, string>;
  saving: boolean;
  onSave: () => void;
  onBack: () => void;
}) {
  const u = useUnits();
  const effective = sets.filter((s) => !s.isWarmup);
  const volume = Math.round(
    effective.reduce((t, s) => t + (s.weightKg ?? 0) * (s.repetitions ?? 0), 0),
  );
  const touched = exercises.filter((e) =>
    effective.some((s) => s.exerciseId === e.exerciseId),
  );

  /* Mejoras: la serie mas pesada de hoy frente a la de la vez anterior. */
  const improvements = touched.flatMap((e) => {
    const top = Math.max(
      0,
      ...effective
        .filter((s) => s.exerciseId === e.exerciseId)
        .map((s) => s.weightKg ?? 0),
    );
    const h = history[e.exerciseId];
    const before =
      h?.last && h.last.date.slice(0, 10) < today ? h.last : h?.previous;
    if (!before || top <= before.weightKg) return [];
    return [{ name: e.name, delta: top - before.weightKg }];
  });
  const changes = exercises.filter((e) => e.daySwap);

  const week = buildWeek({
    today,
    timezone,
    recentSessions,
    doneThisWeek,
    todayDone: true,
  });

  return (
    <div className="m-screen m-summary" data-m-fullscreen="">
      <div
        className="m-body m-stagger"
        style={{ paddingTop: "calc(40px + env(safe-area-inset-top))" }}
      >
        <div className="m-summary-head">
          <span className="m-summary-check m-pop m-pulse" aria-hidden="true">
            <Check size={34} strokeWidth={2.5} />
          </span>
          <h1 className="m-title">Entrenamiento completado</h1>
          <p className="m-sub">
            {[session.dayName, session.planName].filter(Boolean).join(" · ") ||
              "Sesión libre"}
          </p>
        </div>

        <div className="m-grid-2">
          <div className="m-card" data-size="sm">
            <Stat value={mmss(elapsedMs)} label="Duración" />
          </div>
          <div className="m-card" data-size="sm">
            <Stat
              value={u.fmtWeight(volume, 0)}
              unit={u.weightUnit}
              label="Volumen total"
            />
          </div>
          <div className="m-card" data-size="sm">
            <Stat value={effective.length} label="Series" />
          </div>
          <div className="m-card" data-size="sm">
            <Stat
              value={`${touched.length}/${exercises.length || touched.length}`}
              label="Ejercicios"
            />
          </div>
        </div>

        <section className="m-card" aria-labelledby="m-sum-week">
          <h2 id="m-sum-week" className="m-section">
            Esta semana
          </h2>
          <WeekStrip week={week} />
        </section>

        {(improvements.length > 0 || changes.length > 0) && (
          <section className="m-card" aria-labelledby="m-sum-high">
            <h2 id="m-sum-high" className="m-section">
              Destacado de hoy
            </h2>
            {improvements.map((i) => (
              <div key={i.name} className="m-row">
                <TrendingUp
                  size={16}
                  className="m-accent-text"
                  aria-hidden="true"
                />
                <span
                  className="m-num m-accent-text"
                  style={{ fontWeight: 700 }}
                >
                  +{u.fmtWeight(i.delta)} {u.weightUnit}
                </span>
                <span style={{ fontSize: 14 }}>{i.name}</span>
              </div>
            ))}
            {changes.map((c) => (
              <p key={c.id} style={{ fontSize: 14 }}>
                {c.daySwap!.name} → {c.name}{" "}
                <span className="m-sub">(solo hoy)</span>
              </p>
            ))}
          </section>
        )}
      </div>

      <div className="m-summary-actions">
        <button
          type="button"
          className="m-btn m-press"
          data-variant="primary"
          data-block=""
          disabled={saving}
          onClick={onSave}
        >
          {saving ? "Guardando…" : "Guardar entrenamiento"}
        </button>
        <button
          type="button"
          className="m-btn"
          data-variant="ghost"
          data-block=""
          disabled={saving}
          onClick={onBack}
        >
          Volver al entrenamiento
        </button>
      </div>
    </div>
  );
}
