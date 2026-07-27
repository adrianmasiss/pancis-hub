import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

type ErrorStateProps = {
  title?: string;
  description?: string;
  /** Accion de reintento. Se omite el boton si no se pasa. */
  onRetry?: () => void;
  /** Detalle tecnico (digest del error). Solo se muestra si existe. */
  detail?: string;
  className?: string;
};

/**
 * Gemelo de EmptyState para fallos de carga.
 *
 * Comparte metrica y jerarquia con el vacio, y se separa por dos senales:
 * filete continuo en vez de discontinuo (el discontinuo dice "aun no hay
 * nada", el continuo dice "esto se rompio") y el token de estado --critical
 * en el glifo. El color nunca va solo: siempre lo acompana el icono y el
 * titulo, segun la regla 1 del sistema.
 */
export function ErrorState({
  title = messages.errorState.title,
  description = messages.errorState.description,
  onRetry,
  detail,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "border-hairline flex flex-col items-center justify-center gap-3 rounded-lg border px-6 py-12 text-center sm:py-14",
        className,
      )}
    >
      <AlertTriangle
        className="text-critical size-6"
        aria-hidden="true"
        strokeWidth={1.5}
      />
      <h2 className="text-[0.9375rem] font-medium tracking-[-0.012em]">
        {title}
      </h2>
      <p className="text-muted-foreground max-w-[46ch] text-[0.8125rem] leading-relaxed text-balance">
        {description}
      </p>
      {onRetry ? (
        <div className="pt-1">
          <Button variant="outline" size="sm" onClick={onRetry}>
            {messages.common.retry}
          </Button>
        </div>
      ) : null}
      {detail ? (
        <p className="text-muted-foreground/60 num pt-1 text-[0.6875rem]">
          {detail}
        </p>
      ) : null}
    </div>
  );
}
