"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus } from "lucide-react";
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
import {
  ChoicePills,
  FileField,
  FormGroup,
  MetricField,
} from "@/components/shared/form-kit";
import { saveMeasurement } from "@/features/progress/actions";
import type { MeasurementView } from "@/features/progress/queries";
import {
  MEASUREMENT_SOURCES,
  type MeasurementSource,
} from "@/features/progress/schemas";
import { todayLocalISO } from "@/lib/dates";
import { messages } from "@/i18n/es-419";

const t = messages.progress;
const f = t.form;

/** «Onboarding» lo pone la app; solo se ofrece si la medicion ya lo tiene. */
const sourcesFor = (current: MeasurementSource) =>
  MEASUREMENT_SOURCES.filter((s) => s !== "onboarding" || s === current).map(
    (value) => ({ value, label: t.sources[value] }),
  );

const count = (...values: (number | null | undefined)[]) =>
  values.filter((v) => v !== null && v !== undefined).length;

export function MeasurementFormDialog({
  measurement,
}: {
  measurement?: MeasurementView;
}) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<MeasurementSource>(
    measurement?.source ?? "manual",
  );
  const [pending, startTransition] = useTransition();
  const m = measurement;

  const composition = count(
    m?.bodyFatPercentage,
    m?.skeletalMuscleKg,
    m?.visceralFatLevel,
    m?.bodyWaterPercentage,
  );
  const perimeters = count(
    m?.waistCm,
    m?.hipCm,
    m?.chestCm,
    m?.armCm,
    m?.thighCm,
  );

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
          // La accion prominente de Progreso: registrar una medicion es a lo
          // unico que se entra aqui; lo demas es lectura. Dentro de la tabla
          // este mismo dialogo es solo un lapiz, y ese no es prominente.
          <Button variant="brand" size="lg">
            <Plus className="size-4" aria-hidden="true" />
            {t.addMeasurement}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {measurement ? t.editMeasurement : t.addMeasurement}
          </DialogTitle>
          <DialogDescription>{t.estimateNotice}</DialogDescription>
        </DialogHeader>

        <form id="measurement-form" onSubmit={onSubmit} className="grid gap-3">
          <FormGroup title={f.basics}>
            <div className="pc-metrics" data-pair="">
              <MetricField
                lead
                label={t.fields.weightKg.replace(/ \(.*\)/, "")}
                unit="kg"
                name="weightKg"
                step="0.1"
                defaultValue={m?.weightKg ?? ""}
                autoFocus={!measurement}
              />
              <MetricField
                label={t.fields.measuredAt}
                type="date"
                name="measuredAt"
                required
                defaultValue={m?.measuredAt ?? todayLocalISO()}
              />
            </div>
            <ChoicePills
              name="source"
              label={t.fields.source}
              options={sourcesFor(source)}
              value={source}
              onChange={setSource}
            />
            {source === "inbody" ? (
              <p className="pc-form-note">{t.inbodyNotice}</p>
            ) : null}
          </FormGroup>

          <FormGroup
            collapsible
            defaultOpen={source === "inbody" || composition > 0}
            filled={composition}
            title={t.composition.title}
            hint={f.compositionHint}
          >
            <div className="pc-metrics">
              <MetricField
                label={t.composition.metrics.bodyFatPercentage}
                unit="%"
                name="bodyFatPercentage"
                step="0.1"
                defaultValue={m?.bodyFatPercentage ?? ""}
              />
              <MetricField
                label={t.composition.metrics.skeletalMuscleKg}
                unit="kg"
                name="skeletalMuscleKg"
                step="0.1"
                defaultValue={m?.skeletalMuscleKg ?? ""}
              />
              <MetricField
                label={t.composition.metrics.visceralFatLevel}
                unit={f.level}
                name="visceralFatLevel"
                step="0.1"
                defaultValue={m?.visceralFatLevel ?? ""}
              />
              <MetricField
                label={t.composition.metrics.bodyWaterPercentage}
                unit="%"
                name="bodyWaterPercentage"
                step="0.1"
                defaultValue={m?.bodyWaterPercentage ?? ""}
              />
            </div>
          </FormGroup>

          <FormGroup
            collapsible
            defaultOpen={perimeters > 0}
            filled={perimeters}
            title={f.perimeters}
            hint={f.perimetersHint}
          >
            <div className="pc-metrics">
              {(
                [
                  ["waistCm", f.waist],
                  ["hipCm", f.hip],
                  ["chestCm", f.chest],
                  ["armCm", f.arm],
                  ["thighCm", f.thigh],
                ] as const
              ).map(([name, label]) => (
                <MetricField
                  key={name}
                  label={label}
                  unit="cm"
                  name={name}
                  step="0.1"
                  defaultValue={m?.[name] ?? ""}
                />
              ))}
            </div>
          </FormGroup>

          <FormGroup
            collapsible
            defaultOpen={Boolean(m?.notes)}
            title={f.extras}
            hint={f.extrasHint}
          >
            <div className="pc-metric">
              <label htmlFor="measurement-notes">{t.fields.notes}</label>
              <textarea
                id="measurement-notes"
                name="notes"
                rows={2}
                maxLength={300}
                className="pc-textarea"
                defaultValue={m?.notes ?? ""}
              />
            </div>
            <FileField
              name="attachment"
              accept="application/pdf,image/jpeg,image/png,image/webp"
              label={f.attachment}
              help={t.fields.attachmentHelp}
            />
          </FormGroup>
        </form>

        <DialogFooter>
          <Button
            type="submit"
            form="measurement-form"
            className="w-full"
            disabled={pending}
          >
            {pending ? messages.common.loading : messages.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
