import { beforeEach, expect, it, vi } from "vitest";
import { researchFoodOnWeb } from "./web-food-research";

const mocks = vi.hoisted(() => ({ text: vi.fn(), object: vi.fn() }));
vi.mock("ai", () => ({
  generateText: mocks.text,
  generateObject: mocks.object,
}));
vi.mock("@/ai-sdk/google", () => ({
  google: { tools: { googleSearch: () => ({}) } },
}));
vi.mock("@/lib/ai/google", () => ({
  getGeminiModel: () => ({}),
  getGeminiSearchModel: () => ({}),
}));

beforeEach(() => vi.clearAllMocks());

it("no importa respuestas basadas en memoria sin grounding", async () => {
  mocks.text.mockResolvedValue({
    text: "La galleta tiene 162 calorías",
    providerMetadata: {},
  });
  expect((await researchFoodOnWeb("galleta")).reading).toBeNull();
  expect(mocks.object).not.toHaveBeenCalled();
});

it("conserva el texto y las citas del proveedor aunque el modelo los cambie", async () => {
  mocks.text.mockResolvedValue({
    text: "Por 34 g: 162 kcal.",
    providerMetadata: {
      google: {
        groundingMetadata: {
          groundingChunks: [
            { web: { uri: "https://example.com/etiqueta", title: "Etiqueta" } },
            { web: { uri: "https://example.com/otra", title: "Otra" } },
          ],
          groundingSupports: [
            {
              segment: { text: "Por 34 g: 162 kcal." },
              groundingChunkIndices: [0],
            },
          ],
          searchEntryPoint: { renderedContent: "<div>Sugerencias</div>" },
        },
      },
    },
  });
  mocks.object.mockResolvedValue({
    object: {
      name: "Galleta",
      brand: "Marca",
      market: "Costa Rica",
      foodGroup: "carbohidrato",
      identityClear: true,
      conflicts: [],
      basis: "serving_g",
      amount: 34,
      portionLabel: null,
      calories: 162,
      proteinG: null,
      carbohydrateG: null,
      fatG: null,
      fiberG: null,
      sugarG: null,
      sodiumMg: null,
      notes: [],
      evidence: "Texto reformateado por el modelo",
      sourceIndices: [1],
      evidenceSegments: [0],
    },
  });
  const result = await researchFoodOnWeb("galleta");
  expect(result.reading?.evidence).toBe("Por 34 g: 162 kcal.");
  expect(result.reading?.sourceIndices).toEqual([0]);
  expect(result.searchSuggestions).toBe("<div>Sugerencias</div>");
  mocks.object.mockResolvedValue({ object: { evidenceSegments: [99] } });
  expect((await researchFoodOnWeb("galleta")).reading).toBeNull();
  mocks.object.mockRejectedValue(new Error("quota"));
  expect((await researchFoodOnWeb("galleta")).searchSuggestions).toBe(
    "<div>Sugerencias</div>",
  );
});
