import { expect, test } from "@playwright/test";
import { esperarAcceso } from "./helpers/auth";
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
const usuario = `e2e${Date.now()}`.slice(0, 20);
const password = "password-e2e-12345";

test.describe.configure({ mode: "serial" });

test("registro y onboarding completo", async ({ page }) => {
  await page.goto("/registro");
  await page.getByLabel("Nombre").fill("Usuaria E2E");
  await esperarAcceso(page);
  await page.getByLabel("Usuario", { exact: true }).fill(usuario);
  await page.getByLabel("Correo electrónico").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByLabel("Confirmar contraseña").fill(password);
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page).toHaveURL(/\/onboarding/, { timeout: 20_000 });

  // Paso 1: basicos
  await page.getByLabel("Fecha de nacimiento").fill("1995-05-10");
  await page.getByLabel("Sexo biologico").selectOption("femenino");
  await page.getByLabel("Altura (cm)").fill("165");
  await page.getByRole("button", { name: "Continuar" }).click();

  // Paso 2: objetivo (recomposicion destacada)
  await page.getByRole("radio", { name: /Recomposición corporal/ }).check();
  await page.getByRole("button", { name: "Continuar" }).click();

  // Paso 3: actividad
  await page.getByLabel("Experiencia entrenando").selectOption("intermedio");
  await page.getByLabel("Días de entrenamiento por semana").fill("4");
  await page.getByLabel("Actividad cotidiana").selectOption("moderado");
  await page.getByRole("button", { name: "Continuar" }).click();

  // Paso 4: nutricion
  await page.getByLabel(/Comidas al día/).fill("4");
  await page.getByRole("button", { name: "Continuar" }).click();

  // Paso 5: linea base
  await page.getByLabel("Peso (kg)").fill("68");
  await page.getByRole("button", { name: "Continuar" }).click();

  // Paso 6: confirmacion con objetivos estimados
  await expect(
    page.getByText("Objetivos nutricionales estimados"),
  ).toBeVisible();
  await page.getByRole("button", { name: "Guardar y comenzar" }).click();

  // Dashboard con datos reales.
  //
  // Se comprueba la cifra troquelada y no el titulo "Nutrición de hoy": la
  // tarjeta de la maqueta no lleva titulo, porque la cifra ES el titular.
  await expect(page).toHaveURL("/", { timeout: 20_000 });
  await expect(page.getByText(/te faltan hoy/)).toBeVisible();
});

