import { getDayPlan, getDietPlanForDate } from "@/features/nutrition/queries";
import { getFoodsLibraryPage } from "@/features/foods/queries";
import { createClient } from "@/lib/supabase/server";
import { addDaysISO } from "@/lib/dates";
import { NutritionTabs } from "./nutrition-tabs";
import { withDayTimes } from "./day-times";
import { getTrainingAdjustment } from "@/mobile/training-adjustment";
import { kcal } from "./format";
import { NutritionToday } from "./today";
import { MealDetail } from "./meal-detail";
import { CompareFoods } from "./compare";
import { FoodLibrary } from "./library";
import { FoodDetail } from "./food-detail";
import { EatOut } from "./eat-out";
import {
  getRestaurantItems,
  listRestaurants,
} from "@/features/restaurants/queries";
import { NutritionHistory, type HistoryDay } from "./history";

export type NutritionParams = {
  vista?: string;
  comida?: string;
  item?: string;
  q?: string;
  filtro?: string;
  /** Ficha de un alimento de la biblioteca. */
  alimento?: string;
  /** Restaurante elegido en «Comer fuera». */
  r?: string;
};

function fechaCorta(dateISO: string): string {
  const s = new Intl.DateTimeFormat("es-CR", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  })
    .format(new Date(`${dateISO}T12:00:00Z`))
    .replace(".", "")
    .replace(",", "");
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Lo comido en los ultimos ~4 meses, por dia: kcal y si salio del plan. */
async function historyDays(
  userId: string,
  today: string,
): Promise<HistoryDay[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("meals")
    .select("date, source_template_meal_id, meal_items(calories_snapshot)")
    .eq("user_id", userId)
    .in("status", ["completada", "completada_con_cambios"])
    .is("deleted_at", null)
    .gte("date", addDaysISO(today, -130))
    .lte("date", today);
  const byDate = new Map<string, HistoryDay>();
  for (const meal of data ?? []) {
    const day = byDate.get(meal.date) ?? {
      date: meal.date,
      calories: 0,
      meals: 0,
      offPlan: 0,
    };
    day.meals += 1;
    if (!meal.source_template_meal_id) day.offPlan += 1;
    day.calories += (meal.meal_items ?? []).reduce(
      (t, i) => t + Number(i.calories_snapshot),
      0,
    );
    byDate.set(meal.date, day);
  }
  return [...byDate.values()];
}

/**
 * Nutricion en telefono: una ruta con la seccion en `?vista=`, como Entrenar.
 * Mismas consultas y acciones que escritorio; otra capa visual.
 */
export async function NutritionMobile({
  userId,
  today,
  date,
  timezone,
  params,
}: {
  userId: string;
  today: string;
  date: string;
  timezone: string;
  params: NutritionParams;
}) {
  const vista = params.vista ?? "";
  if (params.alimento && /^[0-9a-f-]{36}$/i.test(params.alimento)) {
    const { foods } = await getFoodsLibraryPage(userId, {
      foodId: params.alimento,
      view: "todos",
      page: 1,
      pageSize: 1,
    });
    if (foods[0]) return <FoodDetail food={foods[0]} date={date} />;
  }
  const [day, planDelDia] = await Promise.all([
    getDayPlan(userId, date),
    getDietPlanForDate(userId, date, "day"),
  ]);
  // Las comidas movidas de hora solo hoy, ya aplicadas y en orden.
  const { diet, moved } = await withDayTimes(userId, date, planDelDia);

  if (params.comida && diet) {
    const meal = diet.meals.find((m) => m.id === params.comida);
    if (meal) {
      return (
        <MealDetail
          meal={meal}
          date={date}
          movedFrom={moved[meal.id] ?? null}
          loggedMealId={
            day.meals.find((m) => m.sourceTemplateMealId === meal.id)?.id ??
            null
          }
        />
      );
    }
  }

  const planMeals = diet?.meals ?? [];
  const logged = planMeals.filter((m) => m.loggedToday).length;
  const tab =
    vista === "comparar" ||
    vista === "biblioteca" ||
    vista === "fuera" ||
    vista === "historial"
      ? vista
      : "hoy";

  let title = "Nutrición";
  let subtitle: string = planMeals.length
    ? `${fechaCorta(date)} · ${logged} de ${planMeals.length} comidas`
    : fechaCorta(date);
  let body: React.ReactNode;

  if (tab === "comparar") {
    title = "Comparar";
    subtitle = "Encuentra un sustituto con calorías equivalentes";
    body = (
      <CompareFoods
        meals={planMeals}
        date={date}
        initialItemId={params.item ?? null}
      />
    );
  } else if (tab === "biblioteca") {
    title = "Biblioteca";
    subtitle = "Valores por 100 g";
    const view = params.filtro === "favoritos" ? "favoritos" : "todos";
    const { foods } = await getFoodsLibraryPage(userId, {
      query: params.q?.trim().slice(0, 80) || undefined,
      view,
      page: 1,
      pageSize: 40,
    });
    body = <FoodLibrary foods={foods} query={params.q ?? ""} view={view} />;
  } else if (tab === "fuera") {
    title = "Comer fuera";
    subtitle = day.remaining
      ? `Te quedan ${kcal(Math.max(0, day.remaining.calories))} kcal hoy`
      : "Registra lo que comas fuera del plan";
    const restaurants = await listRestaurants(params.q?.trim() || undefined);
    // El elegido puede no salir en la busqueda (se acaba de crear): se suma.
    if (params.r && !restaurants.some((r) => r.id === params.r)) {
      const todos = await listRestaurants();
      const elegido = todos.find((r) => r.id === params.r);
      if (elegido) restaurants.unshift(elegido);
    }
    const selected =
      restaurants.find((r) => r.id === params.r) ??
      restaurants.find((r) => r.itemCount > 0) ??
      null;
    body = (
      <EatOut
        date={date}
        query={params.q ?? ""}
        restaurants={restaurants}
        selected={selected}
        items={selected ? await getRestaurantItems(selected.id) : []}
        remainingKcal={
          day.remaining ? Math.max(0, day.remaining.calories) : null
        }
      />
    );
  } else if (tab === "historial") {
    title = "Historial";
    const days = await historyDays(userId, today);
    subtitle = "Tus días según el plan";
    body = (
      <NutritionHistory
        days={days}
        today={today}
        targetCalories={day.targets?.calories ?? diet?.targetCalories ?? null}
        planMealCount={planMeals.length}
      />
    );
  } else {
    // El ajuste por entreno solo vale para hoy.
    const ajuste =
      date === today
        ? await getTrainingAdjustment(userId, today, timezone)
        : null;
    body = (
      <NutritionToday
        day={day}
        diet={diet}
        date={date}
        today={today}
        moved={moved}
        adjustment={ajuste?.kcal ? ajuste : null}
      />
    );
  }

  return (
    <NutritionTabs active={tab} title={title} subtitle={subtitle}>
      {body}
    </NutritionTabs>
  );
}
