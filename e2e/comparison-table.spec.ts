import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  adminClient,
  completeOnboarding,
  seedActiveDiet,
} from "./helpers/seed";

const url = readFileSync(".env.local", "utf8")
  .match(/^NEXT_PUBLIC_SUPABASE_URL=(.*)$/m)?.[1]
  ?.trim();
if (!url || !["localhost", "127.0.0.1"].includes(new URL(url).hostname))
  throw new Error("Solo Supabase local para esta prueba.");
const email = `e2e-table-${Date.now()}@pancis.local`;
const password = "comparison-local-2026";
let userId = "";
test.beforeAll(async () => {
  const { data, error } = await adminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("No test user");
  userId = data.user.id;
  await completeOnboarding(userId);
  await seedActiveDiet(userId);
});
test.afterAll(async () => {
  if (userId) await adminClient().auth.admin.deleteUser(userId);
});

test("comparación visual: cantidades, teclado y móvil", async ({ page }) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/login");
  await page.getByLabel("Correo o usuario").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/", { timeout: 20000 });
  await page.goto("/nutricion");
  await page.screenshot({
    path: test.info().outputPath("nutrition-reference.png"),
    animations: "disabled",
  });
  await page
    .getByRole("button", {
      name: "Intercambiar — Avena en hojuelas",
      exact: true,
    })
    .first()
    .click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator(".alternative-option").first()).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.screenshot({
    path: test.info().outputPath("discovery-desktop.png"),
    animations: "disabled",
  });
  await page.setViewportSize({ width: 320, height: 568 });
  const discoverySize = await dialog
    .locator(".focus-card-scroll")
    .evaluate((el) => ({ width: el.clientWidth, content: el.scrollWidth }));
  expect(discoverySize.content).toBeLessThanOrEqual(discoverySize.width + 1);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await dialog.getByRole("button", { name: "Buscar", exact: true }).click();
  await dialog.getByRole("searchbox").fill("Arroz blanco");
  await expect(dialog.locator(".alternative-option").first()).toContainText(
    /arroz/i,
  );
  await dialog.locator(".alternative-option").first().click();
  const table = dialog.getByRole("table");
  await expect(table).toBeVisible();
  const original = await dialog
    .locator('[data-tone="reference"] .swap-card-energy strong')
    .innerText();
  const grams = dialog.getByRole("spinbutton", {
    name: "Cantidad (g)",
    exact: true,
  });
  await grams.fill("125");
  const before = await table.innerText();
  await grams.fill("250");
  await expect(table).not.toHaveText(before);
  await expect(
    dialog.locator('[data-tone="reference"] .swap-card-energy strong'),
  ).toHaveText(original);
  await grams.fill("");
  await expect(grams).toHaveAttribute("aria-invalid", "true");
  await expect(
    dialog.getByRole("button", {
      name: "Sustituir solo este día",
      exact: true,
    }),
  ).toHaveCount(0);
  await grams.fill("125");
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(
      dialog.getByRole("button", { name: "Cerrar", exact: true }),
    ).toBeInViewport();
    const size = await dialog
      .locator(".focus-card-scroll")
      .evaluate((el) => ({ width: el.clientWidth, content: el.scrollWidth }));
    expect(size.content).toBeLessThanOrEqual(size.width + 1);
    await page.screenshot({
      path: test.info().outputPath(`comparison-${width}.png`),
      animations: "disabled",
    });
  }
  const apply = dialog.getByRole("button", {
    name: "Sustituir solo este día",
    exact: true,
  });
  await apply.scrollIntoViewIfNeeded();
  await expect(apply).toBeInViewport();
  await page.screenshot({
    path: test.info().outputPath("comparison-mobile-decision.png"),
    animations: "disabled",
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await grams.scrollIntoViewIfNeeded();
  await grams.focus();
  await expect(grams).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    dialog.getByRole("button", { name: /Usar sugerida/ }),
  ).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await page.goto("/nutricion/comparar");
  await expect(
    page.getByRole("region", { name: "Comparación del intercambio" }),
  ).toBeVisible();
  for (const width of [320, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const size = await page.evaluate(() => ({
      width: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(size.content).toBeLessThanOrEqual(size.width + 1);
  }
  expect(errors).toEqual([]);
});
