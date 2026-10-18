"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, FileInput, TriangleAlert } from "lucide-react";
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
import { DropZone, FormGroup, MetricField } from "@/components/shared/form-kit";
import {
  extractRoutinePdf,
  extractRoutineWithAi,
  importRoutine,
  previewRoutineImport,
  type ImportExercisePreview,
  type ImportPreview,
} from "@/features/training/import-actions";
import { ExercisePicker } from "@/features/training/components/exercise-picker";
import { toOptionalNumber } from "@/lib/forms";
import { messages } from "@/i18n/es-419";
import "./import-routine.css";

const t = messages.training.import;

type Draft = ImportPreview["days"];

/** Igual que en el servidor: sin series, o sin reps y sin «al fallo». */
const incompleto = (e: ImportExercisePreview) =>
  !e.sets || (!e.repsMin && !/fallo|seg|min|tiempo|amrap/i.test(e.notes ?? ""));

/**
 * Importacion de rutinas del coach (docs/02_PRODUCT_REQUIREMENTS.md 9).
 *
 * Desde un PDF o una foto (con IA) o pegando el texto. Siempre muestra lo que
 * entendio ANTES de guardar, y todo se puede corregir ahi: nombres de dia,
 * series, repeticiones, RIR, descanso, notas y el ejercicio del catalogo.
 * Los ejercicios sin equivalente se omiten en vez de inventarlos.
 */