test("registrar comida e intercambiar un alimento", async ({ page }) => {
  await page.goto("/login");
  await esperarAcceso(page);
  await page.getByLabel("Correo o usuario").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
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
  await page.getByLabel("Porción").selectOption({ label: "Gramos exactos" });
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
  await page.getByLabel("Buscar").selectOption("más_proteína");
  await expect(page.getByText(/se comparan por caloría/)).toBeVisible();
  await page.getByLabel("Buscar").selectOption("similar");
  await expect(page.getByText(/Compatibilidad:/).first()).toBeVisible();

  // Intercambiar son DOS gestos desde que existe el veredicto: elegir la
  // alternativa abre la comparacion, y aplicar es el segundo. Es la regla del
  // producto —proponer, no ejecutar— y antes un toque en la lista cambiaba el
  // dia sin ensenar que pasaba con el.
  await page.getByRole("button", { name: "Ver el cambio" }).first().click();
  await expect(page.getByText("SI HACES EL CAMBIO")).toBeVisible();
  await expect(page.getByText("Efecto en el día")).toBeVisible();
  await page.getByRole("button", { name: "Aplicar el cambio" }).click();
  await expect(page.getByText("Alimento intercambiado.")).toBeVisible();
  // Tras aceptar, la hoja explica como queda el resto del dia.
  // Por rol: el panel de consulta repite ese texto en su descripcion.
  await expect(
    page.getByRole("heading", { name: "Como queda tu día" }),
  ).toBeVisible();

  // La vista Hoy recoge lo registrado y responde lo que falta (doc 13). Las
  // cuatro columnas juntas son el punto: antes solo estaban objetivo y
  // consumido, y el restante lo calculaba el usuario de cabeza.
  await page.goto("/");
  // La cifra troquelada responde "cuanto falta" antes que nada, cada macro
  // trae su disco, y el gesto de registrar vive en la misma pantalla.
  // "kcal" ya no viaja en el rotulo: la unidad va pegada a la cifra.
  await expect(page.getByText(/te faltan hoy|de mas/)).toBeVisible();
  await expect(page.getByText("proteína", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Registrar comida" }),
  ).toBeVisible();
  // Con una comida registrada, el dia ya empezo.
  await expect(
    page.getByText("Todavía no has registrado nada de hoy."),
  ).toHaveCount(0);
});

test("horarios ordenan el día", async ({ page }) => {
  await page.goto("/login");
  await esperarAcceso(page);
  await page.getByLabel("Correo o usuario").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
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
  //
  // Se leen los encabezados de nivel 3, que son los titulos de las comidas.
  // Antes esto buscaba `[data-slot=card-title]`, un atributo del componente
  // Card que la tarjeta de comida ya no usa: se apoyaba en el detalle de
  // implementacion de un envoltorio, no en lo que la pagina significa.
  //
  // Se espera a que las dos existan ANTES de leer la lista: `allTextContents`
  // no reintenta, asi que sin esto devuelve lo que hubiera en el instante en
  // que el servidor todavia estaba revalidando.
  await expect(
    page.getByRole("heading", { level: 3, name: "Desayuno" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 3, name: "Cena" }),
  ).toBeVisible();
  const titulos = await page
    .getByRole("heading", { level: 3 })
    .allTextContents();
  const desayuno = titulos.findIndex((t) => t.includes("Desayuno"));
  const cena = titulos.findIndex((t) => t.includes("Cena"));
  expect(desayuno).toBeGreaterThanOrEqual(0);
  expect(desayuno).toBeLessThan(cena);
});

test("corregir un alimento del catálogo", async ({ page }) => {
  await page.goto("/login");
  await esperarAcceso(page);
  await page.getByLabel("Correo o usuario").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });

  await page.goto("/nutricion/alimentos?q=avena");
  await page
    .getByRole("button", { name: /Corregir datos — Avena/ })
    .first()
    .click();

  // Solo se corrigen las calorias; el resto debe seguir heredando el catalogo.
  await page.getByLabel(/Calorías por 100 g/).fill("377");
  await page.getByLabel(/Motivo/).fill("La etiqueta dice 377");
  await page.getByRole("button", { name: "Guardar corrección" }).click();
  await expect(page.getByText("Corrección guardada.")).toBeVisible();

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

test("escanear código de barras", async ({ page }) => {
  await page.goto("/login");
  await esperarAcceso(page);
  await page.getByLabel("Correo o usuario").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });

  await page.goto("/nutricion/alimentos");
  await page.getByRole("button", { name: "Escanear código" }).click();

  // Un codigo con un digito mal leido se rechaza ANTES de consultar.
  await page
    .getByRole("textbox", { name: "Código de barras" })
    .fill("3017620422013");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.getByText(/no parece válido/)).toBeVisible();

  // El codigo real de Nutella si resuelve contra Open Food Facts.
  await page
    .getByRole("textbox", { name: "Código de barras" })
    .fill("3017620422003");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.getByText(/Nutella/i).first()).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText("Open Food Facts").first()).toBeVisible();
});

