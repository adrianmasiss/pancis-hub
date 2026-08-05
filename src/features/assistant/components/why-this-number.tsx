"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  explainNumbers,
  type NumberExplanation,
} from "@/features/assistant/explain-actions";
import { messages } from "@/i18n/es-419";

const t = messages.assistant;

/**
 * Enlace discreto que abre el origen de una o varias cifras del sistema.
 *
 * Se carga AL ABRIR, no al pintar la pantalla: son constantes que casi nadie
 * mira, y no tiene sentido pagar la consulta en cada render del panel.
 */
export function WhyThisNumber({
  keys,
  label = t.whereFrom,
}: {
  keys: string[];
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [explanations, setExplanations] = useState<NumberExplanation[] | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  const load = () => {
    setOpen(true);
    if (explanations) return;
    startTransition(async () => {
      const result = await explainNumbers(keys);
      if ("error" in result) {
        toast.error(result.error);
        setOpen(false);
        return;
      }
      setExplanations(result.explanations);
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={load}
        className="text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors duration-200"
      >
        {label}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.whereFromTitle}</DialogTitle>
            <DialogDescription>{t.whereFromDescription}</DialogDescription>
          </DialogHeader>

          {pending || !explanations ? (
            <p className="text-muted-foreground text-sm">{messages.common.loading}</p>
          ) : explanations.length === 0 ? (
            <p className="text-muted-foreground text-sm">{t.whereFromEmpty}</p>
          ) : (
            <div className="flex flex-col gap-6">
              {explanations.map((entry) => (
                <div key={entry.key} className="flex flex-col gap-1.5 text-sm">
                  <p className="font-medium">
                    {entry.label}: {entry.value}
                  </p>
                  <p className="text-muted-foreground">{entry.rationale}</p>
                  {entry.isProductParameter ? (
                    <p className="text-caution text-xs">{t.productParameter}</p>
                  ) : null}
                  {entry.limitations ? (
                    <p className="text-muted-foreground text-xs italic">
                      {entry.limitations}
                    </p>
                  ) : null}
                  {entry.sources.length > 0 ? (
                    <ul className="text-muted-foreground mt-1 space-y-1 border-l pl-3 text-xs">
                      {entry.sources.map((source) => (
                        <li key={source.title}>
                          {source.title}
                          {source.identifier ? ` · ${source.identifier}` : ""}
                          {source.evidenceGrade
                            ? ` · ${t.evidenceGrade} ${source.evidenceGrade}`
                            : ""}
                          {source.role ? (
                            <span
                              className={
                                source.role === "sustenta"
                                  ? undefined
                                  : "text-caution"
                              }
                            >
                              {" · "}
                              {t.sourceRoles[source.role] ?? source.role}
                            </span>
                          ) : null}
                          {source.note ? (
                            <span className="block">{source.note}</span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
