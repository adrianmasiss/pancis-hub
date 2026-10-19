import { ActionLink } from "@/components/ui/action";
import { UtensilsCrossed } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { AddMealDialog } from "./add-meal-dialog";

/**
 * Pantalla completa, no tarjeta dentro del tablero.
 *
 * Con el tablero puesto, quien llega por primera vez ve cuatro ceros, una
 * meta que no eligio y dos tarjetas laterales que no puede usar todavia.
 * Nada de eso es informacion: es ruido con forma de dato. Aqui la pantalla
 * se reduce a una sola direccion y a las dos salidas reales del producto —
 * subir el plan que ya tienes, o empezar por una comida suelta.
 */
export function NutritionGettingStarted({ date }: { date: string }) {
  return (
    <EmptyState
      size="page"
      tone="warm"
      icon={UtensilsCrossed}
      className="nutrition-start-surface"
      title="Todavía no tienes un plan"
      description="Cuando subas tu dieta, aquí verás cada comida del día con su hora, sus macros y los sustitutos que cuadran con tu meta. Si no tienes un plan escrito, empieza registrando una comida: el resumen del día funciona igual."
      action={
        <ActionLink family="add" href="/nutricion/dieta">
          Importar mi dieta
        </ActionLink>
      }
      secondaryAction={<AddMealDialog date={date} />}
      suggestionsLabel="Mientras tanto"
      suggestions={[
        {
          label: "Explorar la biblioteca de alimentos",
          href: "/nutricion/alimentos",
        },
        {
          label: "Comparar dos comidas",
          href: "/nutricion/comparar",
        },
        {
          label: "Preguntarle al copiloto qué comer hoy",
          href: "/asistente?q=Ay%C3%BAdame%20a%20armar%20un%20plan%20de%20comidas%20para%20hoy",
        },
      ]}
    />
  );
}
