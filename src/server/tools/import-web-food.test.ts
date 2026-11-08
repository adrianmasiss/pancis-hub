import { beforeEach, describe, expect, it, vi } from "vitest";
import { importWebFood, webFoodId } from "./import-web-food";
import type { FoodResearch } from "./web-food-research";

const mocks = vi.hoisted(() => ({
  client: vi.fn(),
  research: vi.fn(),
  revalidate: vi.fn(),
  off: vi.fn(),
  importExternal: vi.fn(),
  byBarcode: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.client }));
vi.mock("@/lib/ai/google", () => ({ hasGeminiApiKey: () => true }));
vi.mock("./web-food-research", () => ({ researchFoodOnWeb: mocks.research }));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
vi.mock("./off-lookup", () => ({
  findOnOpenFoodFacts: mocks.off,
  isCompleteOffFood: (food: { missingNutrients?: string[] }) =>
    !food.missingNutrients?.length,
  offProductUrl: (code: string) =>
    `https://world.openfoodfacts.org/product/${code}`,
}));
vi.mock("@/features/foods/external-actions", () => ({
  importExternalFood: mocks.importExternal,
}));
vi.mock("@/lib/food-providers", () => ({
  openFoodFactsProvider: { getFoodByBarcode: mocks.byBarcode },
}));

const offFood = (code: string, calories: number) => ({
  source: "openfoodfacts",
  externalId: code,
  barcode: code,
  name: "Chiky",
  externalName: "Chiky",
  brand: "Pozuelo",
  imageUrl: null,
  foodGroup: "carbohidrato",
  cookedState: null,
  per100g: {
    calories,
    proteinG: 5,
    carbohydrateG: 67.5,
    fatG: 22.5,
    fiberG: 2.5,
  },
  sugarG: 30,
  sodiumMg: 275,
  sourceUpdatedAt: null,
  portions: [],
  aliases: [],
});

const userId = "11111111-1111-4111-a111-111111111111";
const evidence =
  "Por 34 g: 162 kcal, proteína 2 g, carbohidratos 23 g, grasa 7 g, fibra 1 g.";
const research: FoodResearch = {
  report: evidence,
  sources: [{ title: "Etiqueta local", url: "https://example.com/producto" }],
  reading: {
    name: "Galleta de prueba",
    brand: "Marca",
    market: "Costa Rica",
    foodGroup: "carbohidrato",
    identityClear: true,
    conflicts: [],
    basis: "serving_g",
    amount: 34,
    portionLabel: "1 paquete",
    calories: 162,
    proteinG: 2,
    carbohydrateG: 23,
    fatG: 7,
    fiberG: 1,
    sugarG: null,
    sodiumMg: null,
    evidence,
    sourceIndices: [0],
    notes: [],
  },
};

function mockDatabase(
  responses: { data?: unknown; error?: unknown }[],
  signedIn = true,
) {
  const writes: { table: string; value: Record<string, unknown> }[] = [];
  const from = vi.fn((table: string) => {
    const response = responses.shift() ?? { data: null, error: null };
    const chain: Record<string, unknown> = {};
    for (const method of [
      "select",
      "eq",
      "ilike",
      "is",
      "limit",
      "maybeSingle",
    ])
      chain[method] = () => chain;
    chain.insert = (value: Record<string, unknown>) => {
      writes.push({ table, value });
      return chain;
    };
    chain.then = (resolve: (value: unknown) => void) =>
      Promise.resolve(response).then(resolve);
    return chain;
  });
  mocks.client.mockResolvedValue({
    from,
    auth: {
      getUser: async () => ({
        data: { user: signedIn ? { id: userId } : null },
      }),
    },
  });
  return { writes, from };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.research.mockResolvedValue(structuredClone(research));
  mocks.off.mockResolvedValue({ kind: "none" });
});

