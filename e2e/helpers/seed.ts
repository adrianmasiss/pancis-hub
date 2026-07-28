import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con rol de servicio contra la base LOCAL de desarrollo.
 *
 * Las credenciales se leen de .env.local porque Playwright no carga ese
 * archivo. Es solo para pruebas locales: nunca se usa contra produccion.
 */
function readEnv(name: string): string {
  const file = readFileSync(".env.local", "utf8");
  const line = file
    .split("\n")
    .find((row) => row.trim().startsWith(`${name}=`));
  if (!line) throw new Error(`Falta ${name} en .env.local`);
  return line.split("=").slice(1).join("=").trim();
}

export function adminClient() {
  return createClient(
    readEnv("NEXT_PUBLIC_SUPABASE_URL"),
    readEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } },
  );
}

export async function findUserId(email: string): Promise<string> {
  const admin = adminClient();
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const user = data.users.find((candidate) => candidate.email === email);
  if (!user) throw new Error(`No se encontro el usuario ${email}`);
  return user.id;
}

/**
 * Siembra una dieta activa con una comida y un alimento. El flujo normal
 * de creacion pasa por la IA (subir un PDF), que no es viable en e2e.
 */
export async function seedActiveDiet(userId: string): Promise<string> {
  const admin = adminClient();

  const { data: food } = await admin
    .from("foods")
    .select("id")
    .eq("name", "Avena en hojuelas")
    .is("deleted_at", null)
    .limit(1)
    .single();

  const { data: template } = await admin
    .from("diet_templates")
    .insert({
      user_id: userId,
      name: "Plan de prueba",
      is_active: true,
      target_calories: 2000,
      target_protein: 150,
      target_carbs: 200,
      target_fat: 60,
    })
    .select("id")
    .single();

  const { data: meal } = await admin
    .from("diet_template_meals")
    .insert({
      template_id: template!.id,
      name: "Desayuno",
      meal_type: "desayuno",
      order_index: 0,
    })
    .select("id")
    .single();

  await admin.from("diet_template_items").insert({
    template_meal_id: meal!.id,
    food_id: food!.id,
    quantity_g: 80,
  });

  return template!.id;
}

/** Cambia la cantidad del unico alimento de la dieta sembrada. */
export async function changeSeededQuantity(
  templateId: string,
  quantityG: number,
): Promise<void> {
  const admin = adminClient();
  const { data: meals } = await admin
    .from("diet_template_meals")
    .select("id")
    .eq("template_id", templateId);
  await admin
    .from("diet_template_items")
    .update({ quantity_g: quantityG })
    .eq("template_meal_id", meals![0]!.id);
}

/**
 * Siembra una rutina activa con un dia y un ejercicio, y devuelve los ids
 * necesarios para verificar que el plan base no se toca al sustituir.
 */
export async function seedActiveWorkoutPlan(userId: string): Promise<{
  planId: string;
  planExerciseId: string;
  exerciseId: string;
  exerciseName: string;
}> {
  const admin = adminClient();

  // Dos ejercicios del mismo musculo, para que haya alternativa que ofrecer.
  const { data: exercises } = await admin
    .from("exercise_catalog")
    .select("id, name, primary_muscle")
    .eq("primary_muscle", "cuadriceps")
    .is("deleted_at", null)
    .limit(2);
  if (!exercises || exercises.length < 2) {
    throw new Error("El catalogo necesita 2 ejercicios de cuadriceps");
  }

  const { data: plan } = await admin
    .from("workout_plans")
    .insert({
      user_id: userId,
      name: "Rutina de prueba",
      objective: "hipertrofia",
      active: true,
    })
    .select("id")
    .single();

  const { data: day, error: dayError } = await admin
    .from("workout_plan_days")
    .insert({ workout_plan_id: plan!.id, day_index: 1, name: "Pierna" })
    .select("id")
    .single();
  if (dayError) throw new Error(`workout_plan_days: ${dayError.message}`);

  const { data: planExercise, error: planExerciseError } = await admin
    .from("workout_plan_exercises")
    .insert({
      workout_plan_day_id: day!.id,
      exercise_id: exercises[0]!.id,
      position: 1,
      sets: 4,
      target_reps_min: 8,
      target_reps_max: 10,
    })
    .select("id")
    .single();
  if (planExerciseError)
    throw new Error(`workout_plan_exercises: ${planExerciseError.message}`);

  return {
    planId: plan!.id,
    planExerciseId: planExercise!.id,
    exerciseId: exercises[0]!.id,
    exerciseName: exercises[0]!.name,
  };
}

/** Ejercicio que el plan tiene guardado ahora mismo, sin pasar por RLS. */
export async function readPlanExerciseId(
  planExerciseId: string,
): Promise<string> {
  const admin = adminClient();
  const { data } = await admin
    .from("workout_plan_exercises")
    .select("exercise_id")
    .eq("id", planExerciseId)
    .single();
  return data!.exercise_id;
}

/** Sustituciones por dia guardadas para ese ejercicio del plan. */
export async function readDaySwaps(planExerciseId: string) {
  const admin = adminClient();
  const { data } = await admin
    .from("exercise_day_swaps")
    .select("date, substitute_exercise_id, reason, source")
    .eq("plan_exercise_id", planExerciseId);
  return data ?? [];
}

/**
 * Marca el onboarding como completo sin pasar por el asistente de 6 pasos.
 * Las pruebas de sustitucion no estan verificando el onboarding, y repetirlo
 * en cada spec las hace lentas y fragiles.
 */
export async function completeOnboarding(userId: string): Promise<void> {
  const admin = adminClient();
  const { error } = await admin
    .from("profiles")
    .update({
      birth_date: "1995-05-10",
      biological_sex: "femenino",
      height_cm: 165,
      experience_level: "intermedio",
      primary_goal: "recomposicion",
      training_days_per_week: 4,
      activity_level: "moderado",
      meals_per_day: 4,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (error) throw new Error(`profiles: ${error.message}`);
}
