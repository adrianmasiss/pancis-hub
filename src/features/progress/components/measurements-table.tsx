"use client";

import { useState, useTransition } from "react";
import { FileText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  deleteMeasurement,
  getAttachmentUrl,
} from "@/features/progress/actions";
import { MeasurementFormDialog } from "@/features/progress/components/measurement-form-dialog";
import type { MeasurementView } from "@/features/progress/queries";
import { messages } from "@/i18n/es-419";

const t = messages.progress;

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("es-419", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

function Cell({ value, unit }: { value: number | null; unit: string }) {
  return (
    <td className="px-2 py-2 text-right tabular-nums">
      {value !== null ? `${value}${unit}` : "—"}
    </td>
  );
}

export function MeasurementsTable({
  measurements,
}: {
  measurements: MeasurementView[];
}) {
  const [pendingDelete, setPendingDelete] = useState<MeasurementView | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  const openAttachment = (measurement: MeasurementView) => {
    startTransition(async () => {
      const result = await getAttachmentUrl({ measurementId: measurement.id });
      if ("error" in result) toast.error(result.error);
      else window.open(result.url, "_blank", "noopener,noreferrer");
    });
  };

  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full min-w-130 text-sm">
        <thead>
          <tr className="text-muted-foreground border-b text-left text-xs">
            <th scope="col" className="px-3 py-2 font-medium">
              {t.table.date}
            </th>
            <th scope="col" className="px-2 py-2 text-right font-medium">
              {t.table.weight}
            </th>
            <th scope="col" className="px-2 py-2 text-right font-medium">
              {t.table.fat}
            </th>
            <th scope="col" className="px-2 py-2 text-right font-medium">
              {t.table.muscle}
            </th>
            <th scope="col" className="px-2 py-2 text-right font-medium">
              {t.table.waist}
            </th>
            <th scope="col" className="px-2 py-2 font-medium">
              {t.table.source}
            </th>
            <th scope="col" className="px-2 py-2">
              <span className="sr-only">{messages.common.edit}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {measurements.map((measurement) => (
            <tr key={measurement.id} className="border-b last:border-0">
              <td className="px-3 py-2 whitespace-nowrap">
                {formatDate(measurement.measuredAt)}
              </td>
              <Cell value={measurement.weightKg} unit=" kg" />
              <Cell value={measurement.bodyFatPercentage} unit=" %" />
              <Cell value={measurement.skeletalMuscleKg} unit=" kg" />
              <Cell value={measurement.waistCm} unit=" cm" />
              <td className="text-muted-foreground px-2 py-2 text-xs">
                {t.sources[measurement.source]}
              </td>
              <td className="px-2 py-2">
                <div className="flex items-center justify-end">
                  {measurement.hasAttachment ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8"
                      disabled={pending}
                      aria-label={`${t.table.view} ${t.table.attachment} — ${measurement.measuredAt}`}
                      onClick={() => openAttachment(measurement)}
                    >
                      <FileText className="size-4" />
                    </Button>
                  ) : null}
                  <MeasurementFormDialog measurement={measurement} />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive size-8"
                    disabled={pending}
                    aria-label={`${t.deleteMeasurement} — ${measurement.measuredAt}`}
                    onClick={() => setPendingDelete(measurement)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.deleteMeasurement}</DialogTitle>
            <DialogDescription>{t.deleteMeasurementConfirm}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              {messages.common.cancel}
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => {
                const target = pendingDelete;
                setPendingDelete(null);
                if (!target) return;
                startTransition(async () => {
                  const result = await deleteMeasurement({
                    measurementId: target.id,
                  });
                  if ("error" in result) toast.error(result.error);
                  else toast.success(t.measurementDeleted);
                });
              }}
            >
              {messages.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
