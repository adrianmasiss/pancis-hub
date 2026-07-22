import { expect, test } from "@playwright/test";
import {
  changeSeededQuantity,
  findUserId,
  seedActiveDiet,
} from "./helpers/seed";

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
  // Cada alternativa muestra su compatibilidad 0-10.
  // Requisito 5.2: filtrar la busqueda segun lo que hace falta.
  await page.getByLabel("Buscar").selectOption("mas_proteina");
  await expect(page.getByText(/se comparan por caloria/)).toBeVisible();
  await page.getByLabel("Buscar").selectOption("similar");
  await expect(page.getByText(/Compatibilidad:/).first()).toBeVisible();

  await page
    .getByRole("button", { name: "Confirmar intercambio" })
    .first()
    .click();
  await expect(page.getByText("Alimento intercambiado.")).toBeVisible();
  // Tras aceptar, la hoja explica como queda el resto del dia.
  await expect(page.getByText("Como queda tu dia")).toBeVisible();
});

test("horarios ordenan el dia", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo electronico").fill(email);
  await page.getByLabel("Contrasena", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesion" }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });

  await page.goto("/nutricion");

  // Se crea la cena ANTES que el desayuno: si el orden fuera por creacion,
  // la cena quedaria primero.
  await page.getByRole("button", { name: "Agregar comida" }).click();
  await page.getByLabel("Tipo de comida").selectOption("cena");
  await page.getByLabel("Hora (opcional)").fill("20:30");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Comida agregada.")).toBeVisible();

  await page.getByRole("button", { name: "Agregar comida" }).click();
  await page.getByLabel("Tipo de comida").selectOption("desayuno");
  await page.getByLabel("Hora (opcional)").fill("07:15");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Comida agregada.")).toBeVisible();

  // La hora se muestra en la tarjeta.
  await expect(page.getByText(/7:15/).first()).toBeVisible();
  await expect(page.getByText(/8:30/).first()).toBeVisible();

  // Y manda sobre el orden de creacion: el desayuno va antes que la cena.
  const titulos = await page
    .locator("[data-slot=card-title]")
    .allTextContents();
  const desayuno = titulos.findIndex((t) => t.includes("Desayuno"));
  const cena = titulos.findIndex((t) => t.includes("Cena"));
  expect(desayuno).toBeGreaterThanOrEqual(0);
  expect(desayuno).toBeLessThan(cena);
});

test("corregir un alimento del catalogo", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo electronico").fill(email);
  await page.getByLabel("Contrasena", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesion" }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });

  await page.goto("/nutricion/alimentos?q=avena");
  await page
    .getByRole("button", { name: /Corregir datos — Avena/ })
    .first()
    .click();

  // Solo se corrigen las calorias; el resto debe seguir heredando el catalogo.
  await page.getByLabel(/Calorias por 100 g/).fill("377");
  await page.getByLabel(/Motivo/).fill("La etiqueta dice 377");
  await page.getByRole("button", { name: "Guardar correccion" }).click();
  await expect(page.getByText("Correccion guardada.")).toBeVisible();

  await page.reload();
  await expect(page.getByText("Corregido por ti").first()).toBeVisible();
  await expect(page.getByText(/377/).first()).toBeVisible();

  // El valor corregido es el que se registra al agregarlo a una comida.
  await page.goto("/nutricion");
  await page.getByRole("button", { name: "Agregar comida" }).click();
  await page.getByLabel("Tipo de comida").selectOption("snack");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Comida agregada.")).toBeVisible();

  await page.getByRole("button", { name: "Agregar alimento" }).last().click();
  await page.getByLabel("Buscar alimento…").fill("avena");
  await page.getByRole("button", { name: /Avena/ }).first().click();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page.getByText("Alimento agregado.")).toBeVisible();
  // 100 g de avena corregida a 377 kcal.
  await expect(page.getByText(/377/).first()).toBeVisible();

  // El historial guarda la correccion con su motivo.
  await page.goto("/historial");
  await expect(page.getByText("Alimento corregido").first()).toBeVisible();
  await expect(page.getByText(/La etiqueta dice 377/).first()).toBeVisible();
});

