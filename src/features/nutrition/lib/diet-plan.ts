/**
 * El plan de dieta de un dia, con las sustituciones de ESE dia superpuestas.
 *
 * Vivia dentro de `getDashboardData`, atado a "hoy" y a una sola pantalla.
 * Nutricion necesita lo mismo para una fecha cualquiera, y duplicar cien
 * lineas de aritmetica de macros y sustituciones era pedir que las dos copias
 * se separaran: justo el tipo de fallo que no se ve en pantalla hasta que una
 * cifra no cuadra.
 *
 * Funcion pura: recibe filas ya leidas y devuelve la vista. No toca la base.
 *
 * La regla que sostiene todo esto: **el plan guardado no se toca**. Una
 * sustitucion del dia se superpone al mapear, de modo que manana reaparece el
 * alimento original sin haber escrito nada en la plantilla.
 */

import { scaleExtra } from "./extras";
import type {
  DietTemplateItemView,
  DietTemplateView,
  MacroTotals,
} from "@/features/dashboard/queries";

const round1 = (value: number) => Math.round(value * 10) / 10;

const ZERO: MacroTotals = {
  calories: 0,
  proteinG: 0,
  carbohydrateG: 0,
  fatG: 0,
  fiberG: 0,
};

/** Fila de `foods` tal como la piden las consultas de plantilla y swaps. */
type FoodRow = {
  id: string;
  name: string;
  owner_user_id: string | null;
  food_group?: string | null;
  image_url?: string | null;
  /** Por 100 g; null cuando el catalogo no lo trae. */
  sodium_mg?: number | string | null;
  sugar_g?: number | string | null;
  calories: number | string | null;
  protein_g: number | string | null;
  carbohydrate_g: number | string | null;
  fat_g: number | string | null;
  fiber_g: number | string | null;
  food_portions?: { label: string; grams: number | string }[] | null;
} | null;

export type DaySwapRow = {
  template_item_id: string;
  quantity_g: number | string;
  source: string;
  /** «Hoy no me lo comi»: no suma en el dia. Ver migracion 20261003. */
  omitted?: boolean | null;
  external_name: string | null;
  external_calories: number | string | null;
  external_protein_g: number | string | null;
  external_carbohydrate_g: number | string | null;
  external_fat_g: number | string | null;
  foods: FoodRow;
};

export type DietTemplateRow = {
  id: string;
  name: string;
  target_calories: number | string;
  target_protein: number | string;
  target_carbs: number | string;
  target_fat: number | string;
  diet_template_meals: {
    id: string;
    name: string | null;
    meal_type: string;
    order_index: number;
    scheduled_time: string | null;
    diet_template_items: {
      id: string;
      quantity_g: number | string;
      serving_equivalence: string | null;
      foods: FoodRow;
    }[];
  }[];
};

export function sumMacros(items: { macros: MacroTotals }[]): MacroTotals {
  return items.reduce<MacroTotals>(
    (acc, item) => ({
      calories: acc.calories + item.macros.calories,
      proteinG: round1(acc.proteinG + item.macros.proteinG),
      carbohydrateG: round1(acc.carbohydrateG + item.macros.carbohydrateG),
      fatG: round1(acc.fatG + item.macros.fatG),
      fiberG: round1(acc.fiberG + item.macros.fiberG),
    }),
    { ...ZERO },
  );
}

