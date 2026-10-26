"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog } from "radix-ui";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowLeftRight, ChevronLeft, Dumbbell, Search } from "lucide-react";
import { searchExercises } from "@/features/training/actions";
import { planReplacementOptions } from "@/features/training/plan-edit-actions";
import { searchSubstitutes } from "@/features/training/session-swap-actions";
import type { SubstituteMatch } from "@/features/training/lib/session-substitutes";
import { capital, musculo } from "@/features/training/components/training-ui";
import { MOBILE_PORTAL_ID } from "@/mobile/routes";
import { Sheet } from "@/mobile/ui/sheet";
import { useSearch } from "@/mobile/ui/use-search";
import {
  WheelColumn,
  WheelGroup,
  Wheels,
  range,
  type WheelOption,
} from "@/mobile/ui/wheel";

/**
 * Piezas del editor de rutina del telefono (3.5), que tambien usa Importar
 * (3.6): la hoja de valores con ruedas y la pantalla de reemplazo.
 */

/** Un ejercicio del catalogo, como lo eligen la busqueda y las alternativas. */
export type CatalogPick = {
  id: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  equipment: string | null;
};

/** Lo que se edita de cada ejercicio de la rutina. */
export type ExerciseValues = {
  sets: number | null;
  repsMin: number | null;
  repsMax: number | null;
  rir: number | null;
  restSeconds: number | null;
};

/** «4 × 8–10 · RIR 2 · 90 s». */
export function scheme(v: ExerciseValues): string {
  const reps =
    v.repsMin === null && v.repsMax === null
      ? "—"
      : v.repsMin === v.repsMax || v.repsMax === null
        ? String(v.repsMin)
        : `${v.repsMin ?? "—"}–${v.repsMax}`;
  const partes = [`${v.sets ?? "—"} × ${reps}`];
  if (v.rir !== null) partes.push(`RIR ${v.rir}`);
  if (v.restSeconds) partes.push(restLabel(v.restSeconds));
  return partes.join(" · ");
}

function restLabel(s: number) {
  if (s < 60) return `${s} s`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m}:${String(r).padStart(2, "0")} min` : `${m} min`;
}

/** Musculos en pantalla: principal y secundarios, bien escritos. */
export function musclesOf(
  e: Pick<CatalogPick, "primaryMuscle" | "secondaryMuscles">,
) {
  return {
    primary: e.primaryMuscle ? capital(musculo(e.primaryMuscle)) : null,
    secondary: e.secondaryMuscles.slice(0, 3).map((m) => capital(musculo(m))),
  };
}

const NINGUNO = -1;
const SERIES = range(1, 10);
const RIRS: WheelOption<number>[] = [
  { value: NINGUNO, label: "—" },
  ...range(0, 5),
];
/** En la rueda, siempre «m:ss» (la unidad va al lado): «2:30 min» no cabe. */
const mss = (s: number) =>
  `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const DESCANSOS: WheelOption<number>[] = [
  { value: 0, label: "—" },
  ...range(15, 300, 15, mss),
];

/**
 * Series, reps (de–a), RIR y descanso en ruedas tipo iOS. Cada giro se
 * aplica al momento; «Listo» cierra.
 */
