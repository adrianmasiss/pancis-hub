"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
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
import { FormGroup, MetricField } from "@/components/shared/form-kit";
import { createPlan } from "@/features/training/actions";
import { messages } from "@/i18n/es-419";

const t = messages.training;

export function CreatePlanDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [pending, startTransition] = useTransition();

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;
    startTransition(async () => {
      const result = await createPlan({ name, objective });
      if ("error" in result) toast.error(result.error);
      else {
        toast.success(t.planCreated);
        setOpen(false);
        setName("");
        setObjective("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" aria-hidden="true" />
          {t.createPlan}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t.createPlan}</DialogTitle>
          <DialogDescription>{t.createPlanHint}</DialogDescription>
        </DialogHeader>
        <form id="create-plan-form" onSubmit={onSubmit} className="grid gap-3">
          <FormGroup title={t.createPlanGroup}>
            <MetricField
              type="text"
              label={t.planName}
              value={name}
              maxLength={80}
              placeholder={t.planNamePlaceholder}
              onChange={(event) => setName(event.target.value)}
              required
              autoFocus
            />
            <MetricField
              type="text"
              label={t.planObjective}
              value={objective}
              maxLength={200}
              placeholder={t.planObjectivePlaceholder}
              onChange={(event) => setObjective(event.target.value)}
            />
          </FormGroup>
        </form>
        <DialogFooter>
          <Button
            type="submit"
            form="create-plan-form"
            className="w-full"
            disabled={pending || !name.trim()}
          >
            {pending ? messages.common.loading : messages.common.save}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
