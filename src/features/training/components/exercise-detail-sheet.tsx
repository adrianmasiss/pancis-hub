"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { encuadreDe } from "@/features/training/lib/model-regions";
import {
  ROTULOS,
  resaltadoDeEjercicios,
} from "@/features/training/lib/muscle-map";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getCatalogExerciseDetail,
  getExerciseDetail,
  type ExerciseDetail,
} from "@/features/training/actions";
import { RESISTANCE_PROFILE_DESCRIPTIONS } from "@/features/training/lib/biomechanics";
import { formatPrescription } from "@/features/training/lib/prescription";
import { messages } from "@/i18n/es-419";
import { rotuloCatalogo } from "@/features/training/lib/library-groups";
import "./exercise-detail.css";

const t = messages.training.biomechanics;

/* `three` sólo viaja si se abre la ficha, y WebGL no existe en el servidor. */
const MuscleModel = dynamic(
  () => import("./muscle-model").then((m) => m.MuscleModel),
  {
    ssr: false,
    loading: () => <div className="muscle-model-stage" aria-hidden="true" />,
  },
);

/** El numero siempre va acompanado del motivo; el color no va solo. */
function scoreTone(score: number): string {
  if (score >= 8) return "text-primary";
  if (score >= 5) return "text-foreground";
  return "text-destructive";
}

/** Rotulo pequeno de bloque, el mismo para todo lo que hay en la ficha. */
function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="xd-block">
      <h3 className="label-micro">{title}</h3>
      {children}
    </section>
  );
}

const numberFmt = new Intl.NumberFormat("es-CR", { maximumFractionDigits: 1 });
const dateFmt = new Intl.DateTimeFormat("es-CR", { dateStyle: "medium" });

/**
 * Lo que se lee entre series: los dos fotogramas, como se hace, que trabaja y
 * en que fijarse. Nada mas a la vista; lo tecnico queda plegado debajo.
 */
