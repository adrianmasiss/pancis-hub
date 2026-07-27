/**
 * Motor deterministico de demostracion del asistente. Sin IA: reglas
 * explicitas sobre el mensaje + los datos reales del usuario. Prudente
 * por diseno: nunca diagnostica ni presenta estimaciones como certezas.
 */
import type {
  AssistantIntent,
  AssistantProvider,
  AssistantReply,
} from "@/features/assistant/types";

function normalize(text: string): string {
  return text.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function detectIntent(message: string): AssistantIntent {
  const text = normalize(message);

  if (
    /(maquina|equipo|aparato)/.test(text) &&
    /(no tengo|no hay|sin)/.test(text)
  ) {
    return { kind: "exerciseMissing" };
  }
  if (/(que (preparo|cocino|hago)) con (.+)/.test(text)) {
    const match = text.match(/con (.+)\??$/);
    return { kind: "recipeIdea", ingredients: match?.[1] ?? "" };
  }
  if (/(pizza|comer fuera|restaurante|comida fuera|fiesta)/.test(text)) {
    return { kind: "eatingOut" };
  }
  if (
    /proteina/.test(text) &&
    /(no llegue|no alcance|me falto|no cumpli|baja)/.test(text)
  ) {
    return { kind: "proteinShort" };
  }
  if (
    /(dormi poco|dormi mal|mal sueno|desvel|pocas horas de sueno)/.test(text)
  ) {
    return { kind: "poorSleep" };
  }
  if (
    /peso/.test(text) &&
    /(no cambia|no baja|estancad|igual|no se mueve)/.test(text)
  ) {
    return { kind: "weightStall" };
  }
  if (
    /(entreno|entrenar).*(tarde|noche|manana)|cambiar? .*horario/.test(text)
  ) {
    return { kind: "timingShift" };
  }
  // Entrenamiento: sustituir un ejercicio concreto.
  const substituteMatch = text.match(
    /(?:no puedo hacer|cambiar|sustituir|reemplazar|otra opcion para)\s+(?:el |la |los |las )?([a-z\s]{3,40})/,
  );
  if (substituteMatch?.[1]) {
    return {
      kind: "exerciseSubstitute",
      exerciseName: substituteMatch[1].trim(),
    };
  }

  // Cuantas series/repeticiones para un ejercicio.
  const setsMatch = text.match(
    /(?:cuantas series|cuantas repeticiones|series y repeticiones|cuanto peso).*?(?:de|para|en)\s+(?:el |la )?([a-z\s]{3,40})/,
  );
  if (setsMatch?.[1]) {
    return { kind: "setsAndReps", exerciseName: setsMatch[1].trim() };
  }

  if (
    /(mi rutina|la rutina|mi entrenamiento).*(esta bien|como va|revisa|analiza|opinas)|(revisa|analiza).*(mi rutina|mi entrenamiento)/.test(
      text,
    )
  ) {
    return { kind: "routineReview" };
  }

  const foodMatch = text.match(
    /no tengo (?:el |la |los |las )?([a-z\s]{3,40})/,
  );
  if (foodMatch?.[1]) {
    return { kind: "foodMissing", foodName: foodMatch[1].trim() };
  }
  return { kind: "fallback" };
}

const REEVALUATE_TOMORROW = "Manana, al revisar tu plan del dia.";
const REEVALUATE_TWO_WEEKS =
  "En 2 semanas, comparando promedios semanales de peso.";

export const deterministicProvider: AssistantProvider = {
  generateReply({
    context,
    intent,
    foodAlternatives,
    exerciseAlternatives,
    prescription,
  }): AssistantReply {
    const remainingProtein = context.targets
      ? Math.max(
          0,
          Math.round(context.targets.proteinG - context.consumedToday.proteinG),
        )
      : null;
    const remainingCalories = context.targets
      ? Math.round(context.targets.calories - context.consumedToday.calories)
      : null;

    switch (intent.kind) {
      case "foodMissing": {
        const alternativesText =
          foodAlternatives && foodAlternatives.length > 0
            ? foodAlternatives
                .map(
                  (alternative) =>
                    `${alternative.name} (~${alternative.suggestedQuantityG} g, ${alternative.caloriesDiff >= 0 ? "+" : ""}${alternative.caloriesDiff} kcal)`,
                )
                .join(" o ")
            : null;
        return {
          observation: `Dices que no tienes ${intent.foodName}.`,
          interpretation:
            "Un alimento se puede sustituir por otro de aporte similar sin afectar el plan de forma relevante.",
          confidence: alternativesText ? "media" : "baja",
          action: alternativesText
            ? `Como aproximacion, podrias usar ${alternativesText}.`
            : "Abre la comida en Nutricion y usa el boton Intercambiar sobre el alimento: te mostrare alternativas con cantidades equivalentes.",
          alternative:
            "Tambien puedes registrar lo que si tengas a mano y revisar los totales del dia.",
          reason:
            "Las equivalencias igualan el macro principal del alimento; son aproximaciones, no valores identicos.",
          reevaluate: REEVALUATE_TOMORROW,
        };
      }
      case "eatingOut":
        return {
          observation: "Hoy vas a comer fuera de tu plan habitual.",
          interpretation:
            "Una comida libre no define tu progreso; la consistencia semanal pesa mas que un dia aislado.",
          confidence: "media",
          action:
            remainingCalories !== null && remainingProtein !== null
              ? `Disfrutala sin culpa. Si quieres suavizar el impacto, prioriza proteina en tus otras comidas (te faltan ~${remainingProtein} g hoy) y modera las porciones del resto del dia.`
              : "Disfrutala sin culpa y retoma tu plan en la siguiente comida.",
          alternative:
            "Puedes registrar la comida de forma aproximada con alimentos similares del catalogo para mantener tu historial.",
          reason:
            "La adherencia sostenible incluye flexibilidad; restringir en exceso suele empeorar la adherencia despues.",
          reevaluate: REEVALUATE_TOMORROW,
        };
      case "proteinShort":
        return {
          observation:
            remainingProtein !== null
              ? `Hoy llevas ${Math.round(context.consumedToday.proteinG)} g de proteina de tu objetivo de ${context.targets!.proteinG} g (faltan ~${remainingProtein} g).`
              : "Comentas que no llegaste a tu proteina objetivo.",
          interpretation:
            "Un dia por debajo del objetivo no compromete tu progreso; el promedio semanal es lo relevante.",
          confidence: "media",
          action:
            "Si aun tienes comidas pendientes, suma una fuente proteica (pollo, atun, huevo, yogur griego o lacteos). Un snack de yogur griego con fruta agrega ~15-20 g.",
          alternative:
            "Si el dia ya termino, simplemente retoma manana; no compenses en exceso.",
          reason:
            "Distribuir la proteina entre comidas facilita alcanzar el total sin forzar una sola comida enorme.",
          reevaluate: "Al final de la semana, viendo tu adherencia promedio.",
        };
      case "exerciseSubstitute": {
        const options =
          exerciseAlternatives && exerciseAlternatives.length > 0
            ? exerciseAlternatives
                .map(
                  (alternative) =>
                    `${alternative.name} (compatibilidad ${alternative.compatibility}/10)`,
                )
                .join(", ")
            : null;
        return {
          observation: `Quieres una alternativa a ${intent.exerciseName}.`,
          interpretation: options
            ? "Hay ejercicios que comparten musculo principal y patron de movimiento, aunque el estimulo nunca es identico."
            : "No encontre ese ejercicio en el catalogo con ese nombre.",
          confidence: options ? "media" : "baja",
          action: options
            ? `Las opciones mas cercanas son: ${options}. ${exerciseAlternatives![0]!.recommendation}`
            : "Abre tu rutina y usa el boton Sustituir sobre el ejercicio: ahi comparo musculo, patron, articulaciones y estabilidad.",
          alternative:
            "En la ficha del ejercicio (boton de informacion) puedes ver que se gana y que se pierde en cada cambio.",
          reason:
            "La comparacion pondera musculo principal, patron de movimiento y articulaciones implicadas; dos ejercicios nunca son equivalentes exactos.",
          reevaluate: "Tras un par de sesiones con la alternativa.",
        };
      }
      case "setsAndReps": {
        return {
          observation: prescription
            ? `Preguntas por el esquema de ${prescription.exerciseName}.`
            : `Preguntas por el esquema de ${intent.exerciseName}.`,
          interpretation:
            "El esquema depende del tipo de ejercicio, tu objetivo, tu experiencia y la fatiga que ya acumulas; no existe un 4x12 universal.",
          confidence: prescription ? "media" : "baja",
          action: prescription
            ? `Como punto de partida: ${prescription.summary}. ${prescription.topReason}`
            : "Abre la ficha del ejercicio en tu rutina: ahi calculo series, repeticiones, RIR y descanso segun tu contexto.",
          alternative: prescription?.progression,
          reason:
            "Los rangos salen de tu objetivo y de las caracteristicas del ejercicio (articulaciones implicadas y fatiga que deja).",
          reevaluate: "Cuando completes el rango objetivo en todas las series.",
        };
      }
      case "routineReview": {
        const finding = context.routineTopFinding;
        const volume = context.weeklySetsByMuscle
          .slice(0, 3)
          .map((entry) => `${entry.muscle} ${entry.sets}`)
          .join(", ");
        return {
          observation: context.activePlanName
            ? `Tu rutina activa es ${context.activePlanName}.`
            : "Aun no tienes una rutina activa.",
          interpretation: finding
            ? `Lo mas relevante ahora mismo: ${finding.title}.`
            : "No encontre ajustes prioritarios en tu rutina.",
          confidence: finding ? "media" : "baja",
          action:
            finding?.detail ??
            "Crea o activa una rutina para que pueda analizar volumen, frecuencia y patrones.",
          alternative: volume
            ? `Series semanales por musculo (top 3): ${volume}.`
            : undefined,
          reason:
            "El analisis revisa volumen semanal, frecuencia, patrones cubiertos, redundancias y orden de los ejercicios.",
          reevaluate: "Cada vez que cambies la estructura de la rutina.",
        };
      }
      case "poorSleep":
        return {
          observation:
            context.sleepHoursToday !== null
              ? `Registraste ${context.sleepHoursToday} horas de sueno.`
              : "Comentas que dormiste poco.",
          interpretation:
            "El sueno insuficiente puede reducir el rendimiento y aumentar el hambre percibida ese dia.",
          confidence: "media",
          action:
            "Si entrenas hoy, considera bajar un poco la carga o las series (por ejemplo, deja 1-2 repeticiones mas en reserva) y prioriza acostarte temprano.",
          alternative:
            "Si te sientes bien, entrena normal; un mal dia de sueno aislado no exige cambios.",
          reason:
            "Ajustes pequenos y reversibles protegen la constancia sin sobre-reaccionar a un solo dia.",
          reevaluate:
            "En tu proximo diario: si el sueno bajo se repite varios dias, conviene revisar horarios.",
        };
      case "weightStall": {
        const changeText =
          context.weightWeeklyChange !== null
            ? `${context.weightWeeklyChange > 0 ? "+" : ""}${context.weightWeeklyChange} kg`
            : null;
        return {
          observation: changeText
            ? `Tu promedio semanal de peso cambio ${changeText} frente a la semana anterior.`
            : "Comentas que tu peso no cambia.",
          interpretation:
            "El peso diario fluctua por agua, glucogeno y digestion; ademas, en recomposicion es posible progresar con el peso estable.",
          confidence: "media",
          action:
            "Evalua con promedios de 2-3 semanas, junto con medidas de cintura, fotos y rendimiento antes de tocar calorias.",
          alternative:
            "Si tras 2-3 semanas el promedio sigue plano y tu objetivo es perder grasa, un ajuste moderado de calorias seria razonable — tu decides si aplicarlo.",
          reason:
            "Cambiar el plan por fluctuaciones de pocos dias lleva a decisiones erraticas; el asistente nunca modifica tus objetivos sin tu confirmacion.",
          reevaluate: REEVALUATE_TWO_WEEKS,
        };
      }
      case "exerciseMissing":
        return {
          observation: "No tienes disponible la maquina de un ejercicio.",
          interpretation:
            "Casi todo ejercicio tiene sustitutos que trabajan el mismo musculo con otro equipo.",
          confidence: "media",
          action:
            "En tu rutina, toca el boton Sustituir del ejercicio: veras alternativas por musculo, patron de movimiento y equipo.",
          alternative:
            "Durante una sesion tambien puedes agregar cualquier otro ejercicio del catalogo.",
          reason:
            "Ningun ejercicio reproduce exactamente a otro, pero mantener el estimulo del musculo objetivo conserva tu progreso.",
          reevaluate: "En tu proxima sesion con el equipo habitual.",
        };
      case "recipeIdea":
        return {
          observation: `Buscas que preparar con: ${intent.ingredients || "tus ingredientes"}.`,
          interpretation:
            "Con una fuente de proteina y un carbohidrato base se arma una comida completa alineada a tu plan.",
          confidence: "baja",
          action:
            "Revisa la seccion Recetas y filtra por 'Alta proteina' o busca por el ingrediente; si no existe, crea la receta y sus macros se calculan solos.",
          alternative:
            "Registra los ingredientes directamente en tu comida con el buscador de alimentos.",
          reason:
            "Aun no puedo generar recetas nuevas por ti: soy una version demostrativa sin IA.",
          reevaluate: REEVALUATE_TOMORROW,
        };
      case "timingShift":
        return {
          observation: "Vas a entrenar en un horario distinto al habitual.",
          interpretation:
            "El total diario de calorias y proteina importa mas que el horario exacto de las comidas.",
          confidence: "media",
          action:
            "Acomoda una comida con carbohidratos y proteina 1-3 horas antes de entrenar y otra fuente de proteina despues; puedes reordenar tus comidas arrastrando el plan del dia.",
          alternative:
            "Si entrenas en ayunas y te sientes bien, tambien es valido; ajusta segun tu tolerancia.",
          reason:
            "La distribucion flexible mantiene la adherencia sin sacrificar resultados relevantes.",
          reevaluate: REEVALUATE_TOMORROW,
        };
      default:
        return {
          observation: "Recibi tu mensaje.",
          interpretation:
            "Puedo ayudarte con intercambios de alimentos, proteina restante, sueno, estancamiento de peso, sustitucion de ejercicios y horarios.",
          confidence: "baja",
          action:
            "Prueba con una de las sugerencias de abajo o cuentame que parte de tu plan quieres ajustar.",
          alternative:
            "Tambien puedes explorar la Academia para entender el porque de tu plan.",
          reason:
            "Soy una version demostrativa con reglas fijas; una futura version con IA entendera mas matices.",
          reevaluate: "Cuando quieras, aqui estare.",
        };
    }
  },
};
