"use client";

import { useMemo, useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { completeOnboarding } from "@/features/onboarding/actions";
import {
  calculateAge,
  calculateInitialTargets,
} from "@/features/onboarding/lib/nutrition-targets";
import { StepNavigation } from "@/features/onboarding/components/step-navigation";
import {
  parseCommaList,
  type OnboardingData,
} from "@/features/onboarding/schemas";
import { messages } from "@/i18n/es-419";

const s = messages.onboarding.summary;
const f = messages.onboarding.fields;

const GOAL_LABELS: Record<OnboardingData["primaryGoal"], string> = {
  recomposicion: f.goalRecomposition,
  perdida_grasa: f.goalFatLoss,
  ganancia_muscular: f.goalMuscleGain,
  mantenimiento: f.goalMaintenance,
};

type ConfirmStepProps = {
  data: OnboardingData;
  onBack: () => void;
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 text-sm">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

export function ConfirmStep({ data, onBack }: ConfirmStepProps) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const targets = useMemo(
    () =>
      calculateInitialTargets({
        biologicalSex: data.biologicalSex,
        weightKg: data.weightKg,
        heightCm: data.heightCm,
        ageYears: calculateAge(new Date(`${data.birthDate}T00:00:00`)),
        activityLevel: data.activityLevel,
        primaryGoal: data.primaryGoal,
      }),
    [data],
  );

  const preferences = [
    ...parseCommaList(data.allergies),
    ...parseCommaList(data.restrictions),
    ...parseCommaList(data.dislikedFoods),
  ];

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setServerError(null);
    startTransition(async () => {
      const result = await completeOnboarding(data);
      if (result && "error" in result) {
        setServerError(result.error);
      }
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <dl className="space-y-2">
        <SummaryRow label={s.profile} value={data.displayName} />
        <SummaryRow label={s.goal} value={GOAL_LABELS[data.primaryGoal]} />
        <SummaryRow
          label={s.activity}
          value={`${data.trainingDaysPerWeek} d/sem`}
        />
        <SummaryRow
          label={s.nutrition}
          value={preferences.length > 0 ? preferences.join(", ") : s.none}
        />
        <SummaryRow label={s.baseline} value={`${data.weightKg} kg`} />
      </dl>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{s.targets}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2">
            <SummaryRow
              label={s.calories}
              value={`${targets.calories} kcal ${s.perDay}`}
            />
            <SummaryRow label={s.protein} value={`${targets.proteinG} g`} />
            <SummaryRow label={s.carbs} value={`${targets.carbohydrateG} g`} />
            <SummaryRow label={s.fat} value={`${targets.fatG} g`} />
            <SummaryRow label={s.fiber} value={`${targets.fiberG} g`} />
            <SummaryRow label={s.water} value={`${targets.waterMl} ml`} />
          </dl>
          <Separator className="my-3" />
          {/*
            NUT-008: el piso de seguridad deja de aplicarse en silencio. Es un
            aviso, no un error: el objetivo es valido, pero el usuario tiene
            que saber que se le subio y por que la guarda es imperfecta.
          */}
          {targets.safetyFloorApplied ? (
            <p className="text-caution mb-2 text-xs text-balance">
              {s.safetyFloorApplied}
            </p>
          ) : null}
          <p className="text-muted-foreground text-xs text-balance">
            {messages.onboarding.estimateNotice}
          </p>
        </CardContent>
      </Card>

      {serverError ? (
        <p role="alert" className="text-destructive text-sm">
          {serverError}
        </p>
      ) : null}
      <StepNavigation
        onBack={onBack}
        submitLabel={messages.onboarding.finish}
        pending={pending}
      />
    </form>
  );
}
