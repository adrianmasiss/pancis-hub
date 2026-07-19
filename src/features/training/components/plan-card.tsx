"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { CheckCircle2, Copy, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Link
            href={`/entrenamiento/rutinas/${plan.id}`}
            className="hover:underline"
          >
            {plan.name}
          </Link>
          {plan.active ? <Badge>{t.activeBadge}</Badge> : null}
          <span className="text-muted-foreground ml-auto text-xs font-normal">
            {plan.dayCount} {t.dayLabel.toLowerCase()}
            {plan.dayCount === 1 ? "" : "s"}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
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
                    run(
                      () => setActivePlan({ planId: plan.id }),
                      t.planActivated,
                    )
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
                  run(
                    () => duplicatePlan({ planId: plan.id }),
                    t.planDuplicated,
                  )
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
        </CardTitle>
      </CardHeader>
      {plan.objective ? (
        <CardContent>
          <p className="text-muted-foreground text-sm">{plan.objective}</p>
        </CardContent>
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
    </Card>
  );
}
