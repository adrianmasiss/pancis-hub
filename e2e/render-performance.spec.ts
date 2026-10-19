import { test, expect } from "@playwright/test";
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
  throw new Error("Profiling requires local Supabase");
const email = `e2e-perf-${Date.now()}@pancis.local`;
const password = "performance-local-2026";
let userId = "";
test.beforeAll(async () => {
  const { data, error } = await adminClient().auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) throw error ?? new Error("No test user");
  userId = data.user.id;
  await completeOnboarding(userId);
  await seedActiveDiet(userId);
});
test.afterAll(async () => {
  if (userId) await adminClient().auth.admin.deleteUser(userId);
});

test("measure idle painting and isolate ambient decoration", async ({
  page,
  context,
}) => {
  test.setTimeout(180000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/login");
  await page.getByLabel("Correo o usuario").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await expect(page).toHaveURL("/", { timeout: 30000 });
  const cdp = await context.newCDPSession(page);
  await cdp.send("Performance.enable");
  const report = [];
  for (const route of [
    "/nutricion",
    "/nutricion/alimentos",
    "/configuracion",
  ]) {
    const start = Date.now();
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".pc-action").first()).toBeVisible({
      timeout: 30000,
    });
    const readyMs = Date.now() - start;
    await page.mouse.move(0, 0);
    // Allow entrance animations and dev compilation to settle before the idle sample.
    await page.waitForTimeout(1500);
    const animations = await page.evaluate(() =>
      document.getAnimations().map((a) => ({
        name: (a as CSSAnimation).animationName,
        state: a.playState,
        target: (a.effect as KeyframeEffect)?.target?.className,
      })),
    );
    for (const experiment of ["normal", "stage-off", "ambient-off"]) {
      const style =
        experiment === "normal"
          ? null
          : await page.addStyleTag({
              content:
                experiment === "stage-off"
                  ? ".app-stage::before { animation: none !important; }"
                  : ".app-stage::before,.assistant-fab::before,.pc-live-edge::after,.app-ambient { animation: none !important; }",
            });
      await page.waitForTimeout(200);
      const samples = [];
      for (let trial = 0; trial < 3; trial++) {
        const events: Record<string, unknown>[] = [];
        const collect = ({ value }: { value: typeof events }) =>
          events.push(...value);
        cdp.on("Tracing.dataCollected", collect);
        await cdp.send("Tracing.start", {
          categories: "devtools.timeline",
          transferMode: "ReportEvents",
        });
        const before = await cdp.send("Performance.getMetrics");
        await page.waitForTimeout(2000);
        const after = await cdp.send("Performance.getMetrics");
        const complete = new Promise<void>((resolve) =>
          cdp.once("Tracing.tracingComplete", () => resolve()),
        );
        await cdp.send("Tracing.end");
        await complete;
        cdp.off("Tracing.dataCollected", collect);
        const metric = (name: string) =>
          (after.metrics.find((m) => m.name === name)?.value ?? 0) -
          (before.metrics.find((m) => m.name === name)?.value ?? 0);
        samples.push({
          taskMs: metric("TaskDuration") * 1000,
          styleMs: metric("RecalcStyleDuration") * 1000,
          layoutMs: metric("LayoutDuration") * 1000,
          paints: events.filter((e) => e.name === "Paint" && e.ph === "X")
            .length,
          paintMs:
            events
              .filter((e) => e.name === "Paint" && e.ph === "X")
              .reduce(
                (sum, e) => sum + (typeof e.dur === "number" ? e.dur : 0),
                0,
              ) / 1000,
        });
      }
      report.push({ route, readyMs, experiment, animations, samples });
      if (style) await style.evaluate((el) => el.parentNode?.removeChild(el));
    }
  }
  await test.info().attach("render-profile.json", {
    body: JSON.stringify(report, null, 2),
    contentType: "application/json",
  });
  console.log(JSON.stringify(report));
});

test("scroll and hover remain usable in both themes and viewport sizes", async ({
  page,
  context,
}) => {
  await page.goto("/login");
  await page.getByLabel("Correo o usuario").fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill(password);
  await page
    .getByRole("button", { name: "Iniciar sesión", exact: true })
    .click();
  await expect(page).toHaveURL("/", { timeout: 30000 });
  for (const theme of ["light", "dark"]) {
    await context.addCookies(
      ["pancis-theme-pref", "pancis-theme-mode"].map((name) => ({
        name,
        value: theme,
        url: "http://localhost:3000",
      })),
    );
    for (const width of [390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto("/nutricion/alimentos");
      await expect(page.locator("html")).toHaveAttribute("data-pc-mode", theme);
      await expect(page.locator(".pc-action").first()).toBeVisible();
      const stage = page.locator(".app-stage");
      expect(
        await stage.evaluate(
          (el) => getComputedStyle(el, "::before").animationName,
        ),
      ).toBe("none");
      await page.mouse.move(width / 2, 450);
      await page.mouse.wheel(0, 600);
      await expect
        .poll(() =>
          page.evaluate(() =>
            Math.max(
              window.scrollY,
              ...Array.from(
                document.querySelectorAll("main, .app-content"),
              ).map((el) => el.scrollTop),
            ),
          ),
        )
        .toBeGreaterThan(0);
      await page.mouse.wheel(0, -2000);
      const action = page.locator(".pc-action").first();
      await action.scrollIntoViewIfNeeded();
      await action.hover();
      await action.focus();
      await expect(action).toBeFocused();
      await page.screenshot({
        path: `output/performance-${theme}-${width}.png`,
      });
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(
    await page
      .locator(".assistant-fab")
      .evaluate((el) => getComputedStyle(el, "::before").animationName),
  ).toBe("none");
});
