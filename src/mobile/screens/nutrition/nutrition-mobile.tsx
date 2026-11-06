import { getDayPlan, getDietPlanForDate } from "@/features/nutrition/queries";
import { getFoodsLibraryPage } from "@/features/foods/queries";
import { createClient } from "@/lib/supabase/server";
import { addDaysISO } from "@/lib/dates";
import { NutritionTabs } from "./nutrition-tabs";
import { withDayTimes } from "./day-times";
import { getTrainingAdjustment } from "@/mobile/training-adjustment";
import { kcal, mealLabel } from "./format";
import { NutritionToday } from "./today";
import { MealDetail } from "./meal-detail";
import { CompareFoods } from "./compare";
import { FoodLibrary, type LibraryFilter } from "./library";
import { FOOD_GROUPS, type FoodGroup } from "@/features/foods/schemas";
import { FoodDetail } from "./food-detail";
import { BarcodeScannerScreen } from "./scanner";
import { EatOut } from "./eat-out";
import {
  getRestaurant,
  getRestaurantItems,
  listRestaurants,
} from "@/features/restaurants/queries";
import { RestaurantMenu } from "./restaurant-menu";
import { DishDetail } from "./dish-detail";
import { NutritionHistory, type HistoryDay } from "./history";

export type NutritionParams = {
  vista?: string;
  comida?: string;
  item?: string;
  q?: string;
  filtro?: string;
  /** Grupo de alimento de la biblioteca (`FOOD_GROUPS`). */
  grupo?: string;
  pagina?: string;
  /** Ficha de un alimento de la biblioteca. */
  alimento?: string;
  /** Restaurante elegido en «Comer fuera»: abre su menu. */
  r?: string;
  /** Plato del menu del restaurante: abre su ficha. */
  plato?: string;
  /** Historial abierto desde «Copiar de otro día». */
  copiar?: string;
};

/** Alimentos por pagina de la biblioteca, como la de ejercicios. */
const FOOD_LIBRARY_PAGE = 24;

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
  if (vista === "escanear") {
    return <BarcodeScannerScreen backHref="/nutricion?vista=biblioteca" />;
  }
  if (params.alimento && /^[0-9a-f-]{36}$/i.test(params.alimento)) {
    const { foods } = await getFoodsLibraryPage(userId, {
      foodId: params.alimento,
      view: "todos",
      page: 1,
      pageSize: 1,
    });
    if (foods[0]) {
      const plan = await getDietPlanForDate(userId, date, "day");
      const { diet } = await withDayTimes(userId, date, plan);
      return (
        <FoodDetail
          food={foods[0]}
          date={date}
          meals={(diet?.meals ?? []).map((m) => ({
            id: m.id,
            name: mealLabel(m.mealType, m.name),
            time: m.scheduledTime,
          }))}
        />
      );
    }
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

  const UUID = /^[0-9a-f-]{36}$/i;
  if (vista === "fuera" && params.r && UUID.test(params.r)) {
    const restaurant = await getRestaurant(params.r);
    if (restaurant) {
      const items = await getRestaurantItems(restaurant.id);
      const remainingKcal = day.remaining
        ? Math.max(0, day.remaining.calories)
        : null;
      const item =
        params.plato && UUID.test(params.plato)
          ? items.find((i) => i.id === params.plato)
          : undefined;
      if (item) {
        const abiertas = (diet?.meals ?? []).filter((m) => !m.loggedToday);
        // La que toca: la primera sin registrar cuya hora no paso, o la
        // primera sin registrar (las horas van como HH:MM:SS).
        const ahora =
          date === today
            ? new Intl.DateTimeFormat("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
                timeZone: timezone,
              }).format(new Date())
            : "00:00";
        const sugerida =
          abiertas.find(
            (m) => (m.scheduledTime?.slice(0, 5) ?? "99:99") >= ahora,
          ) ?? abiertas[0];
        return (
          <DishDetail
            restaurant={restaurant}
            item={item}
            date={date}
            consumed={day.totals}
            targets={day.targets}
            openPlanMeals={abiertas.map((m) => ({
              id: m.id,
              label: mealLabel(m.mealType, m.name),
              kcal: m.totals.calories,
            }))}
            suggestedMealId={sugerida?.id ?? null}
            pendingPlanKcal={abiertas.reduce(
              (t, m) => t + m.totals.calories,
              0,
            )}
          />
        );
      }
      return (
        <RestaurantMenu
          restaurant={restaurant}
          items={items}
          remainingKcal={remainingKcal}
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
        targets={day.targets ?? null}
      />
    );
  } else if (tab === "biblioteca") {
    title = "Biblioteca";
    subtitle = "Valores por 100 g";
    const filtro: LibraryFilter =
      params.filtro === "favoritos" || params.filtro === "verificados"
        ? params.filtro
        : "todos";
    const grupo = FOOD_GROUPS.includes(params.grupo as FoodGroup)
      ? (params.grupo as FoodGroup)
      : null;
    const page = Math.max(1, Number(params.pagina) || 1);
    const { foods, total } = await getFoodsLibraryPage(userId, {
      query: params.q?.trim().slice(0, 80) || undefined,
      view: filtro === "favoritos" ? "favoritos" : "todos",
      onlyConfirmed: filtro === "verificados",
      group: grupo ?? undefined,
      page,
      pageSize: FOOD_LIBRARY_PAGE,
    });
    body = (
      <FoodLibrary
        foods={foods}
        total={total}
        query={params.q ?? ""}
        page={page}
        pageSize={FOOD_LIBRARY_PAGE}
        filter={filtro}
        group={grupo}
      />
    );
  } else if (tab === "fuera") {
    title = "Comer fuera";
    subtitle = day.remaining
      ? `Te quedan ${kcal(Math.max(0, day.remaining.calories))} kcal hoy`
      : "Registra lo que comas fuera del plan";
    const restaurants = await listRestaurants(params.q?.trim() || undefined);
    body = (
      <EatOut
        query={params.q ?? ""}
        restaurants={restaurants}
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
        copyMode={params.copiar === "1"}
        timezone={timezone}
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