test("sustituir una comida por una receta", async ({ page }) => {
  await page.goto("/login");
  await esperarAcceso(page);
  await page.getByLabel("Correo o usuario").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
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
  await page
    .getByRole("button", { name: /Pechuga de pollo/ })
    .first()
    .click();
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
  await page.getByLabel("Conservación").fill("3 días en refrigeración");
  await page.getByRole("button", { name: "Guardar notas" }).click();
  await expect(page.getByText("Notas guardadas.")).toBeVisible();

  // Comida del dia con la que comparar la receta.
  await page.goto("/nutricion");
  // Se le da nombre propio: el dia ya acumula varias comidas de pruebas
  // anteriores y ".last()" dejaria de apuntar a la correcta.
  await page.getByRole("button", { name: "Agregar comida" }).click();
  await page.getByLabel("Tipo de comida").selectOption("otro");
  await page.getByLabel(/Nombre/).fill("Comida receta");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Comida agregada.")).toBeVisible();

  // Cada comida es una region con el nombre de la comida, asi que se localiza
  // por lo que es y no trepando el DOM hasta un `data-slot` del envoltorio.
  const mealCard = page.getByRole("region", { name: "Comida receta" });

  await mealCard.getByRole("button", { name: "Agregar alimento" }).click();
  await page.getByLabel("Buscar alimento…").fill("arroz");
  await page
    .getByRole("button", { name: /Arroz blanco/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page.getByText("Alimento agregado.")).toBeVisible();

  // Sustituir esa comida por la receta, con la comparacion a la vista.
  await page
    .getByRole("button", { name: /Cambiar por receta — Comida receta/ })
    .click();
  await expect(page.getByText("Porciones sugeridas").first()).toBeVisible();
  await expect(page.getByText(/Compatibilidad:/).first()).toBeVisible();
  await page
    .getByRole("button", { name: "Sustituir la comida" })
    .first()
    .click();
  await expect(
    page.getByText("Comida sustituida por la receta."),
  ).toBeVisible();
  await expect(page.getByText(/Bowl de prueba/).first()).toBeVisible();
});

test("versionar y restaurar la dieta", async ({ page }) => {
  // La dieta se siembra directamente: crearla pasa por el flujo de IA
  // (subir un PDF), que no es viable en una prueba automatizada.
  const userId = await findUserId(email);
  const templateId = await seedActiveDiet(userId);

  await page.goto("/login");
  await esperarAcceso(page);
  await page.getByLabel("Correo o usuario").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });

  await page.goto("/nutricion/dieta");
  await expect(page.getByText("Versiones de tu dieta")).toBeVisible();

  // Version 1: el plan tal como quedo sembrado.
  await page.getByLabel(/Motivo/).fill("Antes de subir avena");
  await page.getByRole("button", { name: "Guardar versión" }).click();
  await expect(page.getByText("Versión 1 guardada.")).toBeVisible();
  await page.reload();
  await expect(page.getByText(/Versión 1/).first()).toBeVisible();

  // Se cambia la dieta por fuera y la pagina debe detectar la diferencia.
  await changeSeededQuantity(templateId, 150);
  await page.reload();
  await expect(
    page.getByText("Cambios sin guardar desde la última versión"),
  ).toBeVisible();
  await expect(page.getByText(/80 g -> 150 g/)).toBeVisible();

  // Restaurar deja el plan como estaba y no quedan cambios pendientes.
  await page.getByRole("button", { name: "Restaurar" }).first().click();
  await page.getByRole("button", { name: "Restaurar" }).last().click();
  await expect(
    page.getByText("Se restauró la versión 1.").first(),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Cambios sin guardar desde la última versión"),
  ).toHaveCount(0);
  // Restaurar guarda el estado previo (v2) y el restaurado (v3), asi que
  // la version mas reciente coincide con lo que hay en pantalla.
  await expect(page.getByText(/Versión 3/).first()).toBeVisible();
});

test("registrar entrenamiento y peso", async ({ page }) => {
  await page.goto("/login");
  await esperarAcceso(page);
  await page.getByLabel("Correo o usuario").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });

  // Sesion libre con una serie registrada
  await page.goto("/entrenamiento");
  await page.getByRole("button", { name: "Sesión libre" }).click();
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
  await page.getByRole("button", { name: "Finalizar sesión" }).click();
  await page.getByRole("button", { name: "Confirmar" }).click();
  await expect(page).toHaveURL("/entrenamiento", { timeout: 20_000 });

  // Peso
  await page.goto("/progreso");
  await page.getByRole("button", { name: "Registrar medición" }).click();
  await page.getByLabel("Peso", { exact: true }).fill("67.8");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Medición guardada.")).toBeVisible();
});

