/**
 * Verificacion de RLS y flujo de registro contra el stack local de Supabase.
 *
 * Uso: node scripts/verify-rls.mjs
 * Requiere: supabase start (stack local corriendo) y seed aplicado.
 *
 * Comprueba que:
 * - el registro crea el perfil automaticamente (trigger handle_new_user);
 * - un usuario no puede leer ni escribir datos privados de otro;
 * - los catalogos son de solo lectura para usuarios autenticados;
 * - el usuario demo del seed puede iniciar sesion y ver sus objetivos.
 */
import { createClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
const ANON =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  (() => {
    throw new Error("Define NEXT_PUBLIC_SUPABASE_ANON_KEY");
  })();

let failures = 0;
function check(name, condition, detail = "") {
  const status = condition ? "OK " : "FAIL";
  if (!condition) failures += 1;
  console.log(`[${status}] ${name}${detail ? ` — ${detail}` : ""}`);
}

function newClient() {
  return createClient(URL, ANON, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const stamp = Date.now();
const clientA = newClient();
const clientB = newClient();

// 1. Registro de dos usuarios.
const { data: userA, error: signUpErrorA } = await clientA.auth.signUp({
  email: `rls-a-${stamp}@pancis.local`,
  password: "password-a-12345",
  options: { data: { display_name: "Usuario A" } },
});
check(
  "registro usuario A",
  !signUpErrorA && !!userA.user,
  signUpErrorA?.message,
);

const { data: userB, error: signUpErrorB } = await clientB.auth.signUp({
  email: `rls-b-${stamp}@pancis.local`,
  password: "password-b-12345",
  options: { data: { display_name: "Usuario B" } },
});
check(
  "registro usuario B",
  !signUpErrorB && !!userB.user,
  signUpErrorB?.message,
);

// 2. El trigger creo los perfiles.
const { data: profileA } = await clientA
  .from("profiles")
  .select("id, display_name, locale")
  .single();
check(
  "trigger crea perfil con locale es-419",
  profileA?.id === userA.user.id && profileA?.locale === "es-419",
);

// 3. A escribe una medicion privada.
const { error: insertErrorA } = await clientA.from("body_measurements").insert({
  user_id: userA.user.id,
  weight_kg: 80,
  source: "manual",
});
check("A inserta su medicion", !insertErrorA, insertErrorA?.message);

// 4. B no ve datos de A.
const { data: bReadsMeasurements } = await clientB
  .from("body_measurements")
  .select("id");
check(
  "B no ve mediciones de A",
  (bReadsMeasurements ?? []).length === 0,
  `filas visibles: ${(bReadsMeasurements ?? []).length}`,
);

const { data: bReadsProfiles } = await clientB.from("profiles").select("id");
check(
  "B solo ve su propio perfil",
  (bReadsProfiles ?? []).length === 1 &&
    bReadsProfiles?.[0]?.id === userB.user.id,
);

// 5. B no puede escribir con el user_id de A.
const { error: spoofError } = await clientB.from("body_measurements").insert({
  user_id: userA.user.id,
  weight_kg: 1,
  source: "manual",
});
check("B no puede insertar como A", !!spoofError, spoofError?.message);

// 6. Catalogos: lectura si, escritura no.
const { data: foods } = await clientB.from("foods").select("id");
check("catalogo de alimentos legible", (foods ?? []).length >= 20);

const { error: foodInsertError } = await clientB.from("foods").insert({
  name: "Hack",
  food_group: "otro",
  calories: 0,
  protein_g: 0,
  carbohydrate_g: 0,
  fat_g: 0,
});
check("catalogo no escribible por usuarios", !!foodInsertError);

// 7. Usuario demo del seed.
const demo = newClient();
const { data: demoSession, error: demoError } =
  await demo.auth.signInWithPassword({
    email: "demo@pancis.local",
    password: "demo12345",
  });
check(
  "login del usuario demo",
  !demoError && !!demoSession.user,
  demoError?.message,
);

const { data: demoTargets } = await demo
  .from("nutrition_targets")
  .select("calories, status")
  .eq("status", "active")
  .single();
check(
  "demo ve su objetivo activo",
  demoTargets?.calories === 2091,
  `calories: ${demoTargets?.calories}`,
);

const { data: demoMeals } = await demo.from("meal_items").select("id");
check("demo ve sus meal_items via join RLS", (demoMeals ?? []).length === 6);

// B no ve los meal_items del demo.
const { data: bMealItems } = await clientB.from("meal_items").select("id");
check("B no ve meal_items de otros", (bMealItems ?? []).length === 0);

console.log(
  failures === 0
    ? "\nTodas las verificaciones de RLS pasaron."
    : `\n${failures} verificaciones fallaron.`,
);
process.exit(failures === 0 ? 0 : 1);
