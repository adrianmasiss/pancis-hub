import { expect, test } from "@playwright/test";
import { esperarAcceso } from "./helpers/auth";
import {
  completeOnboarding,
  findUserId,
  readLoggedPlanMeals,
  readSeededDietIds,
  seedActiveDiet,
  seedExternalDietSwap,
  seedNutritionTarget,
} from "./helpers/seed";

/**
 * Lo que muestra el plan y lo que se guarda tienen que ser la misma comida.
 * La sustitucion externa es el caso mas exigente: no tiene foods.id y solo
 * puede conservarse mediante su nombre y sus snapshots.
 */
const email = `e2e-plan-nutrition-${Date.now()}@pancis.local`;
const usuario = `e2eplan${Date.now()}`.slice(0, 20);
const password = "password-e2e-12345";

test("registra una comida del plan con la sustitución visible, una sola vez", async ({
  page,
}) => {
  await page.goto("/registro");
  await page.getByLabel("Nombre").fill("Usuaria Plan Nutrición");
  await esperarAcceso(page);
  await page.getByLabel("Usuario", { exact: true }).fill(usuario);
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByLabel("Confirmar contraseña").fill(password);
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 20_000 });

  const userId = await findUserId(email);
  await completeOnboarding(userId);
  const templateId = await seedActiveDiet(userId);
  const { templateMealId, templateItemId } =
    await readSeededDietIds(templateId);
  // completeOnboarding conserva el timezone UTC por defecto.
  const date = new Date().toISOString().slice(0, 10);
  await seedNutritionTarget(userId, date);
  await seedExternalDietSwap({ userId, templateItemId, date });

  await page.goto("/nutricion");
  await page
    .getByRole("button", { name: "Sustituir alimentos — Desayuno" })
    .click();
  // La sustitucion del dia se afirma sobre la FILA del alimento, no sobre
  // cualquier texto: desde que la comida plegada resume sus alimentos, el
  // nombre aparece tambien en ese resumen y `getByText` daba dos nodos.
  await expect(
    page
      .locator(".nutrition-meal-detail")
      .getByText("Pancakes caseros", { exact: true }),
  ).toBeVisible();

  if (process.env.VISUAL_QA === "1") {
    await page.screenshot({
      path: test.info().outputPath("nutrición-desktop.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: test.info().outputPath("nutrición-mobile.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 1280, height: 720 });
  }

  await page
    .getByRole("button", { name: "Marcar como comida — Desayuno" })
    .click();
  await expect(
    page.getByText("Comida registrada en tu diario de hoy."),
  ).toBeVisible({ timeout: 20_000 });

  const logged = await readLoggedPlanMeals({ userId, templateMealId, date });
  expect(logged).toHaveLength(1);
  expect(logged[0]).toMatchObject({
    status: "completada_con_cambios",
    source_template_meal_id: templateMealId,
  });
  expect(logged[0]?.meal_items).toEqual([
    expect.objectContaining({
      food_id: null,
      external_name: "Pancakes caseros",
      quantity_g: 120,
      calories_snapshot: 276,
      protein_snapshot: 8.4,
      carbohydrate_snapshot: 42,
      fat_snapshot: 8.4,
      fiber_snapshot: 0,
    }),
  ]);

  // El estado se resuelve por source_template_meal_id y ya no ofrece volver a
  // registrar la misma comida. La base conserva exactamente una fila.
  await page.reload();
  await expect(
    page
      .getByRole("region", { name: "Resumen del día" })
      .getByText(/1 comida registrada/),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Marcar como comida — Desayuno" }),
  ).toHaveCount(0);
  expect(
    await readLoggedPlanMeals({ userId, templateMealId, date }),
  ).toHaveLength(1);
});
