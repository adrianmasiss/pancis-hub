# Pancis Hub — Paquete de redefinición e implementación

Este paquete redefine Pancis Hub como una aplicación enfocada y profesional para resolver cuatro necesidades principales:

1. Consultar una dieta existente y sustituir alimentos o comidas **solo para el día actual**, cuantificando el efecto sobre calorías y macronutrientes.
2. Consultar una rutina existente y sustituir ejercicios **en el momento**, comparando objetivo muscular, región anatómica, patrón de movimiento, estabilidad, rango de movimiento y fatiga.
3. Registrar y visualizar datos biométricos e InBody con una experiencia 3D premium, sin inventar métricas que el dispositivo no haya medido.
4. Conversar con un asistente de IA contextual, respaldado por cálculos determinísticos y una biblioteca científica versionada y citable.

## Nueva definición del producto

> **Un copiloto de nutrición y entrenamiento que ayuda al usuario a realizar sustituciones puntuales, comprender su impacto y mantenerse cerca de su plan original mediante datos alimentarios, biomecánica y evidencia científica trazable.**

## Qué contiene este paquete

- Objetivo y alcance del producto.
- Flujos de usuario.
- Requisitos funcionales.
- Política de evidencia científica.
- Motor de sustituciones nutricionales.
- Arquitectura de datos alimentarios.
- Motor de sustituciones de ejercicios.
- Arquitectura del asistente de IA.
- Especificación biométrica e InBody 3D.
- Biblioteca de investigaciones y RAG.
- Modelo de datos.
- Arquitectura técnica.
- UX/UI.
- Seguridad y límites de salud.
- Plan de pruebas.
- Roadmap de implementación.
- Backlog.
- Prompt maestro para adaptar el sistema actual.
- Registro inicial de fuentes.

## Orden recomendado de lectura

1. `docs/00_NORTH_STAR.md`
2. `docs/01_SCOPE_AND_MVP.md`
3. `docs/02_USER_JOURNEYS.md`
4. `docs/04_SCIENTIFIC_GOVERNANCE.md`
5. `docs/05_NUTRITION_SWAP_ENGINE.md`
6. `docs/07_TRAINING_BIOMECHANICS_ENGINE.md`
7. `docs/08_AI_COPILOT_ARCHITECTURE.md`
8. `docs/09_BIOMETRICS_INBODY_3D.md`
9. `docs/16_IMPLEMENTATION_ROADMAP.md`
10. `docs/18_MASTER_IMPLEMENTATION_PROMPT.md`

## Principio esencial

No existe un sistema capaz de garantizar que todas sus recomendaciones sean “100 % comprobadas”. La ciencia cambia, los estudios tienen limitaciones y la respuesta individual varía.

Pancis Hub debe buscar el estándar más alto posible mediante:

- fuentes primarias y revisiones sistemáticas;
- nivel de evidencia visible;
- fecha de última revisión;
- población estudiada;
- limitaciones;
- trazabilidad de cada recomendación;
- separación entre cálculo, inferencia y consejo;
- revisión humana de reglas de alto impacto.

## Enfoque de costos

El MVP se plantea con una estrategia **free-first**:

- Next.js y TypeScript.
- Supabase y Vercel en sus planes gratuitos durante desarrollo.
- USDA FoodData Central y Open Food Facts.
- PubMed, Europe PMC, Crossref y OpenAlex.
- wger como fuente inicial abierta de ejercicios.
- Three.js para visualización 3D.

La IA generativa no puede garantizar operación gratuita ilimitada en producción. La arquitectura debe permitir cambiar de proveedor, limitar uso, utilizar modelos locales en desarrollo y reservar llamadas de IA para explicaciones donde realmente aporten valor.


## Actualización de programación del entrenamiento

Se añadió `docs/07A_TRAINING_PROGRAMMING_SPLITS_TEMPO_FAILURE.md` con:

- Jeff Nippard como referencia comunicativa correcta.
- Full Body, Upper/Lower y Push/Pull/Legs.
- Divisiones híbridas de 5 días.
- Frecuencia y volumen.
- Entrenamiento al fallo, RIR y RPE.
- Tempo y cadencia.
- Descanso, progresión, fatiga y deload.
