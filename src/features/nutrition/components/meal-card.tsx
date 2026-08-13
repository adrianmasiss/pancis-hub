"use client";

import { useState, useTransition } from "react";
import {
  Check,
  CircleSlash,
  Clock,
  Copy,
  MoreVertical,
  NotebookPen,
  Trash2,
  Undo2,
} from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { MacroChip } from "@/components/shared/macro-chip";
import {
  copyMeal,
  deleteMeal,
  updateMealNotes,
  updateMealStatus,
} from "@/features/nutrition/actions";
import { FoodPicker } from "@/features/nutrition/components/food-picker";
import { MealItemRow } from "@/features/nutrition/components/meal-item-row";
import {
  AskAboutButton,
  contextualQuestions,
} from "@/features/assistant/components/ask-about-button";
import { RecipeSwapSheet } from "@/features/nutrition/components/recipe-swap-sheet";
import type { MealView } from "@/features/nutrition/queries";
import { formatTime } from "@/features/nutrition/lib/meal-schedule";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

const t = messages.nutrition;

export function MealCard({ meal }: { meal: MealView }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [notes, setNotes] = useState(meal.notes ?? "");
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

  const title = meal.name || t.mealTypes[meal.mealType];
  const time = formatTime(meal.scheduledTime);

  return (
    /*
      La comida es una tarjeta de la lista del dia, no una `Section`: su
      cabecera lleva titulo, cifra, meta y tres disparadores, y eso no cabe en
      el par titulo/accion.

      Se reparte en DOS filas. Antes iba todo en una sola linea flex —titulo,
      tipo, hora, estado, kcal y tres botones— que en 390px se estrujaba hasta
      partir el titulo. Arriba lo que identifica la comida y su energia; debajo,
      en una linea aparte, la meta que solo se consulta.
    */
    <section
      // Con nombre accesible la tarjeta es una region navegable: quien usa
      // lector de pantalla puede saltar de comida en comida en vez de recorrer
      // la lista entera de alimentos.
      aria-labelledby={`comida-${meal.id}`}
      className={cn(
        "surface-card px-5 py-5",
        meal.status === "omitida" && "opacity-60",
      )}
    >
      <div className="mb-3">
        <div className="flex items-baseline gap-3">
          <h3
            id={`comida-${meal.id}`}
            className="display-title min-w-0 flex-1 truncate"
          >
            {title}
          </h3>
          <span className="num-strong shrink-0">
            {meal.totals.calories.toLocaleString("es-419")}
            <span className="text-muted-foreground font-normal"> {t.kcal}</span>
          </span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <Badge
            variant={
              meal.status === "completada" ||
              meal.status === "completada_con_cambios"
                ? "default"
                : "outline"
            }
            className="font-normal"
          >
            {t.statuses[meal.status]}
          </Badge>
          {meal.name ? (
            <span className="text-muted-foreground text-xs">
              {t.mealTypes[meal.mealType]}
            </span>
          ) : null}
          {time ? (
            <span className="text-muted-foreground flex items-center gap-1 text-xs">
              <Clock className="size-3" aria-hidden="true" />
              {time}
            </span>
          ) : null}

          {/* Los disparadores se van al final de la fila de meta: son acciones
              sobre la comida, no parte de su nombre. */}
          <span className="ml-auto flex shrink-0 items-center">
            <AskAboutButton
              question={contextualQuestions.meal(title)}
              label={title}
            />
            <RecipeSwapSheet
              mealId={meal.id}
              mealName={title}
              hasItems={meal.items.length > 0}
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={messages.common.openMenu}
                  disabled={pending}
                >
                  <MoreVertical className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {meal.status !== "completada" &&
                meal.status !== "completada_con_cambios" ? (
                  <DropdownMenuItem
                    onClick={() =>
                      run(
                        () =>
                          updateMealStatus({
                            mealId: meal.id,
                            status: "completada",
                          }),
                        t.statusUpdated,
                      )
                    }
                  >
                    <Check className="size-4" /> {t.markCompleted}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem
                    onClick={() =>
                      run(
                        () =>
                          updateMealStatus({
                            mealId: meal.id,
                            status: "planificada",
                          }),
                        t.statusUpdated,
                      )
                    }
                  >
                    <Undo2 className="size-4" /> {t.markPlanned}
                  </DropdownMenuItem>
                )}
                {meal.status !== "omitida" ? (
                  <DropdownMenuItem
                    onClick={() =>
                      run(
                        () =>
                          updateMealStatus({
                            mealId: meal.id,
                            status: "omitida",
                          }),
                        t.statusUpdated,
                      )
                    }
                  >
                    <CircleSlash className="size-4" /> {t.markSkipped}
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem
                  onClick={() =>
                    run(() => copyMeal({ mealId: meal.id }), t.mealCopied)
                  }
                >
                  <Copy className="size-4" /> {t.copyMeal}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setNotesOpen((open) => !open)}>
                  <NotebookPen className="size-4" /> {t.notes}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 className="size-4" /> {t.deleteMeal}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {meal.items.length > 0 ? (
          <ul className="divide-rule divide-y">
            {meal.items.map((item) => (
              <MealItemRow key={item.id} item={item} />
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">{t.emptyMeal}</p>
        )}

        {meal.items.length > 0 ? (
          <p className="text-muted-foreground flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs">
            <MacroChip type="protein" value={meal.totals.proteinG} />
            <MacroChip type="carbs" value={meal.totals.carbohydrateG} />
            <MacroChip type="fat" value={meal.totals.fatG} />
            <MacroChip type="fiber" value={meal.totals.fiberG} />
          </p>
        ) : null}

        {notesOpen || meal.notes ? (
          <div className="space-y-2">
            <Textarea
              value={notes}
              maxLength={500}
              placeholder={t.notesPlaceholder}
              onChange={(event) => setNotes(event.target.value)}
              aria-label={t.notes}
              rows={2}
            />
            {notes !== (meal.notes ?? "") ? (
              <Button
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  run(
                    () => updateMealNotes({ mealId: meal.id, notes }),
                    t.notesSaved,
                  )
                }
              >
                {t.saveNotes}
              </Button>
            ) : null}
          </div>
        ) : null}

        <FoodPicker mealId={meal.id} />
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t.deleteMeal}</DialogTitle>
            <DialogDescription>{t.deleteMealConfirm}</DialogDescription>
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
                run(() => deleteMeal({ mealId: meal.id }), t.mealDeleted);
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