export function ImportRoutineDialog({ aiEnabled }: { aiEnabled: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [draft, setDraft] = useState<Draft>([]);
  const [pending, startTransition] = useTransition();

  const show = (result: ImportPreview) => {
    setPreview(result);
    setDraft(result.days);
  };

  const nameFrom = (file: File) =>
    file.name
      .replace(/\.(pdf|jpe?g|png|webp|heic|heif)$/i, "")
      .replace(/%20|[_-]+/g, " ")
      .trim();

  const readFile = (file: File) => {
    startTransition(async () => {
      const form = new FormData();
      form.append("file", file);
      if (aiEnabled) {
        const result = await extractRoutineWithAi(form);
        if ("error" in result) {
          toast.error(result.error);
          return;
        }
        show(result);
        if (!name.trim()) setName(nameFrom(file));
        return;
      }
      const result = await extractRoutinePdf(form);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setText(result.text);
      setPreview(null);
      if (!name.trim()) setName(nameFrom(file));
      toast.success(t.pdfLoaded);
    });
  };

  const analyze = () => {
    startTransition(async () => {
      const result = await previewRoutineImport({ text });
      if ("error" in result) {
        toast.error(result.error);
        setPreview(null);
        return;
      }
      show(result);
      if (!name.trim()) setName(t.defaultName);
    });
  };

  const editExercise = (
    d: number,
    e: number,
    patch: Partial<ImportExercisePreview>,
  ) =>
    setDraft((days) =>
      days.map((day, i) =>
        i !== d
          ? day
          : {
              ...day,
              exercises: day.exercises.map((ex, j) =>
                j === e ? { ...ex, ...patch } : ex,
              ),
            },
      ),
    );

  const exercises = draft.flatMap((day) => day.exercises);
  const sinCatalogo = exercises.filter((e) => !e.matchedId).length;
  const incompletos = exercises.filter(
    (e) => e.matchedId && incompleto(e),
  ).length;

  const save = () => {
    startTransition(async () => {
      const result = await importRoutine({
        name,
        notes: preview?.notes ?? [],
        days: draft.map((day) => ({
          name: day.name.trim() || "Día",
          note: day.note,
          exercises: day.exercises,
        })),
      });
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      toast.success(t.imported);
      setOpen(false);
      setText("");
      setPreview(null);
      router.push(`/entrenamiento/rutinas/${result.planId}`);
    });
  };

  const numberInput = (
    label: string,
    name: string,
    value: number | null,
    onChange: (v: number | null) => void,
    invalid = false,
    step = "1",
  ) => (
    <label className="ir-num" data-invalid={invalid || undefined}>
      <span aria-hidden="true">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        placeholder="—"
        aria-label={name}
        value={value ?? ""}
        aria-invalid={invalid || undefined}
        onChange={(event) =>
          onChange(toOptionalNumber(event.target.value) ?? null)
        }
      />
    </label>
  );

  const accept = aiEnabled
    ? "application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
    : "application/pdf";

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (pending) return;
        setOpen(next);
        if (!next) setPreview(null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileInput className="size-4" aria-hidden="true" />
          {t.trigger}
        </Button>
      </DialogTrigger>
      <DialogContent className="ir-dialog max-w-2xl">
        {preview === null ? (
          <>
            <DialogHeader>
              <DialogTitle>{t.title}</DialogTitle>
              <DialogDescription>{t.description}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3">
              {/* El camino principal: el archivo tal como lo mando el coach. */}
              <DropZone
                accept={accept}
                title={aiEnabled ? t.uploadFile : t.uploadPdf}
                hint={aiEnabled ? t.aiNotice : t.dropHintPdf}
                busy={pending}
                busyLabel={aiEnabled ? t.readingFile : t.readingPdf}
                onFile={readFile}
              />

              <p className="ir-or" aria-hidden="true">
                <span>{t.orPaste}</span>
              </p>

              <FormGroup title={t.textLabel} hint={t.noAiNotice}>
                <textarea
                  id="routine-text"
                  aria-label={t.textLabel}
                  className="pc-textarea ir-text"
                  rows={5}
                  maxLength={20000}
                  value={text}
                  placeholder={t.placeholder}
                  onChange={(event) => setText(event.target.value)}
                />
              </FormGroup>
            </div>

            <DialogFooter>
              <Button
                type="button"
                className="w-full"
                disabled={pending || text.trim().length < 3}
                onClick={analyze}
              >
                {pending ? messages.common.loading : t.analyze}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <button
                type="button"
                className="ir-back"
                onClick={() => setPreview(null)}
              >
                <ArrowLeft size={14} aria-hidden="true" />
                {t.back}
              </button>
              <DialogTitle>{t.previewTitle}</DialogTitle>
              <DialogDescription className="tabular-nums">
                {t.summary
                  .replace("{days}", String(draft.length))
                  .replace("{exercises}", String(exercises.length))}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3">
              {sinCatalogo > 0 || incompletos > 0 ? (
                <div className="ir-alerts" role="status">
                  {sinCatalogo > 0 ? (
                    <p>
                      <TriangleAlert size={14} aria-hidden="true" />
                      {t.unmatched.replace("{count}", String(sinCatalogo))}
                    </p>
                  ) : null}
                  {incompletos > 0 ? (
                    <p>
                      <TriangleAlert size={14} aria-hidden="true" />
                      {t.incomplete.replace("{count}", String(incompletos))}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <MetricField
                type="text"
                label={t.nameLabel}
                value={name}
                maxLength={80}
                placeholder={t.namePlaceholder}
                onChange={(event) => setName(event.target.value)}
                className="ir-name"
              />

              {draft.map((day, d) => {
                const issues = day.exercises.some(
                  (x) => !x.matchedId || incompleto(x),
                );
                return (
                  <FormGroup
                    key={d}
                    collapsible
                    defaultOpen={d === 0 || issues}
                    filled={day.exercises.length}
                    title={day.name.trim() || `Día ${d + 1}`}
                    hint={day.note ? `${t.dayNote}: ${day.note}` : undefined}
                  >
                    <label className="ir-dayname">
                      <span>{t.dayName}</span>
                      <input
                        aria-label={`Nombre del día ${d + 1}`}
                        value={day.name}
                        maxLength={80}
                        onChange={(event) =>
                          setDraft((days) =>
                            days.map((x, i) =>
                              i === d ? { ...x, name: event.target.value } : x,
                            ),
                          )
                        }
                      />
                    </label>
                    <ol className="ir-list">
                      {day.exercises.map((exercise, e) => {
                        const falta = Boolean(
                          exercise.matchedId && incompleto(exercise),
                        );
                        return (
                          <li
                            key={e}
                            className="ir-ex"
                            data-incomplete={falta || undefined}
                            data-unmatched={!exercise.matchedId || undefined}
                          >
                            <div className="ir-ex-head">
                              <span className="ir-ex-num" aria-hidden="true">
                                {String(e + 1).padStart(2, "0")}
                              </span>
                              <span className="ir-ex-name">
                                <strong>
                                  {exercise.matchedName ?? exercise.rawName}
                                </strong>
                                {!exercise.matchedName ? (
                                  <small className="ir-ex-miss">
                                    {t.notInCatalog}
                                  </small>
                                ) : exercise.matchedName !==
                                  exercise.rawName ? (
                                  <small>
                                    {t.written}: «{exercise.rawName}»
                                  </small>
                                ) : null}
                              </span>
                              <ExercisePicker
                                triggerVariant="swap"
                                triggerLabel={
                                  exercise.matchedName ? t.change : t.choose
                                }
                                onSelect={(picked) =>
                                  editExercise(d, e, {
                                    matchedId: picked.id,
                                    matchedName: picked.name,
                                  })
                                }
                              />
                            </div>
                            <div className="ir-nums">
                              {numberInput(
                                "Series",
                                "Series",
                                exercise.sets,
                                (v) => editExercise(d, e, { sets: v }),
                                falta && !exercise.sets,
                              )}
                              {numberInput(
                                "Reps mín.",
                                "Reps mín.",
                                exercise.repsMin,
                                (v) => editExercise(d, e, { repsMin: v }),
                                falta && Boolean(exercise.sets),
                              )}
                              {numberInput(
                                "Reps máx.",
                                "Reps máx.",
                                exercise.repsMax,
                                (v) => editExercise(d, e, { repsMax: v }),
                              )}
                              {numberInput(
                                "RIR",
                                "RIR",
                                exercise.rir,
                                (v) => editExercise(d, e, { rir: v }),
                                false,
                                "0.5",
                              )}
                              {numberInput(
                                "Desc. s",
                                "Desc. (s)",
                                exercise.restSeconds,
                                (v) => editExercise(d, e, { restSeconds: v }),
                              )}
                            </div>
                            <input
                              className="ir-notes"
                              aria-label={`Notas de ${exercise.rawName}`}
                              placeholder="Notas: superserie, al fallo, tempo…"
                              value={exercise.notes ?? ""}
                              maxLength={500}
                              onChange={(event) =>
                                editExercise(d, e, {
                                  notes: event.target.value || null,
                                })
                              }
                            />
                          </li>
                        );
                      })}
                    </ol>
                  </FormGroup>
                );
              })}

              {preview.notes.length > 0 ? (
                <FormGroup
                  collapsible
                  defaultOpen={false}
                  filled={preview.notes.length}
                  title={t.generalNotes}
                >
                  <ul className="ir-plain">
                    {preview.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </FormGroup>
              ) : null}

              {preview.ignoredLines.length > 0 ? (
                <FormGroup
                  collapsible
                  defaultOpen={false}
                  filled={preview.ignoredLines.length}
                  title={t.ignored}
                  hint={t.ignoredHint}
                >
                  <ul className="ir-plain ir-mono">
                    {preview.ignoredLines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </FormGroup>
              ) : null}
            </div>

            <DialogFooter>
              <Button
                type="button"
                className="w-full"
                disabled={pending || !name.trim() || incompletos > 0}
                onClick={save}
              >
                {pending ? messages.common.loading : t.save}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
