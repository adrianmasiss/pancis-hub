import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlanMealCard } from "@/features/nutrition/components/plan-meal-card";
import type { DietTemplateMealView } from "@/features/dashboard/queries";

const logDietTemplateMeal = vi.fn();
const fireCelebration = vi.fn();

const deleteMeal = vi.fn();

vi.mock("@/features/dashboard/actions", () => ({
  logDietTemplateMeal: (...args: unknown[]) => logDietTemplateMeal(...args),
  getDietItemSwapSuggestions: () => new Promise(() => {}),
  swapDietTemplateItem: vi.fn(),
}));
vi.mock("@/features/nutrition/actions", () => ({
  deleteMeal: (...args: unknown[]) => deleteMeal(...args),
}));
vi.mock("@/features/nutrition/components/plan-food-edit-dialog", () => ({
  PlanFoodEditDialog: () => null,
}));
vi.mock("@/components/shared/celebration-overlay", () => ({
  fireCelebration: () => fireCelebration(),
}));
vi.mock("@/lib/haptics", () => ({ triggerHaptic: vi.fn() }));
vi.mock("@/features/dashboard/components/diet-item-swap-sheet", () => ({
  DietItemSwapSheet: ({
    item,
    trigger,
  }: {
    item: { foodName: string };
    trigger?: string;
  }) =>
    trigger === "action" ? (
      <button type="button">{`Intercambiar — ${item.foodName}`}</button>
    ) : null,
}));
vi.mock("@/features/nutrition/components/undo-day-swap-button", () => ({
  UndoDaySwapButton: () => null,
}));

const meal: DietTemplateMealView = {
  id: "5d63c42d-fd5f-4b63-9896-a91a9f78e720",
  name: "Desayuno",
  mealType: "desayuno",
  orderIndex: 0,
  scheduledTime: "07:30:00",
  loggedToday: false,
  items: [
    {
      id: "item-1",
      foodId: "food-1",
      foodName: "Avena",
      isCustom: false,
      omitted: false,
      foodGroup: "carbohidrato",
      imageUrl: null,
      sodiumMg: null,
      sugarG: null,
      quantityG: 80,
      servingEquivalence: null,
      foodPortions: [],
      daySwap: null,
      macros: {
        calories: 420,
        proteinG: 28,
        carbohydrateG: 48,
        fatG: 12,
        fiberG: 8,
      },
    },
  ],
  totals: {
    calories: 420,
    proteinG: 28,
    carbohydrateG: 48,
    fatG: 12,
    fiberG: 8,
  },
};

