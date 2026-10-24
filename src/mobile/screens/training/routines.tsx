"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, FileUp, Pencil, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { setActivePlan } from "@/features/training/actions";
import type { PlanDayView, PlanSummary } from "@/features/training/queries";
import { reps } from "@/features/training/components/training-ui";
import { dayTitle } from "./today";
import { Tag } from "@/mobile/ui/display";

/**
 * Rutinas: las del coach y las creadas por IA, con la activa primero. Cada
 * dia se despliega ahi mismo con sus ejercicios (uno abierto a la vez; el de
 * hoy, de entrada). Importar o crear con IA van a su propio paso.
 */
export function Routines({
  plans,
  planDays,
  todayDayId,
  aiEnabled,
}: {
  plans: PlanSummary[];
  planDays: Record<string, PlanDayView[]>;
  todayDayId: string | null;
  aiEnabled: boolean;
}) {
  const router = useRouter();
  const [openDay, setOpenDay] = useState<string | null>(todayDayId);
  const [pending, startTransition] = useTransition();
  const ordered = [...plans].sort(
    (a, b) =>
      Number(b.active) - Number(a.active) || a.origin.localeCompare(b.origin),
  );

  const activate = (plan: PlanSummary) =>
    startTransition(async () => {
      const result = await setActivePlan({ planId: plan.id });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(`${plan.name} es tu rutina activa.`);
      router.refresh();
    });

  return (
    <div className="m-body m-stagger">
      {ordered.length === 0 && (
        <p className="m-sub">
          Aún no tienes rutinas. Importa la de tu coach o crea una con IA.
        </p>
      )}
      {ordered.map((plan) => {
        const days = planDays[plan.id] ?? [];
        return (
          <section
            key={plan.id}
            className="m-routine"
            data-active={plan.active ? "" : undefined}
            aria-label={plan.name}
          >
            <span className="m-row" style={{ gap: 6 }}>
              <Tag tone={plan.origin === "ia" ? "ia" : "neutral"}>
                {plan.origin === "ia" ? "CREADA POR IA" : "DEL COACH"}
              </Tag>
              <span style={{ flex: 1 }} />
              {plan.active && (
                <span className="m-eyebrow" data-tone="accent">
                  Activa
                </span>
              )}
            </span>
            <span className="m-card-title">{plan.name}</span>
            <span className="m-sub">
              {[
                `${plan.dayCount} ${plan.dayCount === 1 ? "día" : "días"}`,
                plan.objective,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>

            {days.length > 0 && (
              <div className="m-days">
                {days.map((day, i) => {
                  const open = openDay === day.id;
                  const hoy = plan.active && day.id === todayDayId;
                  return (
                    <div
                      key={day.id}
                      className="m-day-acc"
                      data-open={open ? "" : undefined}
                    >
                      <button
                        type="button"
                        className="m-day-acc-head m-press"
                        aria-expanded={open}
                        aria-controls={`m-day-${day.id}`}
                        onClick={() => setOpenDay(open ? null : day.id)}
                      >
                        <span className="m-day-acc-num m-num">{i + 1}</span>
                        <span className="m-list-row-main">
                          <span className="m-list-row-title">
                            {dayTitle(day)}
                          </span>
                          <span className="m-list-row-sub">
                            {day.exercises.length}{" "}
                            {day.exercises.length === 1
                              ? "ejercicio"
                              : "ejercicios"}
                          </span>
                        </span>
                        {hoy && (
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
                          <ol className="m-day-acc-list">
                            {day.exercises.map((e) => (
                              <li key={e.id}>
                                <Link
                                  href={`/entrenamiento?vista=biblioteca&ejercicio=${e.exerciseId}`}
                                  className="m-day-acc-ex m-press"
                                >
                                  <span className="m-day-acc-name">
                                    {e.name}
                                  </span>
                                  <span className="m-num m-day-acc-scheme">
                                    {e.sets ?? "—"} × {reps(e)}
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="m-row" style={{ gap: 8, marginTop: 4 }}>
              {!plan.active && (
                <button
                  type="button"
                  className="m-btn m-press"
                  data-variant="primary"
                  disabled={pending}
                  onClick={() => activate(plan)}
                  style={{ flex: 1 }}
                >
                  {pending ? "Activando…" : "Usar esta rutina"}
                </button>
              )}
              <Link
                href={`/entrenamiento/rutinas/${plan.id}`}
                className="m-btn m-press"
                style={{ flex: plan.active ? 1 : undefined }}
              >
                <Pencil size={15} aria-hidden="true" />
                Editar
              </Link>
            </div>
          </section>
        );
      })}

      <h2 className="m-section" style={{ marginTop: 6 }}>
        Agregar rutina
      </h2>
      <div className="m-grid-2">
        <Link
          href="/entrenamiento?vista=rutinas&paso=importar"
          className="m-action-tile m-press"
        >
          <FileUp
            size={24}
            strokeWidth={2}
            className="m-accent-text"
            aria-hidden="true"
          />
          <span className="m-list-row-title">Importar del coach</span>
          <span className="m-list-row-sub">
            {aiEnabled
              ? "PDF o foto. La IA lee ejercicios, series, reps y RIR."
              : "PDF o texto: ejercicios, series, reps y RIR."}
          </span>
        </Link>
        <Link
          href="/entrenamiento?vista=rutinas&paso=ia"
          className="m-action-tile m-press"
          aria-disabled={!aiEnabled}
        >
          <Sparkles
            size={24}
            strokeWidth={2}
            className="m-accent-text"
            aria-hidden="true"
          />
          <span className="m-list-row-title">Crear con IA</span>
          <span className="m-list-row-sub">
            Responde un cuestionario corto y la IA la arma.
          </span>
        </Link>
      </div>
    </div>
  );
}
