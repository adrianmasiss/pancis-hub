# Módulo de Dieta

**Fase:** MVP

## Qué resuelve

Una persona ve su dieta del día con los macros que le corresponden según su biometría, y si un día puntual no puede o no quiere comer lo planificado, puede cambiarlo y ver inmediatamente cómo afecta ese cambio — sin tener que rehacer el plan completo ni adivinar si el sustituto es equivalente.

## Flujo paso a paso

1. **Cálculo de objetivos de macros.** Al cargar los datos biométricos iniciales (peso, altura, edad, sexo, nivel de actividad, objetivo de peso), el sistema calcula calorías objetivo y gramos de proteína/carbohidratos/grasas usando la fórmula activa en `formula_versions` (ver más abajo). El resultado se guarda en `macro_targets`, no se recalcula en cada pantalla.
2. **Vista de la dieta del día.** Muestra los alimentos planificados, sus macros individuales, y el acumulado del día comparado contra el objetivo. Debe ser legible de un vistazo — esto es directamente responsabilidad de la skill de dirección visual elegida para el proyecto, no de este documento.
3. **Cambio puntual.** El usuario marca "hoy no voy a comer esto" sobre un ítem específico de `diet_day_items`. Esto crea o modifica el `diet_day` de ese día únicamente (`es_dia_modificado = true`); el plan base de otros días no se toca.
4. **Búsqueda de sustituto.** Tres caminos, todos deben coexistir:
   - **Por biblioteca propia:** el usuario busca directamente en `foods` (alimentos ya verificados en USDA o cargados antes) y el sistema muestra a cuántas porciones equivale respecto al alimento original, según macros.
   - **Sin idea de qué elegir:** el usuario pide una sugerencia y el sistema busca en `foods`/USDA candidatos con perfil de macros similar al original (mismo rango de proteína/carbos/grasas, tolerancia configurable) y devuelve 2-3 opciones ordenadas por similitud.
   - **Alimento no guardado en la biblioteca:** el usuario le pregunta directamente a la IA por un producto específico. Este caso pasa por el chat (`06-chat-ia.md`), que debe dejar explícito si el dato viene de una fuente verificada o es una estimación de la IA — nunca mezclarlo sin distinguirlo.
5. **Cálculo de equivalencia.** La sustitución no es "mismo peso en gramos", es equivalencia de macros dentro de una tolerancia razonable (ej. ±10% en proteína, con ajuste automático de porción). Esto es lógica determinística, no una llamada a IA — ver la nota de cuota en `02-arquitectura-y-stack.md`.

## De dónde sale la precisión científica

Los gramos de macro por kg de peso **no se fijan como constantes arbitrarias en el código**. Se guardan como `formula_versions`, vinculadas a `research_sources`. Como punto de partida a verificar y formalizar con las fuentes reales antes de fijarlas en producción, la literatura deportiva actual suele manejar rangos como estos:

- **Proteína:** aproximadamente 1.6–2.2 g/kg/día para personas entrenadas en resistencia con objetivo de hipertrofia o preservación de masa magra en déficit (rango ampliamente citado en revisiones sistemáticas y metaanálisis de nutrición deportiva).
- **Carbohidratos:** mucho más variable según nivel de actividad y objetivo — desde rangos moderados en déficit/sedentarismo hasta varios gramos por kg en quienes entrenan con alto volumen.
- **Grasas:** típicamente expresadas como 20-35% de las calorías totales, con un piso mínimo por kg de peso por razones hormonales.

**Antes de que estos números lleguen a producción**, hay que completar `09-biblioteca-investigaciones.md` con las fuentes concretas (papers, posiciones oficiales de asociaciones como ISSN/ACSM) y cargar la `formula_version` correspondiente con esa referencia. Este documento no debe tratarse como la fuente de verdad numérica final — es el lugar donde se explica el mecanismo, no el valor.

## Qué queda fuera de esta fase

- Generación automática de una dieta completa para alguien sin plan previo (eso es `08-generacion-automatica.md`, v2).
- Reconocimiento de alimentos por foto.
- Ajuste automático de objetivos de macro por tendencia de peso a lo largo del tiempo (posible v3).
