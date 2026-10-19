import { expect as baseExpect, test } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  adminClient,
  completeOnboarding,
  seedActiveDiet,
  seedNutritionTarget,
  readSeededDietIds,
  readLoggedPlanMeals,
} from "./helpers/seed";

const expect = baseExpect.configure({ timeout: 20_000 });

// Solo cuentas desechables contra el Supabase local.
const env = readFileSync(".env.local", "utf8");
const url = env.match(/^NEXT_PUBLIC_SUPABASE_URL=(.*)$/m)?.[1]?.trim();
if (!url || !["localhost", "127.0.0.1"].includes(new URL(url).hostname))
  throw new Error("Esta prueba requiere Supabase local.");
const email = `e2e-nutrition-workspace-${Date.now()}@pancis.local`;
const password = "nutrition-workspace-e2e-2026";
let userId = "";
let templateId = "";
let templateMealId = "";
let templateItemId = "";
const date = new Date().toISOString().slice(0, 10);

test.beforeAll(async () => {
  const admin = adminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user)
    throw error ?? new Error("No se pudo crear la cuenta de prueba");
  userId = data.user.id;
  await completeOnboarding(userId);
  templateId = await seedActiveDiet(userId);
  ({ templateMealId, templateItemId } = await readSeededDietIds(templateId));
  await seedNutritionTarget(userId, date);
  const { data: foods } = await admin
    .from("foods")
    .select("id")
    .is("deleted_at", null)
    .limit(5);
  for (const [index, name, mealType, time] of [
    [1, "Media mañana", "snack", "10:30"],
    [2, "Almuerzo", "almuerzo", "13:00"],
    [3, "Merienda", "snack", "16:30"],
    [4, "Cena", "cena", "20:00"],
  ] as const) {
    const { data: meal, error: mealError } = await admin
      .from("diet_template_meals")
      .insert({
        template_id: templateId,
        name,
        meal_type: mealType,
        order_index: index,
        scheduled_time: time,
      })
      .select("id")
      .single();
    if (mealError) throw mealError;
    const { error: itemError } = await admin
      .from("diet_template_items")
      .insert({
        template_meal_id: meal!.id,
        food_id: foods![index]!.id,
        quantity_g: 100 + index * 20,
      });
    if (itemError) throw itemError;
  }
});

test.afterAll(async () => {
  if (userId) await adminClient().auth.admin.deleteUser(userId);
});

