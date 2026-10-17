import {
  fireEvent,
  render,
  screen,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import {
  SwapAlternativeList,
  type AlternativeLoader,
} from "./swap-alternative-list";
import {
  rankAlternatives,
  type EquivalenceFood,
} from "@/features/foods/lib/equivalence";

vi.mock("@/features/nutrition/components/comparison-chat", () => ({
  ComparisonChat: () => <div>Consulta sobre la comparación</div>,
}));

vi.mock("@/features/foods/components/food-form-dialog", () => ({
  FoodFormDialog: () => <button>Agregar alimento</button>,
}));
const source: EquivalenceFood = {
  id: "source",
  name: "Arroz",
  foodGroup: "carbohidrato",
  cookedState: "cocido",
  per100g: {
    calories: 130,
    proteinG: 3,
    carbohydrateG: 28,
    fatG: 1,
    fiberG: 1,
  },
};
const food = {
  ...source,
  id: "papa",
  name: "Papa",
  per100g: { calories: 80, proteinG: 2, carbohydrateG: 17, fatG: 0, fiberG: 2 },
};
const alternatives = rankAlternatives({
  source,
  sourceQuantityG: 100,
  candidates: [food],
  favoriteIds: new Set(),
  recentIds: new Set(),
  restrictions: [],
});
beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
  window.matchMedia = vi.fn().mockReturnValue({
    matches: false,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  });
});
afterEach(cleanup);
function mount(
  load: AlternativeLoader = vi.fn().mockResolvedValue({ alternatives }),
) {
  const onPick = vi.fn();
  render(
    <SwapAlternativeList
      sourceName="Arroz"
      sourceQuantityG={100}
      sourceMacros={source.per100g}
      load={load}
      pending={false}
      onPick={onPick}
    />,
  );
  return { onPick, load };
}
describe("explorar un intercambio", () => {
  it("previsualiza cantidades, recalcula desde los datos originales y bloquea cantidades inválidas", async () => {
    const { onPick } = mount();
    await screen.findByRole("button", { name: /Papa/ });
    expect(
      screen.queryByRole("region", { name: "Qué cambia con esta alternativa" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Papa/ }));
    expect(
      screen.getByRole("region", { name: "Qué cambia con esta alternativa" }),
    ).toHaveTextContent("Proteína");
    expect(
      screen.queryByRole("region", { name: "Elegir alternativa" }),
    ).not.toBeInTheDocument();
    const quantity = screen.getByRole("spinbutton", { name: "Cantidad (g)" });
    fireEvent.change(quantity, { target: { value: "200" } });
    expect(onPick.mock.lastCall?.[0]).toMatchObject({
      suggestedQuantityG: 200,
      macros: { calories: 160, proteinG: 4 },
      diff: { calories: 30, proteinG: 1 },
    });
    fireEvent.change(quantity, { target: { value: "" } });
    expect(onPick.mock.lastCall?.[0]).toBeNull();
    expect(screen.getByRole("alert")).toHaveTextContent("hasta 5000");
    fireEvent.click(screen.getByRole("button", { name: /Usar sugerida/ }));
    expect(onPick.mock.lastCall?.[0].suggestedQuantityG).toBe(
      alternatives[0]!.suggestedQuantityG,
    );
  });
  it("separa el mismo grupo del orden nutricional y permite buscar", async () => {
    const { load } = mount();
    await screen.findByRole("button", { name: /Papa/ });
    expect(load).toHaveBeenLastCalledWith({
      filter: "similar",
      sameGroupOnly: true,
      query: undefined,
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Más cercanas en macros" }),
    );
    await waitFor(() =>
      expect(load).toHaveBeenLastCalledWith({
        filter: "macros",
        sameGroupOnly: false,
        query: undefined,
      }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Buscar" }));
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "papa" },
    });
    await waitFor(() =>
      expect(load).toHaveBeenLastCalledWith({
        filter: "macros",
        sameGroupOnly: false,
        query: "papa",
      }),
    );
  });
  it("descarta una respuesta vieja al cambiar de vista", async () => {
    let resolveOld!: (value: { alternatives: typeof alternatives }) => void;
    const load = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveOld = resolve;
          }),
      )
      .mockResolvedValue({ alternatives: [] });
    mount(load);
    await waitFor(() => expect(load).toHaveBeenCalledTimes(1));
    fireEvent.click(
      screen.getByRole("button", { name: "Más cercanas en macros" }),
    );
    await screen.findByText(/No hay opciones para este criterio/);
    resolveOld({ alternatives });
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: /Papa/ }),
      ).not.toBeInTheDocument(),
    );
  });
  it("pagina dos cards y vuelve a las opciones sin apilar la comparación", async () => {
    const options = Array.from({ length: 5 }, (_, index) => ({
      ...alternatives[0]!,
      food: { ...food, id: `food-${index}`, name: `Opción ${index + 1}` },
    }));
    mount(vi.fn().mockResolvedValue({ alternatives: options }));
    await screen.findByRole("button", { name: /Opción 1/ });
    expect(
      screen.queryByRole("button", { name: /Opción 3/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Opciones siguientes" }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Opción 3/ }));
    expect(
      screen.getByRole("group", { name: "Encontrar alternativas" }),
    ).toBeVisible();
    await waitFor(() =>
      expect(
        screen.getByRole("region", { name: "Comparación del intercambio" }),
      ).toBeVisible(),
    );
    // Without a dedicated button, the active mode reopens the options.
    fireEvent.click(screen.getByRole("button", { name: "Similares" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Opción 3/ })).toBeVisible(),
    );
    expect(
      screen.getByRole("region", { name: "Alimento actual" }),
    ).toHaveTextContent("Arroz");
    expect(screen.getByRole("button", { name: /Opción 3/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.queryByRole("region", { name: "Alimento alternativo" }),
    ).not.toBeInTheDocument();
  });
  it("mantiene las opciones al pulsar la vista que ya está activa", async () => {
    const { load } = mount();
    await screen.findByRole("button", { name: /Papa/ });
    fireEvent.click(screen.getByRole("button", { name: "Similares" }));
    expect(screen.getByRole("button", { name: /Papa/ })).toBeVisible();
    expect(load).toHaveBeenCalledTimes(1);
  });
  it("muestra un error recuperable", async () => {
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue({ alternatives });
    mount(load);
    fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("button", { name: /Papa/ })).toBeVisible();
  });
});
