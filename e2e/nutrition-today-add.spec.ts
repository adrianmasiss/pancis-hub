import { test, expect, devices } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  adminClient,
  completeOnboarding,
  seedActiveDiet,
  readSeededDietIds,
} from "./helpers/seed";

const url = readFileSync(".env.local", "utf8")
  .match(/^NEXT_PUBLIC_SUPABASE_URL=(.*)$/m)?.[1]
  ?.trim();
if (!url || !["localhost", "127.0.0.1"].includes(new URL(url).hostname))
  throw new Error("Solo Supabase local");
test.use({ ...devices["iPhone 13"], defaultBrowserType: "chromium" });
test("el + de Hoy busca y registra en la fecha abierta", async ({ page }) => {
  const db = adminClient();
  const email = `e2e-day-add-${Date.now()}@pancis.local`;
  const password = "test-day-add-2026";
  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("No user");
  const userId = data.user.id;
  try {
    await completeOnboarding(userId);
    const dietId = await seedActiveDiet(userId);
    const { templateMealId, templateItemId } = await readSeededDietIds(dietId);
    await page.goto("/login");
    await page.getByLabel("Correo o usuario").fill(email);
    await page.getByLabel("Contraseña", { exact: true }).fill(password);
    await page
      .getByRole("button", { name: "Iniciar sesión", exact: true })
      .click();
    await expect(page).toHaveURL("/", { timeout: 20000 });
    await page.goto("/nutricion?fecha=2026-11-07");
    await page
      .getByRole("button", { name: "Agregar comida al día", exact: true })
      .click();
    for (const name of ["Código de barras", "Foto de etiqueta", "Manual"]) {
      await expect(
        page.getByRole("link", { name: new RegExp(name) }),
      ).toBeVisible();
    }
    await expect(
      page.getByRole("link", { name: /Foto de etiqueta/ }),
    ).toHaveAttribute("href", "/nutricion/alimentos?metodo=foto");
    await page.getByRole("button", { name: /Buscar alimento/ }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toHaveAccessibleName("Buscar alimento");
    await expect(dialog).toBeVisible();
    await expect(dialog).toContainText("07/11/2026");
    await dialog.getByRole("searchbox").fill("Producto inexistente de prueba");
    await expect(dialog).toContainText("No encontramos");
    await expect(
      dialog.getByRole("button", { name: "Buscar fuera de tu biblioteca" }),
    ).toBeVisible();
    // Simula el área visible que deja un teclado, sin cambiar el layout viewport.
    await page.evaluate(() => {
      Object.defineProperty(window.visualViewport, "height", {
        configurable: true,
        value: 420,
      });
      window.visualViewport!.dispatchEvent(new Event("resize"));
    });
    await expect(dialog).toHaveCSS("height", "420px");
    const searchBounds = await dialog.getByRole("searchbox").boundingBox();
    expect(searchBounds!.y + searchBounds!.height).toBeLessThan(420);
    await page.screenshot({ path: "/tmp/nutrition-today-search-keyboard.png" });
    await page.evaluate(() => {
      Reflect.deleteProperty(window.visualViewport!, "height");
      window.visualViewport!.dispatchEvent(new Event("resize"));
    });
    await dialog.getByRole("searchbox").fill("Avena");
    const food = dialog.getByRole("button", { name: /Avena.*kcal/ }).first();
    await food.click();
    await expect(dialog).toHaveAccessibleName("Nueva comida");
    await dialog.getByRole("button", { name: /Agregar ·/ }).click();
    await expect(dialog).not.toBeVisible();
    const { data: meals } = await db
      .from("meals")
      .select("date")
      .eq("user_id", userId);
    expect(meals).toEqual([{ date: "2026-11-07" }]);
    const independent = page.getByRole("region", {
      name: "Fuera del plan",
      exact: true,
    });
    await expect(independent.locator(".m-plan-meal")).toHaveCount(1);
    const plan = page.getByRole("region", {
      name: "Comidas del plan",
      exact: true,
    });
    await expect(plan.locator(".m-plan-meal")).toHaveCount(1);
    await page
      .getByRole("button", { name: "Marcar Desayuno como comida", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Desmarcar Desayuno", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Agregar comida al día", exact: true })
      .click();
    await page.getByRole("button", { name: /Buscar alimento/ }).click();
    await dialog.getByRole("searchbox").fill("Avena");
    await dialog
      .getByRole("button", { name: /Avena.*kcal/ })
      .first()
      .click();
    await dialog
      .getByRole("combobox", { name: /Dónde lo agregamos/ })
      .selectOption(templateMealId);
    await expect(dialog.getByLabel("Nombre", { exact: true })).toHaveCount(0);
    await page.screenshot({ path: "/tmp/nutrition-extra-destination.png" });
    await dialog.getByRole("button", { name: /Agregar a Desayuno/ }).click();
    await expect(dialog).not.toBeVisible();
    await expect(independent.locator(".m-plan-meal")).toHaveCount(1);
    await expect(plan.locator(".m-plan-meal")).toHaveCount(1);
    await plan.locator(".m-plan-meal-toggle").click();
    await expect(
      plan.locator(".m-ing-tag").filter({ hasText: "Extra" }),
    ).toBeVisible();
    const { data: registered } = await db
      .from("meals")
      .select(
        "date, source_template_meal_id, extra_of_template_meal_id, meal_items(calories_snapshot)",
      )
      .eq("user_id", userId)
      .is("deleted_at", null);
    expect(registered).toHaveLength(3);
    expect(
      registered!.filter(
        (meal) => meal.source_template_meal_id === templateMealId,
      ),
    ).toHaveLength(1);
    expect(
      registered!.filter(
        (meal) => meal.extra_of_template_meal_id === templateMealId,
      ),
    ).toHaveLength(1);
    expect(registered!.every((meal) => meal.date === "2026-11-07")).toBe(true);
    const total = registered!.reduce(
      (sum, meal) =>
        sum +
        meal.meal_items.reduce(
          (n, item) => n + Number(item.calories_snapshot),
          0,
        ),
      0,
    );
    const consumedText = await page
      .getByRole("region", { name: "Resumen del día" })
      .locator(".m-nutri-sum-foot strong")
      .first()
      .innerText();
    expect(Number(consumedText.replace(/[^0-9]/g, ""))).toBe(Math.round(total));
    const { data: original } = await db
      .from("diet_template_items")
      .select("quantity_g")
      .eq("id", templateItemId)
      .single();
    expect(Number(original!.quantity_g)).toBe(80);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const viewport of [
      { width: 375, height: 812 },
      { width: 812, height: 375 },
    ]) {
      await page.setViewportSize(viewport);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({
      path: "/tmp/nutrition-separated-meals.png",
      fullPage: true,
    });
  } finally {
    await db.auth.admin.deleteUser(userId);
  }
});
