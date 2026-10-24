"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, ChevronLeft, Info, Pencil } from "lucide-react";
import { toast } from "sonner";
import { generateRoutine } from "@/features/training/generate-actions";
import {
  EQUIPOS,
  NIVELES,
  OBJETIVOS,
  type Questionnaire,
} from "@/features/training/lib/routine-generation";
import { GRUPOS_MUSCULARES } from "@/features/training/lib/library-groups";
import { goBack } from "@/mobile/ui/back-button";

const SUB: Record<Questionnaire["goal"], string> = {
  recomposicion: "Perder grasa y ganar músculo",
  hipertrofia: "Más volumen e hipertrofia",
  fuerza: "Pesos más altos, menos reps",
  resistencia: "Más reps, menos descanso",
};

const NIVEL_SUB: Record<Questionnaire["level"], string> = {
  principiante: "Menos de 1 año entrenando con constancia",
  intermedio: "Entre 1 y 3 años, conoces los básicos",
  avanzado: "Más de 3 años y técnica sólida",
};

const DIAS = ["3", "4", "5", "6"] as const;

const MOLESTIAS = [
  "Hombro",
  "Rodilla",
  "Espalda baja",
  "Muñeca",
  "Codo",
  "Cadera",
];

const PASOS = [
  {
    id: "objetivo",
    title: "¿Cuál es tu objetivo?",
    help: "La rutina ajusta series, repeticiones y descansos a esto.",
  },
  {
    id: "dias",
    title: "¿Cuántos días por semana?",
    help: "Los que de verdad puedes sostener, no los ideales.",
  },
  {
    id: "nivel",
    title: "¿Cuánta experiencia tienes?",
    help: "Define el volumen y qué tan técnicos son los ejercicios.",
  },
  {
    id: "equipo",
    title: "¿Con qué equipo cuentas?",
    help: "Elige todo lo que tengas a mano.",
  },
  {
    id: "molestias",
    title: "¿Alguna lesión o molestia?",
    help: "La IA evita los ejercicios que la carguen.",
  },
  {
    id: "enfasis",
    title: "¿Quieres darle énfasis a algo?",
    help: "Hasta 4 grupos. Si no, queda equilibrada.",
  },
  {
    id: "resumen",
    title: "Revisa tus respuestas",
    help: "Toca una para cambiarla.",
  },
] as const;

type Paso = (typeof PASOS)[number]["id"];

/**
 * Cuestionario para que la IA arme una rutina: una pregunta por pantalla, con
 * barra de avance, «Atrás» arriba y «Siguiente» fijo abajo (apagado hasta
 * responder). El ultimo paso resume y avisa que la arma una IA.
 */
