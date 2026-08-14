import { Utensils } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { messages } from "@/i18n/es-419";

const t = messages.dashboard.nutrition;

/**
 * Hoy sin objetivos: no hay cifra que troquelar, asi que la pantalla lo dice
 * en vez de dibujar una tarjeta con ceros.
 */
export function NoTargetsCard() {
  return (
    <section className="surface-card px-6 py-6">
      <EmptyState
        title={t.noTargets}
        description={messages.emptyStates.nutrition.description}
        icon={Utensils}
        className="py-6"
      />
    </section>
  );
}