test("escanear codigo de barras", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo electronico").fill(email);
  await page.getByLabel("Contrasena", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesion" }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });

  await page.goto("/nutricion/alimentos");
  await page.getByRole("button", { name: "Escanear codigo" }).click();

  // Un codigo con un digito mal leido se rechaza ANTES de consultar.
  await page
    .getByRole("textbox", { name: "Codigo de barras" })
    .fill("3017620422013");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.getByText(/no parece valido/)).toBeVisible();

  // El codigo real de Nutella si resuelve contra Open Food Facts.
  await page
    .getByRole("textbox", { name: "Codigo de barras" })
    .fill("3017620422003");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.getByText(/Nutella/i).first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText("Open Food Facts").first()).toBeVisible();
});

test("sustituir una comida por una receta", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo electronico").fill(email);
  await page.getByLabel("Contrasena", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesion" }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });

  // Receta con un ingrediente, para tener con que comparar.
  await page.goto("/recetas");
  await page.getByRole("button", { name: "Crear receta" }).click();
  await page.getByLabel("Nombre").fill("Bowl de prueba");
  await page.getByLabel("Porciones").fill("2");
  await page.getByRole("button", { name: "Guardar" }).click();
  // Al crearla se navega a su ficha, asi que el toast no llega a verse.
  await expect(
    page.getByRole("heading", { name: "Bowl de prueba" }),
  ).toBeVisible({ timeout: 20_000 });

  await page.getByRole("button", { name: "Agregar ingrediente" }).click();
  await page.getByLabel("Buscar alimento…").fill("pechuga");
  await page.getByRole("button", { name: /Pechuga de pollo/ }).first().click();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page.getByText(/Pechuga de pollo/).first()).toBeVisible();

  // Requisito 8: pasos numerados, reordenables y marcables al cocinar.
  await page.getByLabel("Agregar paso").fill("Picar la cebolla");
  await page.getByRole("button", { name: "Agregar paso" }).click();
  await expect(page.getByText("Paso agregado.")).toBeVisible();
  await page.getByLabel("Agregar paso").fill("Sofreir 5 minutos");
  await page.getByRole("button", { name: "Agregar paso" }).click();
  await expect(page.getByText(/1 de 2 pasos|0 de 2 pasos/)).toBeVisible();

  // El orden se puede corregir: el paso 2 pasa a ser el 1.
  await page.getByRole("button", { name: "Subir paso 2" }).click();
  await expect(page.getByText("Paso actualizado.")).toBeVisible();
  await page.reload();
  // Se comprueba con una asercion que espera al render, no leyendo el DOM
  // de inmediato tras recargar.
  await expect(page.getByRole("checkbox").first()).toHaveAccessibleName(
    /Sofreir/,
  );

  // Marcar un paso avanza el progreso, sin guardarlo en el historial.
  await page.getByRole("checkbox").first().check();
  await expect(page.getByText("1 de 2 pasos")).toBeVisible();

  // Conservacion y meal prep.
  await page.getByLabel("Conservacion").fill("3 dias en refrigeracion");
  await page.getByRole("button", { name: "Guardar notas" }).click();
  await expect(page.getByText("Notas guardadas.")).toBeVisible();

  // Comida del dia con la que comparar la receta.
  await page.goto("/nutricion");
  await page.getByRole("button", { name: "Agregar comida" }).click();
  await page.getByLabel("Tipo de comida").selectOption("otro");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Comida agregada.")).toBeVisible();

  await page.getByRole("button", { name: "Agregar alimento" }).last().click();
  await page.getByLabel("Buscar alimento…").fill("arroz");
  await page.getByRole("button", { name: /Arroz blanco/ }).first().click();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page.getByText("Alimento agregado.")).toBeVisible();

  // Sustituir esa comida por la receta, con la comparacion a la vista.
  await page
    .getByRole("button", { name: /Cambiar por receta — Otro/ })
    .last()
    .click();
  await expect(page.getByText("Porciones sugeridas").first()).toBeVisible();
  await expect(page.getByText(/Compatibilidad:/).first()).toBeVisible();
  await page
    .getByRole("button", { name: "Sustituir la comida" })
    .first()
    .click();
  await expect(page.getByText("Comida sustituida por la receta.")).toBeVisible();
  await expect(page.getByText(/Bowl de prueba/).first()).toBeVisible();
});

