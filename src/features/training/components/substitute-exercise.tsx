"use client";

import { useEffect, useState, useTransition } from "react";
import { ArrowLeftRight, Search, Sparkles, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  FocusCard,
  FocusCardContent,
  FocusCardDescription,
  FocusCardHeader,
  FocusCardTitle,
} from "@/components/ui/focus-card";
import {
  searchSubstitutes,
  suggestSubstitutes,
  swapSessionExercise,
  undoSessionSwap,
  type SubstituteOption,
} from "@/features/training/session-swap-actions";
import { rotuloCatalogo } from "@/features/training/lib/library-groups";
import type { PlanExerciseView } from "../queries";
import "./substitute-exercise.css";

const lista = (musculos: string[]) =>
  musculos.map((m) => rotuloCatalogo(m).toLowerCase()).join(", ");

/**
 * Sustituir un ejercicio sólo en esta sesión: dos o tres sugerencias arriba y
 * el buscador debajo, cada opción con su parecido al original. La rutina no
 * cambia; para cambiarla está el editor de Rutinas.
 */
export function SubstituteExercise({
  exercise: e,
  live,
}: {
  exercise: PlanExerciseView;
  /** true durante la sesión; antes de empezar, el cambio se anota para hoy. */
  live: boolean;
}) {
  const [open, setOpen] = useState(false);
  /* El original es el de la plantilla: si ya hay un cambio, se compara contra
     ese y no contra el sustituto. */
  const originalId = e.daySwap?.exerciseId ?? e.exerciseId;
  const originalName = e.daySwap?.name ?? e.name;
  const [pending, startTransition] = useTransition();

  const elegir = (option: SubstituteOption, source: "usuario" | "sugerencia") =>
    startTransition(async () => {
      const result = await swapSessionExercise({
        planExerciseId: e.id,
        substituteId: option.exercise.id,
        source,
      });
      if (result.error) toast.error(result.error);
      else {
        toast.success(
          live
            ? `En esta sesión: ${option.exercise.name}`
            : `Hoy: ${option.exercise.name}. Tu rutina no cambia.`,
        );
        setOpen(false);
      }
    });

  const deshacer = () =>
    startTransition(async () => {
      const result = await undoSessionSwap({ planExerciseId: e.id });
      if (result.error) toast.error(result.error);
      else setOpen(false);
    });

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        <ArrowLeftRight className="size-4" aria-hidden="true" />
        Sustituir
      </Button>
      <FocusCard open={open} onOpenChange={setOpen}>
        <FocusCardContent className="substitute-card">
          <FocusCardHeader>
            <FocusCardTitle>Sustituir {originalName}</FocusCardTitle>
            <FocusCardDescription>
              {live ? "Solo en esta sesión." : "Solo para hoy."} Tu rutina queda
              como está.
            </FocusCardDescription>
          </FocusCardHeader>
          {open && (
            <SubstituteBody
              exerciseId={originalId}
              current={e.daySwap ? e : null}
              pending={pending}
              onChoose={elegir}
              onUndo={deshacer}
            />
          )}
        </FocusCardContent>
      </FocusCard>
    </>
  );
}

