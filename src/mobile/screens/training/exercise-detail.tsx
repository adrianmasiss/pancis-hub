"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { ChevronLeft, Dumbbell, Heart, Play } from "lucide-react";
import { toggleExerciseFavorite } from "@/features/training/favorite-actions";
import { triggerHaptic } from "@/lib/haptics";
import { toast } from "sonner";
import {
  startSession,
  type ExerciseDetail as Detail,
} from "@/features/training/actions";
import type { PlanExerciseView } from "@/features/training/queries";
import type { ExerciseHistory } from "@/features/training/lib/stats";
import {
  capital,
  musculo,
  reps,
} from "@/features/training/components/training-ui";
import { ModelDisclosure } from "@/mobile/ui/exercise-model";
import { useUnits } from "@/mobile/units";

/**
 * Detalle de ejercicio: foto arriba con boton de vidrio; series × reps de la
 * rutina, RIR y peso de la ultima vez; musculos principales (acento) y
 * secundarios; el enfasis de la tecnica; y «Empezar entrenamiento».
 */
export function ExerciseDetail({
  detail,
  planned,
  history,
  imageUrl,
  startPlanId,
  startDayId,
  sessionId,
  favorite,
}: {
  detail: Detail;
  planned: PlanExerciseView | null;
  history: ExerciseHistory | null;
  imageUrl: string | null;
  startPlanId?: string;
  startDayId?: string;
  sessionId: string | null;
  favorite: boolean;
}) {
  const ex = detail.exercise;
  const u = useUnits();
  const photo = imageUrl ?? ex.imageUrl;
  const [pending, startTransition] = useTransition();
  const [fav, setFav] = useOptimistic(favorite);
  const toggleFav = () =>
    startTransition(async () => {
      setFav(!fav);
      triggerHaptic("selection");
      const r = await toggleExerciseFavorite({ exerciseId: ex.id });
      if ("error" in r) toast.error(r.error);
    });
  const scheme = planned
    ? `${planned.sets ?? "—"} × ${reps(planned)}`
    : detail.prescription
      ? `${detail.prescription.sets} × ${detail.prescription.repsMin}–${detail.prescription.repsMax}`
      : "—";
  const rir = planned?.rir ?? detail.prescription?.rir ?? null;
  const cues = [detail.summary, ...ex.techniqueCues.slice(0, 2)].filter(
    Boolean,
  );

  return (
    <div className="m-active" data-m-fullscreen="">
      <div className="m-active-hero" style={{ height: 320 }}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- foto del catalogo
          <img src={photo} alt="" className="m-active-photo" />
        ) : (
          <div className="m-active-placeholder" aria-hidden="true">
            <Dumbbell size={40} strokeWidth={1.5} />
          </div>
        )}
        <div className="m-active-fade" aria-hidden="true" />
        <div className="m-active-top">
          <Link
            href="/entrenamiento?vista=biblioteca"
            aria-label="Volver"
            className="m-icon-btn m-press"
            data-glass=""
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </Link>
          <button
            type="button"
            className="m-icon-btn m-press"
            data-glass=""
            aria-pressed={fav}
            aria-label={fav ? "Quitar de favoritos" : "Agregar a favoritos"}
            onClick={toggleFav}
          >
            <Heart
              size={20}
              aria-hidden="true"
              className={fav ? "m-accent-text" : undefined}
              fill={fav ? "currentColor" : "none"}
            />
          </button>
        </div>
        <div className="m-active-title">
          <div className="m-sub">
            Biblioteca · {capital(musculo(ex.primaryMuscle))}
          </div>
          <h1 className="m-active-name">{ex.name}</h1>
        </div>
      </div>

      <div className="m-body m-stagger" style={{ paddingTop: 14, gap: 18 }}>
        <div className="m-grid-3">
          <div
            className="m-card"
            data-size="sm"
            style={{ textAlign: "center", padding: 12 }}
          >
            <div className="m-stat-value">{scheme}</div>
            <div className="m-stat-label">
              {planned ? "En tu rutina" : "Sugerido"}
            </div>
          </div>
          <div
            className="m-card"
            data-size="sm"
            style={{ textAlign: "center", padding: 12 }}
          >
            <div className="m-stat-value">{rir ?? "—"}</div>
            <div className="m-stat-label">RIR</div>
          </div>
          <div
            className="m-card"
            data-size="sm"
            style={{ textAlign: "center", padding: 12 }}
          >
            <div className="m-stat-value">
              {history?.last ? u.fmtWeight(history.last.weightKg) : "—"}
              {history?.last && <small>{u.weightUnit}</small>}
            </div>
            <div className="m-stat-label">Última vez</div>
          </div>
        </div>

        <section
          className="m-stack"
          style={{ gap: 10 }}
          aria-labelledby="m-ex-muscles"
        >
          <h2 id="m-ex-muscles" className="m-section">
            Músculos
          </h2>
          <div className="m-muscles">
            <span className="m-muscles-label">Principales</span>
            <span className="m-muscle" data-primary="">
              {capital(musculo(ex.primaryMuscle))}
            </span>
          </div>
          {ex.secondaryMuscles.length > 0 && (
            <div className="m-muscles">
              <span className="m-muscles-label">Secundarios</span>
              {ex.secondaryMuscles.map((m) => (
                <span key={m} className="m-muscle">
                  {capital(musculo(m))}
                </span>
              ))}
            </div>
          )}
        </section>

        <ModelDisclosure exercises={[ex]} />

        {cues.length > 0 && (
          <section
            className="m-stack"
            style={{ gap: 6 }}
            aria-labelledby="m-ex-tech"
          >
            <h2 id="m-ex-tech" className="m-section">
              Énfasis
            </h2>
            {cues.map((c) => (
              <p key={c} className="m-sheet-text">
                {c}
              </p>
            ))}
          </section>
        )}
      </div>

      <div className="m-active-spacer" />
      <div className="m-step-foot">
        {sessionId ? (
          <Link
            href="/entrenamiento?vista=sesion"
            className="m-btn m-press"
            data-variant="primary"
          >
            <Play size={16} fill="currentColor" aria-hidden="true" />
            Volver a la sesión
          </Link>
        ) : (
          <button
            type="button"
            className="m-btn m-press"
            data-variant="primary"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await startSession({
                  planId: startPlanId,
                  planDayId: startDayId,
                });
                if (result && "error" in result) toast.error(result.error);
              })
            }
          >
            <Play size={16} fill="currentColor" aria-hidden="true" />
            {pending ? "Empezando…" : "Empezar entrenamiento"}
          </button>
        )}
      </div>
    </div>
  );
}
