import { test, expect, type Page } from "@playwright/test";
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
  throw new Error("Solo Supabase local para esta prueba.");
const email = `e2e-alternatives-${Date.now()}@pancis.local`;
const password = "alternatives-local-2026";
let userId = "";
let itemId = "";
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
  const templateId = await seedActiveDiet(userId);
  const ids = await readSeededDietIds(templateId);
  itemId = ids.templateItemId;
  const { data: original } = await admin
    .from("diet_template_items")
    .select("food_id")
    .eq("id", itemId)
    .single();
  const { data: meal, error: mealError } = await admin
    .from("diet_template_meals")
    .insert({
      template_id: templateId,
      name: "Desayuno alternativo",
      meal_type: "desayuno",
      order_index: 1,
    })
    .select("id")
    .single();
  if (mealError) throw mealError;
  const result = await admin.from("diet_template_items").insert({
    template_meal_id: meal!.id,
    food_id: original!.food_id,
    quantity_g: 75,
  });
  if (result.error) throw result.error;
});
test.afterAll(async () => {
  if (userId) await adminClient().auth.admin.deleteUser(userId);
});

async function checkFits(page: Page, name: string) {
  const dialog = page.getByRole("dialog");
  for (const [width, height] of [
    [320, 568],
    [390, 844],
    [1440, 900],
  ] as const) {
    await page.setViewportSize({ width, height });
    await expect(
      dialog.getByRole("button", { name: "Cerrar", exact: true }),
    ).toBeInViewport();
    await expect(dialog.locator(".focus-card-title")).toBeInViewport();
    await page.screenshot({
      path: test.info().outputPath(`${name}-${width}.png`),
      animations: "disabled",
    });
    const size = await dialog.locator(".focus-card-scroll").evaluate((el) => ({
      width: el.clientWidth,
      scrollWidth: el.scrollWidth,
      height: el.clientHeight,
      scrollHeight: el.scrollHeight,
    }));
    expect(size.scrollWidth, `${name} horizontal ${width}`).toBeLessThanOrEqual(
      size.width + 1,
    );
    expect(size.scrollHeight, `${name} vertical ${width}`).toBeLessThanOrEqual(
      size.height + 1,
    );
  }
}

