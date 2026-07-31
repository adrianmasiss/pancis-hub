import { defineConfig, devices } from "@playwright/test";

/**
 * E2E contra el stack local: requiere `supabase start` (con seed) y
 * levanta la app en modo produccion.
 *
 * El puerto se puede cambiar con E2E_PORT. Existe porque `reuseExistingServer`
 * reutiliza CUALQUIER cosa que responda en el puerto: si otro proyecto tiene
 * ocupado el 3000, la suite corre contra esa otra app y falla con errores que
 * no tienen nada que ver. Con otro puerto libre el problema desaparece:
 *
 *   E2E_PORT=3100 npx playwright test
 */
const port = Number(process.env.E2E_PORT ?? 3000);

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "retain-on-failure",
    locale: "es-419",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // `next start -p` explicito: Next 16 ignora la variable PORT.
    command: `npm run build && npx next start -p ${port}`,
    url: `http://localhost:${port}/login`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