function DetailBody({ detail }: { detail: ExerciseDetail }) {
  const { exercise } = detail;
  // Sin resumen escrito, la ejecucion ya es el "como se hace": se usa aqui y
  // no se repite en el detalle tecnico.
  const howTo = detail.summary ?? detail.executionNotes;
  const executionInTechnical = detail.summary ? detail.executionNotes : null;
  const cues = exercise.techniqueCues.slice(0, 3);

  /* El maniquí pequeño enciende lo que trabaja este ejercicio (principal
     fuerte, apoyo tenue) y la cámara se acerca a los principales, del lado
     desde el que se ven. Sin zonas en el modelo (p. ej. cardio), no sale. */
  const resaltado = useMemo(
    () => resaltadoDeEjercicios([exercise]),
    [exercise],
  );
  const principales = useMemo(
    () => Object.keys(resaltado).filter((m) => resaltado[m]! >= 0.75),
    [resaltado],
  );
  const hasModel = principales.length > 0;
  const [view, setView] = useState<"front" | "back">(
    () => encuadreDe(principales)?.side ?? "front",
  );

  return (
    <>
      {exercise.imageUrl ? (
        <figure
          className="xd-frames"
          data-single={!exercise.imageEndUrl ? "" : undefined}
        >
          <Frame
            src={exercise.imageUrl}
            alt={`${exercise.name} — ${t.startPosition}`}
            label={t.startPosition}
          />
          {exercise.imageEndUrl ? (
            <Frame
              src={exercise.imageEndUrl}
              alt={`${exercise.name} — ${t.endPosition}`}
              label={t.endPosition}
            />
          ) : null}
        </figure>
      ) : null}

      {howTo ? (
        <Block title={t.howTo}>
          <p className="xd-lead">{howTo}</p>
        </Block>
      ) : null}

      <Block title={t.worksTitle}>
        <div className="xd-works" data-model={hasModel ? "" : undefined}>
          {hasModel ? (
            <div
              className="muscle-model xd-model"
              role="img"
              aria-label={`${t.modelLabel}: ${principales
                .map((m) => ROTULOS[m] ?? m)
                .join(", ")}`}
            >
              <MuscleModel
                tone="anatomia"
                highlight={resaltado}
                view={view}
                focus={principales}
                pulse
                onViewChange={setView}
              />
            </div>
          ) : null}
          <dl className="xd-muscles">
            <div>
              <dt>{t.primaryShort}</dt>
              <dd className="xd-muscle-primary">
                {rotuloCatalogo(exercise.primaryMuscle)}
              </dd>
            </div>
            {exercise.secondaryMuscles.length > 0 ? (
              <div>
                <dt>{t.secondaryShort}</dt>
                <dd className="xd-muscle-secondary">
                  {exercise.secondaryMuscles
                    .map((m) => rotuloCatalogo(m))
                    .join(" · ")}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      </Block>

      {cues.length > 0 ? (
        <Block title={t.keyPoints}>
          <ol className="xd-cues">
            {cues.map((cue, i) => (
              <li key={cue}>
                <span aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                {cue}
              </li>
            ))}
          </ol>
        </Block>
      ) : null}

      {detail.personalBest ? (
        <Block title={t.personalBest}>
          <p className="xd-best">
            <strong>{numberFmt.format(detail.personalBest.weightKg)}</strong>
            <small>kg</small>
            {detail.personalBest.repetitions ? (
              <span> × {detail.personalBest.repetitions}</span>
            ) : null}
            <em>{dateFmt.format(new Date(detail.personalBest.date))}</em>
          </p>
        </Block>
      ) : null}

      <TechnicalDetail detail={detail} execution={executionInTechnical} />

      {exercise.imageUrl ? <p className="xd-credit">{t.imageCredit}</p> : null}
    </>
  );
}

function Frame({
  src,
  alt,
  label,
}: {
  src: string;
  alt: string;
  label: string;
}) {
  return (
    <div className="xd-frame">
      {/* eslint-disable-next-line @next/next/no-img-element -- storage propio, sin next/image en el resto del proyecto */}
      <img src={src} alt={alt} loading="lazy" />
      <figcaption>{label}</figcaption>
    </div>
  );
}

/**
 * Biomecanica, esquema sugerido y valoracion: valiosos para quien los busca,
 * ruido para quien solo quiere saber como se hace. Se pliegan en un solo
 * desplegable, cerrado por defecto.
 */
function TechnicalDetail({
  detail,
  execution,
}: {
  detail: ExerciseDetail;
  execution: string | null;
}) {
  const [open, setOpen] = useState(false);
  const { exercise } = detail;
  const panelId = "xd-technical";

  return (
    <section className="xd-tech" data-open={open ? "" : undefined}>
      <button
        type="button"
        className="xd-tech-toggle"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>
          <strong>{t.technicalTitle}</strong>
          <small>{t.technicalHint}</small>
        </span>
        <ChevronDown aria-hidden="true" className="size-4" />
      </button>

      <div className="xd-tech-panel" id={panelId} inert={!open}>
        <div>
          <div className="xd-tech-inner">
            {exercise.movementPattern || exercise.joints.length > 0 ? (
              <Block title={t.movement}>
                <p className="xd-text">
                  {[exercise.movementPattern, exercise.joints.join(", ")]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </Block>
            ) : null}

            {exercise.resistanceProfile ? (
              <Block title={t.resistanceProfile}>
                <p className="xd-text">
                  {RESISTANCE_PROFILE_DESCRIPTIONS[exercise.resistanceProfile]}
                  {exercise.hardestPoint ? (
                    <>
                      {" "}
                      <span className="text-foreground">
                        {t.hardestPoint}:
                      </span>{" "}
                      {exercise.hardestPoint}
                    </>
                  ) : null}
                </p>
              </Block>
            ) : null}

            {detail.setupNotes ? (
              <Block title={t.setup}>
                <p className="xd-text">{detail.setupNotes}</p>
              </Block>
            ) : null}

            {execution ? (
              <Block title={t.execution}>
                <p className="xd-text">{execution}</p>
              </Block>
            ) : null}

            {exercise.commonErrors.length > 0 ? (
              <Block title={t.commonErrors}>
                <ul className="xd-list">
                  {exercise.commonErrors.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </Block>
            ) : null}

            {/*
              Requisito 13: la recomendacion se muestra APARTE y nunca
              modifica la rutina por su cuenta.
            */}
            {detail.prescription ? (
              <Block title={t.prescriptionTitle}>
                <p className="xd-scheme">
                  {formatPrescription(detail.prescription)}
                </p>
                <ul className="xd-list">
                  {detail.prescription.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
                <p className="xd-text">
                  <span className="text-foreground">{t.progressionLabel}:</span>{" "}
                  {detail.prescription.progression}
                </p>
                <p className="xd-note">{t.prescriptionNote}</p>
              </Block>
            ) : null}

            {detail.ratings ? (
              <Block title={t.ratingsTitle}>
                <ul className="xd-ratings">
                  {detail.ratings.map((rating) => (
                    <li key={rating.dimension}>
                      <p>
                        <span>{t.dimensions[rating.dimension]}</span>
                        <strong className={scoreTone(rating.score)}>
                          {rating.score}
                          <small>/10</small>
                        </strong>
                      </p>
                      {/* Nunca se muestra la nota sin explicar de donde sale. */}
                      <small>{rating.reason}</small>
                    </li>
                  ))}
                </ul>
              </Block>
            ) : null}

            {detail.prescription === null || detail.ratings === null ? (
              <p className="xd-note">{t.withoutBiomechanics}</p>
            ) : (
              <p className="xd-note">{t.disclaimer}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Ficha del ejercicio: que trabaja, como se comporta la resistencia, como
 * ejecutarlo y como se valora en el contexto del usuario
 * (docs/02_PRODUCT_REQUIREMENTS.md 10-11).
 */
/**
 * Se abre desde dos sitios y por dos caminos:
 *
 *  - Desde una rutina, con `planExerciseId`: ahi se sabe en que puesto de la
 *    sesion va, y la prescripcion lo tiene en cuenta.
 *  - Desde el catalogo, con `exerciseId`: sin sesion de por medio, asi que lo
 *    que se lee es el ejercicio en abstracto.
 *
 * Es el mismo panel a proposito. Una segunda ficha "de catalogo" habria sido
 * la misma informacion con otro aspecto, y la que se quedaria sin actualizar.
 */
export function ExerciseDetailSheet({
  planExerciseId,
  exerciseId,
  exerciseName,
  triggerLabel,
  triggerClassName,
}: {
  planExerciseId?: string;
  exerciseId?: string;
  exerciseName: string;
  triggerLabel?: string;
  /** Para que el disparador tome el aspecto de quien lo usa (la biblioteca). */
  triggerClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<ExerciseDetail | null>(null);

  const load = async () => {
    const result = planExerciseId
      ? await getExerciseDetail({ planExerciseId })
      : await getCatalogExerciseDetail({ exerciseId });
    if ("error" in result) toast.error(result.error);
    else setDetail(result);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) void load();
        else setDetail(null);
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size={triggerLabel ? "sm" : "icon"}
          className={
            triggerClassName ??
            (triggerLabel ? "text-primary" : "text-muted-foreground size-8")
          }
          aria-label={`${triggerLabel ?? t.detailTitle} — ${exerciseName}`}
        >
          <Info className="size-4" aria-hidden="true" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="xd-sheet max-w-[480px]">
        <DialogHeader className="xd-head">
          <p className="label-micro" aria-hidden={detail === null}>
            {detail
              ? [
                  rotuloCatalogo(detail.exercise.primaryMuscle),
                  detail.exercise.equipment
                    ? rotuloCatalogo(detail.exercise.equipment)
                    : null,
                  detail.exercise.isUnilateral ? t.unilateral : null,
                ]
                  .filter(Boolean)
                  .join(" · ")
              : " "}
          </p>
          <DialogTitle className="xd-title">{exerciseName}</DialogTitle>
          <DialogDescription className="sr-only">
            {t.detailDescription}
          </DialogDescription>
        </DialogHeader>

        <div className="xd-body">
          {detail === null ? (
            <div
              className="xd-loading"
              role="status"
              aria-label={messages.common.loading}
            >
              <span className="xd-skel xd-skel-figure" />
              <span className="xd-skel" />
              <span className="xd-skel xd-skel-short" />
            </div>
          ) : (
            <DetailBody detail={detail} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
