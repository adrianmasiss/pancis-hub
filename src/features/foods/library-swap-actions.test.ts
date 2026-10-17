import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  user: { id: "owner" } as { id: string } | null,
  diet: vi.fn(),
  foods: vi.fn(),
  swap: vi.fn(),
  restrictions: [] as { value: string }[],
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/dates", () => ({ todayInTimezone: () => "2026-09-29" }));
vi.mock("@/features/nutrition/queries", () => ({
  getDietPlanForDate: mock.diet,
}));
vi.mock("./queries", () => ({ getFoodsLibrary: mock.foods }));
vi.mock("@/features/nutrition/day-swap-actions", () => ({
  swapDietItemForDay: mock.swap,
}));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: mock.user } }) },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data:
              table === "profiles"
                ? { timezone: "America/Costa_Rica" }
                : { food_group: "carbohidrato" },
          }),
          in: async () => ({ data: mock.restrictions }),
        }),
      }),
    }),
  }),
}));
import { previewLibrarySwap, confirmLibrarySwap } from "./library-swap-actions";
const input = {
  foodId: "00000000-0000-4000-8000-000000000010",
  templateItemId: "00000000-0000-4000-8000-000000000020",
  date: "2026-09-29",
};
const meal = {
  loggedToday: false,
  items: [
    {
      id: input.templateItemId,
      foodId: "source",
      foodName: "Arroz",
      quantityG: 100,
      macros: {
        calories: 130,
        proteinG: 2.7,
        carbohydrateG: 28,
        fatG: 0.3,
        fiberG: 0.4,
      },
    },
  ],
};
beforeEach(() => {
  vi.clearAllMocks();
  mock.user = { id: "owner" };
  mock.restrictions = [];
  mock.diet.mockResolvedValue({ meals: [meal] });
  mock.foods.mockResolvedValue([
    {
      id: input.foodId,
      name: "Papa",
      foodGroup: "carbohidrato",
      cookedState: "cocido",
      calories: 80,
      proteinG: 2,
      carbohydrateG: 20,
      fatG: 0.1,
      fiberG: 2,
    },
  ]);
  mock.swap.mockResolvedValue({});
});
describe("library substitution boundary", () => {
  it("previews actual portions without writing", async () => {
    const result = await previewLibrarySwap(input);
    expect(result).toMatchObject({
      quantityG: 140,
      fromName: "Arroz",
      toName: "Papa",
      after: { calories: 112, carbohydrateG: 28 },
    });
    expect(mock.swap).not.toHaveBeenCalled();
  });
  it("uses server nutrition, not injected client macros", async () => {
    const result = await previewLibrarySwap({
      ...input,
      quantityG: 200,
      calories: 999,
    });
    expect(result).toMatchObject({
      after: { calories: 160 },
      diff: { calories: 30 },
    });
  });
  it("blocks foreign items, unavailable foods and consumed meals", async () => {
    mock.diet.mockResolvedValue({ meals: [] });
    expect(
      await confirmLibrarySwap({ ...input, quantityG: 100 }),
    ).toHaveProperty("error");
    mock.diet.mockResolvedValue({ meals: [{ ...meal, loggedToday: true }] });
    expect(
      await confirmLibrarySwap({ ...input, quantityG: 100 }),
    ).toHaveProperty("error");
    mock.diet.mockResolvedValue({ meals: [meal] });
    mock.foods.mockResolvedValue([]);
    expect(
      await confirmLibrarySwap({ ...input, quantityG: 100 }),
    ).toHaveProperty("error");
    expect(mock.swap).not.toHaveBeenCalled();
  });
  it("requires authentication, current date and a valid quantity", async () => {
    expect(
      await confirmLibrarySwap({ ...input, quantityG: -10 }),
    ).toHaveProperty("error");
    expect(
      await previewLibrarySwap({ ...input, date: "2026-09-28" }),
    ).toHaveProperty("error");
    mock.user = null;
    expect(
      await confirmLibrarySwap({ ...input, quantityG: 100 }),
    ).toHaveProperty("error");
    expect(mock.swap).not.toHaveBeenCalled();
  });
  it("checks saved dietary restrictions before confirming", async () => {
    mock.restrictions = [{ value: "papa" }];
    expect(
      await confirmLibrarySwap({ ...input, quantityG: 100 }),
    ).toHaveProperty("error");
    expect(mock.swap).not.toHaveBeenCalled();
  });
  it("writes only the selected item and day after explicit confirmation", async () => {
    expect(await confirmLibrarySwap({ ...input, quantityG: 120 })).toEqual({});
    expect(mock.swap).toHaveBeenCalledExactlyOnceWith({
      ...input,
      quantityG: 120,
    });
  });
});
