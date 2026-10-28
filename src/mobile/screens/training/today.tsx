"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  ChevronRight,
  Clock,
  Dumbbell,
  FileUp,
  Layers,
  Play,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { startSession } from "@/features/training/actions";
import type {
  PlanDayView,
  PlanDetail,
  TrainingOverview,
} from "@/features/training/queries";
import { estimatedMinutes } from "@/features/training/lib/stats";
import { hace } from "@/features/training/components/training-ui";
import { Sheet } from "@/mobile/ui/sheet";
import { ExerciseModel } from "@/mobile/ui/exercise-model";
import { WeekStrip } from "./week";
import { ActiveRoutine } from "./active-routine";
import { buildWeek, dayTitle, planDaysOf } from "./week-data";

export { dayTitle };

function diaLargo(dateISO: string): string {
  return new Intl.DateTimeFormat("es-CR", {
    weekday: "long",
    timeZone: "UTC",
  }).format(new Date(`${dateISO}T12:00:00Z`));
}

/**
 * Entrenar · Hoy: la semana, el dia que toca con su boton principal y la
 * rutina activa (editable ahi mismo). Tocar un dia ya hecho esta semana avisa que se repite,
 * pero lo permite.
 */
export function TrainingToday({
  overview,
  today,
  timezone,
  nextDayId,
  routine,
  images,
}: {
  overview: TrainingOverview;
  today: string;
  timezone: string;
  nextDayId: string | null;
  /** La rutina activa tal cual esta guardada, para verla y editarla. */
  routine: PlanDetail | null;
  /** Foto de cada ejercicio de la rutina, por id del catalogo. */
  images: Record<string, string>;
}) {
  const plan = overview.activePlan;
  const days = plan?.days ?? [];
  const [dayId, setDayId] = useState(nextDayId ?? days[0]?.id ?? null);
  const [repeat, setRepeat] = useState<PlanDayView | null>(null);
  const [skip, setSkip] = useState<PlanDayView | null>(null);
  const [pending, startTransition] = useTransition();
  const day = days.find((d) => d.id === dayId) ?? days[0] ?? null;
  const dayNumber = day ? days.indexOf(day) + 1 : 0;
  const enCurso = overview.sessionInProgress;
  /* El que toca por orden; si se eligio otro, empezar avisa (y el que
     tocaba sigue pendiente). */
  const toca = days.find((d) => d.id === nextDayId) ?? null;
  const elegido = Boolean(day && toca && day.id !== toca.id);
  const numero = (d: PlanDayView) => days.indexOf(d) + 1;

  const start = (target: PlanDayView | null) =>
    startTransition(async () => {
      const result = await startSession({
        planId: plan?.id,
        planDayId: target?.id,
      });
      if (result && "error" in result) toast.error(result.error);
    });

  const week = buildWeek({
    today,
    timezone,
    recentSessions: overview.recentSessions,
    doneThisWeek: overview.doneThisWeek,
    weekSessions: overview.weekSessions,
    planDays: planDaysOf(days),
  });

  const exercises = day?.exercises ?? [];
  const series = exercises.reduce((t, e) => t + (e.sets ?? 0), 0);
  const minutos = estimatedMinutes(exercises);
  const doneOn = day ? overview.doneThisWeek[day.id] : undefined;

  return (
    <div className="m-body m-stagger">
      {enCurso && (
        <Link
          href="/entrenamiento?vista=sesion"
          className="m-list-row m-press"
          data-live=""
        >
          <span className="m-live-dot m-pulse" aria-hidden="true" />
          <span className="m-list-row-main">
            <span className="m-list-row-title">Sesión en curso</span>
            <span className="m-list-row-sub">
              Empezó {hace(enCurso.startedAt)} ·{" "}
              {enCurso.sets.filter((s) => !s.isWarmup).length} series
            </span>
          </span>
          <span className="m-list-row-trail m-accent-text">Continuar</span>
          <ChevronRight className="m-chevron" size={18} aria-hidden="true" />
        </Link>
      )}

      {plan && day ? (
        <section
          className="m-card"
          data-glow=""
          aria-labelledby="m-today-title"
        >
          <WeekStrip week={week} />
          <hr className="m-divider" />
          <div className="m-day-split">
            <div className="m-day-info">
              <div>
                <div className="m-eyebrow" data-tone="accent">
                  {elegido ? "Elegido" : "Hoy"} · Día {dayNumber}
                </div>
                <h2 id="m-today-title" className="m-card-title" data-size="lg">
                  {dayTitle(day)}
                </h2>
              </div>
              <dl className="m-day-stats">
                {[
                  {
                    icon: Dumbbell,
                    value: exercises.length,
                    label: "Ejercicios",
                  },
                  { icon: Layers, value: series, label: "Series" },
                  {
                    icon: Clock,
                    value: `~${minutos}`,
                    unit: "min",
                    label: "Duración",
                  },
                ].map(({ icon: Icon, value, unit, label }) => (
                  <div key={label} className="m-day-stat">
                    <dt className="m-day-stat-label">{label}</dt>
                    <dd className="m-day-stat-value m-num">
                      <Icon size={16} strokeWidth={2} aria-hidden="true" />
                      {value}
                      {unit && <small>{unit}</small>}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            {exercises.length > 0 && (
              <ExerciseModel
                key={day.id}
                exercises={exercises}
                compact
                className="m-day-model"
              />
            )}
          </div>
          {enCurso ? (
            <Link
              href="/entrenamiento?vista=sesion"
              className="m-btn m-press"
              data-variant="primary"
              data-block=""
            >
              <Play size={16} fill="currentColor" aria-hidden="true" />
              Continuar entrenamiento
            </Link>
          ) : (
            <button
              type="button"
              className="m-btn m-press"
              data-variant="primary"
              data-block=""
              disabled={pending || exercises.length === 0}
              onClick={() =>
                doneOn ? setRepeat(day) : elegido ? setSkip(day) : start(day)
              }
            >
              <Play size={16} fill="currentColor" aria-hidden="true" />
              {pending ? "Empezando…" : "Empezar entrenamiento"}
            </button>
          )}
          {elegido && toca && !enCurso && (
            <button
              type="button"
              className="m-link m-today-back"
              onClick={() => setDayId(toca.id)}
            >
              Por orden toca el Día {numero(toca)} · {dayTitle(toca)}. Volver a
              ese
            </button>
          )}
        </section>
      ) : (
        <section className="m-card" data-glow="">
          <div className="m-eyebrow" data-tone="accent">
            Sin rutina activa
          </div>
          <h2 className="m-card-title">Tu primera rutina empieza aquí</h2>
          <p className="m-sheet-text">
            Importa la de tu coach, deja que la IA arme una o entrena libre.
          </p>
          <div className="m-stack">
            <Link
              href="/entrenamiento?vista=rutinas&paso=importar"
              className="m-btn m-press"
              data-variant="primary"
              data-block=""
            >
              <FileUp size={18} aria-hidden="true" />
              Importar del coach
            </Link>
            <Link
              href="/entrenamiento?vista=rutinas&paso=ia"
              className="m-btn m-press"
              data-block=""
            >
              <Sparkles size={18} aria-hidden="true" />
              Crear con IA
            </Link>
            <button
              type="button"
              className="m-btn m-press"
              data-variant="ghost"
              data-block=""
              disabled={pending || Boolean(enCurso)}
              onClick={() => start(null)}
            >
              Sesión libre
            </button>
          </div>
        </section>
      )}

      {routine && (
        <ActiveRoutine
          plan={routine}
          images={images}
          suggestedDayId={toca?.id ?? null}
          selectedDayId={day?.id ?? null}
          doneThisWeek={overview.doneThisWeek}
          onSelectDay={setDayId}
        />
      )}

      <Sheet
        open={skip !== null}
        onOpenChange={(o) => !o && setSkip(null)}
        title={toca ? `Por orden hoy toca el Día ${numero(toca)}` : ""}
        description={
          skip && toca
            ? `${dayTitle(toca)}. Si empiezas el Día ${numero(skip)} · ${dayTitle(skip)}, queda registrado como entrenado y el Día ${numero(toca)} sigue pendiente para tu próximo entreno.`
            : undefined
        }
      >
        <button
          type="button"
          className="m-btn m-press"
          data-variant="primary"
          data-block=""
          disabled={pending}
          onClick={() => skip && start(skip)}
        >
          {pending
            ? "Empezando…"
            : skip
              ? `Empezar el Día ${numero(skip)} igual`
              : "Empezar"}
        </button>
        <button
          type="button"
          className="m-btn"
          data-variant="ghost"
          data-block=""
          onClick={() => {
            if (toca) setDayId(toca.id);
            setSkip(null);
          }}
        >
          {toca ? `Hacer el Día ${numero(toca)}` : "Cancelar"}
        </button>
      </Sheet>

      <Sheet
        open={repeat !== null}
        onOpenChange={(o) => !o && setRepeat(null)}
        title={repeat ? `Ya hiciste el Día ${numero(repeat)} esta semana` : ""}
        description={
          repeat && overview.doneThisWeek[repeat.id]
            ? `Lo entrenaste el ${diaLargo(overview.doneThisWeek[repeat.id]!)}. Puedes repetirlo igual; quedará como repetido en tu historial.`
            : undefined
        }
      >
        <button
          type="button"
          className="m-btn m-press"
          data-variant="primary"
          data-block=""
          disabled={pending}
          onClick={() => repeat && start(repeat)}
        >
          {repeat ? `Repetir Día ${numero(repeat)}` : "Repetir"}
        </button>
        <button
          type="button"
          className="m-btn"
          data-variant="ghost"
          data-block=""
          onClick={() => setRepeat(null)}
        >
          Elegir otro día
        </button>
      </Sheet>
    </div>
  );
}
