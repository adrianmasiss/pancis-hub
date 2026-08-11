"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { recordChange } from "@/lib/audit";
import { todayInTimezone } from "@/lib/dates";
import { messages } from "@/i18n/es-419";
import { getTargetRecalculation } from "@/features/settings/target-recalculation";

const t = messages.settings.targets;

export type ApplyTargetsResult =
  { error: string } | { unchanged: true } | { success: true };

/**
 * Adopta los objetivos recalculados como la version activa.
 *
 * No recibe cifras: las vuelve a calcular en el servidor. Lo que llega del
 * navegador es unicamente la INTENCION de aceptar, nunca el numero.
 *
 * El objetivo anterior no se borra ni se sobreescribe, se archiva: el
 * historial de objetivos es parte del registro del usuario.
 */
export async function applyRecalculatedTargets(): Promise<ApplyTargetsResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: t.applyFailed };

  const recalculation = await getTargetRecalculation(user.id);
  // La pantalla se quedo atras: entre que se pinto y se hizo clic, los
  // objetivos ya coinciden con los datos de hoy.
  if (!recalculation) return { unchanged: true };

  const { proposed, inputs, drift, activeTargetId, timezone } = recalculation;

  const { error: archiveError } = await supabase
    .from("nutrition_targets")
    .update({ status: "superseded" })
    .eq("id", activeTargetId)
    .eq("user_id", user.id);
  if (archiveError) return { error: t.applyFailed };

  const { data: inserted, error: insertError } = await supabase
    .from("nutrition_targets")
    .insert({
      user_id: user.id,
      // La fecha del perfil, no la del servidor: probandolo a las 23:00 en
      // Costa Rica el objetivo quedaba fechado el dia siguiente.
      effective_from: todayInTimezone(timezone),
      calories: proposed.calories,
      protein_g: proposed.proteinG,
      carbohydrate_g: proposed.carbohydrateG,
      fat_g: proposed.fatG,
      fiber_g: proposed.fiberG,
      water_ml: proposed.waterMl,
      calculation_inputs: inputs,
      source: "ajuste_recomendado",
      status: "active",
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    // Devolver el anterior a activo: el indice unico solo deja un activo por
    // usuario, asi que archivar antes de insertar es obligatorio, y quedarse
    // sin ninguno seria peor que no haber cambiado nada.
    await supabase
      .from("nutrition_targets")
      .update({ status: "active" })
      .eq("id", activeTargetId)
      .eq("user_id", user.id);
    return { error: t.applyFailed };
  }

  await recordChange({
    actorUserId: user.id,
    action: "objetivos_recalculados",
    entity: "nutrition_targets",
    entityId: inserted.id,
    previousValues: {
      calorias: drift.calories.from,
      proteina_g: drift.proteinG.from,
      carbohidratos_g: drift.carbohydrateG.from,
      grasas_g: drift.fatG.from,
      fibra_g: drift.fiberG.from,
      agua_ml: drift.waterMl.from,
    },
    newValues: {
      calorias: drift.calories.to,
      proteina_g: drift.proteinG.to,
      carbohidratos_g: drift.carbohydrateG.to,
      grasas_g: drift.fatG.to,
      fibra_g: drift.fiberG.to,
      agua_ml: drift.waterMl.to,
      peso_kg: inputs.weightKg,
      objetivo: inputs.primaryGoal,
      actividad: inputs.activityLevel,
    },
    reason: t.auditReason,
    origin: "usuario",
  });

  revalidatePath("/");
  revalidatePath("/configuracion");
  revalidatePath("/nutricion");
  return { success: true };
}
