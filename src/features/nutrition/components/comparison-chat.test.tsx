import {
  fireEvent,
  render,
  screen,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ComparisonChat } from "./comparison-chat";
import { askAssistant } from "@/features/assistant/actions";

vi.mock("@/features/assistant/actions", () => ({ askAssistant: vi.fn() }));
vi.mock("@/features/assistant/components/assistant-reply-card", () => ({
  AssistantReplyCard: () => <div>Respuesta completa</div>,
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
const source = {
  name: "Avena",
  quantityG: 80,
  macros: {
    calories: 311,
    proteinG: 13.5,
    carbohydrateG: 52.8,
    fatG: 5.5,
    fiberG: 8.5,
  },
};
const alternative = {
  name: "Arroz",
  quantityG: 125,
  macros: {
    calories: 163,
    proteinG: 3,
    carbohydrateG: 35,
    fatG: 0.5,
    fiberG: 1,
  },
};

describe("consulta contextual", () => {
  it("envía las porciones visibles y conserva la conversación al preguntar de nuevo", async () => {
    vi.mocked(askAssistant).mockResolvedValue({
      conversationId: "thread",
      reply: {
        observation: "Esta alternativa tiene menos proteína.",
        interpretation: "Comparación",
        action: "Revisar",
        reason: "Macros",
        confidence: "alta",
        reevaluate: "Al cambiar porción",
      },
    });
    const { rerender } = render(
      <ComparisonChat source={source} alternative={alternative} />,
    );
    const input = screen.getByRole("textbox", {
      name: "Pregunta sobre los alimentos comparados",
    });
    fireEvent.change(input, { target: { value: "¿Cuál tiene más proteína?" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar consulta" }));
    await screen.findByText("Esta alternativa tiene menos proteína.");
    expect(askAssistant).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Arroz (125g"),
      }),
    );
    rerender(
      <ComparisonChat
        source={source}
        alternative={{
          ...alternative,
          quantityG: 250,
          macros: { ...alternative.macros, calories: 326 },
        }}
      />,
    );
    fireEvent.change(input, { target: { value: "¿Y ahora?" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar consulta" }));
    await waitFor(() =>
      expect(askAssistant).toHaveBeenLastCalledWith(
        expect.objectContaining({
          conversationId: "thread",
          message: expect.stringContaining("Arroz (250g"),
        }),
      ),
    );
    const message = vi.mocked(askAssistant).mock.calls[1]![0] as {
      message: string;
    };
    expect(message.message.length).toBeLessThanOrEqual(500);
  });
  it("mantiene la pregunta cuando el asistente falla para permitir reintentar", async () => {
    vi.mocked(askAssistant).mockRejectedValue(new Error("offline"));
    render(<ComparisonChat source={source} alternative={null} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "¿Cuánta fibra tiene?" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar consulta" }));
    await screen.findByRole("alert");
    expect(input).toHaveValue("¿Cuánta fibra tiene?");
  });
});
