# Chat IA

**Fase:** MVP (versión con contexto básico) → se profundiza en v2 con biblioteca de investigaciones completa

## Qué resuelve

El requisito explícito acá es que **no sea un chatbot genérico de nutrición pegado al costado de la app**. Tiene que comportarse como una conversación con alguien que conoce los datos reales de la persona — su biometría, su dieta y rutina actuales, y las fuentes científicas que el sistema ya tiene cargadas — de la misma forma en que esta conversación tiene contexto de lo que ya se habló antes.

## Diferencia entre "chatbot" y lo que se pide acá

| Chatbot genérico | Lo que necesita Pancis Hub |
|---|---|
| Responde con conocimiento general del modelo, sin ver los datos del usuario | Recibe como contexto la biometría, macros objetivo, dieta/rutina del día y los `research_sources` relevantes antes de responder |
| Cada pregunta es independiente | Tiene memoria de la conversación (`chat_messages`) dentro de la sesión del usuario |
| Puede inventar cifras con total confianza | Debe distinguir explícitamente cuándo una cifra viene de una fuente verificada del sistema y cuándo es una estimación general, y decirlo así en la respuesta |
| No sabe qué preguntarle de vuelta | Puede pedir aclaración si falta un dato biométrico necesario para responder con precisión |

## Diseño técnico: grounding, no solo prompt

Cada llamada a Gemini para el chat debe construirse con:

1. **Contexto del usuario:** su `biometric_profile` más reciente, `macro_targets` actuales, `diet_day`/`routine_day` de hoy.
2. **Contexto científico relevante:** no toda la biblioteca de investigaciones en cada llamada (sería carísimo en tokens y cuota), sino una búsqueda dirigida sobre `research_sources` según el tema de la pregunta (recuperación por palabras clave o embeddings, a definir en la implementación técnica).
3. **Instrucción explícita al modelo** de citar la fuente cuando la respuesta se apoye en un dato del sistema, y de aclarar cuando esté dando una opinión general no verificada contra la biblioteca.
4. **Historial reciente de la conversación**, no el historial completo indefinidamente (por límite de tokens y de cuota).

## Manejo de la cuota gratuita de Gemini

Ver el detalle completo de límites en `02-arquitectura-y-stack.md`. Lo que aplica específicamente al chat:

- El chat es, junto con la redacción de justificaciones de sustitución, el uso principal de la cuota de Gemini — hay que asumir que va a ser el cuello de botella del tier gratuito antes que cualquier otro módulo.
- Cachear respuestas a preguntas frecuentes con el mismo contexto nutricional no siempre es posible porque el contexto es personal, pero sí se puede cachear cosas como la explicación de un concepto general (ej. "qué es el timing de proteína") que no depende de datos individuales.
- Considerar un límite de mensajes por usuario por día en el MVP, comunicado con transparencia, mientras se mide el uso real.

## Casos de uso que debe cubrir en el MVP

- Preguntas abiertas de nutrición/entrenamiento con contexto del usuario ("¿por qué mi objetivo de proteína es este número?", "¿tiene sentido que hoy coma menos carbos si entreno piernas?").
- Consulta sobre un alimento no cargado en la biblioteca ("¿cuánta proteína tiene esto que no encuentro?") — la IA responde con una estimación clara marcada como no verificada, y el sistema ofrece guardarla en `foods` con `fuente = ia_sugerido` para revisión posterior.
- Sugerencia de sustituto cuando el usuario no tiene idea de qué elegir, tanto en dieta como en ejercicio (se conecta con `04-modulo-dieta.md` y `05-modulo-ejercicio.md`).

## Qué queda fuera de esta fase

- Generación completa de plan de dieta/rutina vía chat (eso es un flujo estructurado propio, `08-generacion-automatica.md`, no una respuesta de chat libre).
- Acceso del chat a la biblioteca de investigaciones completa con búsqueda semántica avanzada (en MVP alcanza con un set reducido y curado de fuentes; la búsqueda más sofisticada llega con `09-biblioteca-investigaciones.md` en v2).
