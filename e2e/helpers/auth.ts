import type { Page } from "@playwright/test";

/**
 * Espera a que la pantalla de acceso quede SOLA en el DOM.
 *
 * Con las transiciones de vista activas (`experimental.viewTransition` en
 * `next.config.ts`), mientras la animacion corre el arbol que sale y el que
 * entra conviven. En ese instante hay DOS campos con el nombre accesible
 * "Correo electrónico" y Playwright falla por modo estricto:
 *
 *   strict mode violation: getByLabel('Correo electrónico') resolved to 2 elements
 *
 * No es un defecto del producto —el HTML servido trae uno, y una carga limpia
 * tambien—: es que el test escribia a mitad de la transicion. El fallo estaba
 * latente y solo aparecio cuando la suite llego a ejecutar ese caso.
 */
export async function esperarAcceso(page: Page): Promise<void> {
  await page.waitForFunction(
    () => document.querySelectorAll('input[name="email"]').length === 1,
  );
}
