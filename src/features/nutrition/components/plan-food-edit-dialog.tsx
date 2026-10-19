"use client";
import { useState, useTransition } from "react";
import { Minus, Plus, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ActionButton } from "@/components/ui/action";
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
import type { DietTemplateItemView } from "@/features/dashboard/queries";
import { swapDietItemForDay, undoDietItemDaySwap } from "../day-swap-actions";
import {
  deleteDietTemplateItem,
  updateDietTemplateItemQuantity,
} from "../plan-item-actions";
import { FoodAvatar } from "./food-avatar";

const STEP = 10;
const fmt = (n: number) => Math.round(n).toLocaleString("es-419");

/**
 * Editar un alimento del plan en un solo lugar: cantidad, deshacer el cambio
 * del dia y quitarlo del plan. Cambiarlo por otro alimento vive al lado, en
 * la hoja de sustitucion, que ya compara alternativas.
 *
 * En «Mi plan» del dia la cantidad se guarda como sustitucion de ESE dia
 * sobre el mismo alimento: la plantilla no se toca. En el plan habitual se
 * escribe en la plantilla.
 */
export function PlanFoodEditDialog({
  item,
  date,
  mode,
}: {
  item: DietTemplateItemView;
  date: string;
  mode: "day" | "plan";
}) {
  const [open, setOpen] = useState(false);
  const [grams, setGrams] = useState(item.quantityG);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();
  /* Un sustituto del asistente no tiene ficha en la biblioteca: sus macros
     son una instantanea para su cantidad, y no hay de donde reescalarla. */
  const canResize = Boolean(item.foodId);
  const perGram = (value: number) =>
    item.quantityG > 0 ? (value / item.quantityG) * grams : 0;
  const valid = Number.isFinite(grams) && grams > 0 && grams <= 5000;
  const changed = valid && Math.round(grams) !== Math.round(item.quantityG);

  const reset = (next: boolean) => {
    setOpen(next);
    if (next) {
      setGrams(item.quantityG);
      setConfirmDelete(false);
    }
  };

  const run = (task: () => Promise<{ error?: string }>, done: string) =>
    startTransition(async () => {
      const result = await task();
      if (result.error) toast.error(result.error);
      else {
        toast.success(done);
        setOpen(false);
      }
    });

  const save = () =>
    run(
      () =>
        mode === "day"
          ? swapDietItemForDay({
              templateItemId: item.id,
              date,
              foodId: item.foodId,
              quantityG: Math.round(grams),
            })
          : updateDietTemplateItemQuantity({
              templateItemId: item.id,
              quantityG: Math.round(grams),
            }),
      mode === "day" ? "Cantidad ajustada para este día" : "Plan actualizado",
    );

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogTrigger asChild>
        <ActionButton
          family="edit"
          compact
          type="button"
          aria-label={`Editar — ${item.foodName}`}
        ></ActionButton>
      </DialogTrigger>
      <DialogContent className="plan-food-dialog sm:max-w-[420px]">
        <DialogHeader className="plan-food-dialog-head">
          <FoodAvatar
            name={item.foodName}
            group={item.foodGroup}
            imageUrl={item.imageUrl}
            size="lg"
          />
          <div>
            <DialogTitle>{item.foodName}</DialogTitle>
            <DialogDescription>
              {mode === "day"
                ? "El cambio aplica solo a este día. Tu plan habitual se conserva."
                : "El cambio se guarda en tu plan habitual."}
            </DialogDescription>
          </div>
        </DialogHeader>

        {canResize ? (
          <div className="plan-food-dialog-body">
            <div
              className="plan-food-stepper"
              role="group"
              aria-label="Cantidad"
            >
              <button
                type="button"
                onClick={() => setGrams((g) => Math.max(STEP, g - STEP))}
                aria-label={`Restar ${STEP} g`}
              >
                <Minus size={16} aria-hidden="true" />
              </button>
              <label>
                <input
                  type="number"
                  inputMode="decimal"
                  min={1}
                  max={5000}
                  value={Number.isFinite(grams) ? grams : ""}
                  onChange={(event) => setGrams(Number(event.target.value))}
                  aria-label="Gramos"
                />
                <span>g</span>
              </label>
              <button
                type="button"
                onClick={() => setGrams((g) => Math.min(5000, g + STEP))}
                aria-label={`Sumar ${STEP} g`}
              >
                <Plus size={16} aria-hidden="true" />
              </button>
            </div>
            {item.foodPortions.length > 0 && (
              <div className="plan-food-portions" aria-label="Porciones">
                {item.foodPortions.slice(0, 4).map((portion) => (
                  <button
                    key={portion.label}
                    type="button"
                    data-active={
                      Math.round(portion.grams) === Math.round(grams) ||
                      undefined
                    }
                    onClick={() => setGrams(portion.grams)}
                  >
                    {portion.label}
                    <span>{fmt(portion.grams)} g</span>
                  </button>
                ))}
              </div>
            )}
            <dl className="plan-food-preview" aria-live="polite">
              <div data-macro="calories">
                <dt>Energía</dt>
                <dd>
                  {valid ? fmt(perGram(item.macros.calories)) : "—"}
                  <span>kcal</span>
                </dd>
              </div>
              <div data-macro="proteinG">
                <dt>Proteína</dt>
                <dd>
                  {valid ? fmt(perGram(item.macros.proteinG)) : "—"}
                  <span>g</span>
                </dd>
              </div>
              <div data-macro="carbohydrateG">
                <dt>Carbos</dt>
                <dd>
                  {valid ? fmt(perGram(item.macros.carbohydrateG)) : "—"}
                  <span>g</span>
                </dd>
              </div>
              <div data-macro="fatG">
                <dt>Grasas</dt>
                <dd>
                  {valid ? fmt(perGram(item.macros.fatG)) : "—"}
                  <span>g</span>
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <p className="plan-food-dialog-note">
            Este sustituto lo estimó el asistente para {fmt(item.quantityG)} g y
            no tiene ficha en la biblioteca, así que su cantidad no se puede
            reescalar. Puedes deshacerlo o cambiarlo por otro alimento.
          </p>
        )}

        <DialogFooter className="plan-food-dialog-foot">
          {mode === "plan" &&
            (confirmDelete ? (
              <Button
                variant="destructive"
                disabled={pending}
                onClick={() =>
                  run(
                    () => deleteDietTemplateItem({ templateItemId: item.id }),
                    "Alimento quitado del plan",
                  )
                }
              >
                <Trash2 size={15} aria-hidden="true" />
                Sí, quitar del plan
              </Button>
            ) : (
              <Button
                variant="ghost"
                className="plan-food-remove"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 size={15} aria-hidden="true" />
                Quitar
              </Button>
            ))}
          {mode === "day" && item.daySwap && (
            <Button
              variant="ghost"
              disabled={pending}
              onClick={() =>
                run(
                  () => undoDietItemDaySwap({ templateItemId: item.id, date }),
                  "Se restauró el alimento del plan",
                )
              }
            >
              <RotateCcw size={15} aria-hidden="true" />
              Restaurar original
            </Button>
          )}
          {canResize && (
            <ActionButton
              family="save"
              loading={pending}
              onClick={save}
              disabled={!changed || pending}
              aria-busy={pending}
            >
              {"Guardar"}
            </ActionButton>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
