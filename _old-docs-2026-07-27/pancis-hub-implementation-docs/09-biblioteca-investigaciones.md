# Biblioteca de Investigaciones

**Fase:** versión mínima en MVP (solo las fuentes que ya sustentan fórmulas activas) → versión navegable completa en v2/v3

## Qué resuelve

Es la pieza que sostiene el principio central del proyecto: "ningún número mágico sin fuente". Es el lugar donde vive la evidencia (papers, posiciones oficiales, revisiones) que respalda cada fórmula de macros y cada clasificación de ejercicio por región muscular que usa el resto del sistema. También es, en su versión completa, un apartado navegable para que el usuario vea en qué se basa lo que la app le está diciendo.

## Dos capas distintas, no confundir

1. **Capa de datos (`research_sources` / `formula_versions`, ver `03-modelo-de-datos.md`):** existe desde el MVP. Es lo que consultan el módulo de dieta, el de ejercicio y el chat para citar fuentes. No requiere interfaz propia — es infraestructura.
2. **Capa navegable (`research_documents`, PDFs completos, resúmenes redactados para el usuario):** llega en v2/v3. Es la sección donde una persona curiosa puede entrar y leer por qué el sistema le recomienda lo que le recomienda, con el PDF original disponible.

## Contenido mínimo para el MVP

Antes de que `04-modulo-dieta.md` y `05-modulo-ejercicio.md` puedan pasar de "framework" a "números en producción", esta biblioteca necesita, como mínimo:

- Fuentes concretas para los rangos de proteína/carbohidratos/grasas por kg de peso corporal según objetivo (déficit, mantenimiento, superávit) y nivel de entrenamiento — revisiones sistemáticas o posiciones oficiales de asociaciones de nutrición deportiva reconocidas.
- Fuentes de biomecánica/EMG para al menos los grupos musculares principales (pecho, espalda, piernas, hombros) que sustenten la clasificación por región específica del catálogo de ejercicios.

Este trabajo de curaduría — buscar, leer y cargar las fuentes reales, no solo el framework para guardarlas — es una tarea separada de la implementación de software y debería tratarse como tal en la planificación (no es algo que "sale solo" al escribir el código).

## Curaduría y control de calidad

- Cada fuente cargada necesita: tipo (estudio, revisión sistemática, posición oficial), año, y por qué se considera confiable (revista, si tiene revisión por pares, si es consenso de una asociación reconocida vs. un estudio aislado).
- Preferir revisiones sistemáticas y metaanálisis sobre estudios individuales cuando estén disponibles, precisamente porque el sistema se apoya en esto para decisiones que afectan el progreso físico real de las personas.
- Rol de administrador/curador (ver `03-modelo-de-datos.md`) responsable de mantener esto actualizado — no debe ser editable por usuarios regulares.

## Versión navegable (v2/v3)

- Listado de investigaciones por área (nutrición, entrenamiento, biomecánica).
- Resumen en lenguaje simple de cada una, sin perder el link al documento original.
- Vínculo visible entre cada investigación y dónde se usa en el sistema (ej. "esta fuente sustenta tu objetivo de proteína actual").
- Buscador, para que el chat IA pueda hacer recuperación dirigida en vez de mandar toda la biblioteca como contexto en cada llamada (ver la nota de cuota de Gemini en `02-arquitectura-y-stack.md` y `06-chat-ia.md`).

## Qué queda fuera de esta fase

- Subida de investigaciones por parte de usuarios regulares (fuera de alcance completo — rompería el control de calidad).
- Traducción automática de papers en otros idiomas (evaluar en v3 según necesidad real).
