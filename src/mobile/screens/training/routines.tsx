"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, FileUp, Pencil, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { setActivePlan } from "@/features/training/actions";
import type { PlanDayView, PlanSummary } from "@/features/training/queries";
import { triggerHaptic } from "@/lib/haptics";
import { Fab } from "@/mobile/ui/fab";
import { Sheet } from "@/mobile/ui/sheet";
import { DayList, OriginTag } from "./active-routine";

/**
 * Rutinas: las del coach y las creadas por IA, con la activa primero. Tocar
 * una la despliega ahi mismo con sus dias y ejercicios. Agregar (importar o
 * crear con IA) va por el «+».
 */
export function Routines({
  plans,
  planDays,
  images,
  todayDayId,
  aiEnabled,
}: {
  plans: PlanSummary[];
  planDays: Record<string, PlanDayView[]>;
  images: Record<string, string>;
  todayDayId: string | null;
  aiEnabled: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState<string | null>(null);
  const [openDay, setOpenDay] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<PlanSummary | null>(null);
  const [pending, startTransition] = useTransition();
  const ordered = [...plans].sort(
    (a, b) =>
      Number(b.active) - Number(a.active) || a.origin.localeCompare(b.origin),
  );

  const activate = (plan: PlanSummary) =>
    startTransition(async () => {
      const result = await setActivePlan({ planId: plan.id });
      setConfirm(null);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      triggerHaptic("success");
      toast.success(`${plan.name} es tu rutina activa.`);
      router.refresh();
    });

  return (
    <div className="m-body m-stagger">
      {ordered.length === 0 && (
        <p className="m-sub">
          Aún no tienes rutinas. Toca «+» para importar la de tu coach o crear
          una con IA.
        </p>
      )}
      {ordered.map((plan) => {
        const abierta = open === plan.id;
        return (
          <section
            key={plan.id}
            className="m-routine"
            data-active={plan.active ? "" : undefined}
            data-open={abierta ? "" : undefined}
            aria-label={plan.name}
          >
            <button
              type="button"
              className="m-routine-head m-press"
              aria-expanded={abierta}
              aria-controls={`m-plan-${plan.id}`}
              onClick={() => setOpen(abierta ? null : plan.id)}
            >
              <span className="m-row" style={{ gap: 6 }}>
                <OriginTag origin={plan.origin} />
                <span style={{ flex: 1 }} />
                {plan.active && (
                  <span className="m-eyebrow" data-tone="accent">
                    Activa
                  </span>
                )}
              </span>
              <span className="m-card-title" style={{ fontSize: 20 }}>
                {plan.name}
              </span>
              <span className="m-row" style={{ gap: 8 }}>
                <span className="m-sub" style={{ flex: 1 }}>
                  {[
                    `${plan.dayCount} ${plan.dayCount === 1 ? "día" : "días"}`,
                    plan.objective,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                <ChevronDown
                  className="m-chevron m-disclosure-chevron"
                  size={18}
                  aria-hidden="true"
                />
              </span>
            </button>

            <div
              id={`m-plan-${plan.id}`}
              className="m-disclosure-body"
              inert={!abierta}
            >
              <div>
                <DayList
                  days={planDays[plan.id] ?? []}
                  images={images}
                  openDay={openDay}
                  onToggle={(id) => setOpenDay(openDay === id ? null : id)}
                  todayDayId={plan.active ? todayDayId : null}
                />
                <div className="m-row" style={{ gap: 8, marginTop: 10 }}>
                  {!plan.active && (
                    <button
                      type="button"
                      className="m-btn m-press"
                      data-variant="primary"
                      disabled={pending}
                      onClick={() => setConfirm(plan)}
                      style={{ flex: 1 }}
                    >
                      Usar esta rutina
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
              </div>
            </div>
          </section>
        );
      })}

      <Fab
        label="Agregar rutina"
        actions={[
          {
            label: "Importar del coach",
            sub: aiEnabled
              ? "PDF o foto. La IA lee ejercicios, series, reps y RIR."
              : "PDF o texto: ejercicios, series, reps y RIR.",
            icon: FileUp,
            href: "/entrenamiento?vista=rutinas&paso=importar",
          },
          {
            label: "Crear con IA",
            sub: "Responde un cuestionario corto y la IA la arma.",
            icon: Sparkles,
            href: "/entrenamiento?vista=rutinas&paso=ia",
            disabled: !aiEnabled,
          },
        ]}
      />

      <Sheet
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm ? `¿Usar «${confirm.name}»?` : ""}
        description="Pasa a ser tu rutina activa: es la que verás en Hoy y la que propone el entreno de cada día. La otra no se borra."
      >
        <button
          type="button"
          className="m-btn m-press"
          data-variant="primary"
          data-block=""
          disabled={pending}
          onClick={() => confirm && activate(confirm)}
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
    </div>
  );
}
