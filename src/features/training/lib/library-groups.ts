/**
 * Las categorías de la biblioteca de ejercicios: el músculo principal del
 * catálogo agrupado como se piensa al buscar. El catálogo trae dieciséis
 * valores; «espalda baja» o «abductores» solos no merecen una ficha propia y
 * caen en el grupo donde alguien los buscaría.
 */
export const GRUPOS_MUSCULARES = [
  { id: "pecho", label: "Pecho", catalogo: ["pecho"] },
  {
    id: "espalda",
    label: "Espalda",
    catalogo: ["espalda", "espalda baja", "trapecio"],
  },
  { id: "hombros", label: "Hombros", catalogo: ["hombros"] },
  { id: "biceps", label: "Bíceps", catalogo: ["biceps"] },
  { id: "triceps", label: "Tríceps", catalogo: ["triceps"] },
  { id: "antebrazo", label: "Antebrazo", catalogo: ["antebrazo"] },
  { id: "abdomen", label: "Abdomen", catalogo: ["abdominales", "core"] },
  { id: "gluteos", label: "Glúteos", catalogo: ["gluteos", "abductores"] },
  {
    id: "cuadriceps",
    label: "Cuádriceps",
    catalogo: ["cuadriceps", "aductores"],
  },
  { id: "isquios", label: "Isquios", catalogo: ["isquiotibiales"] },
  { id: "gemelos", label: "Gemelos", catalogo: ["gemelos"] },
] as const;

export type GrupoMuscular = (typeof GRUPOS_MUSCULARES)[number]["id"];

export const COLECCIONES = [
  { id: "todos", label: "Todos" },
  { id: "rutinas", label: "En mis rutinas" },
  { id: "recientes", label: "Recientes" },
] as const;

export type Coleccion = (typeof COLECCIONES)[number]["id"];

export function grupoDe(id: string | undefined) {
  return GRUPOS_MUSCULARES.find((g) => g.id === id);
}

/** El grupo al que pertenece un músculo del catálogo, para la etiqueta. */
export function grupoDelMusculo(musculo: string) {
  return GRUPOS_MUSCULARES.find((g) =>
    (g.catalogo as readonly string[]).includes(musculo),
  );
}

/* El catálogo guarda músculos y equipo sin tildes (así se importó y así se
   filtra). En pantalla van bien escritos y con mayúscula inicial. */
const TILDES: Record<string, string> = {
  gluteos: "glúteos",
  cuadriceps: "cuádriceps",
  biceps: "bíceps",
  triceps: "tríceps",
  balon: "balón",
  maquina: "máquina",
  neumatico: "neumático",
};

export function rotuloCatalogo(valor: string): string {
  const texto = TILDES[valor] ?? valor;
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
