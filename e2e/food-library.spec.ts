import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  adminClient,
  completeOnboarding,
  seedActiveDiet,
  readSeededDietIds,
} from "./helpers/seed";
const env = readFileSync(".env.local", "utf8");
const url = env.match(/^NEXT_PUBLIC_SUPABASE_URL=(.*)$/m)?.[1]?.trim();
if (!url || !["localhost", "127.0.0.1"].includes(new URL(url).hostname))
  throw new Error("Solo Supabase local");
const email = `e2e-library-${Date.now()}@pancis.local`;
const password = "library-design-2026";
let userId = "";
let dietId = "";
let itemId = "";
let existingDietlyId: string | null = null;
test.beforeAll(async () => {
  const db = adminClient();
  existingDietlyId =
    (
      await db
        .from("foods")
        .select("id")
        .eq("external_source", "dietly")
        .eq("external_id", "2818")
        .maybeSingle()
    ).data?.id ?? null;
  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("No user");
  userId = data.user.id;
  await completeOnboarding(userId);
  dietId = await seedActiveDiet(userId);
  itemId = (await readSeededDietIds(dietId)).templateItemId;
});
test.afterAll(async () => {
  if (userId) await adminClient().auth.admin.deleteUser(userId);
  if (!existingDietlyId)
    await adminClient()
      .from("foods")
      .delete()
      .eq("external_source", "dietly")
      .eq("external_id", "2818");
});
test("biblioteca visual, comparación y sustitución solo por hoy", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/login");
  await page.getByLabel("Correo o usuario").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await expect(page).toHaveURL("/", { timeout: 20000 });
  await page.goto("/nutricion/alimentos");
  await expect(
    page.getByRole("heading", { name: "Biblioteca de alimentos", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".food-library-card").first()).toBeVisible();
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    if (width === 390 || width === 1440) {
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({
        path: test.info().outputPath(`biblioteca-viewport-${width}.png`),
      });
      await page.screenshot({
        path: test.info().outputPath(`biblioteca-${width}.png`),
        fullPage: true,
      });
    }
  }
  const banana = page
    .locator(".food-library-card")
    .filter({ has: page.getByRole("heading", { name: "Banano", exact: true }) })
    .first();
  await banana
    .getByRole("button", { name: "Guardar favorito — Banano", exact: true })
    .click();
  await expect(
    banana.getByRole("button", {
      name: "Quitar de favoritos — Banano",
      exact: true,
    }),
  ).toHaveAttribute("aria-pressed", "true");
  await banana
    .getByRole("button", { name: "Ver información — Banano" })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "Información nutricional por 100 g",
  );
  await page.keyboard.press("Escape");
  await banana.getByRole("button", { name: "Usar en mi dieta" }).click();
  const sheet = page.getByRole("dialog");
  await expect(
    sheet.getByRole("button", { name: "Confirmar cambio solo para hoy" }),
  ).toBeEnabled({ timeout: 20000 });
  await expect(sheet).toContainText("Avena en hojuelas");
  expect(
    (
      await adminClient()
        .from("diet_item_day_swaps")
        .select("id")
        .eq("user_id", userId)
    ).data,
  ).toHaveLength(0);
  const grams = sheet.getByLabel("Cantidad del sustituto (g)");
  await grams.fill("");
  await expect(grams).toBeVisible();
  await grams.fill("120");
  await expect(
    sheet.getByRole("button", { name: "Confirmar cambio solo para hoy" }),
  ).toBeDisabled();
  await sheet.getByRole("button", { name: "Recalcular", exact: true }).click();
  await expect(
    sheet.getByRole("button", { name: "Confirmar cambio solo para hoy" }),
  ).toBeEnabled();
  await page.screenshot({
    path: test.info().outputPath("comparacion-1440.png"),
    fullPage: true,
  });
  await sheet
    .getByRole("button", { name: "Confirmar cambio solo para hoy" })
    .click();
  await expect(sheet).toHaveCount(0);
  const { data: swaps } = await adminClient()
    .from("diet_item_day_swaps")
    .select("quantity_g, foods(name)")
    .eq("user_id", userId);
  expect(swaps).toHaveLength(1);
  expect(Number(swaps![0]!.quantity_g)).toBe(120);
  expect(swaps![0]).toMatchObject({ foods: { name: "Banano" } });
  const { data: original } = await adminClient()
    .from("diet_template_items")
    .select("quantity_g, foods(name)")
    .eq("id", itemId)
    .single();
  expect(Number(original!.quantity_g)).toBe(80);
  expect(original).toMatchObject({ foods: { name: "Avena en hojuelas" } });
  await page.getByRole("button", { name: "Deshacer", exact: true }).click();
  await expect
    .poll(
      async () =>
        (
          await adminClient()
            .from("diet_item_day_swaps")
            .select("id")
            .eq("user_id", userId)
        ).data?.length,
      { timeout: 20000 },
    )
    .toBe(0);
  await adminClient()
    .from("diet_templates")
    .update({ is_active: false })
    .eq("id", dietId);
  await page.reload();
  await banana.getByRole("button", { name: "Usar en mi dieta" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "Aún no tienes una dieta activa",
  );
  await expect(page.getByRole("link", { name: "Ir a mi dieta" })).toBeVisible();
  expect(errors).toEqual([]);
});

test("Dietly importa un alimento real sin alterar sus nutrientes", async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto("/login");
  await page.getByLabel("Correo o usuario").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await expect(page).toHaveURL("/", { timeout: 20000 });
  await page.goto("/nutricion/alimentos?origen=dietly");
  const papaya = page
    .locator(".food-library-card")
    .filter({ has: page.getByRole("heading", { name: "Papaya", exact: true }) })
    .first();
  await expect(papaya).toBeVisible({ timeout: 20000 });
  await papaya
    .getByRole("button", { name: "Guardar alimento — Papaya", exact: true })
    .click();
  await expect(
    page.getByText("Alimento guardado en tu biblioteca", { exact: true }),
  ).toBeVisible({ timeout: 25000 });
  const imported = await adminClient()
    .from("foods")
    .select("calories, external_source, source")
    .eq("external_source", "dietly")
    .eq("external_id", "2818")
    .single();
  expect(imported.error).toBeNull();
  expect(Number(imported.data!.calories)).toBe(42.2);
  expect(imported.data!.source).toBe("Dietly · Open Food Facts");
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 1100 });
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(papaya.locator("img")).toBeVisible();
    await page.waitForFunction(
      () =>
        Array.from(document.images)
          .filter(
            (image) =>
              image.getBoundingClientRect().top < innerHeight &&
              image.getBoundingClientRect().bottom > 0,
          )
          .every((image) => image.complete),
      { timeout: 15000 },
    );
    await page.screenshot({
      path: test.info().outputPath(`dietly-${width}.png`),
    });
  }
});
