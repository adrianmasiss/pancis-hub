"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ActionButton } from "@/components/ui/action";
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
import { SelectField } from "@/components/shared/select-field";
import { uploadProgressPhoto } from "@/features/progress/actions";
import { PHOTO_VIEWS } from "@/features/progress/schemas";
import { todayLocalISO } from "@/lib/dates";
import { messages } from "@/i18n/es-419";

const t = messages.progress.photos;

const fecha = (iso: string) =>
  new Intl.DateTimeFormat("es-419", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(iso));

/**
 * Sólo el diálogo de subir. Antes esto vivía dentro de `PhotosSection`, que
 * arrastraba consigo su tarjeta y su lista: puesta en la cabecera de la
 * galería, anunciaba «aún no hay fotos» justo encima de las fotos.
 */
export function PhotoUploadDialog({
  measurements = [],
}: {
  /** Para colgar la foto de una medición. Vacío = sólo fotos sueltas. */
  measurements?: { id: string; measuredAt: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<(typeof PHOTO_VIEWS)[number]>("frontal");
  const [hasFile, setHasFile] = useState(false);
  const [pending, startTransition] = useTransition();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await uploadProgressPhoto(formData);
      if ("error" in result) toast.error(result.error);
      else {
        toast.success(messages.progress.photos.uploaded);
        setOpen(false);
        setHasFile(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <ActionButton family="add">{t.upload}</ActionButton>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.upload}</DialogTitle>
          <DialogDescription>{t.privacyNote}</DialogDescription>
        </DialogHeader>
        <form id="photo-form" onSubmit={onSubmit} className="grid gap-3">
          <FileField
            name="file"
            accept="image/jpeg,image/png,image/webp"
            label={t.choose}
            help={t.fileHelp}
            onFile={(file) => setHasFile(Boolean(file))}
          />
          <FormGroup title={t.details}>
            <ChoicePills
              name="viewType"
              label={t.viewType}
              options={PHOTO_VIEWS.map((v) => ({ value: v, label: t[v] }))}
              value={view}
              onChange={setView}
            />
            {/* Opcional a propósito: una foto sin báscula delante sigue
                valiendo. Si se elige medición, la fecha la fija el servidor a
                partir de ella, así que el campo de fecha sólo manda cuando la
                foto va suelta. */}
            <div className="pc-metrics" data-pair="">
              <MetricField
                label={t.date}
                type="date"
                name="capturedAt"
                required
                defaultValue={todayLocalISO()}
              />
              {measurements.length > 0 ? (
                <SelectField
                  label={t.measurement}
                  name="measurementId"
                  className="pc-metric"
                  options={[
                    { value: "", label: t.noMeasurement },
                    ...measurements.map((m) => ({
                      value: m.id,
                      label: fecha(m.measuredAt),
                    })),
                  ]}
                />
              ) : null}
            </div>
            <MetricField
              type="text"
              label={t.notes}
              name="notes"
              maxLength={200}
              placeholder={messages.common.optional}
            />
          </FormGroup>
        </form>
        <DialogFooter>
          <ActionButton
            family="save"
            loading={pending}
            className="w-full"
            type="submit"
            form="photo-form"
            disabled={pending || !hasFile}
          >
            {messages.common.save}
          </ActionButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
