import { APICallError } from "ai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { geminiModelId, withGeminiFallback } from "./google";

vi.mock("@ai-sdk/google", () => ({ google: (id: string) => ({ id }) }));

function apiError(statusCode: number) {
  return new APICallError({
    message: `HTTP ${statusCode}`,
    url: "https://example.com",
    requestBodyValues: {},
    statusCode,
  });
}

beforeEach(() => {
  vi.stubEnv("GOOGLE_GENERATIVE_AI_API_KEY", "clave");
  vi.stubEnv("GEMINI_MODEL", "modelo-fino");
  vi.stubEnv("GEMINI_MODEL_RAPIDO", "modelo-rapido");
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("withGeminiFallback", () => {
  it("usa el nivel pedido cuando responde", async () => {
    const run = vi.fn(async (model: unknown) => (model as { id: string }).id);
    expect(await withGeminiFallback("rapido", run)).toBe("modelo-rapido");
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("sin cuota en el fino, contesta el rapido", async () => {
    const run = vi.fn(async (model: unknown, tier: string) => {
      if (tier === "fino") throw apiError(429);
      return (model as { id: string }).id;
    });
    expect(await withGeminiFallback("fino", run)).toBe("modelo-rapido");
  });

  it("un error que no es del modelo no se reintenta con el otro", async () => {
    const run = vi.fn(async () => {
      throw apiError(400);
    });
    await expect(withGeminiFallback("fino", run)).rejects.toThrow();
    expect(run).toHaveBeenCalledTimes(1);
  });

  it("sin modelo rapido configurado usa el lite por defecto", () => {
    vi.stubEnv("GEMINI_MODEL_RAPIDO", "");
    expect(geminiModelId("rapido")).toBe("gemini-3.1-flash-lite");
  });
});
