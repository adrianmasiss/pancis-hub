"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/section";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { forgetConversations } from "@/features/assistant/actions";
import { messages } from "@/i18n/es-419";

const t = messages.settings.assistantMemory;

/**
 * Borrado del historial del copiloto.
 *
 * Se muestra el numero de conversaciones guardadas a proposito: "borrar el
 * historial" es abstracto, "tienes 14 conversaciones guardadas" es un hecho
 * sobre el que se puede decidir.
 */
export function AssistantMemoryCard({ count }: { count: number }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <Section title={t.title} description={t.description}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {count === 0 ? t.empty : t.stored.replace("{count}", String(count))}
        </p>
        <Button
          variant="outline"
          disabled={count === 0 || pending}
          onClick={() => setConfirming(true)}
        >
          {t.forget}
        </Button>
      </div>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.forget}</DialogTitle>
            <DialogDescription>{t.confirm}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirming(false)}>
              {messages.common.cancel}
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => {
                setConfirming(false);
                startTransition(async () => {
                  const result = await forgetConversations();
                  if ("error" in result) toast.error(result.error);
                  else toast.success(t.forgotten);
                });
              }}
            >
              {t.forget}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Section>
  );
}
