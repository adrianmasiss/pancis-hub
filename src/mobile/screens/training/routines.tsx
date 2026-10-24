"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { setActivePlan } from "@/features/training/actions";
import type { PlanSummary } from "@/features/training/queries";
import { Sheet } from "@/mobile/ui/sheet";
import { Tag } from "@/mobile/ui/display";

/**
 * Rutinas: las del coach y las creadas por IA, con la activa marcada. Tocar
 * otra pregunta si se activa; importar o crear con IA van a su propio paso.
 */
export function Routines({
  plans,
  aiEnabled,
}: {
  plans: PlanSummary[];
  aiEnabled: boolean;
}) {
  const router = useRouter();
  const [picked, setPicked] = useState<PlanSummary | null>(null);
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
      setPicked(null);
      router.refresh();
    });

  return (
    <div className="m-body m-stagger">
      {ordered.length === 0 && (
        <p className="m-sub">
          Aún no tienes rutinas. Importa la de tu coach o crea una con IA.
        </p>
      )}
      {ordered.map((plan) => (
        <button
          key={plan.id}
          type="button"
          className="m-routine m-press"
          aria-pressed={plan.active}
          onClick={() => setPicked(plan)}
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
          <span className="m-card-title">
            {plan.name}
          </span>
          <span className="m-sub">
            {[
              `${plan.dayCount} ${plan.dayCount === 1 ? "día" : "días"}`,
              plan.objective,
            ]
              .filter(Boolean)
              .join(" · ")}
          </span>
        </button>
      ))}

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

      <Sheet
        open={picked !== null}
        onOpenChange={(o) => !o && setPicked(null)}
        title={picked?.name ?? ""}
        description={
          picked?.active
            ? "Es tu rutina activa."
            : "Al activarla, Entrenar · Hoy te propone sus días. La otra queda guardada."
        }
      >
        {picked && !picked.active && (
          <button
            type="button"
            className="m-btn m-press"
            data-variant="primary"
            data-block=""
            disabled={pending}
            onClick={() => activate(picked)}
          >
            {pending ? "Activando…" : "Usar esta rutina"}
          </button>
        )}
        {picked && (
          <Link
            href={`/entrenamiento/rutinas/${picked.id}`}
            className="m-btn m-press"
            data-block=""
          >
            Ver y editar
          </Link>
        )}
      </Sheet>
    </div>
  );
}
