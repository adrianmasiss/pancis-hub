"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ChoicePills, FormGroup } from "@/components/shared/form-kit";
import { generateRoutine } from "@/features/training/generate-actions";
import { GRUPOS_MUSCULARES } from "@/features/training/lib/library-groups";
import {
  EQUIPOS,
  NIVELES,
  OBJETIVOS,
  type Questionnaire,
} from "@/features/training/lib/routine-generation";
import { AiNotice } from "./ai-notice";
import "./generate-routine.css";

const DIAS = ["3", "4", "5", "6"] as const;

/** Un grupo de pastillas que se encienden y apagan (selección múltiple). */
function Chips<T extends string>({
  label,
  options,
  value,
  onChange,
  max,
  hideLegend,
}: {
  label: string;
  hideLegend?: boolean;
  options: readonly { id: T; label: string }[];
  value: T[];
  onChange: (next: T[]) => void;
  max?: number;
}) {
  return (
    <fieldset className="generate-chips">
      <legend className={hideLegend ? "sr-only" : undefined}>{label}</legend>
      <div>
        {options.map((o) => {
          const on = value.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={on}
              disabled={!on && max !== undefined && value.length >= max}
              onClick={() =>
                onChange(
                  on ? value.filter((v) => v !== o.id) : [...value, o.id],
                )
              }
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

/**
 * Cuestionario para que la IA arme una rutina: objetivo, días, nivel, equipo,
 * lesiones y músculos a enfatizar. Se puede usar aunque haya coach: la rutina
 * queda en «Creadas por IA» y no reemplaza a la activa.
 */
export function GenerateRoutineDialog({ aiEnabled }: { aiEnabled: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState<Questionnaire>({
    goal: "hipertrofia",
    daysPerWeek: 4,
    level: "intermedio",
    equipment: ["gimnasio"],
    limitations: "",
    emphasis: [],
  });

  const generate = () =>
    startTransition(async () => {
      const result = await generateRoutine(q);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Rutina generada. Revísala antes de entrenar.");
      setOpen(false);
      router.push(`/entrenamiento/rutinas/${result.planId}`);
    });

  return (
    <Dialog open={open} onOpenChange={(next) => !pending && setOpen(next)}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={!aiEnabled}>
          <Sparkles className="size-4" aria-hidden="true" />
          Generar con IA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generar una rutina con IA</DialogTitle>
          <DialogDescription>
            Cuéntanos cómo entrenas. La rutina queda en «Creadas por IA» y
            puedes editarla o activarla cuando quieras.
          </DialogDescription>
        </DialogHeader>

        <div className="generate-form">
          <FormGroup title="Tu objetivo">
            <ChoicePills
              label="Qué buscas"
              options={OBJETIVOS.map((o) => ({ value: o.id, label: o.label }))}
              value={q.goal}
              onChange={(goal) => setQ({ ...q, goal })}
            />
            <ChoicePills
              label="Días por semana"
              options={DIAS.map((d) => ({ value: d, label: `${d} días` }))}
              value={String(q.daysPerWeek) as (typeof DIAS)[number]}
              onChange={(d) => setQ({ ...q, daysPerWeek: Number(d) })}
            />
            <ChoicePills
              label="Nivel"
              options={NIVELES.map((n) => ({ value: n.id, label: n.label }))}
              value={q.level}
              onChange={(level) => setQ({ ...q, level })}
            />
          </FormGroup>

          <FormGroup title="Dónde y cómo entrenas">
            <Chips
              label="Equipo disponible"
              options={EQUIPOS}
              value={q.equipment}
              onChange={(equipment) => setQ({ ...q, equipment })}
            />
            <div className="pc-metric">
              <label htmlFor="generate-limitations">
                Lesiones o limitaciones
              </label>
              <textarea
                id="generate-limitations"
                className="pc-textarea"
                rows={2}
                maxLength={300}
                placeholder="Ej.: me duele el hombro derecho al empujar por encima de la cabeza"
                value={q.limitations}
                onChange={(event) =>
                  setQ({ ...q, limitations: event.target.value })
                }
              />
            </div>
          </FormGroup>

          <FormGroup
            collapsible
            defaultOpen={false}
            filled={q.emphasis.length}
            title="Músculos a enfatizar"
            hint="Opcional · hasta 4"
          >
            <Chips
              label="Músculos a enfatizar"
              hideLegend
              options={GRUPOS_MUSCULARES}
              value={q.emphasis}
              onChange={(emphasis) => setQ({ ...q, emphasis })}
              max={4}
            />
          </FormGroup>
        </div>

        {/* El aviso va en el pie fijo: visible siempre, no al final del
            desplazamiento. */}
        <DialogFooter className="flex-col sm:flex-col">
          <AiNotice className="ai-notice-compact" />
          <Button
            type="button"
            className="w-full"
            disabled={pending}
            aria-busy={pending}
            onClick={generate}
          >
            <Sparkles className="size-4" aria-hidden="true" />
            {pending
              ? "Armando tu rutina… (puede tardar un minuto)"
              : "Generar rutina"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
