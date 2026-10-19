"use client";
import { useState } from "react";
import { ActionButton } from "@/components/ui/action";
import { AddFoodButton } from "@/components/shared/comparison-toolbar";
import {
  FocusCard,
  FocusCardContent,
  FocusCardTrigger,
} from "@/components/ui/focus-card";
import type { LibraryFood } from "@/features/foods/queries";
import { AddFoodSheet } from "@/features/foods/components/add-food-sheet";
import { messages } from "@/i18n/es-419";

const t = messages.foods;

/**
 * Every "add a food" (and "edit my food") in the app opens the same sheet:
 * label photo, barcode or manual, one form to review, then save. Only the
 * trigger changes with the place it lives in.
 */
export function FoodFormDialog({
  food,
  trigger = "default",
  onCreated,
}: {
  food?: LibraryFood;
  /** `expand`: alias conservado para la cápsula de creación de la Biblioteca. */
  trigger?: "default" | "expand" | "icon";
  onCreated?: (name: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <FocusCard open={open} onOpenChange={setOpen}>
      <FocusCardTrigger asChild>
        {food ? (
          <ActionButton
            family="edit"
            compact
            aria-label={`${t.editFood} — ${food.name}`}
          ></ActionButton>
        ) : trigger === "icon" ? (
          <AddFoodButton />
        ) : trigger === "expand" ? (
          <ActionButton family="add" type="button" aria-label={t.createFood}>
            {t.createFood}
          </ActionButton>
        ) : (
          <ActionButton family="add">{t.createFood}</ActionButton>
        )}
      </FocusCardTrigger>
      <FocusCardContent
        className="add-food-focus"
        onEscapeKeyDown={(event) => {
          // Nested inside another focus card (the swap sheet): close only
          // this one, not the sheet underneath.
          event.stopPropagation();
        }}
      >
        {open && (
          <AddFoodSheet
            food={food}
            onDone={(name) => {
              setOpen(false);
              if (!food && name) onCreated?.(name);
            }}
          />
        )}
      </FocusCardContent>
    </FocusCard>
  );
}