export function mapDietTemplate({
  template,
  daySwaps,
  loggedTemplateMealIds,
}: {
  template: DietTemplateRow | null;
  /** Sustituciones vigentes SOLO para la fecha que se esta mirando. */
  daySwaps: DaySwapRow[];
  /** Identidades de las comidas del plan ya registradas ese dia. */
  loggedTemplateMealIds: Set<string>;
}): DietTemplateView | null {
  if (!template) return null;

  const swapByItemId = new Map(
    daySwaps.map((swap) => [swap.template_item_id, swap]),
  );

  return {
    id: template.id,
    name: template.name,
    targetCalories: Number(template.target_calories),
    targetProtein: Number(template.target_protein),
    targetCarbs: Number(template.target_carbs),
    targetFat: Number(template.target_fat),
    meals: [...template.diet_template_meals]
      .sort((a, b) => a.order_index - b.order_index)
      .map((meal) => {
        const items: DietTemplateItemView[] = meal.diet_template_items.map(
          (item) => {
            const found = swapByItemId.get(item.id);
            const planFood = item.foods;
            /* Una omision no es una sustitucion: el alimento que se ve es el
               del plan, tal cual, solo que marcado y fuera de los totales. */
            const omitted = Boolean(found?.omitted);
            const swap = omitted ? undefined : found;

            // Con sustitucion vigente manda el sustituto: puede ser un
            // alimento de la biblioteca o la instantanea que guardo el
            // asistente para un producto fuera del catalogo.
            const food = swap ? (swap.foods ?? null) : planFood;
            const quantityG = Number(swap ? swap.quantity_g : item.quantity_g);
            const factor = quantityG / 100;

            const per100g =
              swap && !swap.foods
                ? {
                    calories: Number(swap.external_calories ?? 0),
                    protein_g: Number(swap.external_protein_g ?? 0),
                    carbohydrate_g: Number(swap.external_carbohydrate_g ?? 0),
                    fat_g: Number(swap.external_fat_g ?? 0),
                    fiber_g: 0,
                  }
                : {
                    calories: Number(food?.calories ?? 0),
                    protein_g: Number(food?.protein_g ?? 0),
                    carbohydrate_g: Number(food?.carbohydrate_g ?? 0),
                    fat_g: Number(food?.fat_g ?? 0),
                    fiber_g: Number(food?.fiber_g ?? 0),
                  };

            return {
              id: item.id,
              foodId: food?.id ?? "",
              foodName:
                (swap && !swap.foods ? swap.external_name : food?.name) ?? "",
              isCustom: Boolean(food?.owner_user_id),
              omitted,
              foodGroup: food?.food_group ?? null,
              imageUrl: food?.image_url ?? null,
              // Un sustituto del asistente no trae sodio ni azucar: null, y
              // la fila simplemente no los muestra.
              sodiumMg: scaleExtra(food?.sodium_mg, quantityG),
              sugarG: scaleExtra(food?.sugar_g, quantityG),
              quantityG,
              daySwap: swap
                ? {
                    originalFoodName: planFood?.name ?? "",
                    source: swap.source as "biblioteca" | "asistente",
                  }
                : null,
              // La equivalencia domestica pertenece a la porcion original.
              // Con un sustituto no se puede seguir mostrando como si lo
              // describiera; sus porciones viajan aparte en `foodPortions`.
              servingEquivalence: swap ? null : item.serving_equivalence,
              foodPortions: (food?.food_portions ?? []).map((portion) => ({
                label: portion.label,
                grams: Number(portion.grams),
              })),
              macros: {
                calories: Math.round(per100g.calories * factor),
                proteinG: round1(per100g.protein_g * factor),
                carbohydrateG: round1(per100g.carbohydrate_g * factor),
                fatG: round1(per100g.fat_g * factor),
                fiberG: round1(per100g.fiber_g * factor),
              },
            };
          },
        );

        return {
          id: meal.id,
          name: meal.name,
          mealType: meal.meal_type,
          orderIndex: meal.order_index,
          scheduledTime: meal.scheduled_time,
          items,
          totals: sumMacros(items.filter((item) => !item.omitted)),
          loggedToday: loggedTemplateMealIds.has(meal.id),
        };
      }),
  };
}

/** Lo que suma el plan del dia, con las sustituciones ya incorporadas. */
export function plannedTotalsOf(
  template: DietTemplateView | null,
): MacroTotals | null {
  if (!template) return null;
  return sumMacros(template.meals.map((meal) => ({ macros: meal.totals })));
}