test("versionar y restaurar la dieta", async ({ page }) => {
  // La dieta se siembra directamente: crearla pasa por el flujo de IA
  // (subir un PDF), que no es viable en una prueba automatizada.
  const userId = await findUserId(email);
  const templateId = await seedActiveDiet(userId);

  await page.goto("/login");
  await page.getByLabel("Correo electronico").fill(email);
  await page.getByLabel("Contrasena", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesion" }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });

  await page.goto("/nutricion/dieta");
  await expect(page.getByText("Versiones de tu dieta")).toBeVisible();

  // Version 1: el plan tal como quedo sembrado.
  await page.getByLabel(/Motivo/).fill("Antes de subir avena");
  await page.getByRole("button", { name: "Guardar version" }).click();
  await expect(page.getByText("Version 1 guardada.")).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Version 1/).first()).toBeVisible();

  // Se cambia la dieta por fuera y la pagina debe detectar la diferencia.
  await changeSeededQuantity(templateId, 150);
  await page.reload();
  await expect(
    page.getByText("Cambios sin guardar desde la ultima version"),
  ).toBeVisible();
  await expect(page.getByText(/80 g -> 150 g/)).toBeVisible();

  // Restaurar deja el plan como estaba y no quedan cambios pendientes.
  await page.getByRole("button", { name: "Restaurar" }).first().click();
  await page.getByRole("button", { name: "Restaurar" }).last().click();
  await expect(
    page.getByText("Se restauro la version 1.").first(),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Cambios sin guardar desde la ultima version"),
  ).toHaveCount(0);
  // Restaurar guarda el estado previo (v2) y el restaurado (v3), asi que
  // la version mas reciente coincide con lo que hay en pantalla.
  await expect(page.getByText(/Version 3/).first()).toBeVisible();
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

test("composicion corporal con dos InBody", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo electronico").fill(email);
  await page.getByLabel("Contrasena", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesion" }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });

  await page.goto("/progreso");

  // Linea base: un mes atras.
  const baseline = new Date();
  baseline.setDate(baseline.getDate() - 30);
  const baselineDate = baseline.toISOString().slice(0, 10);

  await page.getByRole("button", { name: "Registrar medicion" }).click();
  await page.getByLabel("Fecha").fill(baselineDate);
  await page.getByLabel("Fuente").selectOption("inbody");
  await page.getByLabel("Peso (kg)").fill("80");
  await page.getByLabel(/Grasa corporal/).fill("24");
  await page.getByLabel(/Masa muscular/).fill("34");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Medicion guardada.")).toBeVisible();

  // Medicion actual: menos grasa y mas musculo.
  await page.getByRole("button", { name: "Registrar medicion" }).click();
  await page.getByLabel("Fuente").selectOption("inbody");
  await page.getByLabel("Peso (kg)").fill("80");
  await page.getByLabel(/Grasa corporal/).fill("20");
  await page.getByLabel(/Masa muscular/).fill("36");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Medicion guardada.")).toBeVisible();

  // La seccion de composicion compara ambas mediciones.
  await expect(
    page.getByText("Composicion corporal", { exact: true }),
  ).toBeVisible();

  // Las aserciones se acotan a la tarjeta de composicion: el grafico de
  // abajo repite las mismas etiquetas en su leyenda.
  const compositionCard = page
    .getByText("Composicion corporal", { exact: true })
    .locator("xpath=ancestor::*[@data-slot='card']");

  // Masa grasa derivada: 80 x 24 % = 19.2 kg -> 80 x 20 % = 16 kg,
  // es decir -3.2 kg contra la medicion anterior.
  await expect(
    compositionCard.getByText("Masa grasa", { exact: true }),
  ).toBeVisible();
  await expect(compositionCard.getByText("-3.2 kg")).toBeVisible();
  // Masa magra: 60.8 kg -> 64 kg.
  await expect(compositionCard.getByText("+3.2 kg")).toBeVisible();

  // Bajar grasa y subir musculo a la vez se destaca como recomposicion.
  await expect(
    page.getByText("Recomposicion en curso", { exact: true }),
  ).toBeVisible();
});

test("ficha biomecanica y sustitucion explicada", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo electronico").fill(email);
  await page.getByLabel("Contrasena", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesion" }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });

  // Rutina con un ejercicio para poder inspeccionarlo.
  await page.goto("/entrenamiento");
  await page.getByRole("button", { name: "Crear rutina" }).click();
  await page.getByLabel("Nombre").fill("Rutina biomecanica");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Rutina creada.")).toBeVisible();

  await page.getByRole("link", { name: /Rutina biomecanica/ }).first().click();
  await page.getByRole("button", { name: "Agregar dia" }).click();
  await page.getByRole("button", { name: "Agregar ejercicio" }).first().click();
  await page.getByLabel("Buscar ejercicio…").fill("sentadilla");
  await page.getByRole("button", { name: /Sentadilla con barra/ }).click();
  await expect(page.getByText("Ejercicio agregado.")).toBeVisible();

  // Ficha del ejercicio: datos biomecanicos y valoraciones con motivo.
  await page
    .getByRole("button", { name: /Ficha del ejercicio — Sentadilla con barra/ })
    .click();
  // Requisito 10/21: imagen del movimiento, inicio y fin.
  const startImage = page.getByRole("img", {
    name: /Sentadilla con barra — Inicio/,
  });
  await expect(startImage).toBeVisible();
  // Que este en el DOM no basta: se comprueba que el archivo cargo.
  await expect
    .poll(() =>
      startImage.evaluate(
        (img) => (img as HTMLImageElement).naturalWidth > 0,
      ),
    )
    .toBe(true);
  await expect(
    page.getByRole("img", { name: /Sentadilla con barra — Fin/ }),
  ).toBeVisible();

  await expect(page.getByText("Articulaciones involucradas")).toBeVisible();
  await expect(page.getByText("Curva de resistencia")).toBeVisible();
  await expect(page.getByText("Errores comunes")).toBeVisible();
  await expect(page.getByText("Valoracion para tu contexto")).toBeVisible();
  // Ninguna puntuacion se muestra sin su motivo.
  await expect(page.getByText("Ajuste a tu objetivo")).toBeVisible();
  await expect(page.getByText(/rango amplio/).first()).toBeVisible();
  await page.keyboard.press("Escape");

  // Sustitucion: cada alternativa explica que se gana y que se pierde.
  await page
    .getByRole("button", { name: /Sustituir — Sentadilla con barra/ })
    .click();
  await expect(page.getByText("En que se parecen").first()).toBeVisible();
  await expect(page.getByText("Que ganas").first()).toBeVisible();
  await expect(page.getByText("Que pierdes").first()).toBeVisible();
});

test("esquema sugerido y analisis de la rutina", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo electronico").fill(email);
  await page.getByLabel("Contrasena", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesion" }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });

  await page.goto("/entrenamiento");
  await page.getByRole("link", { name: /Rutina biomecanica/ }).first().click();

  // Requisito 13: la prescripcion se muestra aparte, con sus motivos.
  await page
    .getByRole("button", { name: /Ficha del ejercicio — Sentadilla con barra/ })
    .click();
  await expect(page.getByText("Esquema sugerido")).toBeVisible();
  // No es "4x12 para todo": a un compuesto le toca rango bajo y descanso largo.
  await expect(page.getByText(/RIR \d · \d+s/)).toBeVisible();
  await expect(page.getByText("Como progresar")).toBeVisible();
  await expect(page.getByText(/no modifica tu rutina/)).toBeVisible();
  await page.keyboard.press("Escape");

  // Versionado de la rutina: guardar, cambiar y restaurar.
  await expect(page.getByText("Versiones de la rutina")).toBeVisible();
  await page.getByLabel(/Motivo/).fill("Antes de subir series");
  await page.getByRole("button", { name: "Guardar version" }).click();
  await expect(page.getByText("Version 1 guardada.")).toBeVisible();

  // Se cambian las series del ejercicio y debe detectarse la diferencia.
  await page
    .getByRole("button", { name: /Editar — Sentadilla con barra/ })
    .click();
  await page.getByLabel("Series").fill("5");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Ejercicio actualizado.")).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Cambios sin guardar desde la ultima version"),
  ).toBeVisible();
  await expect(page.getByText(/series 3 -> 5/)).toBeVisible();

  await page.getByRole("button", { name: "Restaurar" }).first().click();
  await page.getByRole("button", { name: "Restaurar" }).last().click();
  await expect(
    page.getByText("Se restauro la version 1.").first(),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Cambios sin guardar desde la ultima version"),
  ).toHaveCount(0);

  // Requisito 14: analisis con hallazgos priorizados.
  await expect(page.getByText("Analisis de la rutina")).toBeVisible();
  await expect(page.getByText("Series semanales por musculo")).toBeVisible();
  // La rutina tiene un solo ejercicio: faltan patrones por cubrir y el
  // rango de repeticiones no esta definido (el alta se reserva a no tener
  // series, y al agregar un ejercicio se crean 3 por defecto).
  await expect(page.getByText("Mejora recomendada").first()).toBeVisible();
  await expect(
    page.getByText("Patrones de movimiento sin cubrir"),
  ).toBeVisible();
  await expect(page.getByText(/empuje horizontal/).first()).toBeVisible();
});

