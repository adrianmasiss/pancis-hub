import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { DietTemplateView } from "@/features/dashboard/queries";
import { messages } from "@/i18n/es-419";

const t = messages.dashboard.nutrition;
const n = messages.nutrition;

/**
 * La siguiente comida del plan, resuelta desde la plantilla activa: la primera
 * en orden que todavia no se ha registrado hoy.
 *
 * Va aparte del componente por lo mismo que el resto de esta pantalla: es una
 * decision de producto —cual es "la siguiente"— y se prueba sin React.
 */
export function nextPendingMeal(template: DietTemplateView | null) {
  if (!template) return null;
  const pending = [...template.meals]
    .sort((a, b) => a.orderIndex - b.orderIndex)
    .find((meal) => !meal.loggedToday);
  if (!pending) return null;

  return {
    name:
      pending.name ||
      n.mealTypes[pending.mealType as keyof typeof n.mealTypes] ||
      pending.mealType,
    foods: pending.items.map((item) => item.foodName),
    calories: Math.round(pending.totals.calories),
  };
}

/**
 * "Proxima comida" — la fila entre los macros y el boton (nodo 7:34).
 *
 * Responde la pregunta que sigue naturalmente a "me faltan 751 kcal": ¿y
 * entonces que como ahora? Sin ella hay que entrar a Nutricion y buscarlo, que
 * es exactamente el toque de mas que esta pantalla existe para quitar.
 *
 * Capsula de radio 34, no tarjeta de 26: la maqueta la trata como una fila
 * accionable, no como un bloque de contenido.
 */
export function NextMealRow({
  meal,
}: {
  meal: ReturnType<typeof nextPendingMeal>;
}) {
  if (!meal) {
    return (
      <p className="text-muted-foreground px-1 text-[0.8125rem]">
        {t.nextMealEmptyHint}
      </p>
    );
  }

  const summary = meal.foods.slice(0, 3).join(", ");

  return (
    <Link
      href="/nutricion"
      className="surface-card text-foreground hover:bg-card-raised flex h-[68px] items-center gap-3.5 rounded-3xl px-[18px] transition-colors duration-[var(--dur-fast)]"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">
          {t.nextMeal.replace("{meal}", meal.name)}
        </span>
        <span className="text-muted-foreground mt-0.5 block truncate text-xs">
          {summary ? `${summary} · ` : ""}
          <span className="num">
            {meal.calories.toLocaleString("es-419")}
          </span>{" "}
          {n.kcal}
        </span>
      </span>
      <ChevronRight
        className="text-muted-foreground size-5 shrink-0"
        aria-hidden="true"
      />
    </Link>
  );
}