test("composición corporal con dos InBody", async ({ page }) => {
  await page.goto("/login");
  await esperarAcceso(page);
  await page.getByLabel("Correo o usuario").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });

  await page.goto("/progreso");

  // Linea base: un mes atras.
  const baseline = new Date();
  baseline.setDate(baseline.getDate() - 30);
  const baselineDate = baseline.toISOString().slice(0, 10);

  await page.getByRole("button", { name: "Registrar medición" }).click();
  await page.getByLabel("Fecha").fill(baselineDate);
  await page.getByRole("button", { name: "InBody", exact: true }).click();
  await page.getByLabel("Peso", { exact: true }).fill("80");
  await page.getByLabel(/Grasa corporal/).fill("24");
  await page.getByLabel(/Masa muscular/).fill("34");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Medición guardada.")).toBeVisible();

  // Medicion actual: menos grasa y mas musculo.
  await page.getByRole("button", { name: "Registrar medición" }).click();
  await page.getByRole("button", { name: "InBody", exact: true }).click();
  await page.getByLabel("Peso", { exact: true }).fill("80");
  await page.getByLabel(/Grasa corporal/).fill("20");
  await page.getByLabel(/Masa muscular/).fill("36");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Medición guardada.")).toBeVisible();

  // La tarjeta del cuerpo y la del cambio, que compara ambas mediciones.
  await expect(
    page.getByRole("heading", { name: "Tu cuerpo hoy" }),
  ).toBeVisible();

  // Las aserciones se acotan a la tarjeta de composicion: el grafico de
  // abajo repite las mismas etiquetas en su leyenda.
  //
  // Se sube al <section> que la contiene. Antes trepaba hasta un
  // `data-slot=card`, atributo del componente Card que esta tarjeta ya no usa.
  const compositionCard = page
    .getByRole("heading", { name: "Cambio desde tu medición anterior" })
    .locator("xpath=ancestor::section[1]");

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
    page.getByText("Recomposición en curso", { exact: true }),
  ).toBeVisible();
});

test("ficha biomecánica y sustitución explicada", async ({ page }) => {
  await page.goto("/login");
  await esperarAcceso(page);
  await page.getByLabel("Correo o usuario").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });

  // Rutina con un ejercicio para poder inspeccionarlo.
  await page.goto("/entrenamiento?vista=rutinas");
  await page.getByRole("button", { name: "Crear rutina" }).click();
  await page.getByLabel("Nombre").fill("Rutina biomecánica");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Rutina creada.")).toBeVisible();

  await page
    .getByRole("link", { name: /Rutina biomecanica/ })
    .first()
    .click();
  await page.getByRole("button", { name: "Agregar día" }).click();
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
      startImage.evaluate((img) => (img as HTMLImageElement).naturalWidth > 0),
    )
    .toBe(true);
  await expect(
    page.getByRole("img", { name: /Sentadilla con barra — Fin/ }),
  ).toBeVisible();

  // Lo tecnico va plegado bajo «Detalle técnico».
  await page.getByRole("button", { name: /Detalle técnico/ }).click();
  await expect(page.getByText("Movimiento", { exact: true })).toBeVisible();
  await expect(page.getByText("Curva de resistencia")).toBeVisible();
  await expect(page.getByText("Errores comunes")).toBeVisible();
  await expect(page.getByText("Valoración para tu contexto")).toBeVisible();
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

