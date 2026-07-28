# BIO-002 · Valores biomecánicos del catálogo de ejercicios

**Constantes:** `stability`, `range_of_motion`, `technical_demand`, `systemic_fatigue`, `progression_ease`, `resistance_profile`, `hardest_point`, `joints`, `common_errors`, `technique_cues` en `exercise_catalog`, poblados por la migración `20260723000002`
**Estado: no es evidencia** · **Sin grado** · Revisado 2026-07-28

> **Este claim no corrige un valor. Retira una fuente que nunca existió.**

---

## Origen de los datos, confirmado

Los valores fueron **generados, sin autoría humana y sin revisión por alguien
con formación en el área** (confirmado por el propio usuario el 2026-07-28).

Eso los deja fuera de la jerarquía de `spec/docs/04_SCIENTIFIC_GOVERNANCE.md`.
La escala llega hasta el grado D, que cubre "opinión experta o contenido
educativo". **Contenido generado sin revisión no es opinión experta.** No hay
un experto detrás cuya opinión se esté recogiendo.

No es un grado bajo. Es la ausencia de grado.

## Por qué importa más de lo que parece

El motor `rateExercise()` consume estos valores y produce una valoración de
1 a 10 **acompañada siempre de una razón redactada**. Esa exigencia se
introdujo como garantía de calidad, y aquí se vuelve en contra:

> "Permite añadir carga de forma medible, que es lo que impulsa la fuerza."

La frase es correcta en abstracto. Pero el número que la dispara
(`progression_ease` de ese ejercicio) es inventado. **El sistema produce
explicaciones bien escritas de valoraciones sin fundamento**, que es una forma
de falsa precisión más convincente y por tanto peor que mostrar el número a
secas.

Un usuario que lee "estabilidad 4, por eso este ejercicio exige más control"
razonablemente asume que ese 4 significa algo.

## Interacción con el defecto D-001

`docs/DEFECTOS_CONOCIDOS.md` recoge que estos valores desaparecen en cada
`supabase db reset`, y que entonces `rateExercise` cae a `DEFAULT_SCORE = 5`
sin avisar.

Puestos en conjunto: el motor funciona con datos inventados, y cuando esos
datos se pierden funciona con un 5 constante, y en ninguno de los dos casos
lo dice. **Las dos situaciones son indistinguibles para el usuario**, lo cual
es la mejor prueba de que la valoración no está aportando información real
hoy.

## Qué se hace

### Inmediato, sin esperar a la reconstrucción

1. **Retirar el aire de dato objetivo.** Mientras los valores no estén
   revisados, la ficha del ejercicio no debe mostrar puntuaciones numéricas
   como si fueran medidas.
2. **Marcar el origen en la base.** Añadir a `exercise_catalog` una columna de
   procedencia por ejercicio (`generado_sin_revisar`, `revisado`,
   `importado_de_fuente`) para que el sistema sepa qué está mostrando y pueda
   comportarse distinto.
3. **Arreglar D-001**, porque no tiene sentido reconstruir datos que el
   siguiente reset va a borrar.

### Reconstrucción

El usuario pidió rehacerlos o confirmarlos. Hay tres vías, y no se excluyen:

| Vía | Qué cubre | Coste |
|---|---|---|
| **Derivación estructural** | `joints`, `is_unilateral`, `equipment`, patrón de movimiento | Bajo. Son hechos anatómicos y mecánicos verificables, no opiniones. |
| **Literatura** | `resistance_profile`, `hardest_point`, rango de movimiento | Medio. Hay literatura biomecánica por ejercicio, pero no para los 15 por igual. |
| **Revisión humana** | `stability`, `technical_demand`, `systemic_fatigue`, `progression_ease` | Alto. Son juicios. Con un revisor con formación pasan a grado D legítimo. |

**Recomendación:** empezar por la primera, que es objetiva y elimina de un
golpe la parte inventada más fácil de arreglar. Los cuatro campos de la
tercera fila son irreductiblemente juicios: o los firma una persona, o se
retiran.

## Lo que NO hay que hacer

**Regenerarlos con otro modelo y darlos por buenos.** Sería repetir el
problema con más pasos. Si la reconstrucción de los campos de juicio no lleva
firma humana, esos campos deben desaparecer de la interfaz, no rellenarse
otra vez.

## Claim propuesto

Ninguno. **No se puede emitir un claim al usuario a partir de estos datos**
hasta que tengan procedencia.

## Nivel de evidencia

**Sin grado.** No procede asignar uno.

## Decisión

- [ ] Incorporar
- [ ] Incorporar con advertencia
- [x] No incorporar
- [x] Requiere revisión

## Revisor y fecha

Redactado por el agente el 2026-07-28. Origen de los datos confirmado por el
usuario. **Pendiente de decidir el alcance de la reconstrucción.**
