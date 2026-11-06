import { describe, expect, it } from "vitest";
import restaurants from "../data/costa-rica-2026-11-06.json";
import items from "../../../../scripts/datos/restaurantes-costa-rica-2026-11-06.json";
import { RESTAURANT_CATEGORIES } from "./menu";

describe("Informe de restaurantes CR del 06/11/2026", () => {
  it("conserva las 40 fichas, sus categorías y enlaces", () => {
    expect(restaurants).toHaveLength(40);
    expect(new Set(restaurants.map((r) => r.name)).size).toBe(40);
    for (const restaurant of restaurants) {
      expect(RESTAURANT_CATEGORIES).toContain(restaurant.category);
      expect(new URL(restaurant.menuUrl).protocol).toBe("https:");
      expect(restaurant.note.length).toBeGreaterThan(0);
    }
  });

  it("no convierte publicación en verificación ni datos dudosos en cero", () => {
    expect(items).toHaveLength(111);
    expect(items.filter((i) => i.published)).toHaveLength(40);
    for (const item of items) {
      expect(item.status).toBe("pendiente");
      expect(restaurants.some((r) => r.name === item.restaurant)).toBe(true);
      expect(item.source_note).toContain("06/11/2026");
      if (item.published) {
        for (const value of [
          item.calories,
          item.protein_g,
          item.carbohydrate_g,
          item.fat_g,
        ]) {
          expect(value).not.toBeNull();
          expect(value).toBeGreaterThanOrEqual(0);
        }
      } else {
        expect(item.calories).toBeNull();
        expect(item.protein_g).toBeNull();
        expect(item.carbohydrate_g).toBeNull();
        expect(item.fat_g).toBeNull();
      }
    }
  });
});
