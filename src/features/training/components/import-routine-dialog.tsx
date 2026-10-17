"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileInput, FileUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  extractRoutinePdf,
  importRoutine,
  previewRoutineImport,
  type ImportPreview,
} from "@/features/training/import-actions";
import { ExercisePicker } from "@/features/training/components/exercise-picker";
import { messages } from "@/i18n/es-419";

const t = messages.training.import;

/**
 * Importacion de rutinas escritas (docs/02_PRODUCT_REQUIREMENTS.md 9).
 *
 * Siempre muestra lo que entendio ANTES de guardar: importar a ciegas una
 * rutina mal interpretada seria peor que no importarla. Los ejercicios sin
 * equivalente en el catalogo se listan como omitidos en vez de inventarlos.
 */
export function ImportRoutineDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  /* Correcciones a mano sobre lo que emparejó la app: «día-ejercicio» → el
     ejercicio del catálogo elegido. Se mandan al guardar. */
  const [overrides, setOverrides] = useState<
    Record<string, { id: string; name: string }>
  >({});
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const readPdf = (file: File) => {
    startTransition(async () => {
      const form = new FormData();
      form.append("file", file);
      const result = await extractRoutinePdf(form);
      if ("error" in result) {
        toast.error(result.error);
        return;
      }
      setText(result.text);
      setPreview(null);
      setOverrides({});
      if (!name.trim())
        setName(
          file.name
            .replace(/(\.pdf)+$/i, "")
            .replace(/%20/g, " ")
            .trim(),
        );
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
      setPreview(result);
      setOverrides({});
      if (!name.trim()) setName(t.trigger);
    });
  };

  const save = () => {
    startTransition(async () => {
      const result = await importRoutine({
        name,
        text,
        overrides: Object.fromEntries(
          Object.entries(overrides).map(([key, value]) => [key, value.id]),
        ),
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

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
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
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) readPdf(file);
              event.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={pending}
            onClick={() => fileRef.current?.click()}
          >
            <FileUp className="size-4" aria-hidden="true" />
            {pending ? t.readingPdf : t.uploadPdf}
          </Button>
          <div className="space-y-1">
            <Label htmlFor="routine-text">{t.textLabel}</Label>
            <Textarea
              id="routine-text"
              rows={8}
              maxLength={20000}
              value={text}
              placeholder={t.placeholder}
              onChange={(event) => {
                setText(event.target.value);
                setPreview(null);
                setOverrides({});
              }}
            />
            <p className="text-muted-foreground text-xs">{t.noAiNotice}</p>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={pending || text.trim().length < 3}
            onClick={analyze}
          >
            {pending ? messages.common.loading : t.analyze}
          </Button>

          {preview ? (
            <section className="space-y-3 rounded-xl border p-3">
              <div>
                <h3 className="text-sm font-medium">{t.previewTitle}</h3>
                <p className="text-muted-foreground text-xs tabular-nums">
                  {t.summary
                    .replace("{days}", String(preview.dayCount))
                    .replace("{exercises}", String(preview.exerciseCount))}
                </p>
              </div>

              {preview.unmatchedCount -
                Object.keys(overrides).filter((key) => {
                  const [d, e] = key.split("-").map(Number);
                  return !preview.days[d!]?.exercises[e!]?.matchedId;
                }).length >
              0 ? (
                <p className="text-caution text-xs">
                  {t.unmatched.replace(
                    "{count}",
                    String(preview.unmatchedCount),
                  )}
                </p>
              ) : null}

              {preview.notes.length > 0 ? (
                <details className="text-muted-foreground text-xs">
                  <summary className="cursor-pointer">{t.generalNotes}</summary>
                  <ul className="mt-1 list-disc pl-4">
                    {preview.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </details>
              ) : null}

              <ul className="space-y-3">
                {preview.days.map((day, d) => (
                  <li key={`${day.name}-${d}`} className="space-y-1">
                    <p className="text-sm font-medium">{day.name}</p>
                    {day.note ? (
                      <p className="text-muted-foreground text-xs italic">
                        {t.dayNote}: {day.note}
                      </p>
                    ) : null}
                    <ul className="space-y-1.5">
                      {day.exercises.map((exercise, e) => {
                        const key = `${d}-${e}`;
                        const chosen = overrides[key];
                        const matchedName =
                          chosen?.name ?? exercise.matchedName;
                        return (
                          <li
                            key={key}
                            className="bg-muted/50 flex items-start gap-2 rounded-xl px-3 py-2 text-xs"
                          >
                            <span className="min-w-0 flex-1 space-y-0.5">
                              <span className="block text-sm font-medium">
                                {matchedName ?? exercise.rawName}
                                {!matchedName ? (
                                  <span className="text-destructive font-normal">
                                    {" "}
                                    ({t.notInCatalog})
                                  </span>
                                ) : null}
                              </span>
                              <span className="text-muted-foreground block tabular-nums">
                                {matchedName && matchedName !== exercise.rawName
                                  ? `${t.written}: «${exercise.rawName}» · `
                                  : ""}
                                {exercise.sets && exercise.repsMin
                                  ? `${exercise.sets}×${exercise.repsMin}${
                                      exercise.repsMax &&
                                      exercise.repsMax !== exercise.repsMin
                                        ? `–${exercise.repsMax}`
                                        : ""
                                    }`
                                  : exercise.sets
                                    ? `${exercise.sets} series`
                                    : "al fallo"}
                                {exercise.restSeconds
                                  ? ` · desc. ${exercise.restSeconds} s`
                                  : ""}
                              </span>
                              {exercise.notes ? (
                                <span className="text-muted-foreground block">
                                  {exercise.notes}
                                </span>
                              ) : null}
                            </span>
                            <ExercisePicker
                              triggerLabel={matchedName ? t.change : t.choose}
                              onSelect={(picked) =>
                                setOverrides((prev) => ({
                                  ...prev,
                                  [key]: { id: picked.id, name: picked.name },
                                }))
                              }
                            />
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>

              {preview.ignoredLines.length > 0 ? (
                <details className="text-muted-foreground text-xs">
                  <summary className="cursor-pointer">{t.ignored}</summary>
                  <ul className="mt-1 list-disc pl-4">
                    {preview.ignoredLines.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </details>
              ) : null}

              <div className="space-y-1">
                <Label htmlFor="routine-name">{t.nameLabel}</Label>
                <Input
                  id="routine-name"
                  value={name}
                  maxLength={80}
                  onChange={(event) => setName(event.target.value)}
                />
              </div>

              <Button
                type="button"
                className="w-full"
                disabled={pending || !name.trim()}
                onClick={save}
              >
                {pending ? messages.common.loading : t.save}
              </Button>
            </section>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
