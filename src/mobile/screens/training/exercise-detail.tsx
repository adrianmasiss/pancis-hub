"use client";

import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { Check, Dumbbell, Heart, Play } from "lucide-react";
import { toggleExerciseFavorite } from "@/features/training/favorite-actions";
import { triggerHaptic } from "@/lib/haptics";
import { toast } from "sonner";
import type { ExerciseDetail as Detail } from "@/features/training/actions";
import type { PlanExerciseView } from "@/features/training/queries";
import type { ExerciseHistory } from "@/features/training/lib/stats";
import {
  capital,
  musculo,
  reps,
} from "@/features/training/components/training-ui";
import { ModelDisclosure } from "@/mobile/ui/exercise-model";
import { BackButton } from "@/mobile/ui/back-button";
import { useUnits } from "@/mobile/units";

/**
 * Detalle de ejercicio: foto arriba con boton de vidrio; series × reps de la
 * rutina, RIR y peso de la ultima vez; musculos principales (acento) y
 * secundarios y el enfasis de la tecnica.
 */
export function ExerciseDetail({
  detail,
  planned,
  history,
  imageUrl,
  sessionId,
  favorite,
}: {
  detail: Detail;
  planned: PlanExerciseView | null;
  history: ExerciseHistory | null;
  imageUrl: string | null;
  sessionId: string | null;
  favorite: boolean;
}) {
  const ex = detail.exercise;
  const u = useUnits();
  const photo = imageUrl ?? ex.imageUrl;
  const [, startTransition] = useTransition();
  const [fav, setFav] = useOptimistic(favorite);
  const toggleFav = () =>
    startTransition(async () => {
      setFav(!fav);
      triggerHaptic("selection");
      const r = await toggleExerciseFavorite({ exerciseId: ex.id });
      if ("error" in r) toast.error(r.error);
    });
  /* Lo de la rutina manda; si el ejercicio no esta en ella, lo sugerido. */
  const p = detail.prescription;
  const sets = planned ? planned.sets : (p?.sets ?? null);
  const repsTxt = planned
    ? reps(planned)
    : p
      ? `${p.repsMin}–${p.repsMax}`
      : "—";
  const rir = planned?.rir ?? p?.rir ?? null;
  const rest = planned?.restSeconds ?? p?.restSeconds ?? null;
  const stats: { value: React.ReactNode; unit?: string; label: string }[] = [
    { value: sets ?? "—", label: sets === 1 ? "serie" : "series" },
    { value: repsTxt, label: "reps" },
    { value: rir ?? "—", label: "RIR" },
    {
      // La unidad al lado de la cifra: «2:30 min», «45 s».
      value: !rest
        ? "—"
        : rest < 60
          ? rest
          : rest % 60
            ? `${Math.floor(rest / 60)}:${String(rest % 60).padStart(2, "0")}`
            : rest / 60,
      unit: !rest ? undefined : rest < 60 ? "s" : "min",
      label: "descanso",
    },
  ];
  /* Enfasis en puntos cortos: las claves de tecnica del catalogo; si no hay,
     las frases del resumen. Nunca mas de cuatro. */
  const cues = (
    ex.techniqueCues.length
      ? ex.techniqueCues
      : (detail.summary ?? "")
          .split(/(?<=[.!?])\s+/)
          .map((c) => c.trim().replace(/\.$/, ""))
          .filter(Boolean)
  ).slice(0, 4);

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
          <BackButton fallback="/entrenamiento?vista=biblioteca" glass />
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
        <section aria-labelledby="m-ex-scheme">
          <h2 id="m-ex-scheme" className="sr-only">
            {planned ? "En tu rutina" : "Sugerido"}
          </h2>
          <div className="m-ex-stats">
            {stats.map((st) => (
              <div key={st.label} className="m-ex-stat">
                <span className="m-ex-stat-value m-num">
                  {st.value}
                  {st.unit && <small>{st.unit}</small>}
                </span>
                <span className="m-ex-stat-label">{st.label}</span>
              </div>
            ))}
          </div>
          <p className="m-ex-stats-note">
            {planned ? "Así está en tu rutina" : "Esquema sugerido"}
            {history?.last && (
              <>
                {" · "}Última vez{" "}
                <strong className="m-num m-ex-last">
                  {u.fmtWeight(history.last.weightKg)} {u.weightUnit}
                </strong>
              </>
            )}
          </p>
        </section>

        <section
          className="m-stack"
          style={{ gap: 12 }}
          aria-labelledby="m-ex-muscles"
        >
          <h2 id="m-ex-muscles" className="m-section">
            Músculos
          </h2>
          <div className="m-ex-muscle-group">
            <h3 className="m-ex-muscle-title">Principales</h3>
            <div className="m-muscles">
              <span className="m-muscle" data-primary="">
                {capital(musculo(ex.primaryMuscle))}
              </span>
            </div>
          </div>
          {ex.secondaryMuscles.length > 0 && (
            <div className="m-ex-muscle-group">
              <h3 className="m-ex-muscle-title">Secundarios</h3>
              <div className="m-muscles">
                {ex.secondaryMuscles.map((m) => (
                  <span key={m} className="m-muscle" data-secondary="">
                    {capital(musculo(m))}
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        <ModelDisclosure exercises={[ex]} withSecondary />

        {cues.length > 0 && (
          <section
            className="m-stack"
            style={{ gap: 10 }}
            aria-labelledby="m-ex-tech"
          >
            <h2 id="m-ex-tech" className="m-section">
              Énfasis
            </h2>
            <ul className="m-ex-cues">
              {cues.map((c) => (
                <li key={c}>
                  <Check size={16} strokeWidth={2.5} aria-hidden="true" />
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {/* Desde la biblioteca no se empieza a entrenar; con una sesion en
          curso, la ficha lleva de vuelta a ella. */}
      {sessionId && (
        <>
          <div className="m-active-spacer" />
          <div className="m-step-foot">
            <Link
              href="/entrenamiento?vista=sesion"
              className="m-btn m-press"
              data-variant="primary"
            >
              <Play size={16} fill="currentColor" aria-hidden="true" />
              Volver a la sesión
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
