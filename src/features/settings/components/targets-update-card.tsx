"use client";

import { useTransition } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/shared/section";
import { applyRecalculatedTargets } from "@/features/settings/target-actions";
import type { TargetChange } from "@/features/onboarding/lib/target-drift";
import type { TargetRecalculation } from "@/features/settings/target-recalculation";
import { messages } from "@/i18n/es-419";

const t = messages.settings.targets;
const s = messages.onboarding.summary;

const GOAL_LABELS: Record<string, string> = {
  recomposicion: messages.onboarding.fields.goalRecomposition,
  perdida_grasa: messages.onboarding.fields.goalFatLoss,
  ganancia_muscular: messages.onboarding.fields.goalMuscleGain,
  mantenimiento: messages.onboarding.fields.goalMaintenance,
};

const ACTIVITY_LABELS: Record<string, string> = {
  sedentario: messages.onboarding.fields.sedentary,
  ligero: messages.onboarding.fields.light,
  moderado: messages.onboarding.fields.moderate,
  alto: messages.onboarding.fields.high,
};

/**
 * La fecha llega como AAAA-MM-DD. Se le añade la hora local para que no la
 * interpreten como UTC y retroceda un dia, el mismo bug que ya aparecio en
 * los formularios de fecha.
 */
function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-419", {
    day: "numeric",
    month: "long",
  }).format(new Date(`${iso}T00:00:00`));
}

/** Las cinco frases del "que cambio", cada una con sus dos valores. */
function describeChange(
  change: TargetRecalculation["inputChanges"][number],
): string {
  const label = (value: string | number, map: Record<string, string>) =>
    map[String(value)] ?? String(value);

  switch (change.field) {
    case "weightKg":
      return t.changedWeight
        .replace("{from}", String(change.from))
        .replace("{to}", String(change.to));
    case "heightCm":
      return t.changedHeight
        .replace("{from}", String(change.from))
        .replace("{to}", String(change.to));
    case "ageYears":
      return t.changedAge
        .replace("{from}", String(change.from))
        .replace("{to}", String(change.to));
    case "activityLevel":
      return t.changedActivity
        .replace("{from}", label(change.from, ACTIVITY_LABELS))
        .replace("{to}", label(change.to, ACTIVITY_LABELS));
    case "primaryGoal":
      return t.changedGoal
        .replace("{from}", label(change.from, GOAL_LABELS))
        .replace("{to}", label(change.to, GOAL_LABELS));
  }
}

function ComparisonRow({
  label,
  change,
  unit,
}: {
  label: string;
  change: TargetChange;
  unit: string;
}) {
  const same = change.delta === 0;
  return (
    <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 py-1.5 text-sm">
      <dt className="text-muted-foreground truncate">{label}</dt>
      <dd className="flex items-center gap-2 tabular-nums">
        <span className={same ? "" : "text-muted-foreground line-through"}>
          {change.from} {unit}
        </span>
        {same ? null : (
          <>
            <ArrowRight
              className="text-muted-foreground size-3.5 shrink-0"
              aria-hidden="true"
            />
            <span className="font-medium">
              {change.to} {unit}
            </span>
          </>
        )}
      </dd>
    </div>
  );
}

/**
 * Aviso de que los objetivos guardados ya no corresponden al cuerpo de hoy.
 *
 * Se renderiza solo cuando la diferencia supera el ruido del metodo, asi que
 * su sola presencia ya es informacion. Muestra las dos columnas de cifras
 * porque el usuario no puede consentir un cambio que no ve.
 */
export function TargetsUpdateCard({
  recalculation,
}: {
  recalculation: TargetRecalculation;
}) {
  const [pending, startTransition] = useTransition();
  const { drift, inputChanges, weightMeasuredAt, safetyFloorApplied } =
    recalculation;

  const onApply = () => {
    startTransition(async () => {
      const result = await applyRecalculatedTargets();
      if ("error" in result) toast.error(result.error);
      else if ("unchanged" in result) toast.info(t.unchanged);
      else toast.success(t.applied);
    });
  };

  return (
    <Section title={t.title} description={t.description}>
      <div className="flex flex-col gap-5">
        {inputChanges.length > 0 ? (
          <ul className="flex flex-col gap-1 text-sm">
            {inputChanges.map((change) => (
              <li key={change.field} className="text-balance">
                {describeChange(change)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm text-balance">
            {t.noInputHistory}
          </p>
        )}

        <dl className="max-w-md">
          <ComparisonRow
            label={s.calories}
            change={drift.calories}
            unit="kcal"
          />
          <ComparisonRow label={s.protein} change={drift.proteinG} unit="g" />
          <ComparisonRow
            label={s.carbs}
            change={drift.carbohydrateG}
            unit="g"
          />
          <ComparisonRow label={s.fat} change={drift.fatG} unit="g" />
          <ComparisonRow label={s.fiber} change={drift.fiberG} unit="g" />
          <ComparisonRow label={s.water} change={drift.waterMl} unit="ml" />
        </dl>

        {safetyFloorApplied ? (
          <p className="text-caution text-xs text-balance">{t.safetyFloor}</p>
        ) : null}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <Button onClick={onApply} disabled={pending}>
            {pending ? messages.common.loading : t.apply}
          </Button>
          <p className="text-muted-foreground text-xs">
            {t.weightMeasured.replace("{date}", formatDate(weightMeasuredAt))}{" "}
            {t.estimateNotice}
          </p>
        </div>
      </div>
    </Section>
  );
}
