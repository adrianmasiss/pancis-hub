import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  adminClient,
  completeOnboarding,
  seedActiveWorkoutPlan,
} from "./helpers/seed";
const env = readFileSync(".env.local", "utf8");
const url = env.match(/^NEXT_PUBLIC_SUPABASE_URL=(.*)$/m)?.[1]?.trim();
if (!url || !["localhost", "127.0.0.1"].includes(new URL(url).hostname))
  throw new Error("Solo Supabase local");
const email = `e2e-training-design-${Date.now()}@pancis.local`;
const password = "training-design-e2e-2026";
let userId = "";
let secondDayId = "";
test.beforeAll(async () => {
  const db = adminClient();
  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("No se creó la cuenta");
  userId = data.user.id;
  await completeOnboarding(userId);
  const { planId } = await seedActiveWorkoutPlan(userId);
  const { data: day, error: dayError } = await db
    .from("workout_plan_days")
    .insert({ workout_plan_id: planId, day_index: 2, name: "Torso" })
    .select("id")
    .single();
  if (dayError) throw dayError;
  secondDayId = day!.id;
  const { data: exercises } = await db
    .from("exercise_catalog")
    .select("id")
    .in("primary_muscle", ["pecho", "espalda", "hombros", "biceps", "triceps"])
    .is("deleted_at", null)
    .limit(5);
  if (!exercises?.length) throw new Error("Faltan ejercicios de pecho");
  const { error: insertError } = await db.from("workout_plan_exercises").insert(
    exercises.map((e, index) => ({
      workout_plan_day_id: secondDayId,
      exercise_id: e.id,
      position: index + 1,
      sets: 3,
      target_reps_min: 8,
      target_reps_max: 12,
      rest_seconds: 90,
    })),
  );
  if (insertError) throw insertError;
});
test.afterAll(async () => {
  if (userId) await adminClient().auth.admin.deleteUser(userId);
});

