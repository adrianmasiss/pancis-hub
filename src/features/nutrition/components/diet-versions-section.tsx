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
import {
  restoreDietVersion,
  saveDietVersion,
  type DietVersionList,
} from "@/features/nutrition/version-actions";
import { messages } from "@/i18n/es-419";

const t = messages.nutrition.versions;

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("es-419", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

/** Lista legible de lo que cambio desde la ultima version guardada. */
function pendingLines(changes: DietVersionList["pendingChanges"]): string[] {
  if (!changes) return [];
  return [
    ...changes.addedMeals.map((meal) =>
      t.pendingMealAdded.replace("{meal}", meal),
    ),
    ...changes.removedMeals.map((meal) =>
      t.pendingMealRemoved.replace("{meal}", meal),
    ),
    ...changes.changedItems.map((item) =>
      t.pendingItemChanged
        .replace("{food}", item.foodName)
        .replace("{meal}", item.mealName)
        .replace("{from}", String(item.fromQuantityG))
        .replace("{to}", String(item.toQuantityG)),
    ),
    ...changes.addedItems.map((item) =>
      t.pendingItemAdded
        .replace("{food}", item.foodName)
        .replace("{meal}", item.mealName),
    ),
    ...changes.removedItems.map((item) =>
      t.pendingItemRemoved
        .replace("{food}", item.foodName)
        .replace("{meal}", item.mealName),
    ),
  ];
}

/**
 * Versiones de la dieta (docs/02_PRODUCT_REQUIREMENTS.md 22).
 *
 * Restaurar guarda primero una version del estado actual, asi que la
 * accion nunca destruye nada. El dialogo lo dice explicitamente.
 */
export function DietVersionsSection({
  templateId,
  initial,
}: {
  templateId: string;
  initial: DietVersionList;
}) {
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState<{
    id: string;
    version: number;
  } | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => {
    startTransition(async () => {
      const result = await saveDietVersion({ templateId, reason });
      if ("error" in result) toast.error(result.error);
      else {
        toast.success(t.saved.replace("{version}", String(result.version)));
        setReason("");
      }
    });
  };

  const restore = (versionId: string, version: number) => {
    startTransition(async () => {
      const result = await restoreDietVersion({ versionId });
      if ("error" in result) toast.error(result.error);
      else toast.success(t.restored.replace("{version}", String(version)));
      setConfirming(null);
    });
  };

  const changes = pendingLines(initial.pendingChanges);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="size-4" aria-hidden="true" />
          {t.title}
        </CardTitle>
        <p className="text-muted-foreground text-xs">{t.description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {changes.length > 0 ? (
          <section className="space-y-1 rounded-xl border border-amber-500/40 bg-amber-500/5 p-3">
            <h3 className="text-sm font-medium">{t.pendingTitle}</h3>
            <ul className="text-muted-foreground list-disc space-y-0.5 pl-4 text-xs">
              {changes.slice(0, 8).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            {initial.pendingChanges?.caloriesDelta ? (
              <p className="text-muted-foreground text-xs tabular-nums">
                {t.caloriesDelta.replace(
                  "{delta}",
                  initial.pendingChanges.caloriesDelta > 0
                    ? `+${initial.pendingChanges.caloriesDelta}`
                    : String(initial.pendingChanges.caloriesDelta),
                )}
              </p>
            ) : null}
          </section>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="version-reason">{t.reason}</Label>
          <div className="flex gap-2">
            <Input
              id="version-reason"
              value={reason}
              maxLength={200}
              placeholder={t.reasonPlaceholder}
              onChange={(event) => setReason(event.target.value)}
            />
            <Button type="button" disabled={pending} onClick={save}>
              <Save className="size-4" aria-hidden="true" />
              {t.save}
            </Button>
          </div>
        </div>

        {initial.versions.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t.noVersions}</p>
        ) : (
          <ul className="space-y-2">
            {initial.versions.map((version) => (
              <li
                key={version.id}
                className="flex flex-wrap items-center gap-2 rounded-xl border p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {t.versionLabel.replace("{version}", String(version.version))}
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      · {formatDateTime(version.createdAt)}
                    </span>
                  </p>
                  <p className="text-muted-foreground text-xs tabular-nums">
                    {t.summary
                      .replace("{meals}", String(version.mealCount))
                      .replace("{items}", String(version.itemCount))
                      .replace("{calories}", String(version.totalCalories))}
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
                  onClick={() =>
                    setConfirming({ id: version.id, version: version.version })
                  }
                >
                  <RotateCcw className="size-4" aria-hidden="true" />
                  {t.restore}
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
                ? t.versionLabel.replace("{version}", String(confirming.version))
                : ""}
            </DialogTitle>
            <DialogDescription>{t.restoreConfirm}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirming(null)}>
              {messages.common.cancel}
            </Button>
            <Button
              disabled={pending}
              onClick={() =>
                confirming && restore(confirming.id, confirming.version)
              }
            >
              {t.restore}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
