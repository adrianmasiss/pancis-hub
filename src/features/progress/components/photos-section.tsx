"use client";

import { useState, useTransition } from "react";
import { Camera, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormField } from "@/components/shared/form-field";
import { SelectField } from "@/components/shared/select-field";
import {
  deleteProgressPhoto,
  uploadProgressPhoto,
} from "@/features/progress/actions";
import type { PhotoViewItem } from "@/features/progress/queries";
import { PHOTO_VIEWS } from "@/features/progress/schemas";
import { messages } from "@/i18n/es-419";

const t = messages.progress.photos;

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("es-419", {
    day: "numeric",
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

export function PhotosSection({ photos }: { photos: PhotoViewItem[] }) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<PhotoViewItem | null>(
    null,
  );
  const [pending, startTransition] = useTransition();

  const onUpload = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await uploadProgressPhoto(formData);
      if ("error" in result) toast.error(result.error);
      else {
        toast.success(t.uploaded);
        setUploadOpen(false);
      }
    });
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">
          {messages.progress.photosTitle}
        </h2>
        <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
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
            <form onSubmit={onUpload} className="space-y-4">
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
              <FormField
                label={t.date}
                name="capturedAt"
                type="date"
                required
                defaultValue={new Date().toISOString().slice(0, 10)}
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
      </div>

      {photos.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {photos.map((photo) => (
            <li key={photo.id} className="group relative">
              {photo.signedUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photo.signedUrl}
                  alt={`${t[photo.viewType]} — ${formatDate(photo.capturedAt)}`}
                  className="aspect-3/4 w-full rounded-xl border object-cover"
                />
              ) : (
                <div className="bg-muted aspect-3/4 w-full rounded-xl border" />
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 rounded-b-xl bg-linear-to-t from-black/60 to-transparent p-2">
                <Badge variant="secondary" className="font-normal">
                  {t[photo.viewType]} · {formatDate(photo.capturedAt)}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-white hover:text-red-300"
                  disabled={pending}
                  aria-label={`${messages.common.delete} — ${t[photo.viewType]} ${formatDate(photo.capturedAt)}`}
                  onClick={() => setPendingDelete(photo)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">{t.empty}</p>
      )}

      <Dialog
        open={pendingDelete !== null}
        onOpenChange={(next) => {
          if (!next) setPendingDelete(null);
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{messages.common.delete}</DialogTitle>
            <DialogDescription>{t.deleteConfirm}</DialogDescription>
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
                  const result = await deleteProgressPhoto({
                    photoId: target.id,
                  });
                  if ("error" in result) toast.error(result.error);
                  else toast.success(t.deleted);
                });
              }}
            >
              {messages.common.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