describe("PlanMealCard", () => {
  beforeEach(() => {
    logDietTemplateMeal.mockReset();
    deleteMeal.mockReset();
    fireCelebration.mockReset();
  });

  it("registra la comida con su interruptor", async () => {
    const user = userEvent.setup();
    logDietTemplateMeal.mockResolvedValue({ success: true });
    render(<PlanMealCard meal={meal} date="2026-09-28" compact />);
    await user.click(
      screen.getByRole("switch", { name: "Marcar como comida — Desayuno" }),
    );
    expect(logDietTemplateMeal).toHaveBeenCalledWith({
      templateMealId: meal.id,
      date: "2026-09-28",
    });
  });

  it("cada alimento ofrece sustituirlo sin registrar la comida", () => {
    render(<PlanMealCard meal={meal} date="2026-09-28" compact />);
    expect(
      screen.getByRole("button", { name: "Intercambiar — Avena" }),
    ).toBeInTheDocument();
    expect(logDietTemplateMeal).not.toHaveBeenCalled();
  });

  it("muestra los totales de la comida y su parte de la meta diaria", () => {
    render(
      <PlanMealCard
        meal={meal}
        date="2026-09-28"
        compact
        dayTargets={{
          calories: 2100,
          proteinG: 140,
          carbohydrateG: 240,
          fatG: 60,
          fiberG: 30,
        }}
      />,
    );
    expect(
      screen.getByText(/de proteína, 20% de tu meta diaria/),
    ).toBeInTheDocument();
  });

  it("lista cada alimento por separado con su cantidad", () => {
    render(<PlanMealCard meal={meal} date="2026-09-28" compact />);
    const foods = screen.getByRole("list", { name: "Alimentos — Desayuno" });
    expect(foods).toHaveTextContent("Avena");
    expect(foods).toHaveTextContent("80 g");
  });

  it("desmarcar borra el registro que salio de esta comida", async () => {
    deleteMeal.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    const loggedMealId = "0c7d7d1e-5d0a-4a4b-9b55-1f4d1b6f2b10";
    render(
      <PlanMealCard
        meal={{ ...meal, loggedToday: true }}
        date="2026-09-28"
        compact
        loggedMealId={loggedMealId}
      />,
    );
    const toggle = screen.getByRole("switch", {
      name: "Registrada — Desayuno",
    });
    expect(toggle).toBeChecked();
    await user.click(toggle);
    expect(deleteMeal).toHaveBeenCalledWith({ mealId: loggedMealId });
    expect(logDietTemplateMeal).not.toHaveBeenCalled();
  });

  it("sin el registro a mano, la fila registrada no se puede desmarcar", () => {
    render(
      <PlanMealCard
        meal={{ ...meal, loggedToday: true }}
        date="2026-09-28"
        compact
      />,
    );
    const toggle = screen.getByRole("switch", {
      name: "Registrada — Desayuno",
    });
    expect(toggle).toBeChecked();
    expect(toggle).toBeDisabled();
  });

  it("registra la comida concreta en la fecha visible", async () => {
    logDietTemplateMeal.mockResolvedValue({ success: true });
    const user = userEvent.setup();
    render(<PlanMealCard meal={meal} date="2026-08-18" />);

    await user.click(
      screen.getByRole("button", { name: "Marcar como comida — Desayuno" }),
    );

    expect(logDietTemplateMeal).toHaveBeenCalledWith({
      templateMealId: meal.id,
      date: "2026-08-18",
    });
    expect(fireCelebration).toHaveBeenCalledOnce();
  });

  it("muestra la hora del plan, no la del mapa por tipo", () => {
    // `meal_type` es "desayuno", que en el mapa de respaldo son las 07:00.
    // Si sale 07:30 es porque manda `scheduledTime`, que es lo que se quiere:
    // el mapa solo da cinco horas y el plan puede tener cinco comidas a horas
    // que no coinciden con ninguna.
    render(<PlanMealCard meal={meal} date="2026-08-18" />);

    expect(screen.getByText("07:30")).toBeInTheDocument();
    expect(screen.queryByText("07:00")).not.toBeInTheDocument();
  });

  it("no inventa una hora cuando el plan no la tiene", () => {
    render(
      <PlanMealCard
        meal={{ ...meal, scheduledTime: null }}
        date="2026-08-18"
      />,
    );

    expect(screen.getByText("Sin horario")).toBeInTheDocument();
  });

  it("permite abrir sustituciones sin registrar la comida", async () => {
    const user = userEvent.setup();
    render(<PlanMealCard meal={meal} date="2026-08-18" />);
    await user.click(
      screen.getByRole("button", { name: "Sustituir alimentos — Desayuno" }),
    );
    expect(screen.getByText(/Elige un alimento/)).toBeVisible();
    expect(logDietTemplateMeal).not.toHaveBeenCalled();
  });

  it("en Mi plan no ofrece registrar consumo", () => {
    render(<PlanMealCard meal={meal} date="2026-08-18" mode="plan" />);
    expect(
      screen.queryByRole("button", { name: /Marcar como comida/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Sustituir alimentos/ }),
    ).toBeVisible();
  });

  it("no celebra un reintento idempotente", async () => {
    logDietTemplateMeal.mockResolvedValue({
      success: true,
      alreadyLogged: true,
    });
    const user = userEvent.setup();
    render(<PlanMealCard meal={meal} date="2026-08-18" />);

    await user.click(
      screen.getByRole("button", { name: "Marcar como comida — Desayuno" }),
    );

    expect(fireCelebration).not.toHaveBeenCalled();
  });
});
