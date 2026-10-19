"use client";

import { useState, useTransition } from "react";
import { Play } from "lucide-react";
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
import { startSession } from "@/features/training/actions";
import { messages } from "@/i18n/es-419";

const t = messages.training;

type StartSessionButtonProps = {
  planId?: string;
  planDayId?: string;
  label?: string;
  /** `brand` cuando es la accion prominente de su pantalla (regla 1). */
  variant?: "default" | "outline" | "brand";
  /** Para la pastilla oscura de la tarjeta de «Hoy». */
  className?: string;
  /**
   * Fecha (YYYY-MM-DD) en que este día ya se entrenó esta semana. Si viene,
   * antes de empezar se pregunta: repetir un día es válido, pero casi nunca
   * es lo que se quería.
   */
  doneOn?: string;
};

/** «el lunes 13», sin pasar por la zona del navegador. */
function diaDe(dateISO: string): string {
  return new Intl.DateTimeFormat("es-CR", {
    weekday: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateISO}T12:00:00Z`));
}

export function StartSessionButton({
  planId,
  planDayId,
  label,
  variant = "default",
  className,
  doneOn,
}: StartSessionButtonProps) {
  const [pending, startTransition] = useTransition();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const start = () =>
    startTransition(async () => {
      const result = await startSession({ planId, planDayId });
      if (result && "error" in result) toast.error(result.error);
    });

  return (
    <>
      <Button
        variant={variant}
        className={className}
        // La prominente va mas alta: la jerarquia no la hace solo el degradado.
        size={variant === "brand" ? "lg" : "sm"}
        disabled={pending}
        onClick={() => (doneOn ? setConfirmOpen(true) : start())}
      >
        <Play className="size-4" aria-hidden="true" />
        {label ?? t.startSession}
      </Button>

      {doneOn && (
        <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Ya hiciste este día esta semana</DialogTitle>
              <DialogDescription>
                Lo completaste {diaDe(doneOn)}. Si lo repites, quedará
                registrado como otra sesión.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                {messages.common.cancel}
              </Button>
              <Button
                disabled={pending}
                onClick={() => {
                  setConfirmOpen(false);
                  start();
                }}
              >
                Repetir el día
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
