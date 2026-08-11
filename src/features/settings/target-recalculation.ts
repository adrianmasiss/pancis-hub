/**
 * Recalculo de los objetivos nutricionales cuando el cuerpo o el objetivo
 * cambian (defecto D-002, segunda mitad).
 *
 * Regla de la casa: la app PROPONE y la persona confirma. Este modulo solo
 * calcula la propuesta; escribirla es una accion aparte que exige un clic.
 *
 * El calculo vive en el servidor y nunca acepta cifras del cliente, por lo
 * mismo que `importExternalFood` re-consulta al proveedor: un objetivo
 * nutricional no puede depender de lo que diga el navegador.
 *
 * SERVER-ONLY.
 */

import { createClient } from "@/lib/supabase/server";
import { getNutritionFormulas } from "@/features/onboarding/formula-queries";
import {
  calculateAge,
  calculateInitialTargets,
  type ActivityLevel,
  type BiologicalSex,
  type PrimaryGoal,
} from "@/features/onboarding/lib/nutrition-targets";
import {
  diffTargetInputs,
  evaluateTargetDrift,
  type InputChange,
  type TargetDrift,
  type TargetInputsSnapshot,
  type TargetSnapshot,
} from "@/features/onboarding/lib/target-drift";

export type TargetRecalculation = {
  activeTargetId: string;
  drift: TargetDrift;
  /** Que cambio desde que se calculo el objetivo activo. Puede venir vacio. */
  inputChanges: InputChange[];
  proposed: TargetSnapshot;
  inputs: TargetInputsSnapshot;
  /** Fecha de la medicion de peso que se uso, para poder citarla. */
  weightMeasuredAt: string;
  /** true si hubo que subir las calorias hasta la guarda sobre el basal. */
  safetyFloorApplied: boolean;
  /** Zona horaria del perfil, para fechar el objetivo nuevo donde vive. */
  timezone: string;
};

/**
 * Objetivos que la app puede proponerse recalcular.
 *
 * `manual` queda fuera a proposito: si la persona (o su nutricionista) fijo
 * las cifras a mano, la estimacion de la app no tiene autoridad para
 * pedirle que las cambie.
 */
const RECALCULABLE_SOURCES = ["estimacion_inicial", "ajuste_recomendado"];

function parseInputs(value: unknown): TargetInputsSnapshot | null {
  if (typeof value !== "object" || value === null) return null;
  const raw = value as Record<string, unknown>;
  if (
    typeof raw.weightKg !== "number" ||
    typeof raw.heightCm !== "number" ||
    typeof raw.ageYears !== "number" ||
    typeof raw.activityLevel !== "string" ||
    typeof raw.primaryGoal !== "string"
  ) {
    return null;
  }
  return {
    weightKg: raw.weightKg,
    heightCm: raw.heightCm,
    ageYears: raw.ageYears,
    activityLevel: raw.activityLevel,
    primaryGoal: raw.primaryGoal,
  };
}

/**
 * Devuelve la propuesta, o null cuando no hay nada que proponer: perfil
 * incompleto, sin peso registrado, objetivo definido a mano, o el objetivo
 * activo sigue correspondiendo al cuerpo de hoy.
 *
 * Nunca lanza: es un aviso secundario y no puede tumbar la pagina que lo
 * muestra.
 */
export async function getTargetRecalculation(
  userId: string,
): Promise<TargetRecalculation | null> {
  try {
    const supabase = await createClient();

    const [profileResult, weightResult, activeResult] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "birth_date, biological_sex, height_cm, activity_level, primary_goal, timezone",
        )
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("body_measurements")
        .select("measured_at, weight_kg")
        .eq("user_id", userId)
        .not("weight_kg", "is", null)
        .order("measured_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("nutrition_targets")
        .select(
          "id, calories, protein_g, carbohydrate_g, fat_g, fiber_g, water_ml, source, calculation_inputs",
        )
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle(),
    ]);

    const profile = profileResult.data;
    const weight = weightResult.data;
    const active = activeResult.data;

    if (!profile || !weight?.weight_kg || !active) return null;
    if (!RECALCULABLE_SOURCES.includes(active.source)) return null;
    if (
      !profile.birth_date ||
      !profile.biological_sex ||
      !profile.height_cm ||
      !profile.activity_level ||
      !profile.primary_goal
    ) {
      return null;
    }

    const inputs: TargetInputsSnapshot = {
      weightKg: Number(weight.weight_kg),
      heightCm: Number(profile.height_cm),
      ageYears: calculateAge(new Date(`${profile.birth_date}T00:00:00`)),
      activityLevel: profile.activity_level,
      primaryGoal: profile.primary_goal,
    };

    const formulas = await getNutritionFormulas();
    const recalculated = calculateInitialTargets(
      {
        biologicalSex: profile.biological_sex as BiologicalSex,
        weightKg: inputs.weightKg,
        heightCm: inputs.heightCm,
        ageYears: inputs.ageYears,
        activityLevel: profile.activity_level as ActivityLevel,
        primaryGoal: profile.primary_goal as PrimaryGoal,
      },
      formulas,
    );

    const proposed: TargetSnapshot = {
      calories: recalculated.calories,
      proteinG: recalculated.proteinG,
      carbohydrateG: recalculated.carbohydrateG,
      fatG: recalculated.fatG,
      fiberG: recalculated.fiberG,
      waterMl: recalculated.waterMl,
    };

    const drift = evaluateTargetDrift(
      {
        calories: active.calories,
        proteinG: Number(active.protein_g),
        carbohydrateG: Number(active.carbohydrate_g),
        fatG: Number(active.fat_g),
        fiberG: Number(active.fiber_g),
        waterMl: active.water_ml,
      },
      proposed,
    );

    if (!drift.material) return null;

    return {
      activeTargetId: active.id,
      drift,
      inputChanges: diffTargetInputs(
        parseInputs(active.calculation_inputs),
        inputs,
      ),
      proposed,
      inputs,
      weightMeasuredAt: weight.measured_at,
      safetyFloorApplied: recalculated.safetyFloorApplied,
      timezone: profile.timezone ?? "UTC",
    };
  } catch (error) {
    console.error("[objetivos] no se pudo evaluar el recalculo", error);
    return null;
  }
}