export function ExerciseValuesSheet({
  open,
  onClose,
  name,
  values,
  onChange,
  description = "Gira cada rueda; el cambio se guarda con la rutina.",
  onReplace,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
  values: ExerciseValues;
  onChange: (v: ExerciseValues) => void;
  description?: string;
  /** Abre la pantalla de reemplazo (buscar el ejercicio correcto). */
  onReplace?: () => void;
}) {
  const min = values.repsMin ?? values.repsMax ?? 10;
  const max = Math.max(values.repsMax ?? min, min);
  // Fuera de la rueda (p. ej. 40 reps importadas), la opcion se agrega.
  const reps = useMemo(() => range(1, Math.max(30, max)), [max]);
  const descansos = useMemo(
    () =>
      DESCANSOS.some((o) => o.value === (values.restSeconds ?? 0))
        ? DESCANSOS
        : [
            ...DESCANSOS,
            {
              value: values.restSeconds!,
              label: mss(values.restSeconds!),
            },
          ].sort((a, b) => a.value - b.value),
    [values.restSeconds],
  );

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={name}
      description={description}
    >
      <Wheels>
        <WheelGroup label="Series">
          <WheelColumn
            label="Series"
            options={SERIES}
            value={Math.min(10, values.sets ?? 3)}
            onChange={(v) => onChange({ ...values, sets: v })}
          />
        </WheelGroup>
        <WheelGroup label="Reps">
          <WheelColumn
            label="Repeticiones, desde"
            options={reps}
            value={min}
            onChange={(v) =>
              onChange({ ...values, repsMin: v, repsMax: Math.max(v, max) })
            }
          />
          <span className="m-wheel-unit" aria-hidden="true">
            –
          </span>
          <WheelColumn
            label="Repeticiones, hasta"
            options={reps}
            value={max}
            onChange={(v) =>
              onChange({ ...values, repsMax: v, repsMin: Math.min(min, v) })
            }
          />
        </WheelGroup>
        <WheelGroup label="RIR">
          <WheelColumn
            label="Repeticiones en reserva"
            options={RIRS}
            value={values.rir === null ? NINGUNO : Math.min(5, values.rir)}
            onChange={(v) =>
              onChange({ ...values, rir: v === NINGUNO ? null : v })
            }
          />
        </WheelGroup>
      </Wheels>
      <Wheels>
        <WheelGroup label="Descanso" unit="min">
          <WheelColumn
            label="Descanso entre series"
            options={descansos}
            value={values.restSeconds ?? 0}
            onChange={(v) => onChange({ ...values, restSeconds: v || null })}
          />
        </WheelGroup>
      </Wheels>
      <button
        type="button"
        className="m-btn m-press"
        data-variant="primary"
        data-block=""
        onClick={onClose}
      >
        Listo
      </button>
      {onReplace && (
        <button
          type="button"
          className="m-btn m-press"
          data-variant="ghost"
          data-block=""
          onClick={onReplace}
        >
          <ArrowLeftRight size={16} aria-hidden="true" />
          Buscar otro ejercicio
        </button>
      )}
    </Sheet>
  );
}

type Option = { exercise: CatalogPick; similarity?: number };

/**
 * Pantalla de reemplazo: el ejercicio actual arriba con sus musculos, hasta
 * cinco alternativas con su % de similitud, musculos y equipo, y busqueda
 * en todo el catalogo. Sin `source` (agregar uno nuevo) solo busca.
 *
 * Entra desde la derecha, como una pantalla mas, sin perder lo editado.
 */
