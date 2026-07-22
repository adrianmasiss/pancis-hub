"use client";

import { toast } from "sonner";
import {
  VersionsCard,
  type VersionCardItem,
} from "@/components/shared/versions-card";
import {
  restorePlanVersion,
  savePlanVersion,
  type PlanVersionList,
} from "@/features/training/version-actions";
import { messages } from "@/i18n/es-419";

const t = messages.training.versions;

/** Redacta en lenguaje llano lo que cambio desde la ultima version. */
function pendingLines(changes: PlanVersionList["pendingChanges"]): string[] {
  if (!changes) return [];
  return [
    ...changes.addedDays.map((day) => t.pendingDayAdded.replace("{day}", day)),
    ...changes.removedDays.map((day) =>
      t.pendingDayRemoved.replace("{day}", day),
    ),
    ...changes.changedExercises.map((change) =>
      t.pendingChanged
        .replace("{exercise}", change.exerciseName)
        .replace("{day}", change.dayName)
        .replace("{field}", change.field)
        .replace("{from}", change.from)
        .replace("{to}", change.to),
    ),
    ...changes.addedExercises.map((exercise) =>
      t.pendingAdded
        .replace("{exercise}", exercise.exerciseName)
        .replace("{day}", exercise.dayName),
    ),
    ...changes.removedExercises.map((exercise) =>
      t.pendingRemoved
        .replace("{exercise}", exercise.exerciseName)
        .replace("{day}", exercise.dayName),
    ),
  ];
}

export function PlanVersionsSection({
  planId,
  initial,
}: {
  planId: string;
  initial: PlanVersionList;
}) {
  const items: VersionCardItem[] = initial.versions.map((version) => ({
    id: version.id,
    version: version.version,
    createdAt: version.createdAt,
    reason: version.reason,
    summary: t.summary
      .replace("{days}", String(version.dayCount))
      .replace("{exercises}", String(version.exerciseCount))
      .replace("{sets}", String(version.totalSets)),
  }));

  const delta = initial.pendingChanges?.setsDelta ?? 0;

  return (
    <VersionsCard
      labels={t}
      versions={items}
      pendingLines={pendingLines(initial.pendingChanges)}
      deltaText={
        delta
          ? t.setsDelta.replace(
              "{delta}",
              delta > 0 ? `+${delta}` : String(delta),
            )
          : null
      }
      onSave={async (reason) => {
        const result = await savePlanVersion({ planId, reason });
        if ("error" in result) return { error: result.error };
        toast.success(t.saved.replace("{version}", String(result.version)));
        return { version: result.version };
      }}
      onRestore={async (versionId) => {
        const result = await restorePlanVersion({ versionId });
        if ("error" in result) return { error: result.error };
        toast.success(t.restored.replace("{version}", String(result.version)));
        return {};
      }}
    />
  );
}