export function AiQuestionnaire({ aiEnabled }: { aiEnabled: boolean }) {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  /* +1 al avanzar, -1 al volver: decide hacia donde se desliza. */
  const [dir, setDir] = useState(1);
  /* Si se llego a un paso desde el resumen, «Siguiente» vuelve al resumen. */
  const [desdeResumen, setDesdeResumen] = useState(false);
  const [goal, setGoal] = useState<Questionnaire["goal"] | null>(null);
  const [days, setDays] = useState<string | null>(null);
  const [level, setLevel] = useState<Questionnaire["level"] | null>(null);
  const [equipment, setEquipment] = useState<Questionnaire["equipment"]>([]);
  /* null = sin responder; [] = «Ninguna». */
  const [molestias, setMolestias] = useState<string[] | null>(null);
  const [notes, setNotes] = useState("");
  /* null = sin responder; [] = «Equilibrada». */
  const [emphasis, setEmphasis] = useState<string[] | null>(null);
  const [pending, startTransition] = useTransition();

  const paso = PASOS[i]!;
  const resumen = PASOS.length - 1;
  const respondido: Record<Paso, boolean> = {
    objetivo: goal !== null,
    dias: days !== null,
    nivel: level !== null,
    equipo: equipment.length > 0,
    molestias: molestias !== null,
    enfasis: emphasis !== null,
    resumen: true,
  };

  const ir = (n: number) => {
    setDir(n > i ? 1 : -1);
    setI(n);
  };
  const siguiente = () => {
    if (desdeResumen) {
      setDesdeResumen(false);
      ir(resumen);
    } else ir(i + 1);
  };
  const atras = () => {
    if (i === 0) goBack(router, "/entrenamiento?vista=rutinas");
    else ir(i - 1);
  };

  const submit = () =>
    startTransition(async () => {
      if (!goal || !days || !level) return;
      const limitations = [
        molestias?.length
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
        emphasis: emphasis ?? [],
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Rutina generada. Revísala antes de entrenar.");
      router.push("/entrenamiento?vista=rutinas");
    });

  const toggle = <T extends string>(list: T[], v: T) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v];

  const resumenFilas: { paso: Paso; label: string; value: string }[] = [
    {
      paso: "objetivo",
      label: "Objetivo",
      value: OBJETIVOS.find((o) => o.id === goal)?.label ?? "—",
    },
    { paso: "dias", label: "Días por semana", value: days ?? "—" },
    {
      paso: "nivel",
      label: "Experiencia",
      value: NIVELES.find((n) => n.id === level)?.label ?? "—",
    },
    {
      paso: "equipo",
      label: "Equipo",
      value:
        EQUIPOS.filter((e) => equipment.includes(e.id))
          .map((e) => e.label)
          .join(", ") || "—",
    },
    {
      paso: "molestias",
      label: "Lesiones o molestias",
      value: [
        molestias?.length ? molestias.join(", ") : "Ninguna",
        notes.trim(),
      ]
        .filter(Boolean)
        .join(" · "),
    },
    {
      paso: "enfasis",
      label: "Énfasis",
      value: emphasis?.length
        ? GRUPOS_MUSCULARES.filter((g) => emphasis.includes(g.id))
            .map((g) => g.label)
            .join(", ")
        : "Equilibrada",
    },
  ];

  let cuerpo: React.ReactNode;
  switch (paso.id) {
    case "objetivo":
      cuerpo = (
        <div className="m-stack" role="radiogroup" aria-label={paso.title}>
          {OBJETIVOS.map((o) => (
            <Opcion
              key={o.id}
              on={goal === o.id}
              radio
              onClick={() => setGoal(o.id)}
              title={o.label}
              sub={SUB[o.id]}
            />
          ))}
        </div>
      );
      break;
    case "dias":
      cuerpo = (
        <div className="m-grid-2" role="radiogroup" aria-label={paso.title}>
          {DIAS.map((d) => (
            <button
              key={d}
              type="button"
              role="radio"
              aria-checked={days === d}
              className="m-q-day m-press"
              onClick={() => setDays(d)}
            >
              <span className="m-num">{d}</span>
              <span>días</span>
            </button>
          ))}
        </div>
      );
      break;
    case "nivel":
      cuerpo = (
        <div className="m-stack" role="radiogroup" aria-label={paso.title}>
          {NIVELES.map((n) => (
            <Opcion
              key={n.id}
              on={level === n.id}
              radio
              onClick={() => setLevel(n.id)}
              title={n.label}
              sub={NIVEL_SUB[n.id]}
            />
          ))}
        </div>
      );
      break;
    case "equipo":
      cuerpo = (
        <div className="m-stack">
          {EQUIPOS.map((e) => (
            <Opcion
              key={e.id}
              on={equipment.includes(e.id)}
              onClick={() => setEquipment(toggle(equipment, e.id))}
              title={e.label}
            />
          ))}
        </div>
      );
      break;
    case "molestias":
      cuerpo = (
        <div className="m-stack">
          <Opcion
            on={molestias !== null && molestias.length === 0}
            onClick={() => setMolestias([])}
            title="Ninguna"
          />
          <div className="m-grid-2">
            {MOLESTIAS.map((m) => (
              <Opcion
                key={m}
                on={molestias?.includes(m) ?? false}
                onClick={() => setMolestias(toggle(molestias ?? [], m))}
                title={m}
              />
            ))}
          </div>
          <label className="m-field" style={{ marginTop: 6 }}>
            <span>Algo más que deba saber (opcional)</span>
            <textarea
              className="m-input"
              maxLength={200}
              value={notes}
              onChange={(ev) => setNotes(ev.target.value)}
              placeholder="Ej.: entreno en casa los fines de semana"
            />
          </label>
        </div>
      );
      break;
    case "enfasis":
      cuerpo = (
        <div className="m-stack">
          <Opcion
            on={emphasis !== null && emphasis.length === 0}
            onClick={() => setEmphasis([])}
            title="Equilibrada"
            sub="Todo el cuerpo por igual"
          />
          <div className="m-grid-2">
            {GRUPOS_MUSCULARES.map((g) => {
              const on = emphasis?.includes(g.id) ?? false;
              return (
                <Opcion
                  key={g.id}
                  on={on}
                  disabled={!on && (emphasis?.length ?? 0) >= 4}
                  onClick={() => setEmphasis(toggle(emphasis ?? [], g.id))}
                  title={g.label}
                />
              );
            })}
          </div>
        </div>
      );
      break;
    case "resumen":
      cuerpo = (
        <div className="m-stack">
          <ul className="m-q-summary">
            {resumenFilas.map((f) => (
              <li key={f.paso}>
                <button
                  type="button"
                  className="m-q-summary-row m-press"
                  onClick={() => {
                    setDesdeResumen(true);
                    ir(PASOS.findIndex((p) => p.id === f.paso));
                  }}
                >
                  <span className="m-list-row-main">
                    <span className="m-list-row-sub">{f.label}</span>
                    <span className="m-list-row-title">{f.value}</span>
                  </span>
                  <Pencil size={16} aria-hidden="true" className="m-chevron" />
                  <span className="sr-only">Editar</span>
                </button>
              </li>
            ))}
          </ul>
          <div className="m-notice" data-tone="ia">
            <Info size={18} aria-hidden="true" style={{ flex: "none" }} />
            <span>
              Esta rutina la arma una IA y quedará marcada como tal. No
              reemplaza a un coach ni a un profesional de salud.
            </span>
          </div>
        </div>
      );
      break;
  }

  return (
    <div className="m-screen" data-m-fullscreen="" style={{ paddingBottom: 0 }}>
      <div className="m-step-head">
        <button
          type="button"
          aria-label={i === 0 ? "Volver" : "Paso anterior"}
          className="m-icon-btn m-press"
          onClick={atras}
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <div style={{ flex: 1 }}>
          <div className="m-sub">
            Paso <span className="m-num">{i + 1}</span> de{" "}
            <span className="m-num">{PASOS.length}</span>
          </div>
          <div
            className="m-progress"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={PASOS.length}
            aria-valuenow={i + 1}
            aria-label="Avance del cuestionario"
          >
            <div style={{ width: `${((i + 1) / PASOS.length) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="m-q-viewport">
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.div
            key={paso.id}
            className="m-body"
            custom={dir}
            variants={{
              enter: (d: number) =>
                reduce ? { opacity: 0 } : { x: d * 48, opacity: 0 },
              center: { x: 0, opacity: 1 },
              exit: (d: number) =>
                reduce ? { opacity: 0 } : { x: d * -48, opacity: 0 },
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={
              reduce
                ? { duration: 0.15 }
                : { type: "spring", bounce: 0, duration: 0.4 }
            }
          >
            <div className="m-stack" style={{ gap: 6 }}>
              <h1 className="m-title">{paso.title}</h1>
              <p className="m-sheet-text">{paso.help}</p>
            </div>
            {cuerpo}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="m-step-foot">
        {paso.id === "resumen" ? (
          <button
            type="button"
            className="m-btn m-press"
            data-variant="primary"
            disabled={!aiEnabled || pending}
            onClick={submit}
          >
            {pending
              ? "Armando tu rutina…"
              : aiEnabled
                ? "Crear rutina"
                : "IA no disponible ahora"}
          </button>
        ) : (
          <button
            type="button"
            className="m-btn m-press"
            data-variant="primary"
            disabled={!respondido[paso.id]}
            onClick={siguiente}
          >
            {desdeResumen ? "Listo" : "Siguiente"}
          </button>
        )}
      </div>
    </div>
  );
}

/** Opcion grande y tocable; con `radio` se comporta como radio. */
function Opcion({
  on,
  onClick,
  title,
  sub,
  radio,
  disabled,
}: {
  on: boolean;
  onClick: () => void;
  title: string;
  sub?: string;
  radio?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role={radio ? "radio" : undefined}
      aria-checked={radio ? on : undefined}
      aria-pressed={radio ? undefined : on}
      className="m-q-option m-press"
      disabled={disabled}
      onClick={onClick}
    >
      <span className="m-list-row-main">
        <span className="m-q-option-title">{title}</span>
        {sub && <span className="m-list-row-sub">{sub}</span>}
      </span>
      <span className="m-q-check" aria-hidden="true">
        {on && <Check size={14} strokeWidth={3} />}
      </span>
    </button>
  );
}
