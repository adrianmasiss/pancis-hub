"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, FileUp, Search } from "lucide-react";
import { toast } from "sonner";
import {
  extractRoutinePdf,
  extractRoutineWithAi,
  importRoutine,
  previewRoutineImport,
  type ImportExercisePreview,
  type ImportPreview,
} from "@/features/training/import-actions";
import { searchExercises } from "@/features/training/actions";
import { Sheet } from "@/mobile/ui/sheet";
import { Stepper } from "@/mobile/ui/controls";
import { useSearch } from "@/mobile/ui/use-search";

type Row = ImportExercisePreview & { omit?: boolean };
type Day = { name: string; note: string | null; exercises: Row[] };

/** Igual que el servidor: sin series, o sin reps y sin «al fallo». */
const incompleto = (e: Row) =>
  !e.sets || (!e.repsMin && !/fallo|seg|min|tiempo|amrap/i.test(e.notes ?? ""));
const dudosa = (e: Row) => !e.omit && (!e.matchedId || incompleto(e));

const reps = (e: Row) =>
  e.repsMin === null
    ? "—"
    : e.repsMax && e.repsMax !== e.repsMin
      ? `${e.repsMin}–${e.repsMax}`
      : String(e.repsMin);

/**
 * Importar rutina del coach. Paso 1: el PDF, la foto (con IA) o el texto.
 * Paso 2: lo que se entendio, por dia; las filas dudosas van en amarillo y
 * hay que corregirlas (u omitirlas) antes de que se habilite «Guardar».
 */
