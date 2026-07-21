import { ArrowDownRight, ArrowUpRight, Minus, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  CompositionReport,
  MetricComparison,
} from "@/features/progress/lib/composition";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

const t = messages.progress.composition;

const DIRECTION_ICONS = {
  sube: ArrowUpRight,
  baja: ArrowDownRight,
  estable: Minus,
} as const;

/**
 * El color acompana al icono y al signo, nunca es el unico portador de la
 * informacion (a11y).
 */
const ASSESSMENT_STYLES = {
  favorable: "text-primary",
  desfavorable: "text-destructive",
  neutro: "text-muted-foreground",
} as const;

function formatDelta(value: number, unit: string): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value}${unit ? ` ${unit}` : ""}`.trim();
}

function MetricRow({ comparison }: { comparison: MetricComparison }) {
  const { metric, current, deltaPrevious, deltaBaseline } = comparison;
  const unit = t.units[metric];
  const Icon = DIRECTION_ICONS[comparison.direction];

  return (
    <li className="flex items-center gap-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-muted-foreground text-xs font-medium">
          {t.metrics[metric]}
        </p>
        <p className="text-lg font-semibold tabular-nums">
          {current}
          {unit ? <span className="text-sm font-normal"> {unit}</span> : null}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={cn(
            "flex items-center justify-end gap-1 text-sm font-medium tabular-nums",
            ASSESSMENT_STYLES[comparison.assessment],
          )}
        >
          <Icon className="size-3.5" aria-hidden="true" />
          {deltaPrevious !== null
            ? formatDelta(deltaPrevious, unit)
            : t.stable}
          <span className="text-muted-foreground text-xs font-normal">
            {t.vsPrevious}
          </span>
        </p>
        {deltaBaseline !== null ? (
          <p className="text-muted-foreground text-xs tabular-nums">
            {formatDelta(deltaBaseline, unit)}
            {comparison.percentChangeBaseline !== null
              ? ` (${formatDelta(comparison.percentChangeBaseline, "%")})`
              : null}{" "}
            {t.vsBaseline}
          </p>
        ) : null}
      </div>
    </li>
  );
}

/**
 * Evolucion de la composicion corporal medicion a medicion. Pensada para
 * leer cada InBody nuevo en contexto: contra la medicion anterior y contra
 * el punto de partida (docs/02_PRODUCT_REQUIREMENTS.md 19).
 */
export function CompositionSection({ report }: { report: CompositionReport }) {
  const hasComparisons = report.measurementCount > 1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t.title}</CardTitle>
        <p className="text-muted-foreground text-xs">{t.description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {report.isRecomposition ? (
          <div className="border-primary/40 bg-primary/5 flex gap-2 rounded-xl border p-3">
            <Sparkles
              className="text-primary mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <div>
              <p className="text-sm font-medium">{t.recompositionTitle}</p>
              <p className="text-muted-foreground text-xs">
                {t.recompositionBody}
              </p>
            </div>
          </div>
        ) : null}

        {report.comparisons.length > 0 ? (
          <ul className="divide-y">
            {report.comparisons.map((comparison) => (
              <MetricRow key={comparison.metric} comparison={comparison} />
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">
            {t.noCompositionData}
          </p>
        )}

        <p className="text-muted-foreground text-xs">
          {hasComparisons && report.daysSinceBaseline !== null
            ? t.baselineSummary
                .replace("{days}", String(report.daysSinceBaseline))
                .replace("{count}", String(report.measurementCount))
            : t.singleMeasurement}
        </p>
        <p className="text-muted-foreground text-xs">{t.derivedNote}</p>
      </CardContent>
    </Card>
  );
}