test("compara, sustituye solo un día, registra y conserva el plan habitual", async ({
  page,
}) => {
  test.setTimeout(120_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/login");
  await page.getByLabel("Correo o usuario").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });
  await page.goto(`/nutricion?fecha=${date}`);
  await expect(
    page.getByRole("heading", { name: "Mi plan de comidas" }),
  ).toBeVisible();
  await expect(
    page
      .locator(".nutrition-plan-list")
      .getByRole("heading", { name: "Desayuno", exact: true }),
  ).toBeVisible();
  const overview = page.getByRole("region", { name: "Resumen del día" });
  await expect(overview.locator(".nutrition-energy-value strong")).toHaveText(
    "0",
  );
  await expect(overview.locator(".ns-macro")).toHaveCount(4);
  await expect(
    page.getByRole("region", { name: "Primeros pasos en nutrición" }),
  ).toHaveCount(0);
  const breakfast = page.getByRole("listitem").filter({
    has: page.getByRole("heading", { name: "Desayuno", exact: true }),
  });
  await expect(
    breakfast.getByText("Avena en hojuelas", { exact: true }).last(),
  ).toBeVisible();

  await expect(
    page
      .getByRole("region", { name: "Sustituto rápido", exact: true })
      .locator("[aria-busy]"),
  ).toHaveAttribute("aria-busy", "false");
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(
      page.getByRole("button", { name: "Comparar — Desayuno", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    const summaryBox = await overview.boundingBox();
    const mealsBox = await page.locator(".nutrition-meals-panel").boundingBox();
    const toolsBox = await page.locator(".nutrition-side-column").boundingBox();
    expect(summaryBox!.y + summaryBox!.height).toBeLessThanOrEqual(mealsBox!.y);
    if (width === 1440) {
      expect(toolsBox!.x).toBeGreaterThan(mealsBox!.x + mealsBox!.width);
    } else if (width <= 768) {
      expect(toolsBox!.y).toBeGreaterThan(mealsBox!.y + mealsBox!.height);
    }
    if (width === 390 || width === 1440)
      await page.screenshot({
        path: test.info().outputPath(`nutricion-${width}.png`),
        fullPage: true,
      });
  }

  await page
    .getByRole("button", { name: "Ver macros — Almuerzo", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Ver macros — Almuerzo", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("region", { name: "Macros de la comida seleccionada" }),
  ).toContainText("Arroz blanco");
  await page
    .getByRole("button", { name: "Ver macros — Desayuno", exact: true })
    .click();
  await page.getByRole("button", { name: "Comparar — Desayuno" }).click();
  let dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("combobox", { name: "Selecciona una comida…" }),
  ).toHaveValue(templateMealId);
  await expect(
    dialog.getByText("Avena en hojuelas", { exact: true }),
  ).toBeVisible();
  await dialog
    .getByRole("combobox", { name: "Fuente" })
    .nth(1)
    .selectOption("diet");
  await dialog
    .getByRole("combobox", { name: "Selecciona una comida…" })
    .nth(1)
    .selectOption(templateMealId);
  await expect(dialog.getByText("Diferencia (B − A)")).toBeVisible();
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.screenshot({
      path: test.info().outputPath(`comparar-${width}.png`),
      fullPage: false,
    });
  }
  await page.keyboard.press("Escape");

  const admin = adminClient();
  const { data: original } = await admin
    .from("diet_template_items")
    .select("food_id,quantity_g")
    .eq("id", templateItemId)
    .single();
  await page
    .getByRole("region", { name: "Sustituto rápido", exact: true })
    .getByRole("button", { name: "Intercambiar — Avena en hojuelas" })
    .click();
  dialog = page.getByRole("dialog");
  await expect(dialog.getByText(/Cambio solo para/)).toBeVisible();
  await dialog
    .getByRole("button", { name: "Ver el cambio", exact: true })
    .first()
    .click();
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const confirmation = dialog.getByRole("button", {
      name: "Sustituir solo este día",
      exact: true,
    });
    await expect(confirmation).toBeInViewport();
    await page.screenshot({
      path: test.info().outputPath(`sustituir-${width}.png`),
      fullPage: false,
    });
  }
  await dialog
    .getByRole("button", { name: "Sustituir solo este día", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  await expect(breakfast.getByText("Modificada este día")).toBeVisible();
  const { data: unchanged } = await admin
    .from("diet_template_items")
    .select("food_id,quantity_g")
    .eq("id", templateItemId)
    .single();
  expect(unchanged).toEqual(original);
  await page.reload();
  await expect(breakfast.getByText("Modificada este día")).toBeVisible();

  await page
    .getByRole("link", { name: "Editar plan habitual", exact: true })
    .click();
  await expect(
    page
      .getByRole("navigation", { name: "Secciones de nutrición" })
      .getByRole("link", { name: "Mi plan", exact: true }),
  ).toHaveAttribute("aria-current", "page", { timeout: 20_000 });
  await expect(
    breakfast.getByText("Avena en hojuelas", { exact: true }).last(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Marcar como comida/ }),
  ).toHaveCount(0);
  await page
    .getByRole("region", { name: "Sustituto rápido", exact: true })
    .getByRole("button", { name: "Intercambiar — Avena en hojuelas" })
    .click();
  await expect(
    page.getByRole("dialog").getByText(/Cambio en tu plan habitual/),
  ).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Ver el cambio", exact: true })
    .first()
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Sustituir en mi plan", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  const { data: updatedPlan } = await admin
    .from("diet_template_items")
    .select("food_id")
    .eq("id", templateItemId)
    .single();
  expect(updatedPlan?.food_id).not.toBe(original?.food_id);

  await page
    .getByRole("navigation", { name: "Secciones de nutrición" })
    .getByRole("link", { name: "Mi plan", exact: true })
    .click();
  await expect(
    page
      .getByRole("navigation", { name: "Secciones de nutrición" })
      .getByRole("link", { name: "Mi plan", exact: true }),
  ).toHaveAttribute("aria-current", "page", { timeout: 20_000 });
  await breakfast
    .getByRole("button", { name: "Marcar como comida — Desayuno" })
    .click();
  await expect(overview.getByText(/1 comida registrada/)).toBeVisible({
    timeout: 20_000,
  });
  await expect(
    page.getByRole("button", { name: "Marcar como comida — Desayuno" }),
  ).toHaveCount(0);
  await expect(
    page
      .locator(".nutrition-plan-list")
      .getByRole("heading", { name: "Media mañana", exact: true }),
  ).toBeVisible();
  const logged = await readLoggedPlanMeals({ userId, templateMealId, date });
  expect(logged).toHaveLength(1);
  expect(logged[0]!.status).toBe("completada_con_cambios");
  await page.reload();
  await expect(overview.getByText(/1 comida registrada/)).toBeVisible({
    timeout: 20_000,
  });
  await page.getByRole("link", { name: "Historial", exact: true }).click();
  await expect(
    page.getByText("Comidas registradas", { exact: true }).locator(".."),
  ).toContainText("1");
  await page.getByRole("link", { name: "Biblioteca", exact: true }).click();
  await expect(
    page
      .getByRole("navigation", { name: "Secciones de nutrición" })
      .getByRole("link", { name: "Biblioteca", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await page
    .getByRole("link", { name: "Comparar comida", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Antes de cambiar, compara" }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 900 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  // El estado vacío no fabrica consumo ni comidas de muestra.
  await admin
    .from("diet_templates")
    .update({ is_active: false })
    .eq("id", templateId);
  await page.goto("/nutricion?fecha=2026-01-01");
  await expect(
    page.getByRole("heading", { name: "Aún no tienes una dieta" }),
  ).toBeVisible();
  await expect(overview.locator(".nutrition-energy-value strong")).toHaveText(
    "0",
  );
  await expect(
    page.getByRole("button", { name: /Marcar como comida/ }),
  ).toHaveCount(0);
  const start = page.getByRole("region", {
    name: "Primeros pasos en nutrición",
  });
  await expect(
    start.getByRole("link", { name: "Importar mi dieta", exact: true }),
  ).toHaveAttribute("href", "/nutricion/dieta");
  await expect(
    page.getByRole("region", { name: "Ejemplo interactivo de un plan" }),
  ).toHaveCount(0);
  await expect(overview.locator(".ns-macro")).toHaveCount(4);
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page
      .getByRole("heading", { name: "Mi Nutrición", exact: true })
      .scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    if (width === 390 || width === 1440)
      await page.screenshot({
        path: test.info().outputPath(`sin-dieta-${width}.png`),
        fullPage: true,
      });
  }
  await start
    .getByRole("button", { name: "Agregar comida", exact: true })
    .click();
  const firstMealDialog = page.getByRole("dialog");
  await expect(firstMealDialog).toBeVisible();
  await firstMealDialog
    .locator("#meal-name")
    .fill("Mi primera comida sin dieta");
  await firstMealDialog
    .getByRole("button", { name: "Guardar", exact: true })
    .click();
  await expect(firstMealDialog).not.toBeVisible();
  await expect(
    page.getByRole("region", { name: "Registro del día" }),
  ).toContainText("Mi primera comida sin dieta");
  await expect(
    start.getByRole("heading", { name: "Aún no tienes una dieta" }),
  ).toBeVisible();
  await expect(overview.locator(".nutrition-energy-value strong")).toHaveText(
    "0",
  );
  expect(errors).toEqual([]);
});
