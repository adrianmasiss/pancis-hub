"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Badge } from "@/components/ui/badge";
import { StepNavigation } from "@/features/onboarding/components/step-navigation";
import { goalSchema, type GoalInput } from "@/features/onboarding/schemas";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

const f = messages.onboarding.fields;

const GOAL_OPTIONS: {
  value: GoalInput["primaryGoal"];
  label: string;
  help?: string;
  highlighted?: boolean;
}[] = [
  {
    value: "recomposicion",
    label: f.goalRecomposition,
    help: f.goalRecompositionHelp,
    highlighted: true,
  },
  { value: "perdida_grasa", label: f.goalFatLoss },
  { value: "ganancia_muscular", label: f.goalMuscleGain },
  { value: "mantenimiento", label: f.goalMaintenance },
];

type GoalStepProps = {
  defaultValues: Partial<GoalInput>;
  onNext: (data: GoalInput) => void;
  onBack: () => void;
};

export function GoalStep({ defaultValues, onNext, onBack }: GoalStepProps) {
  const form = useForm<GoalInput>({
    resolver: zodResolver(goalSchema),
    defaultValues: { primaryGoal: defaultValues.primaryGoal },
  });
  const selected = useWatch({ control: form.control, name: "primaryGoal" });
  const error = form.formState.errors.primaryGoal?.message;

  return (
    <form onSubmit={form.handleSubmit(onNext)} className="space-y-4" noValidate>
      <fieldset className="space-y-2">
        <legend className="sr-only">{f.goal}</legend>
        {GOAL_OPTIONS.map((option) => (
          <label
            key={option.value}
            className={cn(
              "flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
              selected === option.value
                ? "border-primary bg-accent"
                : "hover:bg-accent/50",
            )}
          >
            <input
              type="radio"
              value={option.value}
              className="mt-1 accent-current"
              {...form.register("primaryGoal")}
            />
            <span className="space-y-1">
              <span className="flex items-center gap-2 text-sm font-medium">
                {option.label}
                {option.highlighted ? (
                  <Badge variant="secondary">
                    {messages.common.recommended}
                  </Badge>
                ) : null}
              </span>
              {option.help ? (
                <span className="text-muted-foreground block text-xs">
                  {option.help}
                </span>
              ) : null}
            </span>
          </label>
        ))}
      </fieldset>
      {error ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      <StepNavigation onBack={onBack} />
    </form>
  );
}
