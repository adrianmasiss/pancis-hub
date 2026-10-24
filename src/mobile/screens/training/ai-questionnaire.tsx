"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Info } from "lucide-react";
import { toast } from "sonner";
import { generateRoutine } from "@/features/training/generate-actions";
import {
  EQUIPOS,
  NIVELES,
  OBJETIVOS,
  type Questionnaire,
} from "@/features/training/lib/routine-generation";
import { GRUPOS_MUSCULARES } from "@/features/training/lib/library-groups";
import { Segmented } from "@/mobile/ui/controls";

const SUB: Record<Questionnaire["goal"], string> = {
  recomposicion: "Perder grasa y ganar músculo",
  hipertrofia: "Más volumen e hipertrofia",
  fuerza: "Pesos más altos, menos reps",
  resistencia: "Más reps, menos descanso",
};

const MOLESTIAS = [
  "Hombro",
  "Rodilla",
  "Espalda baja",
  "Muñeca",
  "Codo",
  "Cadera",
];

function Chips<T extends string>({
  options,
  value,
  onChange,
  max,
}: {
  options: readonly { id: T; label: string }[];
  value: T[];
  onChange: (next: T[]) => void;
  max?: number;
}) {
  return (
    <div className="m-chips">
      {options.map((o) => {
        const on = value.includes(o.id);
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={on}
            className="m-chip-toggle m-press"
            disabled={!on && max !== undefined && value.length >= max}
            onClick={() =>
              onChange(on ? value.filter((v) => v !== o.id) : [...value, o.id])
            }
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Cuestionario para que la IA arme una rutina. Paso 1: objetivo, molestias y
 * enfasis; paso 2: dias, nivel y equipo. El aviso de que la arma una IA
 * esta siempre a la vista.
 */
export function AiQuestionnaire({ aiEnabled }: { aiEnabled: boolean }) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [goal, setGoal] = useState<Questionnaire["goal"]>("recomposicion");
  const [molestias, setMolestias] = useState<string[]>([]);
  const [ninguna, setNinguna] = useState(true);
  const [emphasis, setEmphasis] = useState<string[]>([]);
  const [days, setDays] = useState("4");
  const [level, setLevel] = useState<Questionnaire["level"]>("intermedio");
  const [equipment, setEquipment] = useState<Questionnaire["equipment"]>([
    "gimnasio",
  ]);
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();

  const submit = () =>
    startTransition(async () => {
      const limitations = [
        !ninguna && molestias.length
          ? `Molestias en: ${molestias.join(", ").toLowerCase()}.`
          : "",
        notes.trim(),
      ]
        .filter(Boolean)
        .join(" ")
        .slice(0, 300);
      const result = await generateRoutine({
        goal,
        daysPerWeek: Number(days),
        level,
        equipment,
        limitations,
        emphasis,
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Rutina generada. Revísala antes de entrenar.");
      router.push("/entrenamiento?vista=rutinas");
    });

  return (
    <div className="m-screen" data-m-fullscreen="" style={{ paddingBottom: 0 }}>
      <div className="m-step-head">
        {step === 1 ? (
          <Link
            href="/entrenamiento?vista=rutinas"
            aria-label="Volver"
            className="m-icon-btn m-press"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </Link>
        ) : (
          <button
            type="button"
            aria-label="Paso anterior"
            className="m-icon-btn m-press"
            onClick={() => setStep(1)}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
        )}
        <div style={{ flex: 1 }}>
          <div className="m-sub">Paso {step} de 2</div>
          <div
            className="m-progress"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={2}
            aria-valuenow={step}
            aria-label="Avance del cuestionario"
          >
            <div style={{ width: step === 1 ? "50%" : "100%" }} />
          </div>
        </div>
      </div>

      <div className="m-body m-stagger" key={step}>
        <h1 className="m-title">
          {step === 1 ? "Armemos tu rutina" : "Tu semana y tu equipo"}
        </h1>

        {step === 1 ? (
          <>
            <fieldset className="m-fieldset">
              <legend>Objetivo</legend>
              <div className="m-grid-2">
                {OBJETIVOS.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    aria-pressed={goal === o.id}
                    className="m-choice m-press"
                    onClick={() => setGoal(o.id)}
                  >
                    <span style={{ fontSize: 15, fontWeight: 800 }}>
                      {o.label}
                    </span>
                    <span className="m-list-row-sub">{SUB[o.id]}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset className="m-fieldset">
              <legend>¿Alguna lesión o molestia?</legend>
              <div className="m-chips">
                <button
                  type="button"
                  aria-pressed={ninguna}
                  className="m-chip-toggle m-press"
                  onClick={() => {
                    setNinguna(true);
                    setMolestias([]);
                  }}
                >
                  Ninguna
                </button>
                {MOLESTIAS.map((m) => {
                  const on = molestias.includes(m);
                  return (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={on}
                      className="m-chip-toggle m-press"
                      onClick={() => {
                        const next = on
                          ? molestias.filter((x) => x !== m)
                          : [...molestias, m];
                        setMolestias(next);
                        setNinguna(next.length === 0);
                      }}
                    >
                      {m}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <fieldset className="m-fieldset">
              <legend>Énfasis (hasta 4)</legend>
              <Chips
                options={GRUPOS_MUSCULARES.map((g) => ({
                  id: g.id,
                  label: g.label,
                }))}
                value={emphasis}
                onChange={setEmphasis}
                max={4}
              />
            </fieldset>
          </>
        ) : (
          <>
            <fieldset className="m-fieldset">
              <legend>Días por semana</legend>
              <Segmented
                label="Días por semana"
                value={days}
                onChange={setDays}
                options={["3", "4", "5", "6"].map((d) => ({
                  value: d,
                  label: d,
                }))}
              />
            </fieldset>
            <fieldset className="m-fieldset">
              <legend>Nivel</legend>
              <Segmented
                label="Nivel"
                value={level}
                onChange={setLevel}
                options={NIVELES.map((n) => ({ value: n.id, label: n.label }))}
              />
            </fieldset>
            <fieldset className="m-fieldset">
              <legend>Equipo</legend>
              <Chips
                options={EQUIPOS.map((e) => ({ id: e.id, label: e.label }))}
                value={equipment}
                onChange={setEquipment}
              />
            </fieldset>
            <label className="m-field">
              <span>Algo más que deba saber (opcional)</span>
              <textarea
                className="m-input"
                maxLength={200}
                value={notes}
                onChange={(ev) => setNotes(ev.target.value)}
                placeholder="Ej.: entreno en casa los fines de semana"
              />
            </label>
          </>
        )}

        <div className="m-notice" data-tone="ia">
          <Info size={18} aria-hidden="true" style={{ flex: "none" }} />
          <span>
            Esta rutina la arma una IA y quedará marcada como tal. No reemplaza
            a un coach ni a un profesional de salud.
          </span>
        </div>
      </div>

      <div className="m-step-foot">
        {step === 1 ? (
          <button
            type="button"
            className="m-btn m-press"
            data-variant="primary"
            onClick={() => setStep(2)}
          >
            Siguiente
          </button>
        ) : (
          <button
            type="button"
            className="m-btn m-press"
            data-variant="primary"
            disabled={!aiEnabled || pending || equipment.length === 0}
            onClick={submit}
          >
            {pending
              ? "Armando tu rutina…"
              : aiEnabled
                ? "Crear rutina"
                : "IA no disponible ahora"}
          </button>
        )}
      </div>
    </div>
  );
}