describe("buscar y guardar un alimento", () => {
  it("guarda datos normalizados como privados y no verificados, con evidencia y alias", async () => {
    const { writes } = mockDatabase([{ data: [] }, { data: [] }]);
    const result = await importWebFood("galetadeprueba");
    expect(result.status).toBe("saved");
    const food = writes.find((w) => w.table === "foods")!.value;
    expect(food).toMatchObject({
      owner_user_id: userId,
      verified: false,
      calories: 476.5,
      sugar_g: null,
    });
    expect(food.web_provenance).toMatchObject({
      query: "galetadeprueba",
      sources: research.sources,
      reading: research.reading,
    });
    expect(
      writes.some(
        (w) => w.table === "food_aliases" && w.value.alias === "galetadeprueba",
      ),
    ).toBe(true);
    expect(
      writes.some((w) => w.table === "meals" || w.table === "meal_items"),
    ).toBe(false);
  });
  it("reutiliza una coincidencia local sin consumir búsqueda web", async () => {
    const { writes } = mockDatabase([
      { data: [{ id: "existing" }] },
      { data: [] },
      { data: { id: "existing", name: "Galleta" } },
    ]);
    expect((await importWebFood("Galleta")).status).toBe("existing");
    expect(mocks.research).not.toHaveBeenCalled();
    expect(writes).toHaveLength(0);
  });
  it("no escribe al faltar nutrientes o al fallar la búsqueda", async () => {
    const { writes } = mockDatabase([{ data: [] }, { data: [] }]);
    mocks.research.mockResolvedValue({
      ...research,
      reading: { ...research.reading, proteinG: null },
    });
    expect((await importWebFood("Galleta")).status).toBe("incomplete");
    expect(writes).toHaveLength(0);
    mocks.research.mockRejectedValue(new Error("quota"));
    expect((await importWebFood("Galleta")).status).toBe("unavailable");
    expect(writes).toHaveLength(0);
  });
  it("un error de guardado no se anuncia como éxito", async () => {
    mockDatabase([
      { data: [] },
      { data: [] },
      { error: { code: "42501" } },
      { data: null },
    ]);
    const result = await importWebFood("Galleta");
    expect(result.status).toBe("unavailable");
    expect(result.foodId).toBeUndefined();
    expect(result.sources).toEqual(research.sources);
  });
  it("una carrera de inserción devuelve la ficha existente", async () => {
    mockDatabase([
      { data: [] },
      { data: [] },
      { error: { code: "23505" } },
      { data: { id: "existing" } },
    ]);
    expect((await importWebFood("Galleta")).status).toBe("existing");
  });
  it("no permite buscar o escribir sin sesión", async () => {
    const { from } = mockDatabase([], false);
    expect((await importWebFood("Galleta")).status).toBe("unavailable");
    expect(from).not.toHaveBeenCalled();
    expect(mocks.research).not.toHaveBeenCalled();
  });
  it("Open Food Facts va antes que la web y no gasta búsqueda", async () => {
    const { writes } = mockDatabase([{ data: [] }, { data: [] }]);
    mocks.off.mockResolvedValue({ kind: "one", food: offFood("7441", 488) });
    mocks.importExternal.mockResolvedValue({
      success: true,
      foodId: "off-food",
      alreadyExisted: false,
    });
    const result = await importWebFood("chiky");
    expect(result).toMatchObject({ status: "saved", foodId: "off-food" });
    expect(result.sources[0]!.url).toContain("/product/7441");
    expect(mocks.importExternal).toHaveBeenCalledWith({
      source: "openfoodfacts",
      externalId: "7441",
    });
    expect(mocks.research).not.toHaveBeenCalled();
    expect(writes).toHaveLength(0);
  });
  it("fichas que no coinciden: no elige, devuelve los códigos", async () => {
    mockDatabase([{ data: [] }, { data: [] }]);
    mocks.off.mockResolvedValue({
      kind: "choices",
      foods: [offFood("7441", 488), offFood("7442", 500)],
    });
    const result = await importWebFood("chiky");
    expect(result.status).toBe("incomplete");
    expect(result.message).toContain("7441");
    expect(result.message).toContain("7442");
    expect(mocks.importExternal).not.toHaveBeenCalled();
    expect(mocks.research).not.toHaveBeenCalled();
  });
  it("con el código elegido guarda esa ficha exacta", async () => {
    mockDatabase([{ data: [] }, { data: [] }]);
    mocks.byBarcode.mockResolvedValue(offFood("7442", 500));
    mocks.importExternal.mockResolvedValue({
      success: true,
      foodId: "off-7442",
      alreadyExisted: false,
    });
    const result = await importWebFood("chiky", { barcode: "7442000" });
    expect(result.status).toBe("saved");
    expect(mocks.off).not.toHaveBeenCalled();
    mocks.byBarcode.mockResolvedValue({
      ...offFood("7443", 500),
      missingNutrients: ["fiberG"],
    });
    expect((await importWebFood("chiky", { barcode: "7443000" })).status).toBe(
      "incomplete",
    );
  });
  it("el identificador es estable por producto y se separa por usuario", () => {
    expect(webFoodId(userId, "Choco QuQi", "Gallito")).toBe(
      webFoodId(userId, "chocoquqi", "GALLITO"),
    );
    expect(webFoodId(userId, "Choco QuQi", "Gallito")).not.toBe(
      webFoodId("otro", "Choco QuQi", "Gallito"),
    );
  });
});
