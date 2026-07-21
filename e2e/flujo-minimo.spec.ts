import { expect, test } from "@playwright/test";

/**
 * Flujo minimo end-to-end del MVP (docs/TESTING.md):
 * registro -> onboarding -> comida -> intercambio -> entrenamiento ->
 * peso -> tema -> logout -> login -> persistencia.
 */

const email = `e2e-${Date.now()}@pancis.local`;
const password = "password-e2e-12345";

test.describe.configure({ mode: "serial" });

test("registro y onboarding completo", async ({ page }) => {
  await page.goto("/registro");
  await page.getByLabel("Nombre").fill("Usuaria E2E");
  await page.getByLabel("Correo electronico").fill(email);
  await page.getByLabel("Contrasena", { exact: true }).fill(password);
  await page.getByLabel("Confirmar contrasena").fill(password);
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page).toHaveURL(/\/onboarding/, { timeout: 20_000 });

  // Paso 1: basicos
  await page.getByLabel("Fecha de nacimiento").fill("1995-05-10");
  await page.getByLabel("Sexo biologico").selectOption("femenino");
  await page.getByLabel("Altura (cm)").fill("165");
  await page.getByRole("button", { name: "Continuar" }).click();

  // Paso 2: objetivo (recomposicion destacada)
  await page.getByRole("radio", { name: /Recomposicion corporal/ }).check();
  await page.getByRole("button", { name: "Continuar" }).click();

  // Paso 3: actividad
  await page.getByLabel("Experiencia entrenando").selectOption("intermedio");
  await page.getByLabel("Dias de entrenamiento por semana").fill("4");
  await page.getByLabel("Actividad cotidiana").selectOption("moderado");
  await page.getByRole("button", { name: "Continuar" }).click();

  // Paso 4: nutricion
  await page.getByLabel(/Comidas al dia/).fill("4");
  await page.getByRole("button", { name: "Continuar" }).click();

  // Paso 5: linea base
  await page.getByLabel("Peso (kg)").fill("68");
  await page.getByRole("button", { name: "Continuar" }).click();

  // Paso 6: confirmacion con objetivos estimados
  await expect(
    page.getByText("Objetivos nutricionales estimados"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Guardar y comenzar" }).click();

  // Dashboard con datos reales
  await expect(page).toHaveURL("/", { timeout: 20_000 });
  await expect(page.getByText("Nutricion de hoy")).toBeVisible();
});

test("registrar comida e intercambiar un alimento", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo electronico").fill(email);
  await page.getByLabel("Contrasena", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesion" }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });

  await page.goto("/nutricion");
  await page.getByRole("button", { name: "Agregar comida" }).click();
  await page.getByLabel("Tipo de comida").selectOption("almuerzo");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Comida agregada.")).toBeVisible();

  // Agregar arroz 200 g
  await page.getByRole("button", { name: "Agregar alimento" }).first().click();
  await page.getByLabel("Buscar alimento…").fill("arroz");
  await page
    .getByRole("button", { name: /Arroz blanco \(cocido\)/ })
    .first()
    .click();
  // El arroz tiene porciones domesticas: cambiar a gramos exactos.
  await page.getByLabel("Porcion").selectOption({ label: "Gramos exactos" });
  await page.getByLabel("Gramos exactos").fill("200");
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page.getByText("Alimento agregado.")).toBeVisible();
  await expect(page.getByText(/Arroz blanco/).first()).toBeVisible();

  // Intercambiar por la mejor alternativa
  await page
    .getByRole("button", { name: /Intercambiar — Arroz blanco/ })
    .click();
  await expect(
    page.getByText("Alternativas con aporte similar", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Confirmar intercambio" })
    .first()
    .click();
  await expect(page.getByText("Alimento intercambiado.")).toBeVisible();
});

test("registrar entrenamiento y peso", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo electronico").fill(email);
  await page.getByLabel("Contrasena", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesion" }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });

  // Sesion libre con una serie registrada
  await page.goto("/entrenamiento");
  await page.getByRole("button", { name: "Sesion libre" }).click();
  await expect(page).toHaveURL(/\/entrenamiento\/sesion\//, {
    timeout: 20_000,
  });
  await page.getByRole("button", { name: "Agregar ejercicio" }).click();
  await page.getByLabel("Buscar ejercicio…").fill("sentadilla");
  await page.getByRole("button", { name: /Sentadilla con barra/ }).click();
  await page.getByLabel("Peso (kg)").fill("60");
  await page.getByLabel("Reps").fill("8");
  await page.getByRole("button", { name: "Agregar serie" }).click();
  await expect(page.getByText("Serie registrada.")).toBeVisible();
  await page.getByRole("button", { name: "Finalizar sesion" }).click();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page).toHaveURL("/entrenamiento", { timeout: 20_000 });

  // Peso
  await page.goto("/progreso");
  await page.getByRole("button", { name: "Registrar medicion" }).click();
  await page.getByLabel("Peso (kg)").fill("67.8");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Medicion guardada.")).toBeVisible();
});

test("tema, cierre de sesion y persistencia", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo electronico").fill(email);
  await page.getByLabel("Contrasena", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesion" }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });

  // Cambiar tema a oscuro y verificar la clase en html
  await page.getByRole("button", { name: "Cambiar tema" }).click();
  await page.getByRole("menuitem", { name: "Oscuro" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  // Cerrar sesion
  await page.getByRole("button", { name: "Abrir menu" }).last().click();
  await page.getByRole("menuitem", { name: "Cerrar sesion" }).click();
  await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });

  // Volver a entrar: los datos persisten
  await page.getByLabel("Correo electronico").fill(email);
  await page.getByLabel("Contrasena", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesion" }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });
  await page.goto("/progreso");
  await expect(page.getByText("67.8 kg").first()).toBeVisible();
  await page.goto("/nutricion");
  await expect(page.getByText("Almuerzo").first()).toBeVisible();
});
