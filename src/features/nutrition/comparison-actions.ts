"use server";

import { createClient } from "@/lib/supabase/server";
import { todayInTimezone } from "@/lib/dates";
import { getComparisonMeals } from "./compare-queries";

export async function loadComparisonSources() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Inicia sesión para cargar tus comidas." };
  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", user.id)
    .maybeSingle();
  return getComparisonMeals(
    user.id,
    todayInTimezone(profile?.timezone ?? "America/Costa_Rica"),
  );
}