test("esquema sugerido y análisis de la rutina", async ({ page }) => {
  await page.goto("/login");
  await esperarAcceso(page);
  await page.getByLabel("Correo o usuario").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });

  await page.goto("/entrenamiento?vista=rutinas");
  await page
    .getByRole("link", { name: /Rutina biomecanica/ })
    .first()
    .click();

  // Requisito 13: la prescripcion se muestra aparte, con sus motivos.
  await page
    .getByRole("button", { name: /Ficha del ejercicio — Sentadilla con barra/ })
    .click();
  await page.getByRole("button", { name: /Detalle técnico/ }).click();
  await expect(page.getByText("Esquema sugerido")).toBeVisible();
  // No es "4x12 para todo": a un compuesto le toca rango bajo y descanso largo.
  await expect(page.getByText(/RIR \d · \d+s/)).toBeVisible();
  await expect(page.getByText("Como progresar")).toBeVisible();
  await expect(page.getByText(/no modifica tu rutina/)).toBeVisible();
  await page.keyboard.press("Escape");

  // Versionado de la rutina: guardar, cambiar y restaurar.
  await expect(page.getByText("Versiones de la rutina")).toBeVisible();
  await page.getByLabel(/Motivo/).fill("Antes de subir series");
  await page.getByRole("button", { name: "Guardar versión" }).click();
  await expect(page.getByText("Versión 1 guardada.")).toBeVisible();

  // Se cambian las series del ejercicio y debe detectarse la diferencia.
  await page
    .getByRole("button", { name: /Editar — Sentadilla con barra/ })
    .click();
  await page.getByLabel("Series").fill("5");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByText("Ejercicio actualizado.")).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Cambios sin guardar desde la última versión"),
  ).toBeVisible();
  await expect(page.getByText(/series 3 -> 5/)).toBeVisible();

  await page.getByRole("button", { name: "Restaurar" }).first().click();
  await page.getByRole("button", { name: "Restaurar" }).last().click();
  await expect(
    page.getByText("Se restauró la versión 1.").first(),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Cambios sin guardar desde la última versión"),
  ).toHaveCount(0);

  // Requisito 14: analisis con hallazgos priorizados.
  await expect(page.getByText("Análisis de la rutina")).toBeVisible();
  await expect(page.getByText("Series semanales por músculo")).toBeVisible();
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
  await esperarAcceso(page);
  await page.getByLabel("Correo o usuario").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });

  // Sueno, estres y energia vuelven a registrarse, ahora dentro de progreso.
  await page.goto("/progreso");
  await page.getByLabel("Horas de sueño").fill("7.5");
  await page.getByLabel("Estrés").selectOption("2");
  await page.getByLabel("Energía").selectOption("4");
  await page.getByRole("button", { name: "Guardar como me senti" }).click();
  await expect(page.getByText("Registro guardado.")).toBeVisible();

  // El historial recoge los cambios reales hechos en las pruebas previas,
  // con sus valores anteriores y nuevos.
  await page.goto("/historial");
  await expect(page.getByText("Alimento sustituido").first()).toBeVisible();
  await expect(page.getByText("Antes:").first()).toBeVisible();
  await expect(page.getByText("Después:").first()).toBeVisible();
  await expect(page.getByText("Lo hiciste tu").first()).toBeVisible();
});

