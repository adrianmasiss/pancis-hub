# Pancis Hub — Documento de Implementación

**Versión:** 1.0 · **Fecha:** 26 de julio de 2026
**Estado:** Objetivo de producto redefinido (reemplaza alcance anterior, considerado demasiado amplio para un primer corte)

## Qué es Pancis Hub

Una PWA de nutrición y entrenamiento, de uso multi-usuario, que reemplaza la lógica de "app que cuenta calorías" por un sistema que:

1. Explica **por qué** una dieta o rutina es como es, con base en literatura científica actual, no en reglas fijas.
2. Permite cambios puntuales de un día (dieta o ejercicio) sin romper el objetivo general, sugiriendo sustitutos equivalentes en macronutrientes o en grupo/región muscular trabajada.
3. Tiene un asistente de IA que razona sobre el contexto real de la persona (biometría, objetivos, historial) — no un chatbot desconectado del resto del sistema.
4. Documenta sus fuentes: toda recomendación numérica debe poder rastrearse hasta un estudio o una base de datos verificable.

## Por qué este documento existe

La conversación previa había escalado a una lista de funcionalidades muy amplia (dieta, ejercicio, InBody 3D, auto-generación de rutinas, biblioteca de investigaciones, chat IA) sin un orden de construcción. Este set de documentos existe para:

- Fijar un **alcance de MVP realista** y separarlo de lo que viene después.
- Documentar las **decisiones técnicas ya tomadas** (multi-usuario, USDA FoodData Central, Gemini API) y sus implicancias reales, incluyendo límites que no son obvios a primera vista (por ejemplo, cuotas gratuitas compartidas entre todos los usuarios).
- Dar a cualquier agente o desarrollador que trabaje sobre el proyecto el mismo criterio, sin tener que re-explicarlo cada vez.

## Decisiones de producto ya tomadas

| Decisión | Elegido | Implicancia principal |
|---|---|---|
| Tipo de usuario | Multi-usuario desde el inicio | Se necesita autenticación, aislamiento de datos por cuenta y un modelo de datos pensado para N personas, no una sola |
| Fuente de datos de alimentos | USDA FoodData Central | Gratis, datos oficiales y muy precisos en macros de alimentos base; cobertura limitada en productos de marca (ver `02-arquitectura-y-stack.md`) |
| Motor de IA | Gemini API (tier gratuito) | Gratis pero con cuota diaria compartida entre todos los usuarios del sistema — requiere diseño cuidadoso de cuándo se llama a la IA (ver `02-arquitectura-y-stack.md` y `06-chat-ia.md`) |
| Organización del trabajo | Roadmap en fases (MVP → v2 → v3) | No se construye todo junto; cada documento de módulo indica en qué fase entra |
| Plataforma | PWA móvil | Confirmado en la referencia de skills instaladas del proyecto |

## Principios que aplican a todos los módulos

**Precisión antes que amplitud.** Es preferible que el sistema cubra menos casos pero con números verificables, a que cubra todos los casos con estimaciones genéricas. De esto depende el progreso físico real de quien lo use.

**Ningún número mágico sin fuente.** Cualquier fórmula (macros por kg de peso, calorías de mantenimiento, clasificación de ejercicios por región muscular) debe estar vinculada a una entrada de la biblioteca de investigaciones (`09-biblioteca-investigaciones.md`), no hardcodeada como una verdad fija en el código.

**La IA razona con contexto, no adivina.** El chat y las sugerencias de sustitución deben tener acceso a los datos biométricos, el historial y la biblioteca de investigaciones de la persona. Nunca debe responder como lo haría un chatbot genérico de nutrición sin ese contexto.

**Gratis por defecto, con los límites documentados.** Cada decisión de infraestructura gratuita (Gemini, USDA, hosting) tiene un techo real. Este documento no lo esconde: lo declara, para que el equipo sepa cuándo se va a necesitar escalar a un plan pago.

## Índice de documentos

| Archivo | Contenido | Fase |
|---|---|---|
| `01-roadmap-fases.md` | Qué se construye primero y qué se pospone | — |
| `02-arquitectura-y-stack.md` | Stack técnico, auth, hosting, límites reales de las APIs gratuitas | MVP |
| `03-modelo-de-datos.md` | Entidades y relaciones de la base de datos | MVP |
| `04-modulo-dieta.md` | Dieta diaria, cambios puntuales, sustituciones por macros | MVP |
| `05-modulo-ejercicio.md` | Rutina, sustitución de ejercicios por región muscular específica | MVP |
| `06-chat-ia.md` | Asistente de IA con contexto (Gemini) | MVP |
| `07-inbody-3d.md` | Cuerpo humano 3D interactivo con datos biométricos | v2 |
| `08-generacion-automatica.md` | Generar dieta/rutina inicial para un usuario nuevo | v2 |
| `09-biblioteca-investigaciones.md` | Repositorio de estudios, PDFs, resúmenes y citas | v2 → v3 |

Cada documento de módulo sigue la misma estructura: **qué resuelve**, **cómo funciona paso a paso**, **datos que necesita**, **de dónde sale la precisión científica**, y **qué queda explícitamente fuera de esa fase**.
