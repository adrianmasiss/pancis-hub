import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/*
  Tablas con datos del usuario, con sus hijas anidadas donde aplica. Va con
  la sesion del propio usuario: RLS garantiza que solo salga lo suyo. Las
  fotos de progreso salen como metadatos (rutas privadas), no como archivos.
*/
const TABLAS: { tabla: string; select: string }[] = [
  { tabla: "body_measurements", select: "*, measurement_segments(*)" },
  { tabla: "progress_photos", select: "*" },
  { tabla: "meals", select: "*, meal_items(*)" },
  { tabla: "water_logs", select: "*" },
  { tabla: "nutrition_targets", select: "*" },
  {
    tabla: "diet_templates",
    select: "*, diet_template_meals(*, diet_template_items(*))",
  },
  { tabla: "diet_item_day_swaps", select: "*" },
  { tabla: "diet_meal_day_times", select: "*" },
  { tabla: "dietary_preferences", select: "*" },
  { tabla: "favorites", select: "*" },
  { tabla: "food_user_corrections", select: "*" },
  { tabla: "pantry_items", select: "*" },
  {
    tabla: "workout_plans",
    select: "*, workout_plan_days(*, workout_plan_exercises(*))",
  },
  { tabla: "workout_sessions", select: "*, workout_sets(*)" },
  { tabla: "workout_session_exercises", select: "*" },
  { tabla: "exercise_day_swaps", select: "*" },
  { tabla: "exercise_favorites", select: "*" },
  { tabla: "daily_checkins", select: "*" },
  { tabla: "ai_conversations", select: "*, ai_messages(*)" },
];

/** Descarga de todos los datos del usuario en JSON. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sin sesión" }, { status: 401 });

  const { data: perfil } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const datos: Record<string, unknown> = {
    exportado: new Date().toISOString(),
    cuenta: { id: user.id, email: user.email },
    perfil,
  };
  for (const { tabla, select } of TABLAS) {
    const { data, error } = await supabase
      // Las tablas se nombran desde la lista de arriba, no desde la peticion.
      .from(tabla as "meals")
      .select(select)
      .eq("user_id", user.id);
    datos[tabla] = error ? { error: error.message } : data;
  }

  const fecha = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(datos, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="pancis-hub-${fecha}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