test("asistente accesible y conectado a los motores", async ({ page }) => {
  await page.goto("/login");
  await esperarAcceso(page);
  await page.getByLabel("Correo o usuario").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });

  // Requisito 15: acceso al asistente desde cualquier pantalla.
  //
  // El acceso dejo de ser un boton flotante y vive en la barra superior, que
  // esta en todas las pantallas de la app. El flotante desaparecia en Hoy y en
  // el propio asistente, asi que "desde cualquier pantalla" no era cierto; la
  // barra si lo cumple. `AssistantFab` sigue en el repo, sin montar.
  await page.goto("/progreso");
  const acceso = page.getByRole("link", { name: "Asistente", exact: true });
  await expect(acceso.first()).toBeVisible();
  await acceso.first().click();
  await expect(page).toHaveURL(/\/asistente/, { timeout: 20_000 });

  // Requisito 15: acceso desde un ejercicio concreto, con la pregunta ya
  // redactada para que active la comparacion biomecanica.
  await page.goto("/entrenamiento?vista=rutinas");
  await page
    .getByRole("link", { name: /Rutina biomecanica/ })
    .first()
    .click();
  await page
    .getByRole("link", {
      name: /Preguntar al asistente — Sentadilla con barra/,
    })
    .click();
  await expect(page).toHaveURL(/\/asistente\?q=/, { timeout: 20_000 });
  const prefilled = page.getByRole("textbox").first();
  await expect(prefilled).toHaveValue(/Sentadilla con barra/);
  // No se envia sola: gastaria una llamada al modelo sin que el usuario
  // lo pida.
  //
  // La respuesta ya no rotula sus seis secciones: la accion es el titular y el
  // porque —motivo, cuando reevaluar y fuentes— se pliega tras "¿Por que?".
  // Por eso se afirma sobre ese desplegable, que es lo que garantiza que la
  // respuesta llego con su fundamento y no solo con una frase.
  await expect(page.getByRole("button", { name: /¿Por que\?/ })).toHaveCount(0);
  await page
    .getByRole("button", { name: /Enviar/ })
    .first()
    .click();
  const porque = page.getByRole("button", { name: /¿Por que\?/ }).first();
  await expect(porque).toBeVisible({ timeout: 30_000 });
  await porque.click();
  await expect(page.getByText("MOTIVO")).toBeVisible();

  // Pregunta de entrenamiento resuelta con el motor de prescripcion.
  await page.goto("/asistente");
  const input = page.getByRole("textbox").first();
  await input.fill("cuantas series de sentadilla hago");
  await page
    .getByRole("button", { name: /Enviar|Preguntar/ })
    .first()
    .click();
  await expect(page.getByText(/RIR/).first()).toBeVisible({ timeout: 30_000 });
});

test("importar una rutina escrita", async ({ page }) => {
  await page.goto("/login");
  await esperarAcceso(page);
  await page.getByLabel("Correo o usuario").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });

  await page.goto("/entrenamiento?vista=rutinas");
  await page.getByRole("button", { name: "Importar rutina" }).click();

  // Formato tipico de mensaje, con una linea inventada que no existe en
  // el catalogo y otra que no es un ejercicio.
  await page
    .getByLabel("Texto de la rutina")
    .fill(
      [
        "Día 1 - Pierna",
        "Sentadilla con barra 4x8-10 RIR 2 desc 120",
        "Prensa de pierna 3x12",
        "Máquina inventada xyz 3x10",
        "Día 2 - Torso",
        "Press de banca 4x6-8 RIR 1 rest 3min",
      ].join("\n"),
    );
  await page.getByRole("button", { name: "Analizar" }).click();

  // Se revisa antes de guardar: dias, ejercicios y lo que queda fuera.
  await expect(page.getByText("Esto entendimos")).toBeVisible();
  await expect(page.getByText("2 días · 4 ejercicios")).toBeVisible();
  await expect(page.getByText(/no existen en el catálogo/)).toBeVisible();
  // Lo entendido se puede corregir antes de guardar: RIR 2, y 3min se
  // interpreta como 180 segundos.
  await expect(
    page.getByRole("spinbutton", { name: "RIR" }).first(),
  ).toHaveValue("2");
  // El día 2 no tiene nada que corregir y llega plegado.
  await page.getByRole("button", { name: /Torso/ }).click();
  await expect(
    page.getByRole("spinbutton", { name: "Desc. (s)" }).nth(3),
  ).toHaveValue("180");

  await page.getByLabel("Nombre de la rutina").fill("Rutina importada");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Crear rutina" })
    .click();
  await expect(page.getByText("Rutina importada.")).toBeVisible();
  await expect(page).toHaveURL(/\/entrenamiento\/rutinas\//, {
    timeout: 20_000,
  });
  await expect(page.getByText(/Sentadilla con barra/).first()).toBeVisible();
});

