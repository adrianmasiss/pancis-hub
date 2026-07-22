import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

const t = messages.assistant.contextual;

/**
 * Acceso al asistente desde una comida, un alimento o un ejercicio
 * (docs/02_PRODUCT_REQUIREMENTS.md 15).
 *
 * Las preguntas se redactan de forma que activen los motores que ya
 * existen: "no tengo X" dispara las equivalencias de alimentos y "no
 * puedo hacer X" dispara la comparacion biomecanica. Asi el acceso
 * contextual no es solo un atajo de navegacion, sino que llega con la
 * respuesta util ya preparada.
 */
export const contextualQuestions = {
  meal: (name: string) => t.mealQuestion.replace("{name}", name),
  food: (name: string) => t.foodQuestion.replace("{name}", name),
  exercise: (name: string) => t.exerciseQuestion.replace("{name}", name),
} as const;

export function AskAboutButton({
  question,
  label,
  className,
}: {
  question: string;
  /** Se usa en el nombre accesible, para distinguir un boton de otro. */
  label: string;
  className?: string;
}) {
  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      className={cn("text-muted-foreground size-8", className)}
    >
      <Link
        href={`/asistente?q=${encodeURIComponent(question)}`}
        aria-label={`${t.ask} — ${label}`}
      >
        <Sparkles className="size-4" aria-hidden="true" />
      </Link>
    </Button>
  );
}
