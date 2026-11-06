import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import manifest from "../data/images.json";
import catalog from "../data/costa-rica-2026-11-06.json";
import { restaurantImage, restaurantItemImage } from "./images";

describe("imágenes reales de restaurantes", () => {
  it("cubre el directorio y conserva archivos locales y fuentes", () => {
    for (const restaurant of catalog) {
      expect(restaurantImage(restaurant.name)).not.toBeNull();
    }
    for (const image of [...manifest.restaurants, ...manifest.items]) {
      expect(image.src).toMatch(/^\/images\/restaurants\/[a-f0-9]+\.webp$/);
      expect(existsSync(`public${image.src}`)).toBe(true);
      expect(new URL(image.sourceUrl).protocol).toBe("https:");
    }
  });

  it("tolera acentos y puntuación sin mezclar productos ni restaurantes", () => {
    expect(restaurantItemImage("McDonalds", "Big Mac")?.src).toBeTruthy();
    expect(restaurantItemImage("KFC", "Pure individual")?.src).toBeTruthy();
    expect(restaurantItemImage("Burger King", "Big Mac")).toBeNull();
    expect(restaurantItemImage("McDonald's", "Combo Big Mac")).toBeNull();
    expect(restaurantItemImage("Subway", "Jamón")).toBeNull();
  });

  it("no duplica las claves del catálogo visual", () => {
    const keys = manifest.items.map((i) => `${i.restaurant}:${i.name}`);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(manifest.restaurants.map((i) => i.name)).size).toBe(40);
  });
});
