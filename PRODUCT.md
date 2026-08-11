# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Personas que **ya tienen** una dieta y una rutina — propias o dadas por un
profesional — y necesitan flexibilidad diaria sin perder el control del plan.

El círculo real es **el autor y gente cercana** (confirmado 2026-08-11): unas
pocas personas conocidas, no registro público. La app tiene autenticación
multiusuario y RLS por higiene técnica, no porque haya captación abierta. Eso
significa: se entiende sin que nadie la explique en persona, pero no necesita
argumentar por qué existe ni convencer a nadie de registrarse.

Dos perfiles de entrada que la app debe atender:

- quien llega con su plan en PDF y lo sube;
- quien no tiene nada y necesita un punto de partida.

### Escena de uso (confirmada 2026-08-11)

**Teléfono, de pie y con prisa.** Cocina, gimnasio, supermercado. El escritorio
es el caso minoritario. El diseño actual nació de un handoff de escritorio; eso
es una deuda, no una decisión.

**Dos sesiones muy separadas:**

- *Registro rápido*, varias veces al día, medio minuto: qué me toca, marcarlo,
  salir. Sin navegar.
- *Sesión larga*, ocasional: revisar, comparar sustituciones, leer la evidencia,
  ajustar el plan.

Ambas tienen que caber sin mezclarse.

## Product Purpose

Mantener una copia del plan base y permitir **excepciones diarias** que no lo
destruyen: sustituir un alimento o un ejercicio hoy, ver el antes y el después,
saber cuánto te alejas, confirmar o descartar, y que mañana el plan siga intacto.

Alrededor de eso: plan nutricional y de entrenamiento, biblioteca de alimentos,
seguimiento de composición corporal (incluido InBody), historial de cambios y un
copiloto que responde con los datos reales del usuario.

Éxito = la persona cambia algo de su día sin romper su plan ni perder de vista
su objetivo, y entiende por qué el número que ve es ese.

## Positioning

**Ningún número sin fuente.** Las constantes del cálculo viven en la base de
datos con su referencia científica verificada detrás (`research_sources`,
`formula_versions`), no como literales en el código. La app puede responder «de
dónde sale este número» con el texto exacto de la evidencia, incluidos sus
matices y limitaciones, sin que un modelo lo reescriba.

**Propone, nunca escribe sola.** Toda sustitución, recálculo o ajuste se
presenta con el antes y el después y espera confirmación. El copiloto no tiene
herramientas de escritura: devuelve propuestas.

**La excepción diaria es el mecanismo.** Otras apps te hacen editar el plan (y
perderlo) o ignorarlo. Aquí el plan base es inmutable y el día es una capa
encima.

## Operating Context

- Español latinoamericano (es-419), zona horaria del perfil (Costa Rica en el
  caso real). Sistema métrico por defecto, imperial disponible.
- PWA instalable, con modo sin conexión conservador.
- Fuentes de alimentos: USDA y Open Food Facts. Escaneo de código de barras.
- Composición corporal: básculas domésticas e informes **InBody** (se adjunta el
  PDF o la foto del informe).
- El plan de entrenamiento suele venir de un profesional o de un PDF.
- Ritual real: registrar comidas a lo largo del día, entrenar con el teléfono en
  la mano, pesarse por la mañana, revisar el conjunto de vez en cuando.

## Capabilities and Constraints

**Funciona hoy:** vista Hoy (objetivo / plan / llevas / faltan), plan de dieta
con sustituciones por día, biblioteca de alimentos con corrección por usuario,
recetas, equivalencias, rutina con sustitución por día y análisis biomecánico,
progreso con fotos privadas e InBody, historial de cambios, copiloto con once
herramientas y citas, evaluación del copiloto, tolerancias por macro,
recálculo de objetivos propuesto.

**Restricciones duras:**

- **Todo gratis, siempre.** Solo APIs sin coste (USDA, Open Food Facts; Edamam
  descartado por esto). Supabase y Vercel en plan gratuito. Gemini gratuito:
  **20 peticiones por minuto**, y cada pregunta del copiloto gasta 2-4.
- Sin PDFs científicos protegidos: solo metadatos, resúmenes propios y
  fragmentos autorizados.
- **No existe «lo más económico»**: no hay fuente gratuita fiable de precios, y
  el criterio se retiró en vez de inventarlo.
- Herramienta educativa y de seguimiento. **No sustituye la evaluación, el
  diagnóstico ni el tratamiento de profesionales de la salud**, y ante un
  síntoma clínico corta y deriva.

**Terminología del producto:** excepción diaria · sustitución · plan base ·
tolerancia (margen del usuario, nunca límite clínico) · claim · fuente ·
compatibilidad.

## Brand Commitments

- Nombre **Pancis Hub**. Logo propio del usuario en `public/logo.png` y
  `public/logo-dark.png` (isotipo naranja); los iconos de la PWA derivan de él.
- Naranja de marca `#f6921e` como color primario, con gradientes de marca ya
  definidos en `globals.css`.
- Voz: segunda persona, directa, sin alarmismo y sin prometer precisión que el
  método no tiene. Las advertencias explican el porqué en vez de ordenar.
- Referencias que el usuario ha nombrado como vinculantes: **Spotify, Apple,
  Nike**. Criterio declarado: elegante y premium, paleta única, y **rechazo
  explícito a las rejillas de tarjetas para datos secuenciales**.

## Evidence on Hand

- 27 claims de investigación verificados uno a uno contra PubMed E-utilities y
  Crossref, en `docs/investigacion/claims/`. Cada constante del cálculo tiene su
  fuente, su nivel de evidencia, su población y sus limitaciones.
- Datos reales del propio usuario en la base local (usuario demo: dieta, rutina,
  medidas, sesiones) para diseñar contra contenido verdadero.
- Catálogo de ejercicios con imágenes de dominio público (free-exercise-db).
- **No existe:** testimonios, clientes, métricas de uso, precios, ni ninguna
  cifra de adopción. Nada de eso puede aparecer en la interfaz.
- La Academia contiene **contenido de demostración a propósito** y está fuera de
  la navegación hasta que exista la biblioteca científica (fase 8). No debe
  presentarse como respaldo de nada.

## Product Principles

1. **Ningún número sin su razón.** Si la app muestra una cifra, tiene que poder
   decir de dónde sale, con sus matices.
2. **El plan base es sagrado.** El día es una excepción encima; nada lo
   sobrescribe sin confirmación explícita.
3. **Proponer, no ejecutar.** Antes y después a la vista, y la persona decide.
4. **Honestidad sobre precisión.** Rangos y estimaciones donde el método solo da
   eso; advertir en vez de inventar exactitud.
5. **Funciona sin lo caro.** Si la IA o una API externa fallan, la función
   esencial responde igual, y lo dice.

## Accessibility & Inclusion

Objetivo declarado **WCAG AA medida** (fase 10 del plan). Ya presentes:
enlace de salto al contenido, respeto a `prefers-reduced-motion` en las
animaciones, alternativa tabular obligatoria para cualquier visualización 3D
futura, y tema claro y oscuro completos.

Requisito propio de la escena de uso: **debe funcionar con una mano, de pie**,
y legible con brillo de exterior.
