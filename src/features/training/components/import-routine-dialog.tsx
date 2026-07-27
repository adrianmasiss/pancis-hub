"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileInput } from "lucide-react";
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
  importRoutine,
  previewRoutineImport,
  type ImportPreview,
} from "@/features/training/import-actions";
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
  const [pending, startTransition] = useTransition();

  const analyze = () => {
    startTransition(async () => {
      const result = await previewRoutineImport({ text });
      if ("error" in result) {
        toast.error(result.error);
        setPreview(null);
        return;
      }
      setPreview(result);
      if (!name.trim()) setName(t.trigger);
    });
  };

  const save = () => {
    startTransition(async () => {
      const result = await importRoutine({ name, text });
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
          <div className="space-y-1">
            <Label htmlFor="routine-text">{t.textLabel}</Label>
            <Textarea
              id="routine-text"
              rows={8}
              maxLength={8000}
              value={text}
              placeholder={t.placeholder}
              onChange={(event) => {
                setText(event.target.value);
                setPreview(null);
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

              {preview.unmatchedCount > 0 ? (
                <p className="text-xs text-caution">
                  {t.unmatched.replace(
                    "{count}",
                    String(preview.unmatchedCount),
                  )}
                </p>
              ) : null}

              <ul className="space-y-2">
                {preview.days.map((day) => (
                  <li key={day.name}>
                    <p className="text-sm font-medium">{day.name}</p>
                    <ul className="text-muted-foreground space-y-0.5 text-xs">
                      {day.exercises.map((exercise, index) => (
                        <li key={`${exercise.rawName}-${index}`}>
                          {exercise.matchedName ?? exercise.rawName}
                          {exercise.sets
                            ? ` · ${exercise.sets}x${exercise.repsMin ?? "?"}${
                                exercise.repsMax &&
                                exercise.repsMax !== exercise.repsMin
                                  ? `-${exercise.repsMax}`
                                  : ""
                              }`
                            : ""}
                          {exercise.rir !== null ? ` · RIR ${exercise.rir}` : ""}
                          {exercise.restSeconds
                            ? ` · ${exercise.restSeconds}s`
                            : ""}
                          {!exercise.matchedId ? (
                            <span className="text-destructive">
                              {" "}
                              ({t.notInCatalog})
                            </span>
                          ) : null}
                        </li>
                      ))}
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
