"use client";

import { useState } from "react";
import { Section } from "@/components/shared/section";
import { Progress } from "@/components/ui/progress";
import { ActivityStep } from "@/features/onboarding/components/steps/activity-step";
import { BaselineStep } from "@/features/onboarding/components/steps/baseline-step";
import { BasicsStep } from "@/features/onboarding/components/steps/basics-step";
import { ConfirmStep } from "@/features/onboarding/components/steps/confirm-step";
import { GoalStep } from "@/features/onboarding/components/steps/goal-step";
import { NutritionStep } from "@/features/onboarding/components/steps/nutrition-step";
import type { OnboardingData } from "@/features/onboarding/schemas";
import { messages } from "@/i18n/es-419";

const STEPS = [
  messages.onboarding.steps.basics,
  messages.onboarding.steps.goal,
  messages.onboarding.steps.activity,
  messages.onboarding.steps.nutrition,
  messages.onboarding.steps.baseline,
  messages.onboarding.steps.confirm,
] as const;

type OnboardingWizardProps = {
  initialDisplayName: string;
};

export function OnboardingWizard({
  initialDisplayName,
}: OnboardingWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<Partial<OnboardingData>>({
    displayName: initialDisplayName,
  });

  const advance = (partial: Partial<OnboardingData>) => {
    setData((previous) => ({ ...previous, ...partial }));
    setStepIndex((index) => Math.min(index + 1, STEPS.length - 1));
  };
  const goBack = () => setStepIndex((index) => Math.max(index - 1, 0));

  const step = STEPS[stepIndex] ?? STEPS[0];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm">
          {messages.onboarding.stepLabel} {stepIndex + 1}{" "}
          {messages.onboarding.ofLabel} {STEPS.length}
        </p>
        <Progress
          value={((stepIndex + 1) / STEPS.length) * 100}
          aria-label={`${messages.onboarding.stepLabel} ${stepIndex + 1} ${messages.onboarding.ofLabel} ${STEPS.length}`}
        />
      </div>

      <Section title={step.title} description={step.description}>
        <div>
          {stepIndex === 0 ? (
            <BasicsStep defaultValues={data} onNext={advance} />
          ) : null}
          {stepIndex === 1 ? (
            <GoalStep defaultValues={data} onNext={advance} onBack={goBack} />
          ) : null}
          {stepIndex === 2 ? (
            <ActivityStep
              defaultValues={data}
              onNext={advance}
              onBack={goBack}
            />
          ) : null}
          {stepIndex === 3 ? (
            <NutritionStep
              defaultValues={data}
              onNext={advance}
              onBack={goBack}
            />
          ) : null}
          {stepIndex === 4 ? (
            <BaselineStep
              defaultValues={data}
              onNext={advance}
              onBack={goBack}
            />
          ) : null}
          {stepIndex === 5 ? (
            <ConfirmStep data={data as OnboardingData} onBack={goBack} />
          ) : null}
        </div>
      </Section>
    </div>
  );
}