export function ImportRoutine({ aiEnabled }: { aiEnabled: boolean }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [days, setDays] = useState<Day[]>([]);
  const [fixing, setFixing] = useState<[number, number] | null>(null);
  const [pending, startTransition] = useTransition();

  const show = (result: ImportPreview) => {
    setPreview(result);
    setDays(result.days);
  };

  const readFile = (f: File) =>
    startTransition(async () => {
      setFile(f.name);
      if (!name)
        setName(
          f.name
            .replace(/\.[a-z0-9]+$/i, "")
            .replace(/[_-]+/g, " ")
            .trim(),
        );
      const form = new FormData();
      form.append("file", f);
      if (aiEnabled) {
        // Si la IA falla con un PDF, el servidor lee su texto sin ella.
        form.append("respaldo", "texto");
        const result = await extractRoutineWithAi(form);
        if ("error" in result) toast.error(result.error);
        else {
          if (result.readBy === "texto")
            toast.info(
              "La IA no respondió, así que se leyó el texto del PDF. Revisa las filas marcadas.",
            );
          show(result);
        }
        return;
      }
      const result = await extractRoutinePdf(form);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setText(result.text);
      const parsed = await previewRoutineImport({ text: result.text });
      if ("error" in parsed) toast.error(parsed.error);
      else show(parsed);
    });

  const analyze = () =>
    startTransition(async () => {
      const result = await previewRoutineImport({ text });
      if ("error" in result) toast.error(result.error);
      else {
        if (!name) setName("Rutina del coach");
        show(result);
      }
    });

  const edit = (d: number, i: number, patch: Partial<Row>) =>
    setDays((all) =>
      all.map((day, di) =>
        di !== d
          ? day
          : {
              ...day,
              exercises: day.exercises.map((e, ei) =>
                ei === i ? { ...e, ...patch } : e,
              ),
            },
      ),
    );

  const rows = days.flatMap((d) => d.exercises);
  const pendientes = rows.filter(dudosa).length;

  const save = () =>
    startTransition(async () => {
      const result = await importRoutine({
        name: name.trim() || "Rutina del coach",
        notes: preview?.notes ?? [],
        days: days.map((day) => ({
          name: day.name.trim() || "Día",
          note: day.note,
          exercises: day.exercises
            .filter((e) => !e.omit)
            .map((e) => ({ ...e, omit: undefined })),
        })),
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success("Rutina importada.");
      router.push("/entrenamiento?vista=rutinas");
    });

  const fixRow = fixing ? days[fixing[0]]?.exercises[fixing[1]] : null;

  return (
    <div className="m-screen" data-m-fullscreen="" style={{ paddingBottom: 0 }}>
      <div className="m-step-head">
        {preview ? (
          <button
            type="button"
            aria-label="Volver"
            className="m-icon-btn m-press"
            onClick={() => setPreview(null)}
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </button>
        ) : (
          <Link
            href="/entrenamiento?vista=rutinas"
            aria-label="Volver"
            className="m-icon-btn m-press"
          >
            <ChevronLeft size={20} aria-hidden="true" />
          </Link>
        )}
        <div>
          <div className="m-sub">
            {preview ? "Paso 2 de 2 · Revisa" : "Paso 1 de 2"}
          </div>
          <h1 className="m-title" style={{ fontSize: 26 }}>
            Importar rutina
          </h1>
        </div>
      </div>

      {!preview ? (
        <div className="m-body m-stagger">
          <input
            ref={fileRef}
            type="file"
            hidden
            accept={aiEnabled ? "application/pdf,image/*" : "application/pdf"}
            onChange={(ev) => {
              const f = ev.target.files?.[0];
              if (f) readFile(f);
              ev.target.value = "";
            }}
          />
          <button
            type="button"
            className="m-card m-press"
            data-glow=""
            style={{ alignItems: "center", textAlign: "center", padding: 24 }}
            disabled={pending}
            onClick={() => fileRef.current?.click()}
          >
            <FileUp size={32} className="m-accent-text" aria-hidden="true" />
            <span className="m-card-title">
              {pending
                ? "Leyendo…"
                : aiEnabled
                  ? "Sube el PDF o una foto"
                  : "Sube el PDF"}
            </span>
            <span className="m-sub">
              {aiEnabled
                ? "La IA lee ejercicios, series, reps y RIR. Revisas todo antes de guardar."
                : "Se lee el texto del PDF. Revisas todo antes de guardar."}
            </span>
          </button>
          <label className="m-field">
            <span>O pega el texto de la rutina</span>
            <textarea
              className="m-input"
              value={text}
              onChange={(ev) => setText(ev.target.value)}
              placeholder={"Día 1 · Pierna\nSentadilla 4x6 RIR 2\n…"}
            />
          </label>
          <button
            type="button"
            className="m-btn m-press"
            data-block=""
            disabled={pending || text.trim().length < 3}
            onClick={analyze}
          >
            Analizar texto
          </button>
        </div>
      ) : (
        <div className="m-body m-stagger">
          <div className="m-file-chip">
            <span className="m-file-badge" aria-hidden="true">
              {file?.toLowerCase().endsWith(".pdf")
                ? "PDF"
                : file
                  ? "IMG"
                  : "TXT"}
            </span>
            <span className="m-list-row-main">
              <span className="m-list-row-title">{file ?? "Texto pegado"}</span>
              <span className="m-list-row-sub">
                {aiEnabled && file && preview?.readBy !== "texto"
                  ? "Leída por IA · "
                  : ""}
                {preview.dayCount} días · {preview.exerciseCount} ejercicios
              </span>
            </span>
            <Check
              size={20}
              strokeWidth={2.5}
              className="m-accent-text"
              aria-hidden="true"
            />
          </div>

          <label className="m-field">
            <span>Nombre</span>
            <input
              className="m-input"
              value={name}
              onChange={(ev) => setName(ev.target.value)}
              maxLength={80}
            />
          </label>

          {pendientes > 0 && (
            <div className="m-notice" data-tone="warn" role="status">
              {pendientes === 1
                ? "1 dato no se leyó bien. Toca la fila marcada para corregirlo antes de guardar."
                : `${pendientes} datos no se leyeron bien. Toca las filas marcadas para corregirlos antes de guardar.`}
            </div>
          )}

          {days.map((day, d) => (
            <section key={d} className="m-card" aria-label={day.name}>
              <div
                className="m-row"
                style={{ justifyContent: "space-between" }}
              >
                <h2 className="m-section">
                  Día {d + 1} · {day.name}
                </h2>
                <span className="m-sub">
                  {day.exercises.filter((e) => !e.omit).length} ejercicios
                </span>
              </div>
              <div>
                <div
                  className="m-review-grid m-eyebrow"
                  style={{ paddingBottom: 4 }}
                >
                  <span>Ejercicio</span>
                  <span style={{ textAlign: "center" }}>Series</span>
                  <span style={{ textAlign: "center" }}>RIR</span>
                </div>
                {day.exercises.map((e, i) => {
                  const doubt = dudosa(e);
                  return (
                    <button
                      key={i}
                      type="button"
                      className="m-review-grid m-review-row"
                      data-doubt={doubt ? "" : undefined}
                      style={
                        e.omit
                          ? { opacity: 0.45, textDecoration: "line-through" }
                          : undefined
                      }
                      aria-label={`${e.matchedName ?? e.rawName}${doubt ? ": revisar" : ""}. Editar`}
                      onClick={() => setFixing([d, i])}
                    >
                      <span
                        className={!e.matchedId ? "m-review-bad" : undefined}
                      >
                        {e.matchedName ?? e.rawName}
                        {!e.matchedId && !e.omit ? " · ¿cuál?" : ""}
                      </span>
                      <span className={!e.sets ? "m-review-bad" : undefined}>
                        {e.sets ?? "¿?"} × {reps(e)}
                      </span>
                      <span>{e.rir ?? "—"}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {preview && (
        <div className="m-step-foot">
          <button
            type="button"
            className="m-btn m-press"
            data-variant="primary"
            disabled={
              pending ||
              pendientes > 0 ||
              !rows.some((e) => !e.omit && e.matchedId)
            }
            onClick={save}
          >
            {pending ? "Guardando…" : "Guardar rutina"}
          </button>
        </div>
      )}

      <FixSheet
        row={fixRow ?? null}
        onClose={() => setFixing(null)}
        onChange={(patch) => fixing && edit(fixing[0], fixing[1], patch)}
      />
    </div>
  );
}

function FixSheet({
  row,
  onClose,
  onChange,
}: {
  row: Row | null;
  onClose: () => void;
  onChange: (patch: Partial<Row>) => void;
}) {
  const [term, setTerm] = useState("");
  const results = useSearch(term, async (q) => {
    const r = await searchExercises({ term: q });
    return "error" in r ? null : r.results.slice(0, 6);
  });

  return (
    <Sheet
      open={row !== null}
      onOpenChange={(o) => {
        if (!o) {
          setTerm("");
          onClose();
        }
      }}
      title={row?.rawName ?? ""}
      description={
        row?.matchedName
          ? `En el catálogo: ${row.matchedName}`
          : "No encontramos este ejercicio en el catálogo."
      }
    >
      {row && (
        <>
          <label className="m-search">
            <Search size={18} aria-hidden="true" />
            <span className="sr-only">Buscar en el catálogo</span>
            <input
              type="search"
              placeholder={
                row.matchedId ? "Cambiar ejercicio" : "Buscar en el catálogo"
              }
              value={term}
              onChange={(ev) => setTerm(ev.target.value)}
            />
          </label>
          {results.length > 0 && (
            <div className="m-stack">
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="m-list-row m-press"
                  onClick={() => {
                    onChange({
                      matchedId: r.id,
                      matchedName: r.name,
                      omit: false,
                    });
                    setTerm("");
                  }}
                >
                  <span className="m-list-row-title">{r.name}</span>
                </button>
              ))}
            </div>
          )}
          <div className="m-row" style={{ justifyContent: "space-between" }}>
            <span className="m-section" style={{ fontSize: 15 }}>
              Series
            </span>
            <Stepper
              label="Series"
              value={row.sets ?? 0}
              min={0}
              max={20}
              onChange={(v) => onChange({ sets: v || null })}
            />
          </div>
          <div className="m-row" style={{ justifyContent: "space-between" }}>
            <span className="m-section" style={{ fontSize: 15 }}>
              Reps
            </span>
            <Stepper
              label="Repeticiones"
              value={row.repsMin ?? 0}
              min={0}
              max={100}
              onChange={(v) =>
                onChange({
                  repsMin: v || null,
                  repsMax:
                    row.repsMax && row.repsMax > v ? row.repsMax : v || null,
                })
              }
            />
          </div>
          <div className="m-row" style={{ justifyContent: "space-between" }}>
            <span className="m-section" style={{ fontSize: 15 }}>
              RIR
            </span>
            <Stepper
              label="RIR"
              value={row.rir ?? 0}
              min={0}
              max={10}
              onChange={(v) => onChange({ rir: v })}
            />
          </div>
          <button
            type="button"
            className="m-btn m-press"
            data-variant="primary"
            data-block=""
            onClick={onClose}
          >
            Listo
          </button>
          <button
            type="button"
            className="m-btn"
            data-variant="ghost"
            data-block=""
            onClick={() => {
              onChange({ omit: !row.omit });
              onClose();
            }}
          >
            {row.omit ? "Volver a incluirlo" : "Omitir este ejercicio"}
          </button>
        </>
      )}
    </Sheet>
  );
}
