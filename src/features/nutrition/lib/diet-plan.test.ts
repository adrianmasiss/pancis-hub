import { describe, expect, it } from "vitest";
import {
  mapDietTemplate,
  plannedTotalsOf,
  type DaySwapRow,
  type DietTemplateRow,
} from "@/features/nutrition/lib/diet-plan";

const SHARED_FOOD = {
  id: "food-avena",
  name: "Avena en hojuelas",
  owner_user_id: null,
  calories: 380,
  protein_g: 13,
  carbohydrate_g: 68,
  fat_g: 7,
  fiber_g: 10,
  food_portions: [{ label: "taza", grams: 80 }],
};

const template: DietTemplateRow = {
  id: "template-1",
  name: "Plan base",
  target_calories: 2000,
  target_protein: 150,
  target_carbs: 220,
  target_fat: 60,
  diet_template_meals: [
    {
      id: "meal-breakfast",
      name: "Desayuno",
      meal_type: "desayuno",
      order_index: 0,
      scheduled_time: "07:30:00",
      diet_template_items: [
        {
          id: "item-oats",
          quantity_g: 80,
          serving_equivalence: "1 taza",
          foods: SHARED_FOOD,
        },
      ],
    },
  ],
};

describe("mapDietTemplate", () => {
  it("mapea el plan base sin mutarlo", () => {
    const view = mapDietTemplate({
      template,
      daySwaps: [],
      loggedTemplateMealIds: new Set(),
    });

    expect(view?.meals[0]?.items[0]).toMatchObject({
      foodId: "food-avena",
      foodName: "Avena en hojuelas",
      quantityG: 80,
      servingEquivalence: "1 taza",
      isCustom: false,
      macros: {
        calories: 304,
        proteinG: 10.4,
        carbohydrateG: 54.4,
        fatG: 5.6,
        fiberG: 8,
      },
    });
    expect(
      template.diet_template_meals[0]?.diet_template_items[0]?.quantity_g,
    ).toBe(80);
  });

  it("superpone un sustituto de biblioteca y retira la porcion del original", () => {
    const swap: DaySwapRow = {
      template_item_id: "item-oats",
      quantity_g: 150,
      source: "biblioteca",
      external_name: null,
      external_calories: null,
      external_protein_g: null,
      external_carbohydrate_g: null,
      external_fat_g: null,
      foods: {
        id: "food-yogurt",
        name: "Yogur griego",
        owner_user_id: "user-1",
        calories: 100,
        protein_g: 10,
        carbohydrate_g: 4,
        fat_g: 5,
        fiber_g: 0,
        food_portions: [{ label: "envase", grams: 150 }],
      },
    };

    const item = mapDietTemplate({
      template,
      daySwaps: [swap],
      loggedTemplateMealIds: new Set(),
    })?.meals[0]?.items[0];

    expect(item).toMatchObject({
      foodId: "food-yogurt",
      foodName: "Yogur griego",
      quantityG: 150,
      servingEquivalence: null,
      isCustom: true,
      macros: {
        calories: 150,
        proteinG: 15,
        carbohydrateG: 6,
        fatG: 7.5,
        fiberG: 0,
      },
      daySwap: {
        originalFoodName: "Avena en hojuelas",
        source: "biblioteca",
      },
    });
  });

  it("conserva una estimacion externa reproducible sin fingir fibra", () => {
    const externalSwap: DaySwapRow = {
      template_item_id: "item-oats",
      quantity_g: 120,
      source: "asistente",
      external_name: "Pancakes caseros",
      external_calories: 230,
      external_protein_g: 7,
      external_carbohydrate_g: 35,
      external_fat_g: 7,
      foods: null,
    };

    const item = mapDietTemplate({
      template,
      daySwaps: [externalSwap],
      loggedTemplateMealIds: new Set(),
    })?.meals[0]?.items[0];

    expect(item).toMatchObject({
      foodId: "",
      foodName: "Pancakes caseros",
      isCustom: false,
      quantityG: 120,
      servingEquivalence: null,
      macros: {
        calories: 276,
        proteinG: 8.4,
        carbohydrateG: 42,
        fatG: 8.4,
        fiberG: 0,
      },
    });
  });

  it("marca por identidad de la comida y suma los totales ya sustituidos", () => {
    const view = mapDietTemplate({
      template,
      daySwaps: [],
      loggedTemplateMealIds: new Set(["meal-breakfast"]),
    });

    expect(view?.meals[0]?.loggedToday).toBe(true);
    expect(plannedTotalsOf(view)).toEqual({
      calories: 304,
      proteinG: 10.4,
      carbohydrateG: 54.4,
      fatG: 5.6,
      fiberG: 8,
    });
  });
});
