import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type {
  FindingPriority,
  RoutineAnalysis,
} from "@/features/training/lib/routine-analysis";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

const t = messages.training.biomechanics;

/** El color acompana siempre a la etiqueta de prioridad, nunca va solo. */
const PRIORITY_STYLES: Record<FindingPriority, string> = {
  alta: "border-destructive/40 bg-destructive/5",
  mejora: "border-caution/40 bg-caution/8",
  opcional: "border-border bg-muted/40",
  observacion: "border-border bg-muted/40",
  sin_cambios: "border-primary/40 bg-primary/5",
};

/**
 * Analisis completo de la rutina: volumen, frecuencia, patrones y
 * hallazgos priorizados (docs/02_PRODUCT_REQUIREMENTS.md 14).
 *
 * Es informativo: no modifica la rutina.
 */
export function RoutineAnalysisSection({
  analysis,
}: {
  analysis: RoutineAnalysis;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t.analysisTitle}</CardTitle>
        <p className="text-muted-foreground text-xs">{t.analysisDescription}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {analysis.findings.map((finding, index) => (
            <li
              key={`${finding.title}-${index}`}
              className={cn(
                "space-y-1 rounded-xl border p-3",
                PRIORITY_STYLES[finding.priority],
              )}
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="font-normal">
                  {t.priorities[finding.priority]}
                </Badge>
                <span className="text-sm font-medium">{finding.title}</span>
              </div>
              <p className="text-muted-foreground text-xs">{finding.detail}</p>
            </li>
          ))}
        </ul>

        {analysis.weeklySetsByMuscle.length > 0 ? (
          <section className="space-y-1">
            <h3 className="text-sm font-medium">{t.weeklyVolume}</h3>
            <ul className="text-muted-foreground grid grid-cols-2 gap-x-4 text-xs sm:grid-cols-3">
              {analysis.weeklySetsByMuscle.map((entry) => (
                <li
                  key={entry.muscle}
                  className="flex justify-between gap-2 tabular-nums"
                >
                  <span className="truncate">{entry.muscle}</span>
                  <span className="font-medium">{entry.sets}</span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {analysis.frequencyByMuscle.length > 0 ? (
          <section className="space-y-1">
            <h3 className="text-sm font-medium">{t.frequency}</h3>
            <ul className="text-muted-foreground grid grid-cols-2 gap-x-4 text-xs sm:grid-cols-3">
              {analysis.frequencyByMuscle.map((entry) => (
                <li
                  key={entry.muscle}
                  className="flex justify-between gap-2 tabular-nums"
                >
                  <span className="truncate">{entry.muscle}</span>
                  <span className="font-medium">
                    {t.frequencyValue.replace("{days}", String(entry.days))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <p className="text-muted-foreground text-xs">{t.analysisDisclaimer}</p>
      </CardContent>
    </Card>
  );
}
