import { tool } from "ai";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getRoutineAnalysis } from "@/features/training/queries";
import {
  findExerciseAlternatives,
  findFoodAlternatives,
  findPrescription,
  getCatalogFood,
  searchCatalogFoods,
} from "@/server/tools/catalog";
import { compareFoods, proposeDaySwap } from "@/server/tools/nutrition";
import {
  getSourcesForFormula,
  searchEvidence,
} from "@/server/tools/evidence";
import type { FormulaKey } from "@/features/assistant/lib/grounding";
import type { ToolSource } from "@/server/tools/types";

/**
 * Las herramientas que el modelo puede llamar.
 *
 * Hasta ahora el servidor adivinaba por palabras clave que necesitaba el
 * usuario y se lo servia precalculado. Funcionaba para las preguntas que el
 * detector reconoce y dejaba sin nada a todas las demas: una pregunta que caia
 * en `fallback` llegaba al modelo sin un solo dato del catalogo. El doc 08 pide
 * lo contrario, y es la regla que ordena este modulo:
 *
 *   "El modelo decide que herramienta usar; la herramienta calcula; el modelo
 *    explica."
 *
 * Tres invariantes que NO se negocian:
 *
 * 1. Ninguna herramienta hace aritmetica propia. Todas envuelven motores que ya
 *    existen y ya tienen pruebas.
 * 2. Las de escritura no escriben. Devuelven una propuesta con el nombre de la
 *    accion que la aplicaria, y ninguna recibe cliente de base de datos.
 * 3. El modelo NUNCA dicta macros. Recibe y devuelve identificadores; los
 *    numeros los pone el catalogo. Es la misma leccion de `importExternalFood`
 *    en la fase 1.
 *
 * Las fuentes que devuelvan las herramientas se recogen por `onSources` y las
 * adjunta el servidor al final, igual que las del grounding por palabras clave.
 *
 * SERVER-ONLY.
 */

/** Claves de constantes que el modelo puede pedir por su nombre. */
const FORMULA_KEYS: [FormulaKey, ...FormulaKey[]] = [
  "bmr_equation",
  "activity_factors",
  "goal_adjustments",
  "safety_floor_factor",
  "macro_tolerances_pct",
  "compatibility_profiles",
  "protein_ranges",
  "weekly_rate_band_percent",
  "min_fat_g_per_kg",
  "fiber_g_per_1000_kcal",
  "water_ml_per_kg",
  "energy_availability_thresholds",
  "rir_by_goal",
  "min_rest_seconds",
  "weekly_set_ranges",
  "tempo_very_slow_seconds",
  "frequency_is_distribution",
  "bia_individual_error",
];

export type ToolsetDeps = {
  userId: string;
  /** Fecha de hoy en la zona horaria del usuario, ya resuelta. */
  today: string;
  /** Recoge las fuentes que devuelva cualquier herramienta. */
  onSources: (sources: ToolSource[]) => void;
  /** Esquema de la respuesta final. Viaja como herramienta, ver abajo. */
  replySchema: z.ZodType;
};

