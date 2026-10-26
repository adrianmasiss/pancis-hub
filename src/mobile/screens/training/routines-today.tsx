"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { setActivePlan } from "@/features/training/actions";
import type {
  PlanDayView,
  PlanExerciseView,
  PlanSummary,
} from "@/features/training/queries";
import { reps } from "@/features/training/components/training-ui";
import { triggerHaptic } from "@/lib/haptics";
import { Tag } from "@/mobile/ui/display";
import { Sheet } from "@/mobile/ui/sheet";
import { dayTitle } from "./week-data";

/** «3 × 8–10 · RIR 2 · 90 s»: lo que se ve de un ejercicio en el plan. */
function esquema(e: PlanExerciseView): string {
  const partes = [`${e.sets ?? "—"} × ${reps(e)}`];
  if (e.rir !== null) partes.push(`RIR ${e.rir}`);
  if (e.restSeconds) {
    partes.push(
      e.restSeconds >= 60 && e.restSeconds % 60 === 0
        ? `${e.restSeconds / 60} min`
        : `${e.restSeconds} s`,
    );
  }
  return partes.join(" · ");
}

/**
 * Entrenar · Hoy › Rutinas: todas, la activa primero y marcada. Cada una se
 * despliega aqui mismo con sus dias y ejercicios; cambiar la activa pide
 * confirmacion. En la activa, cada dia puede elegirse para hoy.
 */
export function RoutinesToday({
  plans,
  planDays,
  todayDayId,
  doneThisWeek,
  onPickDay,
}: {
  plans: PlanSummary[];
  planDays: Record<string, PlanDayView[]>;
  todayDayId: string | null;
  doneThisWeek: Record<string, string>;
  onPickDay: (day: PlanDayView) => void;
}) {
  const router = useRouter();
  const ordered = [...plans].sort(
    (a, b) => Number(b.active) - Number(a.active),
  );
  const [open, setOpen] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<PlanSummary | null>(null);
  const [pending, startTransition] = useTransition();

  const activar = (plan: PlanSummary) =>
    startTransition(async () => {
      const result = await setActivePlan({ planId: plan.id });
      setConfirm(null);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      triggerHaptic("success");
      toast.success(`${plan.name} es tu rutina activa.`);
      setOpen(null);
      router.refresh();
    });

  if (ordered.length === 0) return null;

  return (
    <section className="m-stack" aria-labelledby="m-routines-title">
      <h2 id="m-routines-title" className="m-section">
        Rutinas
      </h2>
      {ordered.map((plan) => {
        const days = planDays[plan.id] ?? [];
        const abierto = open === plan.id;
        return (
          <div
            key={plan.id}
            className="m-routine-acc"
            data-active={plan.active ? "" : undefined}
            data-open={abierto ? "" : undefined}
          >
            <button
              type="button"
              className="m-routine-acc-head m-press"
              aria-expanded={abierto}
              aria-controls={`m-plan-${plan.id}`}
              onClick={() => setOpen(abierto ? null : plan.id)}
            >
              <span className="m-list-row-main">
                <span className="m-list-row-title">{plan.name}</span>
                <span className="m-list-row-sub">
                  {[
                    `${plan.dayCount} ${plan.dayCount === 1 ? "día" : "días"}`,
                    plan.origin === "ia" ? "Creada por IA" : "Del coach",
                  ].join(" · ")}
                </span>
              </span>
              {plan.active && <Tag tone="accent">Activa</Tag>}
              <ChevronDown
                className="m-chevron m-disclosure-chevron"
                size={18}
                aria-hidden="true"
              />
            </button>
            <div
              id={`m-plan-${plan.id}`}
              className="m-disclosure-body"
              inert={!abierto}
            >
              <div>
                <div className="m-routine-acc-body">
                  {days.map((day, i) => {
                    const hecho = plan.active && doneThisWeek[day.id];
                    const hoy = plan.active && day.id === todayDayId;
                    return (
                      <div key={day.id} className="m-routine-day">
                        <div className="m-row" style={{ gap: 8 }}>
                          <span className="m-day-acc-num m-num">{i + 1}</span>
                          <span
                            className="m-list-row-title"
                            style={{ flex: 1 }}
                          >
                            {dayTitle(day)}
                          </span>
                          {hoy ? (
                            <span className="m-eyebrow" data-tone="accent">
                              Hoy
                            </span>
                          ) : plan.active ? (
                            <button
                              type="button"
                              className="m-link"
                              onClick={() => onPickDay(day)}
                            >
                              {hecho ? "Repetir hoy" : "Hacer hoy"}
                            </button>
                          ) : null}
                        </div>
                        <ol className="m-day-acc-list">
                          {day.exercises.map((e) => (
                            <li key={e.id} className="m-routine-ex">
                              <span className="m-day-acc-name">{e.name}</span>
                              <span className="m-num m-day-acc-scheme">
                                {esquema(e)}
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    );
                  })}
                  {!plan.active && (
                    <button
                      type="button"
                      className="m-btn m-press"
                      data-variant="primary"
                      data-block=""
                      disabled={pending}
                      onClick={() => setConfirm(plan)}
                    >
                      Usar esta rutina
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <Sheet
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm ? `¿Usar «${confirm.name}»?` : ""}
        description="Pasa a ser tu rutina activa: es la que verás arriba y la que propone el entreno de cada día. La otra no se borra."
      >
        <button
          type="button"
          className="m-btn m-press"
          data-variant="primary"
          data-block=""
          disabled={pending}
          onClick={() => confirm && activar(confirm)}
        >
          {pending ? "Cambiando…" : "Usar esta rutina"}
        </button>
        <button
          type="button"
          className="m-btn"
          data-variant="ghost"
          data-block=""
          onClick={() => setConfirm(null)}
        >
          Cancelar
        </button>
      </Sheet>
    </section>
  );
}
