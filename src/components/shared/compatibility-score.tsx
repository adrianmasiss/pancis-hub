import { macroLabel, type MacroType } from "@/components/shared/macro-chip";
import type { CompatibilityScore as Score } from "@/features/foods/lib/equivalence";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

const t = messages.swap;

const BREAKDOWN: { type: MacroType; key: keyof Omit<Score, "overall"> }[] = [
  { type: "calories", key: "calories" },
  { type: "protein", key: "proteinG" },
  { type: "carbs", key: "carbohydrateG" },
  { type: "fat", key: "fatG" },
  { type: "fiber", key: "fiberG" },
];

/**
 * Color por tramo. No se usa el color como unico portador de informacion:
 * el numero siempre esta visible junto al indicador (a11y).
 */
function toneFor(score: number): string {
  if (score >= 8) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 6) return "text-amber-600 dark:text-amber-400";
  return "text-destructive";
}

/**
 * Puntuacion de compatibilidad de una sustitucion, con su desglose por
 * macro. Se muestra siempre acompanada de la advertencia de que es una
 * aproximacion (docs/DECISIONS.md).
 */
export function CompatibilityScore({
  score,
  className,
}: {
  score: Score;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="flex items-baseline gap-1.5 text-sm">
        <span className="text-muted-foreground">{t.compatibility}:</span>
        <span className={cn("font-semibold tabular-nums", toneFor(score.overall))}>
          {t.compatibilityOf10.replace("{score}", String(score.overall))}
        </span>
      </p>
      <ul className="text-muted-foreground flex flex-wrap gap-x-2.5 gap-y-0.5 text-xs">
        {BREAKDOWN.map(({ type, key }) => (
          <li key={type} className="tabular-nums">
            {macroLabel(type)} {score[key]}/10
          </li>
        ))}
      </ul>
    </div>
  );
}