export function buildAssistantToolset({
  userId,
  today,
  onSources,
  replySchema,
}: ToolsetDeps) {
  return {
    /*
     * La respuesta final es una HERRAMIENTA, no salida estructurada.
     *
     * No es una preferencia de estilo: Gemini rechaza la combinacion con
     * "Function calling with a response mime type: 'application/json' is
     * unsupported". O herramientas, o JSON forzado, no las dos en la misma
     * llamada. Pasar la respuesta por una herramienta da las dos cosas sin una
     * llamada extra, porque el ultimo paso del bucle ya es la respuesta.
     *
     * No lleva `execute` a proposito: sin ejecucion, el bucle se detiene aqui y
     * los argumentos de la llamada SON la respuesta.
     */
    responder: tool({
      description:
        "Entrega tu respuesta final al usuario. Llamala siempre, y solo cuando ya tengas los datos que necesitabas.",
      inputSchema: replySchema,
    }),

    search_foods: tool({
      description:
        "Busca alimentos de la biblioteca por nombre. Devuelve su id y sus macros por 100 g. Usala antes de comparar o proponer un cambio: necesitas el id, nunca inventes macros.",
      inputSchema: z.object({
        query: z.string().min(2).describe("Nombre o parte del nombre"),
        limit: z.number().int().min(1).max(8).optional(),
      }),
      execute: async ({ query, limit }) => {
        const foods = await searchCatalogFoods(query, limit ?? 5);
        return {
          encontrados: foods.length,
          alimentos: foods.map((food) => ({
            id: food.id,
            nombre: food.name,
            grupo: food.foodGroup,
            por100g: food.per100g,
          })),
        };
      },
    }),

    find_food_alternatives: tool({
      description:
        "Alternativas reales para un alimento, ordenadas por el motor de equivalencias, con la cantidad ya ajustada. Respeta las alergias y restricciones del usuario. Usala cuando le falte un alimento o quiera cambiarlo.",
      inputSchema: z.object({
        foodName: z.string().min(2).describe("Alimento que quiere sustituir"),
      }),
      execute: async ({ foodName }) => {
        const alternatives = await findFoodAlternatives(userId, foodName);
        return alternatives.length > 0
          ? { alternativas: alternatives }
          : {
              alternativas: [],
              nota: "No hay alternativas en la biblioteca para ese alimento.",
            };
      },
    }),

    compare_foods: tool({
      description:
        "Compara dos alimentos concretos por su id y dice cuanto cambia el aporte y si se sale de las tolerancias. Los macros los pone el catalogo, tu solo das los ids y las cantidades.",
      inputSchema: z.object({
        originalFoodId: z.uuid(),
        originalQuantityG: z.number().positive().max(5000),
        substituteFoodId: z.uuid(),
        substituteQuantityG: z.number().positive().max(5000),
      }),
      execute: async ({
        originalFoodId,
        originalQuantityG,
        substituteFoodId,
        substituteQuantityG,
      }) => {
        const [original, substitute] = await Promise.all([
          getCatalogFood(originalFoodId),
          getCatalogFood(substituteFoodId),
        ]);
        if (!original || !substitute) {
          return { error: "Alguno de los alimentos no existe en la biblioteca." };
        }

        const result = await compareFoods({
          original: {
            name: original.name,
            quantityG: originalQuantityG,
            per100g: original.per100g,
            foodGroup: original.foodGroup,
          },
          substitute: {
            name: substitute.name,
            quantityG: substituteQuantityG,
            per100g: substitute.per100g,
            foodGroup: substitute.foodGroup,
          },
        });
        if (result.sources) onSources(result.sources);

        return {
          original: original.name,
          sustituto: substitute.name,
          diferencia: result.data.difference,
          compatibilidad: result.data.compatibility,
          tolerancias: result.data.toleranceReport,
          advertencias: result.caveats,
        };
      },
    }),

    get_today_plan: tool({
      description:
        "La dieta activa del usuario: sus comidas, con el nombre, la CANTIDAD EN GRAMOS y el id de cada alimento. Llamala antes de preguntarle al usuario cuanto come de algo: casi siempre ya esta aqui. Los ids que devuelve son los que necesita propose_day_adjustment.",
      inputSchema: z.object({}),
      execute: async () => {
        const supabase = await createClient();
        const { data } = await supabase
          .from("diet_templates")
          .select(
            "name, diet_template_meals(name, meal_type, order_index, diet_template_items(id, quantity_g, foods(id, name)))",
          )
          .eq("user_id", userId)
          .eq("is_active", true)
          .maybeSingle();

        if (!data) return { plan: null, nota: "No hay dieta activa." };

        return {
          fecha: today,
          plan: data.name,
          comidas: [...data.diet_template_meals]
            .sort((a, b) => a.order_index - b.order_index)
            .map((meal) => ({
              nombre: meal.name || meal.meal_type,
              alimentos: meal.diet_template_items.map((item) => ({
                templateItemId: item.id,
                foodId: item.foods?.id ?? null,
                nombre: item.foods?.name ?? "",
                cantidadG: Number(item.quantity_g),
              })),
            })),
        };
      },
    }),

    propose_day_adjustment: tool({
      description:
        "Propone cambiar un alimento del plan SOLO POR HOY. No aplica nada: devuelve una propuesta que el usuario tiene que confirmar en pantalla. El plan base no se toca y manana reaparece como estaba.",
      inputSchema: z.object({
        templateItemId: z.uuid().describe("De get_today_plan"),
        foodId: z.uuid().describe("Alimento sustituto, de search_foods"),
        quantityG: z.number().positive().max(5000),
      }),
      execute: async ({ templateItemId, foodId, quantityG }) => {
        const food = await getCatalogFood(foodId);
        if (!food) return { error: "Ese alimento no existe en la biblioteca." };

        const proposal = proposeDaySwap({
          templateItemId,
          date: today,
          foodId,
          foodName: food.name,
          quantityG,
        });

        return {
          propuesta: proposal.summary,
          loAplica: proposal.appliedBy,
          advertencias: proposal.caveats,
        };
      },
    }),

    find_exercise_substitutes: tool({
      description:
        "Alternativas para un ejercicio, comparadas con el mismo motor biomecanico que usa la pagina de rutina. Devuelve compatibilidad y por que.",
      inputSchema: z.object({
        exerciseName: z.string().min(3),
      }),
      execute: async ({ exerciseName }) => {
        const alternatives = await findExerciseAlternatives(exerciseName);
        return alternatives.length > 0
          ? { alternativas: alternatives }
          : {
              alternativas: [],
              nota: "Ese ejercicio no esta en el catalogo.",
            };
      },
    }),

    propose_set_rep_change: tool({
      description:
        "Esquema de series, repeticiones, RIR y descanso para un ejercicio, segun el objetivo y la experiencia del usuario. Nunca respondas '4x12 para todo': llama a esto.",
      inputSchema: z.object({
        exerciseName: z.string().min(3),
      }),
      execute: async ({ exerciseName }) => {
        const prescription = await findPrescription(userId, exerciseName);
        return (
          prescription ?? { nota: "Ese ejercicio no esta en el catalogo." }
        );
      },
    }),

    analyze_session: tool({
      description:
        "Analiza la rutina activa: hallazgos priorizados y series semanales por musculo. Es el mismo analisis que ve el usuario en pantalla.",
      inputSchema: z.object({}),
      execute: async () => {
        const supabase = await createClient();
        const { data: plan } = await supabase
          .from("workout_plans")
          .select("id, name")
          .eq("user_id", userId)
          .eq("active", true)
          .is("deleted_at", null)
          .maybeSingle();

        if (!plan) return { nota: "No hay rutina activa." };

        const analysis = await getRoutineAnalysis(userId, plan.id);
        if (!analysis) return { nota: "La rutina activa no se pudo analizar." };

        return {
          rutina: plan.name,
          hallazgos: analysis.findings.slice(0, 4),
          seriesPorMusculo: analysis.weeklySetsByMuscle,
        };
      },
    }),

    get_claim_sources: tool({
      description:
        "Las fuentes que sostienen una constante del sistema, con su papel (sustenta, matiza o contradice) y la nota del revisor. Usala cuando expliques de donde sale un numero y no te hayan llegado ya sus fuentes.",
      inputSchema: z.object({
        key: z.enum(FORMULA_KEYS),
      }),
      execute: async ({ key }) => {
        const { sources, rationale, limitations } =
          await getSourcesForFormula(key);
        onSources(sources);
        return {
          justificacion: rationale,
          limitaciones: limitations,
          fuentes: sources.map((source) => ({
            titulo: source.title,
            identificador: source.identifier,
            nivel: source.evidenceGrade,
            poblacion: source.population,
            papel: source.role,
            nota: source.note,
          })),
        };
      },
    }),

    search_evidence: tool({
      description:
        "Busca en la biblioteca cientifica por tema. Excluye estudios retractados. Devuelve pocas fuentes a proposito.",
      inputSchema: z.object({
        query: z.string().min(3),
      }),
      execute: async ({ query }) => {
        const sources = await searchEvidence(query);
        onSources(sources);
        return {
          fuentes: sources.map((source) => ({
            titulo: source.title,
            identificador: source.identifier,
            nivel: source.evidenceGrade,
            poblacion: source.population,
            limitaciones: source.limitations,
          })),
        };
      },
    }),

    get_biometric_history: tool({
      description:
        "Historial de medidas corporales del usuario, de la mas reciente hacia atras.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(20).optional(),
      }),
      execute: async ({ limit }) => {
        const supabase = await createClient();
        const { data } = await supabase
          .from("body_measurements")
          .select(
            "measured_at, weight_kg, body_fat_percentage, skeletal_muscle_kg, visceral_fat_level, source",
          )
          .eq("user_id", userId)
          .order("measured_at", { ascending: false })
          .limit(limit ?? 8);

        return {
          medidas: (data ?? []).map((row) => ({
            fecha: row.measured_at,
            pesoKg: row.weight_kg,
            grasaPorcentaje: row.body_fat_percentage,
            masaMuscularKg: row.skeletal_muscle_kg,
            grasaVisceral: row.visceral_fat_level,
            origen: row.source,
          })),
        };
      },
    }),
  };
}

export type AssistantToolset = ReturnType<typeof buildAssistantToolset>;
