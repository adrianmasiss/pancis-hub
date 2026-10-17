import { describe, expect, it } from "vitest";
import { matchExercise, searchExerciseCatalog } from "./exercise-matcher";

const catalogo = [
  "Barbell incline bench press",
  "Incline Dumbbell Press",
  "Cable Crossover",
  "Cable pulldown",
  "One-Arm Dumbbell Row",
  "Dumbbell lateral raise",
  "Dumbbell Side Bend",
  "Inclinación lateral con mancuerna",
  "Dumbbell front raise",
  "Front Raise And Pullover",
  "Cable Rear Delt Fly",
  "Rear deltoid stretch",
  "Leg Press",
  "Lying Leg Curls",
  "Leg Extensions",
  "Smith sumo squat",
  "Hip thrust",
  "Cable hammer curl (with rope)",
].map((name, i) => ({ id: String(i), name }));

const nombre = (q: string) =>
  matchExercise(q, catalogo)?.candidate.name ?? null;

describe("matchExercise", () => {
  it("traduce el español de gimnasio al catálogo", () => {
    expect(nombre("Press inclinado barra")).toBe("Barbell incline bench press");
    expect(nombre("Jalon abierto polea")).toBe("Cable pulldown");
    expect(nombre("Remo mancuerna individual")).toBe("One-Arm Dumbbell Row");
    expect(nombre("Prensa")).toBe("Leg Press");
    expect(nombre("Flexión acostado")).toBe("Lying Leg Curls");
    expect(nombre("Sentadilla zumo en Smith")).toBe("Smith sumo squat");
    expect(nombre("Hit trust")).toBe("Hip thrust");
    expect(nombre("Bicep polea martillo con mecate")).toBe(
      "Cable hammer curl (with rope)",
    );
  });
  it("exige el mismo movimiento, no sólo palabras en común", () => {
    // El error real de antes: la elevación lateral acababa en una inclinación
    // lateral de oblicuos.
    expect(nombre("Lateral mancuerna")).toBe("Dumbbell lateral raise");
    expect(nombre("Frontal mancuerna martillo")).toBe("Dumbbell front raise");
  });
  it("no confunde el gesto con un estiramiento", () => {
    expect(nombre("Posterior en polea cruzado")).toBe("Cable Rear Delt Fly");
  });
  it("no adivina cuando el nombre no dice qué ejercicio es", () => {
    expect(nombre("Press power")).toBeNull();
    expect(nombre("Pecho abdomen")).toBeNull();
  });
});

describe("searchExerciseCatalog", () => {
  it("encuentra en inglés lo que se busca en español", () => {
    expect(searchExerciseCatalog("remo mancuerna", catalogo)[0]?.name).toBe(
      "One-Arm Dumbbell Row",
    );
  });
});
