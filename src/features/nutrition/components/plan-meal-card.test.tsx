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
