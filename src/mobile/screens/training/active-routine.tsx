"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, ChevronDown, Pencil } from "lucide-react";
import type {
  PlanDayView,
  PlanDetail,
  PlanOrigin,
} from "@/features/training/queries";
import { reps } from "@/features/training/components/training-ui";
import { triggerHaptic } from "@/lib/haptics";
import { MOBILE_PORTAL_ID } from "@/mobile/routes";
import { Tag } from "@/mobile/ui/display";
import { DiscardSheet, ExerciseAvatar, usePlanEditor } from "./routine-editor";
import { dayTitle } from "./week-data";
import { Haptic } from "@/mobile/ui/haptic";

/**
 * Entrenar · Hoy › Tu rutina: solo la activa (las demas viven en Rutinas).
 * Tocar un dia lo despliega y lo elige: pasa a la tarjeta de arriba y es el
 * que se empieza. «Editar» la vuelve editable ahi mismo: reordenar desde el
 * asa, deslizar para quitar, Cambiar y Editar.
 */
export function ActiveRoutine({
  plan,
  images,
  suggestedDayId,
  selectedDayId,
  doneThisWeek,
  onSelectDay,
}: {
  /** La rutina tal cual esta guardada (sin los cambios de «solo hoy»). */
  plan: PlanDetail;
  images: Record<string, string>;
  /** El que toca por orden. */
  suggestedDayId: string | null;
  /** El que muestra la tarjeta de arriba (el que toca, o el elegido). */
  selectedDayId: string | null;
  doneThisWeek: Record<string, string>;
  onSelectDay: (dayId: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  /* Cada edicion arranca de lo guardado: la llave nueva descarta lo que
     quedo de la anterior. */
  const [round, setRound] = useState(0);

  return (
    <section className="m-stack" aria-labelledby="m-active-routine">
      <h2 id="m-active-routine" className="m-section">
        Tu rutina
      </h2>
      {editing ? (
        <InlineEditor
          key={round}
          plan={plan}
          images={images}
          onDone={() => {
            setEditing(false);
            setRound((r) => r + 1);
          }}
        />
      ) : (
        <RoutineView
          plan={plan}
          images={images}
          suggestedDayId={suggestedDayId}
          selectedDayId={selectedDayId}
          doneThisWeek={doneThisWeek}
          onSelectDay={onSelectDay}
          onEdit={() => {
            triggerHaptic("selection");
            setEditing(true);
          }}
        />
      )}
    </section>
  );
}

/** De donde viene la rutina, cada origen con su color. */
export function OriginTag({ origin }: { origin: PlanOrigin }) {
  return origin === "ia" ? (
    <Tag tone="ia">CREADA POR IA</Tag>
  ) : (
    <Tag tone="coach">DEL COACH</Tag>
  );
}

/**
 * Cabecera en franja (la «D» de las tarjetas de Inicio), blanca: origen,
 * nombre y resumen; los dias quedan debajo, sobre el cuerpo negro.
 */
function RoutineHead({
  plan,
  trail,
  sub,
}: {
  plan: PlanDetail;
  trail?: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="m-routine-band">
      <span className="m-row" style={{ gap: 6 }}>
        <OriginTag origin={plan.origin} />
        <span style={{ flex: 1 }} />
        {trail}
      </span>
      <span className="m-card-title" style={{ fontSize: 20 }}>
        {plan.name}
      </span>
      {sub && <span className="m-sub">{sub}</span>}
    </div>
  );
}

function RoutineView({
  plan,
  images,
  suggestedDayId,
  selectedDayId,
  doneThisWeek,
  onSelectDay,
  onEdit,
}: {
  plan: PlanDetail;
  images: Record<string, string>;
  suggestedDayId: string | null;
  selectedDayId: string | null;
  doneThisWeek: Record<string, string>;
  onSelectDay: (dayId: string) => void;
  onEdit: () => void;
}) {
  const [openDay, setOpenDay] = useState<string | null>(null);

  return (
    <div className="m-routine" data-band="">
      <RoutineHead
        plan={plan}
        trail={
          <button
            type="button"
            className="m-btn m-press"
            data-size="sm"
            onClick={onEdit}
          >
            <Haptic />
            <Pencil size={14} aria-hidden="true" />
            Editar
          </button>
        }
        sub={[
          `${plan.days.length} ${plan.days.length === 1 ? "día" : "días"}`,
          plan.objective,
        ]
          .filter(Boolean)
          .join(" · ")}
      />
      <DayList
        days={plan.days}
        images={images}
        openDay={openDay}
        selectedDayId={selectedDayId}
        onToggle={(id) => {
          if (openDay === id) {
            setOpenDay(null);
            return;
          }
          setOpenDay(id);
          if (id !== selectedDayId) {
            triggerHaptic("selection");
            onSelectDay(id);
          }
        }}
        badge={(day) =>
          day.id === selectedDayId ? (
            <span className="m-eyebrow" data-tone="accent">
              {day.id === suggestedDayId ? "Toca hoy" : "Elegido"}
            </span>
          ) : day.id === suggestedDayId ? (
            <span className="m-eyebrow">Toca hoy</span>
          ) : doneThisWeek[day.id] ? (
            <span className="m-day-done">
              <Check size={13} strokeWidth={2.6} aria-hidden="true" />
              Hecho
            </span>
          ) : null
        }
      />
    </div>
  );
}

/**
 * Los dias de una rutina en acordeon (uno abierto a la vez), cada ejercicio
 * con su foto en circulo. Lo comparten Hoy y Rutinas.
 */
export function DayList({
  days,
  images,
  openDay,
  onToggle,
  todayDayId,
  selectedDayId,
  badge,
}: {
  days: PlanDayView[];
  images: Record<string, string>;
  openDay: string | null;
  onToggle: (dayId: string) => void;
  todayDayId?: string | null;
  /** El dia elegido para hoy: su numero va en acento aunque este cerrado. */
  selectedDayId?: string | null;
  /** Lo que va a la derecha del dia (si falta: «Hoy» en el de hoy). */
  badge?: (day: PlanDayView) => React.ReactNode;
}) {
  if (days.length === 0) return null;
  return (
    <div className="m-days">
      {days.map((day, i) => {
        const open = openDay === day.id;
        return (
          <div
            key={day.id}
            className="m-day-acc"
            data-open={open ? "" : undefined}
            data-selected={day.id === selectedDayId ? "" : undefined}
          >
            <button
              type="button"
              className="m-day-acc-head m-press"
              aria-expanded={open}
              aria-controls={`m-day-${day.id}`}
              onClick={() => onToggle(day.id)}
            >
              <Haptic />
              <span className="m-day-acc-num m-num">{i + 1}</span>
              <span className="m-list-row-main">
                <span className="m-list-row-title">{dayTitle(day)}</span>
                <span className="m-list-row-sub">
                  {day.exercises.length}{" "}
                  {day.exercises.length === 1 ? "ejercicio" : "ejercicios"}
                </span>
              </span>
              {badge
                ? badge(day)
                : day.id === todayDayId && (
                    <span className="m-eyebrow" data-tone="accent">
                      Hoy
                    </span>
                  )}
              <ChevronDown
                className="m-chevron m-disclosure-chevron"
                size={18}
                aria-hidden="true"
              />
            </button>
            <div
              id={`m-day-${day.id}`}
              className="m-disclosure-body"
              inert={!open}
            >
              <div>
                <ol className="m-day-acc-list" data-photos="">
                  {day.exercises.map((e) => (
                    <li key={e.id} className="m-day-acc-ex">
                      <ExerciseAvatar image={images[e.exerciseId]} />
                      <span className="m-day-acc-name">{e.name}</span>
                      <span className="m-num m-day-acc-scheme">
                        {e.sets ?? "—"} × {reps(e)}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function InlineEditor({
  plan,
  images,
  onDone,
}: {
  plan: PlanDetail;
  images: Record<string, string>;
  onDone: () => void;
}) {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const ed = usePlanEditor(plan, {
    images,
    onSaved: () => {
      onDone();
      router.refresh();
    },
  });

  return (
    <div className="m-routine m-routine-editing" data-band="">
      <RoutineHead
        plan={plan}
        trail={
          <span className="m-eyebrow" data-tone="accent">
            Editando
          </span>
        }
      />
      {ed.coach && (
        <p className="m-notice" data-tone="warn">
          <AlertTriangle size={16} aria-hidden="true" />
          Es la rutina de tu coach: lo que cambies modifica la importada. La
          original queda en Versiones.
        </p>
      )}
      {ed.lists}
      <p className="m-sub" style={{ fontSize: 12, fontWeight: 500 }}>
        Arrastra desde el asa para reordenar; desliza a la izquierda para
        quitar.
      </p>

      {/* En el portal: la animacion de entrada de Hoy deja un `transform`
          en la seccion y el `fixed` quedaria preso dentro. */}
      {createPortal(
        <div className="m-inline-foot">
          <button
            type="button"
            className="m-btn m-press"
            onClick={() => (ed.dirty ? setLeaving(true) : onDone())}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="m-btn m-press"
            data-variant="primary"
            disabled={!ed.dirty || ed.saving}
            onClick={ed.askSave}
          >
            {ed.dirty ? "Guardar cambios" : "Sin cambios"}
          </button>
        </div>,
        document.getElementById(MOBILE_PORTAL_ID)!,
      )}

      {ed.overlays}
      <DiscardSheet
        open={leaving}
        cambios={ed.cambios}
        onClose={() => setLeaving(false)}
        onSave={ed.askSave}
        onDiscard={onDone}
      />
    </div>
  );
}
