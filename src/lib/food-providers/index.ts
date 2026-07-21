/**
 * Registro de proveedores externos. Solo servicios gratuitos: USDA
 * FoodData Central (clave gratuita) y Open Food Facts (sin clave).
 *
 * SERVER-ONLY: toda llamada externa ocurre en el servidor y las claves
 * nunca llegan al cliente. No importar desde componentes de cliente
 * (docs/SECURITY.md).
 */
import { openFoodFactsProvider } from "@/lib/food-providers/open-food-facts";
import { usdaFoodProvider } from "@/lib/food-providers/usda";
import type { FoodProvider, ProviderSource } from "@/lib/food-providers/types";

const ALL_PROVIDERS: readonly FoodProvider[] = [
  usdaFoodProvider,
  openFoodFactsProvider,
];

/** Proveedores con configuracion suficiente para operar ahora mismo. */
export function availableProviders(): FoodProvider[] {
  return ALL_PROVIDERS.filter((provider) => provider.isAvailable());
}

export function providerBySource(
  source: ProviderSource,
): FoodProvider | undefined {
  return ALL_PROVIDERS.find((provider) => provider.source === source);
}

/** Proveedor capaz de resolver un codigo de barras. */
export function barcodeProvider(): FoodProvider | undefined {
  return availableProviders().find((provider) => provider.getFoodByBarcode);
}

export { usdaFoodProvider, openFoodFactsProvider };
