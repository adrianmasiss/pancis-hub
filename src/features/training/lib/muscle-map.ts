/**
 * Del vocabulario del catalogo al del maniqui.
 *
 * Son dos listas distintas y hay que traducir: el catalogo habla como habla un
 * entrenador —"espalda", "core", "hombros"— y el modelo tiene vientres
 * anatomicos con nombre propio. La traduccion es de uno a VARIOS a proposito:
 * "core" no es un musculo, son el recto abdominal y los oblicuos, y encender
 * solo uno de los dos contaria una media verdad.
 *
 * Lo que no esta en la tabla no se inventa: se ignora. Un ejercicio con un
 * musculo desconocido enciende lo que si se reconoce y no pinta nada raro.
 */
export const MUSCULOS_DEL_MANIQUI = [
  "pectoral",
  "dorsal",
  "trapecio",
  "abdomen",
  "oblicuo",
  "lumbar",
  "deltoides",
  "deltoides-post",
  "biceps",
  "triceps",
  "antebrazo",
  "gluteo",
  "cuadriceps",
  "isquios",
  "aductor",
  "gemelo",
] as const;

export type MusculoDelManiqui = (typeof MUSCULOS_DEL_MANIQUI)[number];

const EQUIVALENCIAS: Record<string, MusculoDelManiqui[]> = {
  pecho: ["pectoral"],
  pectoral: ["pectoral"],
  espalda: ["dorsal"],
  dorsal: ["dorsal"],
  "espalda alta": ["trapecio", "dorsal"],
  "espalda baja": ["lumbar"],
  lumbar: ["lumbar"],
  trapecio: ["trapecio"],
  hombros: ["deltoides", "deltoides-post"],
  hombro: ["deltoides", "deltoides-post"],
  "hombro anterior": ["deltoides"],
  "hombro posterior": ["deltoides-post"],
  biceps: ["biceps"],
  triceps: ["triceps"],
  antebrazo: ["antebrazo"],
  antebrazos: ["antebrazo"],
  core: ["abdomen", "oblicuo"],
  abdomen: ["abdomen"],
  abdominales: ["abdomen"],
  oblicuos: ["oblicuo"],
  gluteos: ["gluteo"],
  gluteo: ["gluteo"],
  /* Los abductores de cadera son sobre todo el glúteo medio, y el maniqui no
     tiene un vientre propio para ellos: se enciende el gluteo, que es donde
     los veria quien mira. */
  abductores: ["gluteo"],
  cuadriceps: ["cuadriceps"],
  isquiotibiales: ["isquios"],
  isquios: ["isquios"],
  femoral: ["isquios"],
  aductores: ["aductor"],
  aductor: ["aductor"],
  gemelos: ["gemelo"],
  gemelo: ["gemelo"],
  pantorrillas: ["gemelo"],
};

/** Sin tildes y en minusculas: el catalogo las escribe de las dos formas. */
function normalizar(valor: string): string {
  return valor.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function musculosDe(valor: string): MusculoDelManiqui[] {
  return EQUIVALENCIAS[normalizar(valor)] ?? [];
}

export type EjercicioConMusculos = {
  primaryMuscle?: string | null;
  secondaryMuscles?: string[] | null;
};

/**
 * El mapa que entiende el maniqui: 1 principal, 0.5 asistente.
 *
 * Si un musculo aparece como principal en un ejercicio y como asistente en
 * otro, manda el principal: el dia entrena ese musculo, aunque otro
 * movimiento solo lo ayude.
 */
export function resaltadoDeEjercicios(
  ejercicios: EjercicioConMusculos[],
): Record<string, number> {
  const mapa: Record<string, number> = {};
  const poner = (musculo: string, peso: number) => {
    mapa[musculo] = Math.max(mapa[musculo] ?? 0, peso);
  };

  for (const ejercicio of ejercicios) {
    for (const musculo of musculosDe(ejercicio.primaryMuscle ?? "")) {
      poner(musculo, 1);
    }
    for (const secundario of ejercicio.secondaryMuscles ?? []) {
      for (const musculo of musculosDe(secundario)) poner(musculo, 0.5);
    }
  }
  return mapa;
}

/** Como se llama cada vientre en pantalla. */
export const ROTULOS: Record<string, string> = {
  pectoral: "Pectoral",
  dorsal: "Dorsal ancho",
  trapecio: "Trapecio",
  abdomen: "Recto abdominal",
  oblicuo: "Oblicuos",
  lumbar: "Erectores lumbares",
  deltoides: "Deltoides anterior",
  "deltoides-post": "Deltoides posterior",
  biceps: "Bíceps",
  triceps: "Tríceps",
  antebrazo: "Antebrazo",
  gluteo: "Glúteo",
  cuadriceps: "Cuádriceps",
  isquios: "Isquiosurales",
  aductor: "Aductores",
  gemelo: "Gemelos",
};
