import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * El aviso de toda rutina generada por IA. Visible siempre que se muestre
 * una: no es letra pequeña.
 */
export function AiNotice({ className }: { className?: string }) {
  return (
    <p className={cn("ai-notice", className)} role="note">
      <Sparkles size={14} aria-hidden="true" />
      <span>
        <strong>Generada por IA.</strong> Es una guía general y no sustituye a
        un profesional. Si tienes una lesión o dudas, consulta a tu entrenador o
        médico.
      </span>
    </p>
  );
}
