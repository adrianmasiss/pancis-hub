import { describe, expect, it } from "vitest";
import type { RestaurantItem } from "../queries";
import { bestForToday, dishFacts, dishMacros, fitOf, initials } from "./menu";

const plato = (extra: Partial<RestaurantItem> = {}): RestaurantItem => ({
  id: "p1",
  name: "Plato",
  servingLabel: null,
  servingG: null,
  calories: 400,
  proteinG: 20,
  carbohydrateG: 40,
  fatG: 15,
  fiberG: 3,
  satFatG: null,
  sugarG: null,
  sodiumMg: null,
  status: "estimado",
  section: "plato",
  sourceUrl: null,
  sourceNote: null,
  options: [],
  ...extra,
});

describe("dishMacros", () => {
  it("suma las opciones elegidas y escala por porciones", () => {
    const item = plato({
      options: [
        {
          id: "a",
          label: "Sin salsa",
          calories: -45,
          proteinG: 0,
          carbohydrateG: 0,
          fatG: -4,
          fiberG: 0,
        },
        {
          id: "b",
          label: "Doble pollo",
          calories: 60,
          proteinG: 12,
          carbohydrateG: 0,
          fatG: 1,
          fiberG: 0,
        },
      ],
    });
    expect(dishMacros(item, ["a"], 2)).toEqual({
      calories: 710,
      proteinG: 40,
      carbohydrateG: 80,
      fatG: 22,
      fiberG: 6,
    });
    expect(dishMacros(item, [])?.calories).toBe(400);
  });

  it("no baja de cero ni inventa cifras", () => {
    const item = plato({
      fatG: 2,
      options: [
        {
          id: "a",
          label: "Sin salsa",
          calories: 0,
          proteinG: 0,
          carbohydrateG: 0,
          fatG: -4,
          fiberG: 0,
        },
      ],
    });
    expect(dishMacros(item, ["a"])?.fatG).toBe(0);
    expect(dishMacros(plato({ calories: null }))).toBeNull();
  });
});

describe("fitOf", () => {
  it("cabe, justo o te pasas", () => {
    expect(fitOf(300, 1000)).toBe("cabe");
    expect(fitOf(850, 1000)).toBe("justo");
    expect(fitOf(1001, 1000)).toBe("te-pasas");
    expect(fitOf(300, null)).toBeNull();
  });
});

describe("bestForToday", () => {
  it("elige el plato que cabe con más proteína", () => {
    const items = [
      plato({ id: "a", calories: 500, proteinG: 30 }),
      plato({ id: "b", calories: 900, proteinG: 50 }),
      plato({ id: "c", calories: 300, proteinG: 30 }),
      plato({ id: "d", calories: 100, proteinG: 60, section: "bebida" }),
    ];
    expect(bestForToday(items, 600)?.id).toBe("c");
    expect(bestForToday(items, 50)).toBeNull();
    expect(bestForToday(items, null)).toBeNull();
  });
});

describe("dishFacts", () => {
  it("usa los umbrales por porción", () => {
    expect(
      dishFacts({
        calories: 300,
        proteinG: 24,
        carbohydrateG: 40,
        fatG: 3,
        fiberG: 5,
      }).map((f) => f.label),
    ).toEqual(["Alto en proteína", "Bajo en grasa", "Buena fuente de fibra"]);
  });
});

describe("initials", () => {
  it("saca iniciales legibles", () => {
    expect(initials("Burger King")).toBe("BK");
    expect(initials("Subway")).toBe("Su");
    expect(initials("McDonald's")).toBe("Mc");
    expect(initials("KFC")).toBe("KF");
  });
});
