import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { DayFoodSearch } from "./day-food-search";
import {
  recentDayFoods,
  searchDayFoods,
  searchDayFoodOnWeb,
} from "@/features/foods/day-search-actions";

vi.mock("@/features/foods/day-search-actions", () => ({
  recentDayFoods: vi.fn(),
  searchDayFoods: vi.fn(),
  searchDayFoodOnWeb: vi.fn(),
}));
const food = {
  id: "food-1",
  brand: null,
  foodGroup: "otro" as const,
  cookedState: null,
  verified: false,
  confirmed: false,
  branded: false,
  isOwn: true,
  isFavorite: false,
  imageUrl: null,
  isCorrected: false,
  name: "Yogur de prueba",
  calories: 70,
  proteinG: 5,
  carbohydrateG: 8,
  fatG: 2,
  fiberG: 0,
  nutritionBasis: "100ml" as const,
};

describe("buscador del día", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(searchDayFoods).mockResolvedValue([]);
    vi.mocked(recentDayFoods).mockResolvedValue([]);
  });

  it("con el campo vacío muestra lo reciente, listo para elegir", async () => {
    vi.mocked(recentDayFoods).mockResolvedValue([food]);
    const select = vi.fn();
    render(<DayFoodSearch onSelect={select} />);
    fireEvent.click(
      await screen.findByRole("button", { name: /Yogur de prueba/ }),
    );
    expect(select).toHaveBeenCalledWith(food);
  });

  it("busca en la web explícitamente y deja revisar el alimento antes de seleccionarlo", async () => {
    vi.mocked(searchDayFoodOnWeb).mockResolvedValue({
      result: {
        query: "Yogur",
        status: "saved",
        message: "Guardado con fuentes",
        sources: [],
        foodId: food.id,
      },
      food,
    } as Awaited<ReturnType<typeof searchDayFoodOnWeb>>);
    const select = vi.fn();
    render(<DayFoodSearch onSelect={select} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Yogur" },
    });
    await screen.findByText("No encontramos «Yogur» en tu biblioteca.");
    expect(searchDayFoodOnWeb).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", { name: "Buscar fuera de tu biblioteca" }),
    );
    await screen.findByText("Guardado con fuentes");
    expect(select).not.toHaveBeenCalled();
    expect(screen.getByText("/100 ml")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Yogur de prueba/ }));
    expect(select).toHaveBeenCalledWith(food);
  });

  it("descarta una respuesta web si cambia la consulta", async () => {
    let resolve!: (
      value: Awaited<ReturnType<typeof searchDayFoodOnWeb>>,
    ) => void;
    vi.mocked(searchDayFoodOnWeb).mockReturnValue(
      new Promise((r) => {
        resolve = r;
      }),
    );
    render(<DayFoodSearch onSelect={vi.fn()} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Yogur" },
    });
    fireEvent.click(
      await screen.findByRole("button", {
        name: "Buscar fuera de tu biblioteca",
      }),
    );
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "Arroz" },
    });
    resolve({
      result: {
        query: "Yogur",
        status: "incomplete",
        message: "Respuesta vieja",
        sources: [],
      },
      food: null,
    });
    await waitFor(() => expect(searchDayFoods).toHaveBeenCalledWith("Arroz"));
    expect(screen.queryByText("Respuesta vieja")).not.toBeInTheDocument();
  });
});
