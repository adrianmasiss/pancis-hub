"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/shared/form-field";
import { SelectField } from "@/components/shared/select-field";
import { saveMeasurement } from "@/features/progress/actions";
import type { MeasurementView } from "@/features/progress/queries";
import { MEASUREMENT_SOURCES } from "@/features/progress/schemas";
import { todayLocalISO } from "@/lib/dates";
import { messages } from "@/i18n/es-419";

const t = messages.progress;
const optional = ` (${messages.common.optional.toLowerCase()})`;

export function MeasurementFormDialog({
  measurement,
}: {
  measurement?: MeasurementView;
}) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState(measurement?.source ?? "manual");
  const [pending, startTransition] = useTransition();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (measurement) formData.set("measurementId", measurement.id);
    startTransition(async () => {
      const result = await saveMeasurement(formData);
      if ("error" in result) toast.error(result.error);
      else {
        toast.success(t.measurementSaved);
        setOpen(false);
      }
    });
  };

  const numberInput = (
    name: string,
    label: string,
    defaultValue: number | null | undefined,
    step = "0.1",
  ) => (
    <FormField
      label={label}
      name={name}
      type="number"
      inputMode="decimal"
      step={step}
      defaultValue={defaultValue ?? ""}
    />
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {measurement ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={`${t.editMeasurement} — ${measurement.measuredAt}`}
          >
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="size-4" aria-hidden="true" />
            {t.addMeasurement}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {measurement ? t.editMeasurement : t.addMeasurement}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label={t.fields.measuredAt}
              name="measuredAt"
              type="date"
              required
              defaultValue={measurement?.measuredAt ?? todayLocalISO()}
            />
            <SelectField
              label={t.fields.source}
              name="source"
              options={MEASUREMENT_SOURCES.map((value) => ({
                value,
                label: t.sources[value],
              }))}
              value={source}
              onChange={(event) =>
                setSource(event.target.value as typeof source)
              }
            />
          </div>

          {source === "inbody" ? (
            <p className="bg-muted text-muted-foreground rounded-lg p-3 text-xs text-balance">
              {t.inbodyNotice}
            </p>
          ) : null}

          <div className="grid grid-cols-2 gap-3">
            {numberInput("weightKg", t.fields.weightKg, measurement?.weightKg)}
            {numberInput(
              "bodyFatPercentage",
              `${t.fields.bodyFat}${optional}`,
              measurement?.bodyFatPercentage,
            )}
            {numberInput(
              "skeletalMuscleKg",
              `${t.fields.skeletalMuscle}${optional}`,
              measurement?.skeletalMuscleKg,
            )}
            {numberInput(
              "waistCm",
              `${t.fields.waist}${optional}`,
              measurement?.waistCm,
            )}
            {numberInput(
              "hipCm",
              `${t.fields.hip}${optional}`,
              measurement?.hipCm,
            )}
            {numberInput(
              "chestCm",
              `${t.fields.chest}${optional}`,
              measurement?.chestCm,
            )}
            {numberInput(
              "armCm",
              `${t.fields.arm}${optional}`,
              measurement?.armCm,
            )}
            {numberInput(
              "thighCm",
              `${t.fields.thigh}${optional}`,
              measurement?.thighCm,
            )}
            {numberInput(
              "visceralFatLevel",
              `${t.fields.visceralFat}${optional}`,
              measurement?.visceralFatLevel,
            )}
            {numberInput(
              "bodyWaterPercentage",
              `${t.fields.bodyWater}${optional}`,
              measurement?.bodyWaterPercentage,
            )}
          </div>

          <FormField
            label={`${t.fields.notes}${optional}`}
            name="notes"
            maxLength={300}
            defaultValue={measurement?.notes ?? ""}
          />

          <div className="space-y-2">
            <Label htmlFor="inbody-attachment">{t.fields.attachment}</Label>
            <Input
              id="inbody-attachment"
              name="attachment"
              type="file"
              accept="application/pdf,image/jpeg,image/png,image/webp"
            />
            <p className="text-muted-foreground text-xs">
              {t.fields.attachmentHelp}
            </p>
          </div>

          <p className="text-muted-foreground text-xs">{t.estimateNotice}</p>

          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? messages.common.loading : messages.common.save}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
