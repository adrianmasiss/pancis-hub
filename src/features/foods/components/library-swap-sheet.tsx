"use client";
import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FocusCard,
  FocusCardContent,
  FocusCardHeader,
  FocusCardTitle,
  FocusCardDescription,
} from "@/components/ui/focus-card";
import type { DietTemplateView } from "@/features/dashboard/queries";
import type { LibraryCardFood } from "../library-types";
import { importExternalFood } from "../external-actions";
import {
  previewLibrarySwap,
  confirmLibrarySwap,
  type LibrarySwapPreview,
} from "../library-swap-actions";
import { undoDietItemDaySwap } from "@/features/nutrition/day-swap-actions";

const fields = [
  ["calories", "Calorías", "kcal"],
  ["proteinG", "Proteína", "g"],
  ["carbohydrateG", "Carbohidratos", "g"],
  ["fatG", "Grasas", "g"],
] as const;
const format = (value: number) =>
  new Intl.NumberFormat("es-CR", { maximumFractionDigits: 1 }).format(value);

export function LibrarySwapSheet({
  food,
  diet,
  date,
  onClose,
}: {
  food: LibraryCardFood;
  diet: DietTemplateView | null;
  date: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const meals =
    diet?.meals.filter((m) => !m.loggedToday && m.items.length) ?? [];
  const [targetId, setTargetId] = useState(meals[0]?.items[0]?.id ?? "");
  const [quantity, setQuantity] = useState("");
  const [preview, setPreview] = useState<LibrarySwapPreview | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const importedId = useRef(food.foodId);
  const requestId = useRef(0);

  useEffect(() => {
    if (!targetId) return;
    let cancelled = false;
    const id = ++requestId.current;
    async function load() {
      setReady(false);
      setLoading(true);
      setError("");
      setPreview(null);
      setQuantity("");
      try {
        if (!importedId.current && food.provider && food.externalId) {
          const imported = await importExternalFood({
            source: food.provider,
            externalId: food.externalId,
          });
          if ("error" in imported) throw new Error(imported.error);
          importedId.current = imported.foodId;
        }
        const result = await previewLibrarySwap({
          foodId: importedId.current,
          templateItemId: targetId,
          date,
        });
        if (cancelled || requestId.current !== id) return;
        if ("error" in result) setError(result.error);
        else {
          setReady(true);
          setPreview(result);
          setQuantity(String(result.quantityG));
        }
      } catch {
        if (!cancelled)
          setError(
            "No pudimos preparar el cambio. Cierra la ficha e inténtalo de nuevo.",
          );
      } finally {
        if (!cancelled && requestId.current === id) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [targetId, food.provider, food.externalId, date]);

  const recalculate = () =>
    startTransition(async () => {
      setError("");
      setPreview(null);
      const result = await previewLibrarySwap({
        foodId: importedId.current,
        templateItemId: targetId,
        date,
        quantityG: Number(quantity),
      });
      if ("error" in result) setError(result.error);
      else setPreview(result);
    });
  const confirm = () => {
    if (!preview) return;
    startTransition(async () => {
      const result = await confirmLibrarySwap({
        foodId: importedId.current,
        templateItemId: targetId,
        date,
        quantityG: preview.quantityG,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      onClose();
      router.refresh();
      toast.success("Sustitución aplicada solo para hoy", {
        action: {
          label: "Deshacer",
          onClick: async () => {
            const undo = await undoDietItemDaySwap({
              templateItemId: targetId,
              date,
            });
            if (undo.error) toast.error(undo.error);
            else router.refresh();
          },
        },
      });
    });
  };

  return (
    <FocusCard
      open
      onOpenChange={(open) => {
        if (!open && !pending) onClose();
      }}
    >
      <FocusCardContent className="library-swap-sheet">
        <FocusCardHeader>
          <FocusCardTitle>Usar {food.name} en mi dieta</FocusCardTitle>
          <FocusCardDescription>
            Elige qué alimento reemplazar hoy, {date}. Tu dieta habitual se
            conserva.
          </FocusCardDescription>
        </FocusCardHeader>
        <div className="library-swap-body">
          {!diet ? (
            <div className="library-swap-empty">
              <h3>Aún no tienes una dieta activa</h3>
              <p>
                Importa tu dieta para elegir qué alimento quieres sustituir.
              </p>
              <Button asChild variant="brand">
                <Link href="/nutricion/dieta">Ir a mi dieta</Link>
              </Button>
            </div>
          ) : !meals.length ? (
            <div className="library-swap-empty">
              <h3>No hay comidas pendientes</h3>
              <p>
                Las comidas registradas se conservan. Puedes revisar tu plan
                desde Nutrición.
              </p>
              <Link href="/nutricion">Ver mi plan</Link>
            </div>
          ) : (
            <>
              <label className="library-field">
                Reemplazar en mi dieta
                <select
                  value={targetId}
                  disabled={pending}
                  onChange={(e) => {
                    setPreview(null);
                    setTargetId(e.target.value);
                  }}
                >
                  {meals.map((meal) => (
                    <optgroup key={meal.id} label={meal.name ?? meal.mealType}>
                      {meal.items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.foodName} · {format(item.quantityG)} g
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              {loading && (
                <p role="status">
                  Calculando la porción y sus macronutrientes…
                </p>
              )}
              {error && (
                <p role="alert" className="text-destructive text-sm">
                  {error}
                </p>
              )}
              {ready && (
                <div className="library-quantity">
                  <label className="library-field">
                    Cantidad del sustituto (g)
                    <Input
                      type="number"
                      min="1"
                      max="5000"
                      step="1"
                      value={quantity}
                      disabled={pending || loading}
                      onChange={(e) => {
                        setQuantity(e.target.value);
                        setPreview(null);
                      }}
                    />
                  </label>
                  <Button
                    variant="outline"
                    disabled={pending || loading || !Number(quantity)}
                    onClick={recalculate}
                  >
                    Recalcular
                  </Button>
                </div>
              )}
              {preview && (
                <div aria-live="polite">
                  <div className="library-swap-foods">
                    <div>
                      <span>En tu dieta</span>
                      <strong>{preview.fromName}</strong>
                      <small>{format(preview.fromQuantity)} g</small>
                    </div>
                    <ArrowRight size={20} aria-hidden="true" />
                    <div>
                      <span>Sustituto</span>
                      <strong>{preview.toName}</strong>
                      <small>{format(preview.quantityG)} g</small>
                    </div>
                  </div>
                  <table className="library-comparison">
                    <caption>Aporte de las porciones</caption>
                    <thead>
                      <tr>
                        <th>Nutriente</th>
                        <th>Antes</th>
                        <th>Después</th>
                        <th>Cambio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map(([key, label, unit]) => (
                        <tr key={key}>
                          <th scope="row">{label}</th>
                          <td>{format(preview.before[key])}</td>
                          <td>{format(preview.after[key])}</td>
                          <td>
                            {preview.diff[key] > 0 ? "+" : ""}
                            {format(preview.diff[key])} {unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="library-swap-note">
                    La porción sugerida es una aproximación nutricional. Revisa
                    también el estado crudo o cocido y la etiqueta del alimento.
                  </p>
                </div>
              )}
              <Button
                variant="brand"
                disabled={!preview || loading || pending}
                onClick={confirm}
              >
                {pending ? "Procesando…" : "Confirmar cambio solo para hoy"}
              </Button>
            </>
          )}
        </div>
      </FocusCardContent>
    </FocusCard>
  );
}