export function ReplaceScreen({
  open,
  onClose,
  source,
  title,
  onPick,
  suggestions,
}: {
  open: boolean;
  onClose: () => void;
  source: CatalogPick | null;
  title: string;
  onPick: (pick: CatalogPick) => void;
  /** Propuestas de antemano (p. ej. las de la IA al importar). */
  suggestions?: CatalogPick[];
}) {
  const reduce = useReducedMotion();
  const container =
    open && typeof document !== "undefined"
      ? document.getElementById(MOBILE_PORTAL_ID)
      : null;

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount container={container}>
            <Dialog.Content asChild forceMount aria-describedby={undefined}>
              <motion.div
                className="m-replace"
                initial={reduce ? { opacity: 0 } : { x: "100%" }}
                animate={reduce ? { opacity: 1 } : { x: 0 }}
                exit={reduce ? { opacity: 0 } : { x: "100%" }}
                transition={
                  reduce
                    ? { duration: 0.15 }
                    : { type: "spring", bounce: 0, duration: 0.45 }
                }
              >
                <ReplaceBody
                  key={source?.id ?? "nuevo"}
                  source={source}
                  title={title}
                  onClose={onClose}
                  onPick={onPick}
                  suggestions={suggestions}
                />
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function ReplaceBody({
  source,
  title,
  onClose,
  onPick,
  suggestions,
}: {
  source: CatalogPick | null;
  title: string;
  onClose: () => void;
  onPick: (pick: CatalogPick) => void;
  suggestions?: CatalogPick[];
}) {
  const [alternatives, setAlternatives] = useState<Option[] | null>(
    source ? null : [],
  );
  const [term, setTerm] = useState("");

  useEffect(() => {
    if (!source) return;
    let alive = true;
    void planReplacementOptions({ exerciseId: source.id }).then((r) => {
      if (alive) setAlternatives("error" in r ? [] : r.options.map(toOption));
    });
    return () => {
      alive = false;
    };
  }, [source]);

  const results = useSearch<Option>(term, async (q) => {
    if (source) {
      const r = await searchSubstitutes({ exerciseId: source.id, query: q });
      return "error" in r ? null : r.results.map(toOption);
    }
    const r = await searchExercises({ term: q });
    return "error" in r
      ? null
      : r.results.slice(0, 15).map((e) => ({ exercise: e }));
  });

  const buscando = term.trim().length >= 2;
  const m = source ? musclesOf(source) : null;

  return (
    <>
      <header className="m-step-head">
        <button
          type="button"
          className="m-icon-btn m-press"
          aria-label="Volver sin cambiar"
          onClick={onClose}
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <Dialog.Title asChild>
          <span style={{ fontSize: 17, fontWeight: 800 }}>{title}</span>
        </Dialog.Title>
      </header>
      <div className="m-body">
        {source && m && (
          <section className="m-card m-replace-current">
            <span className="m-eyebrow">Actual</span>
            <span className="m-card-title">{source.name}</span>
            <MuscleLine
              primary={m.primary}
              secondary={m.secondary}
              equipment={source.equipment}
            />
          </section>
        )}

        <label className="m-search">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Buscar en la biblioteca</span>
          <input
            type="search"
            placeholder="Buscar cualquier ejercicio"
            value={term}
            onChange={(ev) => setTerm(ev.target.value)}
          />
        </label>

        {buscando ? (
          <OptionList
            label="Resultados"
            options={results}
            onPick={onPick}
            empty={`Sin resultados para «${term.trim()}».`}
          />
        ) : (
          <>
            {suggestions && suggestions.length > 0 && (
              <OptionList
                label="Sugerencias de la IA"
                options={suggestions.map((e) => ({ exercise: e }))}
                onPick={onPick}
              />
            )}
            {source && (
              <OptionList
                label="Alternativas"
                options={alternatives ?? []}
                onPick={onPick}
                loading={alternatives === null}
                empty="No encontramos alternativas parecidas. Búscalo arriba."
              />
            )}
          </>
        )}
      </div>
    </>
  );
}

function toOption(m: SubstituteMatch): Option {
  return { exercise: m.exercise, similarity: m.similarity };
}

function MuscleLine({
  primary,
  secondary,
  equipment,
}: {
  primary: string | null;
  secondary: string[];
  equipment: string | null;
}) {
  return (
    <span className="m-replace-muscles">
      {primary && <strong>{primary}</strong>}
      {secondary.length > 0 && <span>{secondary.join(", ")}</span>}
      {equipment && <span className="m-chip">{capital(equipment)}</span>}
    </span>
  );
}

function OptionList({
  label,
  options,
  onPick,
  loading,
  empty,
}: {
  label: string;
  options: Option[];
  onPick: (pick: CatalogPick) => void;
  loading?: boolean;
  empty?: string;
}) {
  return (
    <section className="m-stack" aria-label={label}>
      <h2 className="m-section">{label}</h2>
      {loading ? (
        <p className="m-sub" role="status">
          Buscando alternativas parecidas…
        </p>
      ) : options.length === 0 ? (
        empty && <p className="m-sub">{empty}</p>
      ) : (
        options.map((o) => {
          const m = musclesOf(o.exercise);
          return (
            <button
              key={o.exercise.id}
              type="button"
              className="m-option m-press"
              onClick={() => onPick(o.exercise)}
            >
              <span className="m-option-icon" aria-hidden="true">
                <Dumbbell size={18} strokeWidth={2} />
              </span>
              <span className="m-list-row-main">
                <span className="m-list-row-title">{o.exercise.name}</span>
                <MuscleLine
                  primary={m.primary}
                  secondary={m.secondary}
                  equipment={o.exercise.equipment}
                />
              </span>
              {o.similarity !== undefined && (
                <span className="m-option-score">
                  <span className="m-num">{o.similarity}%</span>
                  <small>similitud</small>
                </span>
              )}
            </button>
          );
        })
      )}
    </section>
  );
}
