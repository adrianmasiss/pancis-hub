import { describe, expect, it } from "vitest";
import { detectRelevantFormulas } from "./grounding";

describe("detectRelevantFormulas", () => {
  it("una pregunta de proteina trae la constante de proteina", () => {
    expect(
      detectRelevantFormulas("por que mi objetivo de proteina es ese numero?"),
    ).toContain("protein_ranges");
  });

  it("funciona con tildes", () => {
    expect(detectRelevantFormulas("¿cuánta proteína necesito?")).toContain(
      "protein_ranges",
    );
  });

  it("detecta temas de entrenamiento", () => {
    expect(detectRelevantFormulas("cuanto descanso entre series?")).toContain(
      "min_rest_seconds",
    );
    expect(detectRelevantFormulas("tengo que llegar al fallo?")).toContain(
      "rir_by_goal",
    );
  });

  /**
   * Cada fuente que entra al contexto son tokens, y la cuota de Gemini es el
   * cuello de botella del plan gratuito. Una pregunta que toque muchos temas
   * no necesita toda la bibliografia para responderse bien.
   */
  it("acota cuantas fuentes se piden", () => {
    const claves = detectRelevantFormulas(
      "proteina, grasa, fibra, agua, volumen, descanso, tempo y frecuencia",
    );

    expect(claves.length).toBeLessThanOrEqual(3);
  });

  it("prioriza el tema con mas coincidencias", () => {
    const claves = detectRelevantFormulas(
      "cuantas series de volumen debo hacer, hablando de series",
    );

    expect(claves[0]).toBe("weekly_set_ranges");
  });

  it("una pregunta sin tema reconocible no pide fuentes", () => {
    expect(detectRelevantFormulas("hola, que tal?")).toEqual([]);
    expect(detectRelevantFormulas("")).toEqual([]);
  });

  it("una senal de comer demasiado poco activa el tema de seguridad", () => {
    expect(
      detectRelevantFormulas("siento que estoy comiendo muy poco"),
    ).toContain("energy_availability_thresholds");
  });

  it("una pregunta de InBody trae la incertidumbre de la bioimpedancia", () => {
    expect(
      detectRelevantFormulas("por que mi InBody dice otra cosa cada semana?"),
    ).toContain("bia_individual_error");
  });
});
