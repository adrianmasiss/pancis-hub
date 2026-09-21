import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PlanMealCard } from "@/features/nutrition/components/plan-meal-card";
import type { DietTemplateMealView } from "@/features/dashboard/queries";

const logDietTemplateMeal = vi.fn();
const fireCelebration = vi.fn();

vi.mock("@/features/dashboard/actions", () => ({
  logDietTemplateMeal: (...args: unknown[]) => logDietTemplateMeal(...args),
}));
vi.mock("@/components/shared/celebration-overlay", () => ({
  fireCelebration: () => fireCelebration(),
}));
vi.mock("@/lib/haptics", () => ({ triggerHaptic: vi.fn() }));
vi.mock("@/features/dashboard/components/diet-item-swap-sheet", () => ({
  DietItemSwapSheet: () => null,
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
  items: [],
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
    fireCelebration.mockReset();
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

  it("cae al mapa por tipo cuando el plan no trae hora", () => {
    render(
      <PlanMealCard
        meal={{ ...meal, scheduledTime: null }}
        date="2026-08-18"
      />,
    );

    expect(screen.getByText("07:00")).toBeInTheDocument();
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
