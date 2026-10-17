"use client";

import { useState, useTransition } from "react";
import { Camera } from "lucide-react";
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
import { FormField } from "@/components/shared/form-field";
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
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Camera className="size-4" aria-hidden="true" />
          {t.upload}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.upload}</DialogTitle>
          <DialogDescription>{t.privacyNote}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="photo-file">{t.upload}</Label>
            <Input
              id="photo-file"
              name="file"
              type="file"
              required
              accept="image/jpeg,image/png,image/webp"
            />
            <p className="text-muted-foreground text-xs">{t.fileHelp}</p>
          </div>
          <SelectField
            label={t.viewType}
            name="viewType"
            options={PHOTO_VIEWS.map((view) => ({
              value: view,
              label: t[view],
            }))}
          />
          {/* Opcional a propósito: una foto sin báscula delante sigue
              valiendo. Si se elige medición, la fecha la fija el servidor a
              partir de ella, así que el campo de fecha sólo manda cuando la
              foto va suelta. */}
          {measurements.length > 0 ? (
            <SelectField
              label={`Medición (${messages.common.optional.toLowerCase()})`}
              name="measurementId"
              options={[
                { value: "", label: "Sin medición" },
                ...measurements.map((m) => ({
                  value: m.id,
                  label: fecha(m.measuredAt),
                })),
              ]}
            />
          ) : null}
          <FormField
            label={t.date}
            name="capturedAt"
            type="date"
            required
            defaultValue={todayLocalISO()}
          />
          <FormField
            label={`${t.notes} (${messages.common.optional.toLowerCase()})`}
            name="notes"
            maxLength={200}
          />
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? messages.common.loading : messages.common.save}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
