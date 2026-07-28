import { expect, test, type Page } from "@playwright/test";
import {
  completeOnboarding,
  findUserId,
  readDaySwaps,
  readPlanExerciseId,
  seedActiveWorkoutPlan,
} from "./helpers/seed";

/**
 * Sustituir un ejercicio "solo por hoy" NO puede tocar la rutina base.
 *
 * Es la invariante que se rompio hasta la fase 1: sustituir hacia un update
 * sobre workout_plan_exercises y la rutina original se perdia para siempre.
 * Esta prueba existe para que no vuelva a pasar, y por eso no se conforma con
 * mirar la pantalla: comprueba en la base que la fila del plan sigue igual.
 */

const email = `e2e-swap-${Date.now()}@pancis.local`;
const password = "password-e2e-12345";

test.describe.configure({ mode: "serial" });

let planId = "";
let planExerciseId = "";
let originalExerciseId = "";
let originalExerciseName = "";

/** Login y espera a que la sesion este lista antes de navegar. */
async function login(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Correo electronico").fill(email);
  await page.getByLabel("Contrasena", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesion" }).click();
  // Navegar antes de que termine el login cancela la peticion.
  await expect(page).toHaveURL("/", { timeout: 20_000 });
}

test("registro y rutina sembrada", async ({ page }) => {
  await page.goto("/registro");
  await page.getByLabel("Nombre").fill("Usuaria Swap");
  await page.getByLabel("Correo electronico").fill(email);
  await page.getByLabel("Contrasena", { exact: true }).fill(password);
  await page.getByLabel("Confirmar contrasena").fill(password);
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page).toHaveURL(/\/onboarding/, { timeout: 20_000 });

  const userId = await findUserId(email);
  await completeOnboarding(userId);
  const seeded = await seedActiveWorkoutPlan(userId);
  planId = seeded.planId;
  planExerciseId = seeded.planExerciseId;
  originalExerciseId = seeded.exerciseId;
  originalExerciseName = seeded.exerciseName;

  expect(planExerciseId).not.toBe("");
});

test("sustituir solo por hoy no modifica el plan guardado", async ({
  page,
}) => {
  await login(page);

  // Directo a la rutina: el recorrido por la tarjeta no es lo que se prueba.
  await page.goto(`/entrenamiento/rutinas/${planId}`);
  await expect(page.getByText(originalExerciseName).first()).toBeVisible({
    timeout: 20_000,
  });

  await page
    .getByRole("button", {
      name: new RegExp(`Sustituir .*${originalExerciseName}`),
    })
    .first()
    .click();

  // Acotado al panel: la pagina tiene otro campo "Motivo (opcional)", el de
  // versionar la rutina, con la misma etiqueta.
  const panel = page.getByRole("dialog");
  await panel
    .getByLabel("Motivo (opcional)")
    .fill("La maquina estaba ocupada");

  // La accion primaria es la que NO destruye la rutina.
  const soloHoy = panel.getByRole("button", { name: "Solo por hoy" }).first();
  await expect(soloHoy).toBeVisible({ timeout: 20_000 });
  await soloHoy.click();

  // La pantalla dice que hoy hay otro ejercicio, sin esconder el original.
  await expect(page.getByText(/Hoy en lugar de/).first()).toBeVisible({
    timeout: 20_000,
  });

  // Lo que de verdad importa: el plan guardado no cambio.
  expect(await readPlanExerciseId(planExerciseId)).toBe(originalExerciseId);

  // Y la sustitucion existe, con su fecha y su motivo.
  const swaps = await readDaySwaps(planExerciseId);
  expect(swaps).toHaveLength(1);
  expect(swaps[0]!.date).toBe(new Date().toISOString().slice(0, 10));
  expect(swaps[0]!.substitute_exercise_id).not.toBe(originalExerciseId);
  expect(swaps[0]!.reason).toBe("La maquina estaba ocupada");
  expect(swaps[0]!.source).toBe("usuario");
});

test("deshacer devuelve el ejercicio original", async ({ page }) => {
  await login(page);

  await page.goto(`/entrenamiento/rutinas/${planId}`);
  await page.getByRole("button", { name: "Volver al original" }).first().click();

  await expect(page.getByText(originalExerciseName).first()).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText(/Hoy en lugar de/)).toHaveCount(0);

  expect(await readDaySwaps(planExerciseId)).toHaveLength(0);
  expect(await readPlanExerciseId(planExerciseId)).toBe(originalExerciseId);
});
