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