test("cambiar de objetivo propone recalcular, y no lo hace solo", async ({
  page,
}) => {
  await page.goto("/login");
  await esperarAcceso(page);
  await page.getByLabel("Correo o usuario").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });

  await page.goto("/configuracion");
  // Antes de tocar nada no hay aviso: el objetivo del onboarding sigue
  // correspondiendo a los datos del perfil.
  await expect(
    page.getByText("Tus objetivos ya no corresponden a tus datos"),
  ).toHaveCount(0);

  /*
    Mismo cuidado que con el margen: es un `select` controlado, y elegir antes
    de que React tome el control deja el valor viejo puesto. Afirmar la
    seleccion antes de guardar convierte un fallo intermitente en un fallo
    inmediato y en el sitio correcto.
  */
  const objetivo = page.getByLabel("Objetivo");
  await expect(objetivo).not.toHaveValue("");
  await objetivo.selectOption("pérdida_grasa");
  await expect(objetivo).toHaveValue("pérdida_grasa");
  await page
    .getByRole("button", { name: "Guardar objetivo y actividad" })
    .click();
  await expect(page.getByText("Cambios guardados.")).toBeVisible();

  // Guardar el perfil NO reescribe los objetivos: aparece la propuesta, con
  // el motivo y las dos cifras, y espera la confirmacion.
  await page.reload();
  await expect(
    page.getByText("Tus objetivos ya no corresponden a tus datos"),
  ).toBeVisible();
  await expect(
    page.getByText(/Tu objetivo paso de Recomposición corporal a Pérdida/),
  ).toBeVisible();

  await page.getByRole("button", { name: "Actualizar mis objetivos" }).click();
  await expect(page.getByText("Objetivos actualizados.")).toBeVisible();

  // Aceptada la propuesta, el aviso desaparece y el cambio queda registrado.
  await page.reload();
  await expect(
    page.getByText("Tus objetivos ya no corresponden a tus datos"),
  ).toHaveCount(0);

  await page.goto("/historial");
  await expect(
    page.getByText("Objetivos nutricionales actualizados").first(),
  ).toBeVisible();
});

test("el margen por macro se puede cambiar", async ({ page }) => {
  await page.goto("/login");
  await esperarAcceso(page);
  await page.getByLabel("Correo o usuario").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });

  // Las columnas existian desde la fase 3 sin ninguna pantalla que las
  // dejara tocar: todo el mundo vivia con los valores por defecto.
  await page.goto("/configuracion");
  /*
    El campo es un `input[type=number]` controlado. Rellenarlo sin esperar a
    que hidrate mezclaba el valor: con "5" dentro y `fill("12")` quedaba "512",
    y la validacion lo rechazaba con razon ("entre 1 y 50 %"). La prueba fallaba
    por una carrera, no por la funcion.

    Esperar a que el campo traiga SU valor garantiza que React ya tomo el
    control, y afirmar despues del relleno impide volver a perseguir el mismo
    fantasma.
  */
  const margenCalorias = page.getByLabel("Calorías (%)");
  await expect(margenCalorias).not.toHaveValue("");
  await margenCalorias.fill("12");
  await expect(margenCalorias).toHaveValue("12");
  await page.getByRole("button", { name: "Guardar mi margen" }).click();
  await expect(page.getByText("Margen actualizado.")).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Calorías (%)")).toHaveValue("12");
});

test("tema, cierre de sesión y persistencia", async ({ page }) => {
  await page.goto("/login");
  await esperarAcceso(page);
  await page.getByLabel("Correo o usuario").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });

  // Cambiar tema a oscuro y verificar la clase en html
  await page.getByRole("button", { name: "Cambiar tema" }).click();
  await page.getByRole("menuitem", { name: "Oscuro" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);

  // Cerrar sesion
  await page.getByRole("button", { name: "Abrir menú" }).last().click();
  await page.getByRole("menuitem", { name: "Cerrar sesión" }).click();
  await expect(page).toHaveURL(/\/login/, { timeout: 20_000 });

  // Volver a entrar: los datos persisten. Y se entra con el USUARIO, no con
  // el correo, que es la segunda forma de acceder: si se rompiera la busqueda
  // de usuario a correo, esta prueba lo dice.
  await esperarAcceso(page);
  await page.getByLabel("Correo o usuario").fill(usuario);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL("/", { timeout: 20_000 });
  await page.goto("/progreso");
  await expect(page.getByText("67.8 kg").first()).toBeVisible();
  await page.goto("/nutricion");
  await expect(page.getByText("Almuerzo").first()).toBeVisible();
});
