"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CheckCircle2, Copy, MoreVertical, Pencil, Trash2 } from "lucide-react";
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
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deletePlan,
  duplicatePlan,
  setActivePlan,
} from "@/features/training/actions";
import type { PlanSummary } from "@/features/training/queries";
import { messages } from "@/i18n/es-419";

const t = messages.training;

export function PlanCard({ plan }: { plan: PlanSummary }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  const run = (
    action: () => Promise<{ error: string } | { success: true }>,
    successMessage: string,
  ) => {
    startTransition(async () => {
      const result = await action();
      if ("error" in result) toast.error(result.error);
      else toast.success(successMessage);
    });
  };

  return (
    /*
      Igual reparto que la comida en Nutricion: arriba el nombre, debajo la
      meta. El nombre iba en la misma linea flex que la insignia, el conteo de
      dias y el menu, y en 390px eso lo estrujaba hasta partirlo.
    */
    <section className="surface-card px-5 py-5">
      <div className="flex items-baseline gap-3">
        {/* El nombre es titulo antes que enlace: se queda en la tinta del
            sistema y el acento se reserva al hover. Como toda `a` de la app
            nace naranja, el titulo entero salia del color del acento y la
            tarjeta se leia como seleccionada. */}
        <h3 className="display-title min-w-0 flex-1 truncate">
          <Link
            href={`/entrenamiento/rutinas/${plan.id}`}
            className="text-foreground hover:text-primary transition-colors duration-[var(--dur-fast)] hover:underline"
          >
            {plan.name}
          </Link>
        </h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="shrink-0"
              aria-label={messages.common.openMenu}
              disabled={pending}
            >
              <MoreVertical className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {!plan.active ? (
              <DropdownMenuItem
                onClick={() =>
                  run(() => setActivePlan({ planId: plan.id }), t.planActivated)
                }
              >
                <CheckCircle2 className="size-4" /> {t.setActive}
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem asChild>
              <Link href={`/entrenamiento/rutinas/${plan.id}`}>
                <Pencil className="size-4" /> {t.editPlan}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() =>
                run(() => duplicatePlan({ planId: plan.id }), t.planDuplicated)
              }
            >
              <Copy className="size-4" /> {t.duplicatePlan}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="size-4" /> {t.deletePlan}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
        {plan.active ? <Badge>{t.activeBadge}</Badge> : null}
        <span className="text-muted-foreground num text-xs">
          {plan.dayCount} {t.dayLabel.toLowerCase()}
          {plan.dayCount === 1 ? "" : "s"}
        </span>
      </div>

      {plan.objective ? (
        <p className="text-muted-foreground mt-3 text-sm">{plan.objective}</p>
      ) : null}

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.deletePlan}</DialogTitle>
            <DialogDescription>{t.deletePlanConfirm}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              {messages.common.cancel}
            </Button>
            <Button
              variant="destructive"
              disabled={pending}
              onClick={() => {
                setConfirmDelete(false);
                run(() => deletePlan({ planId: plan.id }), t.planDeleted);
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