test("modelo local, selección de músculos y sesión del día elegido", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/login");
  await page.getByLabel("Correo o usuario").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/", { timeout: 20000 });
  await page.goto("/entrenamiento");
  await expect(page.locator('[data-model-status="ready"]')).toBeVisible({
    timeout: 30000,
  });
  // Los días son tarjetas: elegir «Torso» la despliega y cambia la tarjeta
  // naranja de arriba.
  const torso = page.locator(".today-day-head", { hasText: "Torso" });
  await torso.click();
  await expect(torso).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator(".today-eyebrow")).toContainText("Torso");
  await expect(page.locator(".today-model")).toHaveAttribute(
    "aria-label",
    /Pectoral/,
  );
  await expect(page.locator(".today-stats > div")).toHaveCount(3);
  await expect(page.locator(".today-stats > div").nth(1)).toContainText("15");
  await expect(page.locator(".today-stats > div").nth(1)).toContainText(
    "5 ejerc.",
  );
  const firstRow = page
    .locator(".today-day[data-open] .today-row-head")
    .first();
  await firstRow.click();
  await expect(firstRow).toHaveAttribute("aria-expanded", "true");
  const exerciseName = await page
    .locator(".today-day[data-open] .today-row-name strong")
    .first()
    .innerText();
  await page
    .getByRole("button", {
      name: `Cómo hacerlo — ${exerciseName}`,
      exact: true,
    })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("heading", { name: exerciseName, exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("dialog").getByText("Qué trabaja", { exact: true }),
  ).toBeVisible({ timeout: 20000 });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);

  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 390 || width === 1440)
      await page.screenshot({
        path: test.info().outputPath(`entrenamiento-${width}.png`),
        fullPage: true,
      });
  }
  const turn = page.locator(".today-turn");
  const before = await turn.getAttribute("aria-label");
  await turn.click();
  await expect(turn).not.toHaveAttribute("aria-label", before ?? "");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page
    .getByRole("button", { name: "Iniciar entrenamiento", exact: true })
    .click();
  // Un día del plan se entrena aquí mismo: la tarjeta pasa a «En curso».
  await expect(page.locator(".today-eyebrow[data-live]")).toBeVisible({
    timeout: 20000,
  });
  await expect(page).toHaveURL(/\/entrenamiento$/);
  const { data: sessions } = await adminClient()
    .from("workout_sessions")
    .select("id, workout_plan_day_id")
    .eq("user_id", userId);
  expect(sessions).toHaveLength(1);
  expect(sessions![0]!.workout_plan_day_id).toBe(secondDayId);

  // Registrar una serie: se ve al instante, se guarda y arranca el descanso.
  const live = page.locator(".live-row").first();
  const liveHead = live.locator(".today-row-head");
  // Puede venir abierta de antes: la fila conserva su estado al empezar.
  if ((await liveHead.getAttribute("aria-expanded")) !== "true")
    await liveHead.click();
  await live.getByRole("button", { name: "Registrar serie 1" }).click();
  await expect(live.locator(".today-row-dose")).toContainText("1/3");
  await expect(page.locator(".live-timer")).toContainText("Descanso");
  await expect
    .poll(
      async () =>
        (
          await adminClient()
            .from("workout_sets")
            .select("id", { count: "exact", head: true })
            .eq("session_id", sessions![0]!.id)
        ).count,
    )
    .toBe(1);
  await page.getByRole("button", { name: "Saltar descanso" }).click();
  await expect(page.locator(".live-timer")).toHaveCount(0);

  // Sustituir en la sesión: queda en la sesión y la rutina no cambia.
  const originalName = await live.locator(".today-row-name strong").innerText();
  await live.getByRole("button", { name: "Sustituir" }).click();
  await page.locator(".substitute-option").first().click({ timeout: 30000 });
  await expect(live.locator(".today-row-name small")).toContainText(
    `En lugar de ${originalName}`,
    { timeout: 20000 },
  );
  const { data: swaps } = await adminClient()
    .from("workout_session_exercises")
    .select("plan_exercise_id, original_exercise_id, performed_exercise_id")
    .eq("session_id", sessions![0]!.id);
  expect(swaps).toHaveLength(1);
  const { data: template } = await adminClient()
    .from("workout_plan_exercises")
    .select("exercise_id")
    .eq("id", swaps![0]!.plan_exercise_id!)
    .single();
  expect(template!.exercise_id).toBe(swaps![0]!.original_exercise_id);
  // Lo que se registra ahora es del ejercicio realizado.
  await live.getByRole("button", { name: /^Registrar serie/ }).click();
  await expect
    .poll(
      async () =>
        (
          await adminClient()
            .from("workout_sets")
            .select("id", { count: "exact", head: true })
            .eq("session_id", sessions![0]!.id)
            .eq("exercise_id", swaps![0]!.performed_exercise_id)
        ).count,
    )
    .toBe(1);
  await page.getByRole("button", { name: "Saltar descanso" }).click();

  await page.reload();
  await expect(
    page.getByRole("button", { name: "Finalizar entrenamiento" }),
  ).toBeVisible();
  // La página sigue siendo operativa si el archivo 3D no se puede cargar.
  await page.route("**/anatomy/muscle-body.glb", (route) => route.abort());
  await page.reload();
  await expect(page.locator('[data-model-status="error"]')).toBeVisible({
    timeout: 20000,
  });
  await expect(page.locator(".today-stats")).toBeVisible();

  // Finalizar: el día queda hecho esta semana, y repetirlo pregunta antes.
  await page.getByRole("button", { name: "Finalizar entrenamiento" }).click();
  await expect(page.locator(".today[data-live]")).toHaveCount(0, {
    timeout: 20000,
  });
  const doneDay = page.locator(".today-day[data-done]");
  await expect(doneDay).toHaveCount(1);
  if ((await doneDay.getAttribute("data-selected")) === null)
    await doneDay.locator(".today-day-head").click();
  await page
    .getByRole("button", { name: "Iniciar entrenamiento", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Ya hiciste este día esta semana" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Cancelar" }).click();

  // El historial muestra el día con la sustitución y la duración.
  await page.goto("/entrenamiento?vista=historial");
  await expect(page.locator(".hist-session")).toHaveCount(1);
  await expect(page.locator(".hist-swap")).toContainText(
    `Sustituyó a ${originalName}`,
  );
  await expect(page.locator(".hist-month [data-trained]")).toHaveCount(1);
  await page.goto("/entrenamiento");
  expect(errors).toEqual([]);
  // First use keeps real actions available without a fabricated routine.
  await adminClient().from("workout_sessions").delete().eq("user_id", userId);
  await adminClient().from("workout_plans").delete().eq("user_id", userId);
  await page.unroute("**/anatomy/muscle-body.glb");
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Tu primera rutina empieza aquí" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Iniciar sesión libre", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".today-day")).toHaveCount(0);
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: test.info().outputPath(`sin-rutina-${width}.png`),
      fullPage: true,
    });
  }
  await page
    .getByRole("button", { name: "Iniciar sesión libre", exact: true })
    .click();
  await expect(page).toHaveURL(/\/entrenamiento\/sesion\//);
  const { data: freeSessions } = await adminClient()
    .from("workout_sessions")
    .select("workout_plan_day_id")
    .eq("user_id", userId);
  expect(freeSessions).toHaveLength(1);
  expect(freeSessions![0]!.workout_plan_day_id).toBeNull();
});
