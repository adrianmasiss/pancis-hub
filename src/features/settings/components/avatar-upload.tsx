"use client";

import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/section";
import { removeAvatar, uploadAvatar } from "@/features/settings/actions";
import { messages } from "@/i18n/es-419";

const t = messages.settings;

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type AvatarUploadProps = {
  displayName: string;
  avatarUrl: string | null;
};

export function AvatarUpload({ displayName, avatarUrl }: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [pending, startTransition] = useTransition();

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    const formData = new FormData();
    formData.set("avatar", file);
    startTransition(async () => {
      const result = await uploadAvatar(formData);
      if ("error" in result) {
        toast.error(result.error);
        setPreview(avatarUrl);
      } else {
        toast.success(t.avatarUploaded);
      }
      if (inputRef.current) inputRef.current.value = "";
    });
  };

  const onRemove = () => {
    startTransition(async () => {
      const result = await removeAvatar();
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setPreview(null);
        toast.success(t.avatarRemoved);
      }
    });
  };

  return (
    <Section title={t.avatarSection} description={t.avatarDescription}>
      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          {preview ? <AvatarImage src={preview} alt={displayName} /> : null}
          <AvatarFallback className="text-lg">
            {initialsOf(displayName) || "?"}
          </AvatarFallback>
        </Avatar>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            {t.avatarUpload}
          </Button>
          {preview ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={onRemove}
            >
              {t.avatarRemove}
            </Button>
          ) : null}
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-label={t.avatarUpload}
            onChange={onFileChange}
          />
        </div>
      </div>
    </Section>
  );
}