test("cards compactas sin scroll: explorar, editar y confirmar", async ({
  page,
}) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/login");
  await page.getByLabel("Correo o usuario").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/", { timeout: 20000 });
  await page.goto("/nutricion", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
  });
  await page
    .getByRole("button", { name: "Comparar — Desayuno", exact: true })
    .click();
  let dialog = page.getByRole("dialog");
  await expect(
    dialog.getByRole("region", { name: "Alternativas de comida" }),
  ).toContainText("Desayuno alternativo");
  await checkFits(page, "comidas-opciones");
  await dialog.locator(".alternative-option").first().click();
  await expect(
    dialog.getByRole("region", { name: "Comparación del intercambio" }),
  ).toBeVisible();
  await checkFits(page, "comidas-comparacion");
  await dialog
    .getByRole("button", { name: "Editar ingredientes", exact: true })
    .nth(1)
    .click();
  const ingredient = dialog.getByRole("spinbutton", {
    name: "Cantidad de Avena en hojuelas (g)",
  });
  await ingredient.fill("150");
  await expect(ingredient).toHaveValue("150");
  await checkFits(page, "comidas-ingredientes");
  await dialog
    .getByRole("button", { name: "Añadir alimento", exact: true })
    .click();
  await dialog
    .getByRole("searchbox", { name: "Buscar alimento" })
    .fill("arroz");
  await expect(
    dialog.locator(".compare-results-compact button").first(),
  ).toBeVisible();
  await checkFits(page, "comidas-buscar");
  await dialog.locator(".compare-results-compact button").first().click();
  await dialog.getByRole("button", { name: "Editar cantidades" }).click();
  await expect(dialog.locator(".compact-ingredient")).toHaveCount(2);
  await dialog.getByRole("button", { name: "Ver comparación" }).click();
  await expect(
    dialog.getByRole("region", { name: "Comparación del intercambio" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", {
      name: "Intercambiar — Avena en hojuelas",
      exact: true,
    })
    .first()
    .click();
  dialog = page.getByRole("dialog");
  await expect(dialog.locator(".alternative-option").first()).toBeVisible();
  await checkFits(page, "alimentos-similares");
  await expect(
    dialog.getByRole("button", { name: "Consultar otra opción" }),
  ).toHaveCount(0);
  await expect(dialog).toContainText(
    "Porciones aproximadas · revisa ingredientes y alérgenos.",
  );
  await dialog
    .getByRole("button", { name: "Agregar alimento", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .last()
      .getByRole("heading", { name: "Agregar alimento" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");

  // The swap compares against the food being replaced; there is no picker
  // to change it from here.
  await expect(
    dialog.getByRole("button", { name: "Cambiar alimento o comida" }),
  ).toHaveCount(0);

  await dialog
    .getByRole("button", { name: "Más cercanas en macros", exact: true })
    .click();
  await expect(dialog.locator(".alternative-option").first()).toBeVisible();
  await checkFits(page, "alimentos-macros");
  const firstName = await dialog
    .locator(".alternative-option strong")
    .first()
    .innerText();
  await dialog.getByRole("button", { name: "Opciones siguientes" }).click();
  await expect(
    dialog.locator(".alternative-option strong").first(),
  ).not.toHaveText(firstName);
  await dialog.getByRole("button", { name: "Opciones anteriores" }).click();
  await expect(dialog.locator(".alternative-option strong").first()).toHaveText(
    firstName,
  );
  await dialog.getByRole("button", { name: "Buscar", exact: true }).click();
  await dialog.getByRole("searchbox").fill("arroz");
  await dialog.locator(".alternative-option").first().click();
  await dialog
    .getByRole("spinbutton", { name: "Cantidad (g)", exact: true })
    .fill("125");
  await expect(
    dialog.getByRole("region", { name: "Comparación del intercambio" }),
  ).toBeVisible();
  await expect(dialog.locator(".alternative-option")).toHaveCount(0);
  const before = await adminClient()
    .from("diet_template_items")
    .select("food_id,quantity_g")
    .eq("id", itemId)
    .single();
  await dialog
    .getByRole("spinbutton", { name: "Cantidad (g)", exact: true })
    .fill("");
  await expect(
    dialog.getByRole("button", {
      name: "Sustituir solo este día",
      exact: true,
    }),
  ).toHaveCount(0);
  await dialog
    .getByRole("spinbutton", { name: "Cantidad (g)", exact: true })
    .fill("125");
  const sourceEnergy = await dialog
    .locator('[data-tone="reference"] .swap-card-energy strong')
    .innerText();
  const deltaAt125 = await dialog
    .locator(".swap-diff-energy strong")
    .innerText();
  await dialog
    .getByRole("spinbutton", { name: "Cantidad (g)", exact: true })
    .fill("250");
  await expect(dialog.locator(".swap-diff-energy strong")).not.toHaveText(
    deltaAt125,
  );
  await expect(
    dialog.locator('[data-tone="reference"] .swap-card-energy strong'),
  ).toHaveText(sourceEnergy);
  await dialog
    .getByRole("spinbutton", { name: "Cantidad (g)", exact: true })
    .fill("125");
  await checkFits(page, "alimentos-comparacion");
  await dialog.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(dialog.getByRole("searchbox")).toHaveValue("arroz");
  await dialog.locator(".alternative-option").first().click();
  await dialog
    .getByRole("spinbutton", { name: "Cantidad (g)", exact: true })
    .fill("125");
  await dialog
    .getByRole("button", { name: "Sustituir solo este día", exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
  const after = await adminClient()
    .from("diet_template_items")
    .select("food_id,quantity_g")
    .eq("id", itemId)
    .single();
  expect(after.data).toEqual(before.data);
  const swap = await adminClient()
    .from("diet_item_day_swaps")
    .select("quantity_g")
    .eq("template_item_id", itemId)
    .eq("user_id", userId)
    .single();
  expect(swap.data?.quantity_g).toBe(125);
  expect(errors).toEqual([]);
});

test("componentes de comparación: crear, cerrar y comparar", async ({
  page,
}) => {
  page.setDefaultTimeout(15000);
  await page.goto("/login");
  await page.getByLabel("Correo o usuario").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/", { timeout: 20000 });
  await page.goto("/nutricion", {
    waitUntil: "domcontentloaded",
    timeout: 30000,
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
  await dialog
    .getByRole("button", { name: "Agregar alimento", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Agregar alimento" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("heading", { name: "Agregar alimento" }),
  ).toHaveCount(0);
  await dialog.locator(".alternative-option").first().click();
  await checkFits(page, "componentes-final");
});
