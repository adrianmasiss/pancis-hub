"use client";

import { useTransition } from "react";
import { FileText } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getAttachmentUrl } from "@/features/progress/actions";
import { messages } from "@/i18n/es-419";

const t = messages.progress;

/**
 * Abre el archivo original de una medición.
 *
 * La URL se pide al pulsar, no al pintar la lista: es una URL firmada de
 * cinco minutos, así que generarlas todas por adelantado significaría emitir
 * un puñado de enlaces que caducan antes de que nadie los use.
 */
export function MeasurementAttachmentButton({
  measurementId,
}: {
  measurementId: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      aria-label={`${t.table.view} ${t.table.attachment}`}
      onClick={() =>
        startTransition(async () => {
          const result = await getAttachmentUrl({ measurementId });
          if ("error" in result) toast.error(result.error);
          else window.open(result.url, "_blank", "noopener,noreferrer");
        })
      }
    >
      <FileText className="size-4" aria-hidden="true" />
      Ver archivo
    </Button>
  );
}
