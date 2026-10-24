"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Search } from "lucide-react";
import { toast } from "sonner";
import {
  searchSubstitutes,
  suggestSubstitutes,
  swapSessionExercise,
  undoSessionSwap,
  type SubstituteOption,
} from "@/features/training/session-swap-actions";
import type { PlanExerciseView } from "@/features/training/queries";
import { capital, musculo } from "@/features/training/components/training-ui";
import { Sheet } from "@/mobile/ui/sheet";
import { Segmented } from "@/mobile/ui/controls";
import { useSearch } from "@/mobile/ui/use-search";

/**
 * Cambiar solo hoy: dos o tres sugerencias (de la IA si hay cuota; si no,
 * del motor de parecido) con su % de similitud, y busqueda manual. La rutina
 * original no cambia.
 */
export function SwapSheet({
  exercise: e,
  open,
  onOpenChange,
}: {
  exercise: PlanExerciseView;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const originalId = e.daySwap?.exerciseId ?? e.exerciseId;
  const originalName = e.daySwap?.name ?? e.name;
  const [tab, setTab] = useState<"ia" | "buscar">("ia");
  const [suggestions, setSuggestions] = useState<SubstituteOption[] | null>(
    null,
  );
  const [byAi, setByAi] = useState(false);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<SubstituteOption | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || suggestions) return;
    let alive = true;
    void suggestSubstitutes({ exerciseId: originalId }).then((r) => {
      if (!alive) return;
      if ("error" in r) {
        setSuggestions([]);
        toast.error(r.error);
        return;
      }
      setSuggestions(r.suggestions);
      setByAi(r.byAi);
      setPicked((p) => p ?? r.suggestions[0] ?? null);
    });
    return () => {
      alive = false;
    };
  }, [open, suggestions, originalId]);

  const results = useSearch(tab === "buscar" ? query : "", async (q) => {
    const r = await searchSubstitutes({ exerciseId: originalId, query: q });
    return "error" in r ? null : r.results;
  });

  const list = tab === "ia" ? (suggestions ?? []) : results;

  const use = () =>
    picked &&
    startTransition(async () => {
      const result = await swapSessionExercise({
        planExerciseId: e.id,
        substituteId: picked.exercise.id,
        source: tab === "ia" ? "sugerencia" : "usuario",
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success(`Hoy: ${picked.exercise.name}. Tu rutina no cambia.`);
      onOpenChange(false);
      router.refresh();
    });

  const undo = () =>
    startTransition(async () => {
      const result = await undoSessionSwap({ planExerciseId: e.id });
      if (result.error) toast.error(result.error);
      else {
        onOpenChange(false);
        router.refresh();
      }
    });

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Cambiar solo por hoy"
      description={`Reemplaza ${originalName}. Tu rutina original no cambia.`}
    >
      <Segmented
        label="Origen de las opciones"
        value={tab}
        onChange={setTab}
        options={[
          { value: "ia", label: byAi ? "Sugerencias IA" : "Sugerencias" },
          { value: "buscar", label: "Buscar" },
        ]}
      />
      {tab === "buscar" && (
        <label className="m-search">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Buscar ejercicio</span>
          <input
            type="search"
            placeholder="Buscar ejercicio"
            value={query}
            autoFocus
            onChange={(ev) => setQuery(ev.target.value)}
          />
        </label>
      )}
      <div className="m-stack" role="radiogroup" aria-label="Opciones">
        {tab === "ia" && suggestions === null && (
          <p className="m-sub" role="status">
            Buscando opciones parecidas…
          </p>
        )}
        {list.map((o) => {
          const sel = picked?.exercise.id === o.exercise.id;
          return (
            <button
              key={o.exercise.id}
              type="button"
              role="radio"
              aria-checked={sel}
              className="m-option m-press"
              onClick={() => setPicked(o)}
            >
              <span className="m-option-icon" aria-hidden="true">
                <Dumbbell size={18} strokeWidth={2} />
              </span>
              <span className="m-list-row-main">
                <span className="m-list-row-title">{o.exercise.name}</span>
                <span className="m-list-row-sub">
                  {[
                    o.exercise.primaryMuscle,
                    ...o.exercise.secondaryMuscles.slice(0, 1),
                  ]
                    .filter(Boolean)
                    .map((m) => capital(musculo(m)))
                    .join(" · ")}
                </span>
                {sel && o.reason && (
                  <span className="m-option-reason">{o.reason}</span>
                )}
              </span>
              <span className="m-option-score">
                <span className="m-num">{o.similarity}%</span>
                <small>similitud</small>
              </span>
            </button>
          );
        })}
        {tab === "buscar" &&
          query.trim().length >= 2 &&
          results.length === 0 && (
            <p className="m-sub">Sin resultados para «{query.trim()}».</p>
          )}
      </div>
      {tab === "ia" && byAi && (
        <p className="m-sub">
          Sugerencias hechas por IA según los músculos que trabaja el ejercicio.
        </p>
      )}
      <button
        type="button"
        className="m-btn m-press"
        data-variant="primary"
        data-block=""
        disabled={!picked || pending}
        onClick={use}
      >
        {pending ? "Cambiando…" : "Usar este ejercicio"}
      </button>
      {e.daySwap ? (
        <button
          type="button"
          className="m-btn"
          data-variant="ghost"
          data-block=""
          disabled={pending}
          onClick={undo}
        >
          Volver a {e.daySwap.name}
        </button>
      ) : (
        <button
          type="button"
          className="m-btn"
          data-variant="ghost"
          data-block=""
          onClick={() => onOpenChange(false)}
        >
          Cancelar
        </button>
      )}
    </Sheet>
  );
}