test("bienestar diario e historial de cambios", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo electronico").fill(email);
  await page.getByLabel("Contrasena", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesion" }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });

  // Sueno, estres y energia vuelven a registrarse, ahora dentro de progreso.
  await page.goto("/progreso");
  await page.getByLabel("Horas de sueno").fill("7.5");
  await page.getByLabel("Estres").selectOption("2");
  await page.getByLabel("Energia").selectOption("4");
  await page.getByRole("button", { name: "Guardar como me senti" }).click();
  await expect(page.getByText("Registro guardado.")).toBeVisible();

  // El historial recoge los cambios reales hechos en las pruebas previas,
  // con sus valores anteriores y nuevos.
  await page.goto("/historial");
  await expect(page.getByText("Alimento sustituido").first()).toBeVisible();
  await expect(page.getByText("Antes:").first()).toBeVisible();
  await expect(page.getByText("Despues:").first()).toBeVisible();
  await expect(page.getByText("Lo hiciste tu").first()).toBeVisible();
});

test("asistente accesible y conectado a los motores", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Correo electronico").fill(email);
  await page.getByLabel("Contrasena", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesion" }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });

  // Requisito 15: acceso al asistente desde cualquier pantalla.
  await page.goto("/progreso");
  const fab = page.getByRole("link", { name: "Abrir asistente" });
  await expect(fab).toBeVisible();
  await fab.click();
  await expect(page).toHaveURL(/\/asistente/, { timeout: 20_000 });
  // En su propia pagina el acceso flotante seria redundante.
  await expect(
    page.getByRole("link", { name: "Abrir asistente" }),
  ).toHaveCount(0);

  // Requisito 15: acceso desde un ejercicio concreto, con la pregunta ya
  // redactada para que active la comparacion biomecanica.
  await page.goto("/entrenamiento");
  await page.getByRole("link", { name: /Rutina biomecanica/ }).first().click();
  await page
    .getByRole("link", { name: /Preguntar al asistente — Sentadilla con barra/ })
    .click();
  await expect(page).toHaveURL(/\/asistente\?q=/, { timeout: 20_000 });
  const prefilled = page.getByRole("textbox").first();
  await expect(prefilled).toHaveValue(/Sentadilla con barra/);
  // No se envia sola: gastaria una llamada al modelo sin que el usuario
  // lo pida.
  await expect(page.getByText(/Observacion/)).toHaveCount(0);
  await page.getByRole("button", { name: /Enviar/ }).first().click();
  await expect(page.getByText(/Observacion/).first()).toBeVisible({
    timeout: 30_000,
  });

  // Pregunta de entrenamiento resuelta con el motor de prescripcion.
  await page.goto("/asistente");
  const input = page.getByRole("textbox").first();
  await input.fill("cuantas series de sentadilla hago");
  await page.getByRole("button", { name: /Enviar|Preguntar/ }).first().click();
  await expect(page.getByText(/RIR/).first()).toBeVisible({ timeout: 30_000 });
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
