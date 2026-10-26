"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { Box, ChevronDown, Layers } from "lucide-react";
import {
  ROTULOS,
  resaltadoDeEjercicios,
} from "@/features/training/lib/muscle-map";
import { encuadreDe } from "@/features/training/lib/model-regions";

/* El mismo maniqui de escritorio. `three` solo viaja si se abre la pantalla,
   y WebGL no existe en el servidor. */
const MuscleModel = dynamic(
  () =>
    import("@/features/training/components/muscle-model").then(
      (m) => m.MuscleModel,
    ),
  {
    ssr: false,
    loading: () => <div className="muscle-model-stage" aria-hidden="true" />,
  },
);

/* Los vientres que se ven de espaldas: un dia de isquios abre de espaldas. */
const POSTERIORES = new Set([
  "dorsal",
  "trapecio",
  "lumbar",
  "deltoides-post",
  "triceps",
  "gluteo",
  "isquios",
  "gemelo",
]);

type ConMusculos = {
  primaryMuscle: string | null;
  secondaryMuscles: string[] | null;
};

/**
 * Maniqui 3D de la vista movil: los musculos de uno o varios ejercicios
 * encendidos y latiendo. Con `zoom`, la camara se acerca a los principales
 * (un solo ejercicio); sin el, se ve el cuerpo entero (el dia).
 */
export function ExerciseModel({
  exercises,
  zoom = false,
  compact = false,
  withSecondary = false,
  className,
}: {
  exercises: ConMusculos[];
  zoom?: boolean;
  /** Columna estrecha: sin «Secundarios». */
  compact?: boolean;
  /** Abre con los secundarios encendidos (mas tenues que los principales). */
  withSecondary?: boolean;
  className?: string;
}) {
  const [secundarios, setSecundarios] = useState(withSecondary);
  const [vista, setVista] = useState<"front" | "back" | null>(null);

  const mapa = useMemo(
    () =>
      resaltadoDeEjercicios(
        exercises.map((e) => ({
          primaryMuscle: e.primaryMuscle ?? "",
          secondaryMuscles: e.secondaryMuscles ?? [],
        })),
      ),
    [exercises],
  );
  const principales = useMemo(
    () => Object.keys(mapa).filter((m) => mapa[m]! >= 0.75),
    [mapa],
  );
  const encendidos = useMemo(
    () =>
      secundarios
        ? mapa
        : Object.fromEntries(
            Object.entries(mapa).filter(([, peso]) => peso >= 0.75),
          ),
    [mapa, secundarios],
  );
  const encuadre = zoom && principales.length ? encuadreDe(principales) : null;
  const posterior =
    principales.filter((m) => POSTERIORES.has(m)).length >
    principales.length / 2;
  const view = vista ?? encuadre?.side ?? (posterior ? "back" : "front");

  return (
    <div
      className={`m-model ${className ?? ""}`}
      data-compact={compact ? "" : undefined}
      data-focus={encuadre ? "" : undefined}
      role="group"
      aria-label={
        principales.length
          ? `Maniquí con ${principales.map((m) => ROTULOS[m] ?? m).join(", ")} encendidos.`
          : "Maniquí sin músculos encendidos."
      }
    >
      <MuscleModel
        tone="anatomia"
        highlight={encendidos}
        view={view}
        focus={encuadre ? principales : null}
        pulse
        onViewChange={setVista}
      />
      {/* Mientras llega el modelo: la silueta del mismo cuerpo (5 KB), que
          se funde cuando el lienzo esta listo. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- 5 KB, local */}
      <img
        className="m-model-ghost"
        src={
          view === "back"
            ? "/anatomy/silueta-espalda.webp"
            : "/anatomy/silueta-frente.webp"
        }
        alt=""
        aria-hidden="true"
      />
      {/* Girar es arrastrar; el credito CC BY vive en Perfil › Acerca de. */}
      <div className="m-model-tools">
        {!compact && (
          <button
            type="button"
            className="m-chip m-press"
            aria-pressed={secundarios}
            onClick={() => setSecundarios(!secundarios)}
          >
            <Layers size={13} strokeWidth={2} aria-hidden="true" />
            Secundarios
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * El maniqui plegado: una fila «Ver musculos en 3D» que lo despliega solo si
 * se pide. Hasta abrirlo no se descarga `three` ni se crea el lienzo.
 */
export function ModelDisclosure({
  exercises,
  withSecondary = false,
}: {
  exercises: ConMusculos[];
  withSecondary?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  return (
    <section className="m-model-disclosure" data-open={open ? "" : undefined}>
      <button
        type="button"
        className="m-list-row m-press"
        aria-expanded={open}
        onClick={() => {
          setMounted(true);
          setOpen(!open);
        }}
      >
        <span className="m-option-icon" aria-hidden="true">
          <Box size={18} strokeWidth={2} />
        </span>
        <span className="m-list-row-main">
          <span className="m-list-row-title">Ver músculos en 3D</span>
          <span className="m-list-row-sub">Los que trabaja este ejercicio</span>
        </span>
        <ChevronDown
          className="m-chevron m-disclosure-chevron"
          size={18}
          aria-hidden="true"
        />
      </button>
      <div className="m-disclosure-body" inert={!open}>
        <div>
          {mounted && (
            <ExerciseModel
              exercises={exercises}
              zoom
              withSecondary={withSecondary}
            />
          )}
        </div>
      </div>
    </section>
  );
}
