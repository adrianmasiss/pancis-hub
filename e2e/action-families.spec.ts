import { expect, test, type Locator } from "@playwright/test";
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
  throw new Error("Solo Supabase local");
const email = `e2e-actions-${Date.now()}@pancis.local`;
const password = "actions-local-2026";
let userId = "";
test.beforeAll(async () => {
  const { data, error } = await adminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("No user");
  userId = data.user.id;
  await completeOnboarding(userId);
  await seedActiveDiet(userId);
});
test.afterAll(async () => {
  if (userId) await adminClient().auth.admin.deleteUser(userId);
});

async function fits(button: Locator) {
  await expect(button).toBeVisible();
  const box = await button.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  const content = await button.evaluate((el) => ({
    width: el.clientWidth,
    scroll: el.scrollWidth,
  }));
  expect(content.scroll).toBeLessThanOrEqual(content.width + 1);
}

for (const touch of [false, true]) {
  test(`familias: temas, teclado, movimiento y formularios (${touch ? "táctil" : "ratón"})`, async ({
    browser,
  }) => {
    test.setTimeout(180000);
    const context = await browser.newContext({
      baseURL: `http://localhost:${process.env.E2E_PORT ?? 3000}`,
      hasTouch: touch,
      isMobile: touch,
      viewport: { width: touch ? 390 : 1440, height: 1000 },
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto("/login");
    await page.getByLabel("Correo o usuario").fill(email);
    await page.getByLabel("Contraseña", { exact: true }).fill(password);
    const login = page.getByRole("button", {
      name: "Iniciar sesión",
      exact: true,
    });
    if (touch) await login.tap();
    else await login.click();
    await expect(page).toHaveURL("/", { timeout: 30000 });
    for (const theme of ["light", "dark"]) {
      await context.addCookies(
        ["pancis-theme-pref", "pancis-theme-mode"].map((name) => ({
          name,
          value: theme,
          url: `http://localhost:${process.env.E2E_PORT ?? 3000}`,
        })),
      );
      for (const width of touch ? [320, 390] : [768, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto("/nutricion");
        await expect(page.locator("html")).toHaveAttribute(
          "data-pc-mode",
          theme,
        );
        const add = page.getByRole("link", {
          name: "Importar dieta",
          exact: true,
        });
        await fits(add);
        const addGlyph = add.locator(".pc-action-glyph");
        if (!touch) await add.hover();
        await expect(addGlyph).toHaveCSS(
          "transform",
          touch ? "none" : "matrix(0, 1, -1, 0, 0, 0)",
        );
        const edit = page.getByRole("link", { name: "Editar plan habitual" });
        await fits(edit);
        if (!touch) await edit.hover();
        await expect(edit.locator(".pc-action-glyph")).toHaveCSS(
          "transform",
          touch ? "none" : "matrix(1, 0, 0, 1, 32, -32)",
        );
        await page.screenshot({
          path: test.info().outputPath(`nutrition-${theme}-${width}.png`),
          fullPage: true,
        });
        await page.goto("/configuracion");
        const save = page
          .locator('.pc-action[data-family="save"]:enabled:visible')
          .first();
        await fits(save);
        const box = await save.boundingBox();
        if (!touch) await save.hover();
        await expect(save.locator(".expand-action-text")).toHaveCSS(
          "opacity",
          touch ? "1" : "0",
        );
        expect((await save.boundingBox())!.width).toBeCloseTo(box!.width);
        expect(
          (await save.getAttribute("aria-label")) || (await save.textContent()),
        ).toMatch(/Guardar/);
        await page.screenshot({
          path: test.info().outputPath(`settings-${theme}-${width}.png`),
          fullPage: true,
        });
        await page.emulateMedia({ reducedMotion: "reduce" });
        await expect(save.locator(".expand-action-text")).toHaveCSS(
          "opacity",
          "1",
        );
        await expect(save.locator(".expand-action-icon")).toHaveCSS(
          "transition-duration",
          "0s",
        );
        await page.emulateMedia({ reducedMotion: "no-preference" });
      }
    }
    await page.goto("/nutricion/alimentos");
    const create = page.getByRole("button", {
      name: "Crear alimento",
      exact: true,
    });
    await create.focus();
    await expect(create).toBeFocused();
    await expect(create).toHaveCSS("outline-style", "solid");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(create).toBeFocused();
    await page.goto("/nutricion");
    const editFood = page.getByRole("button", {
      name: "Editar — Avena en hojuelas",
      exact: true,
    });
    if (touch) await editFood.tap();
    else await editFood.click();
    const editor = page.getByRole("dialog");
    const quantity = editor.getByRole("spinbutton", { name: "Gramos" });
    await expect(quantity).toHaveValue("80");
    const saveQuantity = editor.getByRole("button", {
      name: "Guardar",
      exact: true,
    });
    await expect(saveQuantity).toBeDisabled();
    const increase = editor.getByRole("button", { name: /^Sumar/ });
    const decrease = editor.getByRole("button", { name: /^Restar/ });
    await expect(increase).not.toHaveClass(/pc-action/);
    await expect(decrease).not.toHaveClass(/pc-action/);
    if (touch) await increase.tap();
    else await increase.click();
    await expect(quantity).not.toHaveValue("80");
    if (touch) await decrease.tap();
    else await decrease.click();
    await expect(quantity).toHaveValue("80");
    await quantity.fill("90");
    if (touch) await saveQuantity.tap();
    else await saveQuantity.click();
    await expect(editor).toBeHidden({ timeout: 30000 });
    if (touch) await editFood.tap();
    else await editFood.click();
    await expect(quantity).toHaveValue("90");
    await quantity.fill("80");
    if (touch) await saveQuantity.tap();
    else await saveQuantity.click();
    await expect(editor).toBeHidden({ timeout: 30000 });
    const addMeal = page
      .locator('button.pc-action[data-family="add"]')
      .filter({ hasText: "Agregar comida" })
      .first();
    if (touch) await addMeal.tap();
    else await addMeal.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const save = dialog.getByRole("button", { name: "Guardar", exact: true });
    if (touch) await save.tap();
    else await save.click();
    await expect(dialog).toBeHidden({ timeout: 30000 });
    expect(errors).toEqual([]);
    await context.close();
  });
}
