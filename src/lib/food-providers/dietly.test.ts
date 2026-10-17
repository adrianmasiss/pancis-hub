import { afterEach, describe, expect, it, vi } from "vitest";
import {
  dietlyFoodSchema,
  normalizeDietlyFood,
  dietlyProvider,
  getDietlyCatalogue,
} from "./dietly";
const papaya = {
  id: 2818,
  name: "Papaya",
  source: "off",
  calories_kcal: 42.2,
  protein_g: 0.75,
  carbs_g: 8.53,
  fat_g: 0.15,
  fiber_g: 1.8,
  sodium_mg: 2.5,
  serving_size_g: 160,
  image_url: "https://images.openfoodfacts.org/example.jpg",
};
afterEach(() => vi.unstubAllGlobals());
describe("Dietly nutrition contract", () => {
  it("preserves per-100g macros and grams per serving separately", () => {
    const f = normalizeDietlyFood(papaya)!;
    expect(f.per100g.calories).toBe(42.2);
    expect(f.portions[0]?.grams).toBe(160);
    expect(f.sodiumMg).toBe(2.5);
    expect(f.foodGroup).toBe("fruta");
    expect(f.provenance).toBe("Dietly · Open Food Facts");
  });
  it("retains missing nutrients as null for display, rejects incomplete imports", () => {
    expect(
      dietlyFoodSchema.parse({ ...papaya, fiber_g: null }).fiber_g,
    ).toBeNull();
    expect(normalizeDietlyFood({ ...papaya, protein_g: null })).toBeNull();
    expect(normalizeDietlyFood({ ...papaya, fiber_g: undefined })).toBeNull();
    expect(normalizeDietlyFood({ ...papaya, fiber_g: 0 })).not.toBeNull();
  });
  it("rejects AI estimates and impossible macro totals for substitution", () => {
    expect(normalizeDietlyFood({ ...papaya, source: "claude" })).toBeNull();
    expect(
      normalizeDietlyFood({ ...papaya, protein_g: 80, fat_g: 90 }),
    ).toBeNull();
    expect(normalizeDietlyFood({ ...papaya, calories_kcal: -1 })).toBeNull();
  });
  it("keeps untrusted image schemes out of the UI", () => {
    expect(
      normalizeDietlyFood({ ...papaya, image_url: "javascript:alert(1)" })
        ?.imageUrl,
    ).toBeNull();
  });
  it("shows rate-limit status and makes no immediate retries", async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 429 });
    vi.stubGlobal("fetch", fetcher);
    expect(await getDietlyCatalogue("arroz")).toEqual({
      foods: [],
      status: "limited",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("recovers on a new request after a provider failure", async () => {
    const fetcher = vi
      .fn()
      .mockRejectedValueOnce(new Error("Offline"))
      .mockResolvedValueOnce({ ok: true, json: async () => [papaya] });
    vi.stubGlobal("fetch", fetcher);
    expect((await getDietlyCatalogue("papaya")).status).toBe("unavailable");
    const retried = await getDietlyCatalogue("papaya");
    expect(retried.status).toBe("ok");
    expect(retried.foods).toHaveLength(1);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
  it("handles errors, bare arrays and safe ID paths", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [papaya, { invalid: true }],
    });
    vi.stubGlobal("fetch", fetcher);
    expect((await getDietlyCatalogue()).foods).toHaveLength(1);
    expect(await dietlyProvider.getFoodById("../account")).toBeNull();
    expect(fetcher).toHaveBeenCalledTimes(1);
    fetcher.mockRejectedValue(new Error("Offline"));
    expect((await getDietlyCatalogue()).status).toBe("unavailable");
  });
});
