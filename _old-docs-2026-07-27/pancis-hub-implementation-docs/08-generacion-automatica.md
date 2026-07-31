# Generación Automática de Dieta y Rutina

**Fase:** v2 (depende de que `09-biblioteca-investigaciones.md` ya tenga cobertura suficiente)

## Qué resuelve

Un usuario nuevo se registra sin tener ni dieta ni rutina propia. En vez de dejarlo con una pantalla vacía, el sistema le arma un punto de partida completo basado en su biometría y objetivo, usando las mismas fórmulas y catálogo de ejercicios que ya usa el resto del sistema — no una recomendación genérica desconectada del resto de Pancis Hub.

## Por qué depende de la biblioteca de investigaciones

Generar una dieta y rutina completas desde cero es un salto de responsabilidad mayor que sustituir un ítem puntual: acá el sistema está tomando decisiones por la persona, no solo ofreciendo alternativas. Antes de habilitar esto:

- La cobertura de `formula_versions` para cálculo de macros debe estar validada, no ser el borrador inicial de `04-modulo-dieta.md`.
- El catálogo de `exercises` debe tener suficiente variedad por región muscular específica y por equipo disponible para armar una rutina balanceada real, no una lista corta repetida.

## Flujo propuesto

1. Onboarding recolecta biometría, objetivo (déficit/mantenimiento/superávit), nivel de experiencia en entrenamiento, días disponibles por semana, equipo disponible (gimnasio completo, casa con mancuernas, sin equipo, etc.) y restricciones alimentarias.
2. El sistema calcula `macro_targets` con la fórmula activa (igual que en el flujo manual).
3. Arma un `diet_day` base distribuyendo esos macros en comidas, priorizando alimentos verificados de `foods`/USDA sobre sugerencias no verificadas.
4. Arma una `routine` completa respetando días disponibles y equipo, con ejercicios elegidos para cubrir las regiones musculares específicas de forma balanceada (no solo "un ejercicio por grupo muscular grande").
5. Le muestra al usuario el plan generado con la posibilidad de pedir cambios puntuales inmediatamente, usando los mismos flujos de sustitución de `04-modulo-dieta.md` y `05-modulo-ejercicio.md` — la generación automática no es un sistema aparte, es un punto de partida sobre la misma infraestructura.

## Rol de la IA en este flujo

La selección de alimentos y ejercicios específicos para armar el plan es lógica determinística sobre datos ya estructurados (macros objetivo, catálogo de ejercicios etiquetado), no una llamada abierta a Gemini para "inventar" un plan. Usar la IA acá de forma directa consumiría cuota de forma innecesaria y sería menos confiable que un algoritmo de asignación sobre datos verificados. El rol de Gemini en este flujo se limita a redactar la explicación en lenguaje natural del plan generado ("por qué este plan tiene este reparto de macros y estos ejercicios"), no a decidir los números.

## Qué queda fuera de esta fase

- Ajuste continuo y automático del plan según adherencia real (eso es un sistema de feedback loop de v3, no de generación inicial).
- Planes que consideren lesiones o condiciones médicas específicas — esto requeriría supervisión profesional y está fuera del alcance de este documento por completo.
