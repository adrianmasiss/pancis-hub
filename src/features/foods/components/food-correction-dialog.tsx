"use client";

import { useState, useTransition } from "react";
import { PencilRuler } from "lucide-react";
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
import { FormField } from "@/components/shared/form-field";
import {
  removeFoodCorrection,
  saveFoodCorrection,
} from "@/features/foods/correction-actions";
import type { LibraryFood } from "@/features/foods/queries";
import { messages } from "@/i18n/es-419";
import { toOptionalNumber } from "@/lib/forms";

const t = messages.foods.corrections;

type MacroKey = "calories" | "proteinG" | "carbohydrateG" | "fatG" | "fiberG";

const MACRO_FIELDS: { key: MacroKey; label: string }[] = [
  { key: "calories", label: messages.foods.fields.caloriesPer100 },
  { key: "proteinG", label: messages.foods.fields.proteinPer100 },
  { key: "carbohydrateG", label: messages.foods.fields.carbsPer100 },
  { key: "fatG", label: messages.foods.fields.fatPer100 },
  { key: "fiberG", label: messages.foods.fields.fiberPer100 },
];

/**
 * Correccion de un alimento del catalogo compartido (requisito 7.5).
 *
 * Los campos arrancan VACIOS a proposito, mostrando debajo el valor del
 * catalogo: lo que se deja en blanco sigue heredando la fuente, asi que
 * si esta corrige su dato el usuario se beneficia sin hacer nada.
 */
export function FoodCorrectionDialog({ food }: { food: LibraryFood }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [values, setValues] = useState<Record<string, string>>({});
  const [reason, setReason] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    startTransition(async () => {
      const result = await saveFoodCorrection({
        foodId: food.id,
        name: values.name?.trim() || null,
        calories: toOptionalNumber(values.calories ?? "") ?? null,
        proteinG: toOptionalNumber(values.proteinG ?? "") ?? null,
        carbohydrateG: toOptionalNumber(values.carbohydrateG ?? "") ?? null,
        fatG: toOptionalNumber(values.fatG ?? "") ?? null,
        fiberG: toOptionalNumber(values.fiberG ?? "") ?? null,
        reason: reason.trim() || null,
      });
      if ("error" in result) toast.error(result.error);
      else {
        toast.success(t.saved);
        setOpen(false);
      }
    });
  };

  const remove = () => {
    startTransition(async () => {
      const result = await removeFoodCorrection({ foodId: food.id });
      if ("error" in result) toast.error(result.error);
      else {
        toast.success(t.removed);
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground size-8"
          aria-label={`${t.trigger} — ${food.name}`}
        >
          <PencilRuler className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t.title}</DialogTitle>
          <DialogDescription>{t.description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1">
            <FormField
              label={messages.foods.fields.name}
              value={values.name ?? ""}
              maxLength={80}
              placeholder={food.name}
              onChange={(event) =>
                setValues((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {MACRO_FIELDS.map(({ key, label }) => (
              <div key={key} className="space-y-1">
                <FormField
                  label={label}
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  value={values[key] ?? ""}
                  placeholder={String(food[key])}
                  onChange={(event) =>
                    setValues((previous) => ({
                      ...previous,
                      [key]: event.target.value,
                    }))
                  }
                />
                <p className="text-muted-foreground text-xs">
                  {t.catalogValue.replace("{value}", String(food[key]))}
                </p>
              </div>
            ))}
          </div>

          <FormField
            label={t.reason}
            value={reason}
            maxLength={200}
            placeholder={t.reasonPlaceholder}
            onChange={(event) => setReason(event.target.value)}
          />

          <p className="text-muted-foreground text-xs">{t.emptyNotice}</p>

          <div className="flex gap-2">
            <Button type="submit" className="flex-1" disabled={pending}>
              {pending ? messages.common.loading : t.save}
            </Button>
            {food.isCorrected ? (
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={remove}
              >
                {t.remove}
              </Button>
            ) : null}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
