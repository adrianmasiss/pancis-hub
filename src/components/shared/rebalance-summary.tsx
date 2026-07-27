import { MacroChip } from "@/components/shared/macro-chip";
import type { RebalanceReport } from "@/features/nutrition/lib/rebalance";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

const t = messages.swap;

const SEVERITY_STYLES = {
  alta: "border-destructive/40 bg-destructive/5",
  media: "border-caution/40 bg-caution/8",
  informativa: "border-border bg-muted/40",
} as const;

/**
 * Como queda el dia despues de un cambio: lo que resta contra el objetivo
 * y las sugerencias ordenadas por prioridad.
 *
 * Es puramente informativo. Ninguna sugerencia se aplica sola: modificar
 * otras comidas siempre requiere una accion explicita del usuario
 * (docs/02_PRODUCT_REQUIREMENTS.md 6).
 */
export function RebalanceSummary({
  report,
  className,
}: {
  report: RebalanceReport;
  className?: string;
}) {
  const { remaining, suggestions } = report;

  return (
    <section className={cn("space-y-2 rounded-xl border p-3", className)}>
      <h3 className="text-sm font-medium">{t.rebalanceTitle}</h3>

      <p className="text-muted-foreground flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs">
        <span>{t.rebalanceRemaining}:</span>
        <MacroChip type="calories" value={remaining.calories} />
        <MacroChip type="protein" value={remaining.proteinG} />
        <MacroChip type="carbs" value={remaining.carbohydrateG} />
        <MacroChip type="fat" value={remaining.fatG} />
        <MacroChip type="fiber" value={remaining.fiberG} />
      </p>

      <ul className="space-y-1.5">
        {suggestions.map((suggestion, index) => (
          <li
            key={`${suggestion.macro ?? "general"}-${index}`}
            className={cn(
              "rounded-lg border px-2.5 py-1.5 text-xs",
              SEVERITY_STYLES[suggestion.severity],
            )}
          >
            {suggestion.message}
          </li>
        ))}
      </ul>

      <p className="text-muted-foreground text-xs">{t.rebalanceApplyNote}</p>
    </section>
  );
}