function SubstituteBody({
  exerciseId,
  current,
  pending,
  onChoose,
  onUndo,
}: {
  exerciseId: string;
  current: PlanExerciseView | null;
  pending: boolean;
  onChoose: (o: SubstituteOption, source: "usuario" | "sugerencia") => void;
  onUndo: () => void;
}) {
  const [suggested, setSuggested] = useState<
    { list: SubstituteOption[]; byAi: boolean } | "error" | null
  >(null);
  const [query, setQuery] = useState("");
  /* Cada respuesta llega con el término que la pidió: lo que se muestra es
     siempre lo de lo que hay escrito ahora, nunca una búsqueda vieja. */
  const [found, setFound] = useState<{
    term: string;
    list: SubstituteOption[];
  } | null>(null);
  const term = query.trim();
  const results = term.length >= 2 && found?.term === term ? found.list : null;
  const searching = term.length >= 2 && results === null;

  useEffect(() => {
    let vivo = true;
    void suggestSubstitutes({ exerciseId }).then((r) => {
      if (!vivo) return;
      setSuggested(
        "error" in r ? "error" : { list: r.suggestions, byAi: r.byAi },
      );
    });
    return () => {
      vivo = false;
    };
  }, [exerciseId]);

  /* Se busca al dejar de escribir, no en cada letra. */
  useEffect(() => {
    if (term.length < 2) return;
    let vivo = true;
    const id = window.setTimeout(() => {
      void searchSubstitutes({ exerciseId, query: term }).then((r) => {
        if (vivo) setFound({ term, list: "error" in r ? [] : r.results });
      });
    }, 250);
    return () => {
      vivo = false;
      window.clearTimeout(id);
    };
  }, [term, exerciseId]);

  return (
    <div className="substitute-body">
      {current?.daySwap && (
        <div className="substitute-current" role="status">
          <p>
            Ahora haces <strong>{current.name}</strong> en lugar de{" "}
            {current.daySwap.name}.
          </p>
          <button type="button" onClick={onUndo} disabled={pending}>
            <Undo2 size={14} aria-hidden="true" />
            Volver al original
          </button>
        </div>
      )}

      <section aria-labelledby="substitute-suggested">
        <h3 id="substitute-suggested" className="substitute-heading">
          Sugerencias
          {suggested !== null && suggested !== "error" && suggested.byAi && (
            <span className="substitute-ai">
              <Sparkles size={12} aria-hidden="true" />
              IA
            </span>
          )}
        </h3>
        {suggested === null ? (
          <ul className="substitute-list" aria-busy="true">
            {[0, 1, 2].map((i) => (
              <li key={i} className="substitute-skeleton" />
            ))}
          </ul>
        ) : suggested === "error" ? (
          <p className="substitute-empty">
            No pudimos cargar sugerencias. Busca uno abajo.
          </p>
        ) : suggested.list.length === 0 ? (
          <p className="substitute-empty">
            No hay un ejercicio parecido en el catálogo. Busca uno abajo.
          </p>
        ) : (
          <ul className="substitute-list">
            {suggested.list.map((o) => (
              <Option
                key={o.exercise.id}
                option={o}
                disabled={pending}
                onChoose={() => onChoose(o, "sugerencia")}
              />
            ))}
          </ul>
        )}
      </section>

      <section aria-label="Buscar otro ejercicio">
        <label className="substitute-search">
          <Search size={16} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(ev) => setQuery(ev.target.value)}
            placeholder="Buscar otro ejercicio"
            aria-label="Buscar otro ejercicio"
            maxLength={80}
          />
        </label>
        {searching ? (
          <p className="substitute-empty">Buscando…</p>
        ) : results && results.length === 0 ? (
          <p className="substitute-empty">Sin resultados para «{term}».</p>
        ) : results ? (
          <ul className="substitute-list">
            {results.map((o) => (
              <Option
                key={o.exercise.id}
                option={o}
                disabled={pending}
                onChoose={() => onChoose(o, "usuario")}
              />
            ))}
          </ul>
        ) : null}
      </section>
    </div>
  );
}

function Option({
  option: o,
  disabled,
  onChoose,
}: {
  option: SubstituteOption;
  disabled: boolean;
  onChoose: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        className="substitute-option"
        disabled={disabled}
        onClick={onChoose}
      >
        <span className="substitute-option-head">
          <strong>{o.exercise.name}</strong>
          <span
            className="substitute-similarity"
            data-level={
              o.similarity >= 75
                ? "alta"
                : o.similarity >= 45
                  ? "media"
                  : "baja"
            }
            aria-label={`${o.similarity} % de similitud`}
          >
            {o.similarity}%
          </span>
        </span>
        {o.reason && <span className="substitute-reason">{o.reason}</span>}
        <span className="substitute-muscles">
          {o.shared.length > 0 && <span>Comparte {lista(o.shared)}</span>}
          {o.lost.length > 0 && (
            <span data-kind="lost">Deja fuera {lista(o.lost)}</span>
          )}
          {o.added.length > 0 && (
            <span data-kind="added">Suma {lista(o.added)}</span>
          )}
        </span>
      </button>
    </li>
  );
}
