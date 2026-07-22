"use client";

import { useState, useTransition } from "react";
import { History, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { messages } from "@/i18n/es-419";

/** Una version ya resumida para mostrar; el dominio decide el texto. */
export type VersionCardItem = {
  id: string;
  version: number;
  createdAt: string;
  reason: string | null;
  summary: string;
};

/** Textos del dominio (dieta o rutina). */
export type VersionCardLabels = {
  title: string;
  description: string;
  save: string;
  restore: string;
  versionLabel: string;
  noVersions: string;
  pendingTitle: string;
  reason: string;
  reasonPlaceholder: string;
  restoreConfirm: string;
};

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("es-419", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

/**
 * Lista de versiones con guardado y restauracion
 * (docs/02_PRODUCT_REQUIREMENTS.md 22).
 *
 * Es comun a dietas y rutinas: cambian los textos y de donde salen los
 * datos, pero el comportamiento es el mismo. El dominio se encarga de
 * resumir cada version y de redactar los cambios pendientes.
 */
export function VersionsCard({
  labels,
  versions,
  pendingLines,
  deltaText,
  onSave,
  onRestore,
}: {
  labels: VersionCardLabels;
  versions: VersionCardItem[];
  pendingLines: string[];
  deltaText?: string | null;
  onSave: (reason: string) => Promise<{ error?: string; version?: number }>;
  onRestore: (versionId: string) => Promise<{ error?: string }>;
}) {
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState<VersionCardItem | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const result = await onSave(reason);
      if (result.error) toast.error(result.error);
      else setReason("");
    });
  };

  const restore = (versionId: string) => {
    startTransition(async () => {
      const result = await onRestore(versionId);
      if (result.error) toast.error(result.error);
      setConfirming(null);
    });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="size-4" aria-hidden="true" />
          {labels.title}
        </CardTitle>
        <p className="text-muted-foreground text-xs">{labels.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {pendingLines.length > 0 ? (
          <section className="space-y-1 rounded-xl border border-amber-500/40 bg-amber-500/5 p-3">
            <h3 className="text-sm font-medium">{labels.pendingTitle}</h3>
            <ul className="text-muted-foreground list-disc space-y-0.5 pl-4 text-xs">
              {pendingLines.slice(0, 8).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            {deltaText ? (
              <p className="text-muted-foreground text-xs tabular-nums">
                {deltaText}
              </p>
            ) : null}
          </section>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="version-reason">{labels.reason}</Label>
          <div className="flex gap-2">
            <Input
              id="version-reason"
              value={reason}
              maxLength={200}
              placeholder={labels.reasonPlaceholder}
              onChange={(event) => setReason(event.target.value)}
            />
            <Button type="button" disabled={pending} onClick={save}>
              <Save className="size-4" aria-hidden="true" />
              {labels.save}
            </Button>
          </div>
        </div>

        {versions.length === 0 ? (
          <p className="text-muted-foreground text-sm">{labels.noVersions}</p>
        ) : (
          <ul className="space-y-2">
            {versions.map((version) => (
              <li
                key={version.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {labels.versionLabel.replace(
                      "{version}",
                      String(version.version),
                    )}
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      · {formatDateTime(version.createdAt)}
                    </span>
                  </p>
                  <p className="text-muted-foreground text-xs tabular-nums">
                    {version.summary}
                  </p>
                  {version.reason ? (
                    <p className="text-muted-foreground text-xs italic">
                      {version.reason}
                    </p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setConfirming(version)}
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                  {labels.restore}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog
        open={confirming !== null}
        onOpenChange={(open) => !open && setConfirming(null)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {confirming
                ? labels.versionLabel.replace(
                    "{version}",
                    String(confirming.version),
                  )
                : ""}
            </DialogTitle>
            <DialogDescription>{labels.restoreConfirm}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirming(null)}>
              {messages.common.cancel}
            </Button>
            <Button
              disabled={pending}
              onClick={() => confirming && restore(confirming.id)}
            >
              {labels.restore}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
