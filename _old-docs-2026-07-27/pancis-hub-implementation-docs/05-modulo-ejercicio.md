# Módulo de Ejercicio

**Fase:** MVP

## Qué resuelve

El mismo problema que el módulo de dieta, pero para entrenamiento: un día puntual la persona no puede o no quiere hacer un ejercicio planificado, y necesita un sustituto que trabaje **la misma región muscular específica** — no solo "el mismo músculo grande" de forma genérica.

## El requisito no negociable: especificidad por región, no por grupo muscular

Esto es explícito porque es la diferencia central que se pidió para este módulo: **no alcanza con decir "press plano y press inclinado sirven porque trabajan pecho"**. El sistema tiene que poder decir, con base biomecánica, qué porción de un músculo se ve más comprometida por cada ejercicio — típicamente en función del ángulo de la articulación, la línea de tracción de la resistencia y qué fibras quedan en mayor estiramiento o mayor ventaja mecánica en cada punto del movimiento.

Ejemplo ilustrativo de cómo debería verse el catálogo de `exercises` (los ejercicios y ángulos exactos son ejemplo de estructura, no una tabla cerrada — se completa y valida en `09-biblioteca-investigaciones.md`):

| Ejercicio | Región específica trabajada | Justificación biomecánica (a completar con fuente) |
|---|---|---|
| Press inclinado (30-45°) | Pecho superior / fibras claviculares | El ángulo de inclinación alinea la línea de tracción con la orientación de las fibras claviculares, aumentando su reclutamiento relativo |
| Press plano | Pecho medio / fibras esternocostales medias | Máximo reclutamiento en el rango medio del pecho con el torso horizontal |
| Press declinado / fondos con inclinación torácica | Pecho inferior / fibras esternales inferiores | El ángulo descendente favorece la porción inferior del esternocostal |
| Aperturas con cable bajo a alto | Pecho superior, con mayor tiempo bajo tensión en el estiramiento | La dirección de la resistencia (de abajo hacia arriba) mantiene tensión en fibras superiores durante todo el recorrido |

El mismo criterio se aplica al resto de los grupos musculares del catálogo: espalda (dorsal ancho vs. trapecio medio/inferior vs. deltoides posterior), piernas (cuádriceps — recto femoral con componente de flexión de cadera vs. vastos — sin ese componente —, isquiotibiales en función de rodilla vs. cadera), hombros (deltoides anterior/medio/posterior), etc.

## Enfoque de referencia

El criterio de "explicar el ejercicio por su biomecánica real, no por el nombre del músculo grande", tal como se pidió, es consistente con el enfoque de divulgación científica de entrenadores como Jeff Nippard, que basan la selección de ejercicios en electromiografía, rango de movimiento y arquitectura muscular en vez de solo en la clasificación tradicional por "grupo muscular". Esto se toma como **referencia de enfoque metodológico**, no como fuente primaria: las clasificaciones concretas que entren al catálogo (`exercises.region_especifica`) deben estar respaldadas por estudios de EMG, biomecánica o arquitectura muscular citados en `research_sources`, siguiendo el mismo principio de "ningún número o clasificación sin fuente" del resto del sistema.

## Flujo paso a paso

1. **Vista de la rutina del día**, con cada ejercicio mostrando su región específica (no solo "pecho", sino "pecho superior — fibras claviculares").
2. **Sustitución puntual:** el usuario marca que no puede/no quiere hacer un ejercicio ese día (falta de equipo, lesión leve, aburrimiento). El sistema filtra `exercises` por `region_especifica` igual o biomecánicamente equivalente a la del ejercicio original, respetando también el equipo disponible que declare el usuario en ese momento.
3. **Justificación visible:** cada sustituto sugerido muestra la razón biomecánica de por qué es equivalente, citando la fuente en `research_sources`. Esto es parte del pedido explícito de precisión — la sustitución sin explicación no cumple el objetivo del módulo.
4. **Registro del cambio:** igual que en dieta, se guarda en `routine_day_logs` sin alterar la rutina base planificada.

## Qué queda fuera de esta fase

- Generación automática de una rutina completa desde cero para un usuario nuevo (`08-generacion-automatica.md`, v2).
- Ajuste automático de volumen/intensidad por progreso registrado (posible v3).
- Video o animación demostrativa de cada ejercicio (evaluar en v2 si aporta más que texto + imagen).
