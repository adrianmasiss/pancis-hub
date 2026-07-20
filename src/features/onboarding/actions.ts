"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { messages } from "@/i18n/es-419";
import {
  calculateAge,
  calculateInitialTargets,
} from "@/features/onboarding/lib/nutrition-targets";
import {
  onboardingSchema,
  parseCommaList,
  type OnboardingData,
} from "@/features/onboarding/schemas";

export type OnboardingActionResult = { error: string };

export async function completeOnboarding(
  input: OnboardingData,
): Promise<OnboardingActionResult> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return { error: messages.onboarding.errors.saveFailed };
  }
  const data = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const birthDate = new Date(`${data.birthDate}T00:00:00`);
  const targets = calculateInitialTargets({
    biologicalSex: data.biologicalSex,
    weightKg: data.weightKg,
    heightCm: data.heightCm,
    ageYears: calculateAge(birthDate),
    activityLevel: data.activityLevel,
    primaryGoal: data.primaryGoal,
  });

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      display_name: data.displayName,
      birth_date: data.birthDate,
      biological_sex: data.biologicalSex,
      height_cm: data.heightCm,
      timezone: data.timezone,
      unit_system: data.unitSystem,
      primary_goal: data.primaryGoal,
      experience_level: data.experienceLevel,
      training_days_per_week: data.trainingDaysPerWeek,
      // Los opcionales de texto pueden llegar como cadena vacia: || null
      // evita insertar "" en columnas time/text.
      training_type: data.trainingType || null,
      activity_level: data.activityLevel,
      daily_steps: data.dailySteps ?? null,
      meals_per_day: data.mealsPerDay,
      usual_training_time: data.usualTrainingTime || null,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    return { error: messages.onboarding.errors.saveFailed };
  }

  const preferenceRows = [
    ...parseCommaList(data.allergies).map((value) => ({
      user_id: user.id,
      preference_type: "alergia",
      value,
    })),
    ...parseCommaList(data.restrictions).map((value) => ({
      user_id: user.id,
      preference_type: "restriccion",
      value,
    })),
    ...parseCommaList(data.dislikedFoods).map((value) => ({
      user_id: user.id,
      preference_type: "alimento_no_deseado",
      value,
    })),
  ];

  if (preferenceRows.length > 0) {
    const { error } = await supabase
      .from("dietary_preferences")
      .insert(preferenceRows);
    if (error) {
      return { error: messages.onboarding.errors.saveFailed };
    }
  }

  const { error: measurementError } = await supabase
    .from("body_measurements")
    .insert({
      user_id: user.id,
      measured_at: data.measuredAt,
      weight_kg: data.weightKg,
      body_fat_percentage: data.bodyFatPercentage ?? null,
      skeletal_muscle_kg: data.skeletalMuscleKg ?? null,
      waist_cm: data.waistCm ?? null,
      source: data.measurementSource,
    });

  if (measurementError) {
    return { error: messages.onboarding.errors.saveFailed };
  }

  // Historial de objetivos: el activo previo (si existiera) se archiva,
  // nunca se borra ni se modifica un registro pasado.
  await supabase
    .from("nutrition_targets")
    .update({ status: "superseded" })
    .eq("user_id", user.id)
    .eq("status", "active");

  const { error: targetsError } = await supabase
    .from("nutrition_targets")
    .insert({
      user_id: user.id,
      effective_from: new Date().toISOString().slice(0, 10),
      calories: targets.calories,
      protein_g: targets.proteinG,
      carbohydrate_g: targets.carbohydrateG,
      fat_g: targets.fatG,
      fiber_g: targets.fiberG,
      water_ml: targets.waterMl,
      source: "estimacion_inicial",
      status: "active",
    });

  if (targetsError) {
    return { error: messages.onboarding.errors.saveFailed };
  }

  redirect("/");
}
