"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormField } from "@/components/shared/form-field";
import { SelectField } from "@/components/shared/select-field";
import { createCustomFood, updateCustomFood } from "@/features/foods/actions";
import type { LibraryFood } from "@/features/foods/queries";
import {
  FOOD_GROUPS,
  foodFormSchema,
  type FoodFormInput,
} from "@/features/foods/schemas";
import { toOptionalNumber } from "@/lib/forms";
import { messages } from "@/i18n/es-419";

const t = messages.foods;
const STATE_NONE = "none";

export function FoodFormDialog({ food }: { food?: LibraryFood }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const form = useForm<FoodFormInput>({
    resolver: zodResolver(foodFormSchema),
    defaultValues: food
      ? {
          name: food.name,
          brand: food.brand ?? "",
          foodGroup: food.foodGroup,
          cookedState: food.cookedState ?? undefined,
          calories: food.calories,
          proteinG: food.proteinG,
          carbohydrateG: food.carbohydrateG,
          fatG: food.fatG,
          fiberG: food.fiberG,
        }
      : { name: "", brand: "", fiberG: 0 },
  });
  const errors = form.formState.errors;

  const onSubmit = (data: FoodFormInput) => {
    startTransition(async () => {
      const result = food
        ? await updateCustomFood({ ...data, foodId: food.id })
        : await createCustomFood(data);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(food ? t.updated : t.created);
        setOpen(false);
        if (!food) form.reset();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {food ? (
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label={`${t.editFood} — ${food.name}`}
          >
            <Pencil className="size-4" />
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="size-4" aria-hidden="true" />
            {t.createFood}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{food ? t.editFood : t.createFood}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <FormField
            label={t.fields.name}
            error={errors.name?.message}
            {...form.register("name")}
          />
          <FormField
            label={t.fields.brand}
            error={errors.brand?.message}
            {...form.register("brand")}
          />
          <SelectField
            label={t.fields.group}
            placeholder="—"
            options={FOOD_GROUPS.map((group) => ({
              value: group,
              label: t.groups[group],
            }))}
            error={errors.foodGroup?.message}
            {...form.register("foodGroup")}
          />
          <SelectField
            label={t.fields.cookedState}
            options={[
              { value: STATE_NONE, label: t.fields.stateNone },
              { value: "crudo", label: messages.nutrition.cookedState.crudo },
              { value: "cocido", label: messages.nutrition.cookedState.cocido },
            ]}
            error={errors.cookedState?.message}
            {...form.register("cookedState", {
              setValueAs: (value) => (value === STATE_NONE ? undefined : value),
            })}
          />
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label={t.fields.caloriesPer100}
              type="number"
              inputMode="decimal"
              step="0.1"
              error={errors.calories?.message}
              {...form.register("calories", { setValueAs: toOptionalNumber })}
            />
            <FormField
              label={t.fields.proteinPer100}
              type="number"
              inputMode="decimal"
              step="0.1"
              error={errors.proteinG?.message}
              {...form.register("proteinG", { setValueAs: toOptionalNumber })}
            />
            <FormField
              label={t.fields.carbsPer100}
              type="number"
              inputMode="decimal"
              step="0.1"
              error={errors.carbohydrateG?.message}
              {...form.register("carbohydrateG", {
                setValueAs: toOptionalNumber,
              })}
            />
            <FormField
              label={t.fields.fatPer100}
              type="number"
              inputMode="decimal"
              step="0.1"
              error={errors.fatG?.message}
              {...form.register("fatG", { setValueAs: toOptionalNumber })}
            />
            <FormField
              label={t.fields.fiberPer100}
              type="number"
              inputMode="decimal"
              step="0.1"
              error={errors.fiberG?.message}
              {...form.register("fiberG", { setValueAs: toOptionalNumber })}
            />
          </div>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? messages.common.loading : messages.common.save}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
