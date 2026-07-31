# Roadmap en Fases

Criterio de fase: algo entra al MVP solo si es imprescindible para que una persona pueda usar el sistema de punta a punta (registrarse, ver su dieta y rutina, pedir un cambio puntual, y preguntarle algo a la IA con contexto real). Todo lo que sea "se ve mejor" o "es más completo" pero no bloquea ese flujo, se pospone.

## Fase 0 — Fundaciones (antes de MVP)

No es una feature visible, pero sin esto nada más funciona:

- Autenticación multi-usuario y modelo de datos base (`03-modelo-de-datos.md`)
- Alta de datos biométricos iniciales (peso, altura, edad, sexo, nivel de actividad — lo mínimo para calcular objetivos de macros)
- Integración con USDA FoodData Central
- Integración con Gemini API y diseño del control de cuota (`02-arquitectura-y-stack.md`)

## MVP — v1

Objetivo: una persona se registra, ve su dieta y su rutina del día con los macros que le corresponden, puede cambiar algo puntual y recibir una sustitución con fundamento, y puede preguntarle a la IA con contexto real.

| Módulo | Incluye en MVP | Documento |
|---|---|---|
| Dieta | Ver dieta del día con macros objetivo. Cambio puntual de un alimento por ese día. Sustitución por equivalencia de macros, tanto desde la biblioteca de alimentos como buscando en USDA. | `04-modulo-dieta.md` |
| Ejercicio | Ver rutina del día. Sustituir un ejercicio por otro que trabaje la misma región muscular específica, con la justificación biomecánica. | `05-modulo-ejercicio.md` |
| Chat IA | Preguntas libres con contexto del usuario (biometría, dieta y rutina actuales). Fundamentado en lo que ya existe en la biblioteca de investigaciones inicial (un set reducido y verificado de estudios, no la biblioteca completa). | `06-chat-ia.md` |
| Biblioteca de investigaciones | Versión mínima: las fuentes que ya sustentan las fórmulas de macros y la clasificación de ejercicios del MVP. No hay todavía una sección navegable de PDFs para el usuario. | `09-biblioteca-investigaciones.md` (alcance reducido) |

Explícitamente **fuera del MVP**: InBody 3D, generación automática de dieta/rutina completa para un usuario sin historial, biblioteca de investigaciones navegable con resúmenes.

## v2

Una vez que el MVP esté validado con datos reales de uso:

- **InBody 3D** (`07-inbody-3d.md`): modelo 3D interactivo de cuerpo humano con datos biométricos por región. Es la pieza más costosa de construir bien (requiere un modelo 3D premium, no un placeholder) — por eso se pospone a que el resto del sistema ya tenga datos biométricos reales que mostrar en él.
- **Generación automática de dieta y rutina** (`08-generacion-automatica.md`): cuando un usuario nuevo no tiene ni dieta ni rutina, el sistema le arma una según su biometría y los estudios disponibles. Depende de que la biblioteca de investigaciones ya tenga suficiente cobertura para no generar recomendaciones pobres.
- **Biblioteca de investigaciones navegable**: sección donde el usuario puede ver los PDFs, resúmenes y en qué cálculo específico se usa cada estudio.

## v3 y más adelante

- Ampliar la biblioteca de investigaciones con más áreas (por ejemplo, sueño, estrés, periodización de largo plazo).
- Posible paso del motor de IA de Gemini gratuito a un tier pago o híbrido, si el uso real supera la cuota gratuita (ver `02-arquitectura-y-stack.md`).
- Métricas de progreso a largo plazo (tendencias de composición corporal, adherencia a la dieta/rutina, ajuste automático de objetivos).

## Qué NO está definido todavía y hay que decidir antes de cada fase

- **MVP:** qué framework de frontend/backend usar (no estaba entre las decisiones tomadas en este documento — se recomienda definirlo en la primera sesión de trabajo técnico, condicionado a que soporte PWA y tenga buen soporte de Three.js/WebGL de cara a v2).
- **v2:** proveedor o approach para el modelo 3D del cuerpo humano (comprar un asset premium, encargarlo, o construirlo con una librería anatómica open-source) — impacta directamente el presupuesto, porque "gratis" es más difícil de sostener acá que en el resto del sistema.
