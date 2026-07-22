"use client";

import { toast } from "sonner";
import {
  VersionsCard,
  type VersionCardItem,
} from "@/components/shared/versions-card";
import {
  restoreDietVersion,
  saveDietVersion,
  type DietVersionList,
} from "@/features/nutrition/version-actions";
import { messages } from "@/i18n/es-419";

const t = messages.nutrition.versions;

/** Redacta en lenguaje llano lo que cambio desde la ultima version. */
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

export function DietVersionsSection({
  templateId,
  initial,
}: {
  templateId: string;
  initial: DietVersionList;
}) {
  const items: VersionCardItem[] = initial.versions.map((version) => ({
    id: version.id,
    version: version.version,
    createdAt: version.createdAt,
    reason: version.reason,
    summary: t.summary
      .replace("{meals}", String(version.mealCount))
      .replace("{items}", String(version.itemCount))
      .replace("{calories}", String(version.totalCalories)),
  }));

  const delta = initial.pendingChanges?.caloriesDelta ?? 0;

  return (
    <VersionsCard
      labels={t}
      versions={items}
      pendingLines={pendingLines(initial.pendingChanges)}
      deltaText={
        delta
          ? t.caloriesDelta.replace(
              "{delta}",
              delta > 0 ? `+${delta}` : String(delta),
            )
          : null
      }
      onSave={async (reason) => {
        const result = await saveDietVersion({ templateId, reason });
        if ("error" in result) return { error: result.error };
        toast.success(t.saved.replace("{version}", String(result.version)));
        return { version: result.version };
      }}
      onRestore={async (versionId) => {
        const result = await restoreDietVersion({ versionId });
        if ("error" in result) return { error: result.error };
        toast.success(t.restored.replace("{version}", String(result.version)));
        return {};
      }}
    />
  );
}
