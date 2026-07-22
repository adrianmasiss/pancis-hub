import { describe, expect, it } from "vitest";
import {
  diffSnapshots,
  isIdenticalSnapshot,
  snapshotCalories,
  snapshotItemCount,
  type DietSnapshot,
  type VersionItem,
} from "@/features/nutrition/lib/diet-versions";

const item = (
  foodId: string,
  foodName: string,
  quantityG: number,
  calories = 100,
): VersionItem => ({
  foodId,
  foodName,
  quantityG,
  servingEquivalence: null,
  per100g: {
    calories,
    proteinG: 10,
    carbohydrateG: 10,
    fatG: 2,
    fiberG: 1,
  },
});

const base: DietSnapshot = {
  name: "Plan base",
  targets: { calories: 2000, proteinG: 150, carbohydrateG: 200, fatG: 60 },
  meals: [
    {
      name: "Desayuno",
      mealType: "desayuno",
      orderIndex: 0,
      scheduledTime: "07:00",
      items: [item("a", "Avena", 80), item("b", "Huevo", 100)],
    },
    {
      name: "Almuerzo",
      mealType: "almuerzo",
      orderIndex: 1,
      scheduledTime: "13:00",
      items: [item("c", "Arroz", 150)],
    },
  ],
};

describe("snapshotCalories", () => {
  it("suma las calorias del plan completo", () => {
    // 80 + 100 + 150 gramos, todos a 100 kcal por 100 g.
    expect(snapshotCalories(base)).toBe(330);
  });
});

describe("snapshotItemCount", () => {
  it("cuenta los alimentos de todas las comidas", () => {
    expect(snapshotItemCount(base)).toBe(3);
  });
});

describe("diffSnapshots", () => {
  it("detecta un cambio de cantidad con el antes y el despues", () => {
    const current: DietSnapshot = {
      ...base,
      meals: [
        { ...base.meals[0]!, items: [item("a", "Avena", 120), item("b", "Huevo", 100)] },
        base.meals[1]!,
      ],
    };

    const diff = diffSnapshots(base, current);
    expect(diff.changedItems).toEqual([
      {
        mealName: "Desayuno",
        foodName: "Avena",
        fromQuantityG: 80,
        toQuantityG: 120,
      },
    ]);
    expect(diff.caloriesDelta).toBe(40);
  });

  it("detecta alimentos agregados y quitados", () => {
    const current: DietSnapshot = {
      ...base,
      meals: [
        { ...base.meals[0]!, items: [item("a", "Avena", 80), item("d", "Banano", 120)] },
        base.meals[1]!,
      ],
    };

    const diff = diffSnapshots(base, current);
    expect(diff.addedItems).toEqual([
      { mealName: "Desayuno", foodName: "Banano" },
    ]);
    expect(diff.removedItems).toEqual([
      { mealName: "Desayuno", foodName: "Huevo" },
    ]);
  });

  it("detecta comidas agregadas y quitadas", () => {
    const current: DietSnapshot = {
      ...base,
      meals: [
        base.meals[0]!,
        {
          name: "Cena",
          mealType: "cena",
          orderIndex: 2,
          scheduledTime: "20:00",
          items: [item("e", "Pescado", 150)],
        },
      ],
    };

    const diff = diffSnapshots(base, current);
    expect(diff.addedMeals).toEqual(["Cena"]);
    expect(diff.removedMeals).toEqual(["Almuerzo"]);
  });

  it("no reporta cambios cuando las versiones son iguales", () => {
    const diff = diffSnapshots(base, base);
    expect(diff.changedItems).toHaveLength(0);
    expect(diff.addedItems).toHaveLength(0);
    expect(diff.removedItems).toHaveLength(0);
    expect(diff.caloriesDelta).toBe(0);
  });

  it("identifica comidas por tipo y nombre, no por id", () => {
    // Al restaurar se crean filas nuevas: los ids no sobreviven, asi que
    // comparar por id daria "todo cambio" en cada restauracion.
    const renamedIds: DietSnapshot = JSON.parse(JSON.stringify(base));
    const diff = diffSnapshots(base, renamedIds);
    expect(diff.addedMeals).toHaveLength(0);
    expect(diff.removedMeals).toHaveLength(0);
  });
});

describe("isIdenticalSnapshot", () => {
  it("reconoce dos fotos iguales", () => {
    expect(isIdenticalSnapshot(base, base)).toBe(true);
  });

  it("detecta el cambio de nombre del plan", () => {
    expect(isIdenticalSnapshot(base, { ...base, name: "Otro plan" })).toBe(
      false,
    );
  });

  it("detecta un cambio de cantidad", () => {
    const current: DietSnapshot = {
      ...base,
      meals: [
        { ...base.meals[0]!, items: [item("a", "Avena", 200), item("b", "Huevo", 100)] },
        base.meals[1]!,
      ],
    };
    expect(isIdenticalSnapshot(base, current)).toBe(false);
  });
});
