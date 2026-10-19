"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ActionButton } from "@/components/ui/action";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectField } from "@/components/shared/select-field";
import { createMeal } from "@/features/nutrition/actions";
import { MEAL_TYPES } from "@/features/nutrition/schemas";
import { messages } from "@/i18n/es-419";

const t = messages.nutrition;

export function AddMealDialog({
  date,
  trigger = "primary",
}: {
  date: string;
  trigger?: "primary" | "plan-row";
}) {
  const [open, setOpen] = useState(false);
  const [mealType, setMealType] = useState<string>("desayuno");
  const [name, setName] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [pending, startTransition] = useTransition();

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await createMeal({ date, mealType, name, scheduledTime });
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(t.mealCreated);
        setOpen(false);
        setName("");
        setScheduledTime("");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {/* La misma familia de creación en la cabecera y en la fila del plan. */}
        <ActionButton
          family="add"
          className={trigger === "plan-row" ? "w-full" : undefined}
        >
          {t.addMeal}
        </ActionButton>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.addMeal}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <SelectField
            label={t.mealType}
            options={MEAL_TYPES.map((type) => ({
              value: type,
              label: t.mealTypes[type],
            }))}
            value={mealType}
            onChange={(event) => setMealType(event.target.value)}
          />
          <div className="space-y-2">
            <Label htmlFor="meal-time">{t.mealTime}</Label>
            <Input
              id="meal-time"
              type="time"
              value={scheduledTime}
              onChange={(event) => setScheduledTime(event.target.value)}
            />
            <p className="text-muted-foreground text-xs">{t.mealTimeHelp}</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="meal-name">{t.mealName}</Label>
            <Input
              id="meal-name"
              value={name}
              maxLength={80}
              onChange={(event) => setName(event.target.value)}
            />
          </div>
          <ActionButton
            family="save"
            loading={pending}
            className="w-full"
            type="submit"
            disabled={pending}
          >
            {messages.common.save}
          </ActionButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
