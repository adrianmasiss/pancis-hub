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

### ¿Se puede reconstruir con información certificada de la web?

Sí, en buena parte. Comprobado el 2026-07-28, y el resultado cambia el plan.

**Fuente 1: ACSM Position Stand 2026 (PMID 41843416).** La autoridad
certificadora del área, y **está en acceso abierto** (PMC12965823, 116 000
caracteres legibles). Clasifica y gradúa por tipo de comparación con un
sistema formal de calidad de evidencia, número de revisiones y tamaño
muestral. Cubre explícitamente monoarticular frente a multiarticular, máquina
frente a peso libre, superficie estable frente a inestable, rango parcial y
tiempo bajo tensión.

**Fuente 2: free-exercise-db.** Ya es dependencia del proyecto para las
imágenes. Licencia **The Unlicense** (dominio público, verificada vía API de
GitHub). 873 ejercicios con campos estructurados: `force` (push/pull/static),
`mechanic` (compound/isolation), `level`, `equipment`, `primaryMuscles`,
`secondaryMuscles`, `category`.

### Pero hay un límite que ninguna fuente resuelve

**Ninguna autoridad publica "sentadilla: estabilidad 4 sobre 10".**

El ACSM clasifica y gradúa por categorías. free-exercise-db clasifica por
categorías. La literatura biomecánica describe momentos articulares y perfiles
de resistencia. **Nadie asigna puntuaciones de 1 a 10 por ejercicio**, porque
esa granularidad no tiene referente medible.

Es decir: el problema no es solo de dónde vienen los datos. **Es que la escala
misma no tiene referente.** Buscar una fuente para un número del 1 al 10 es
buscar algo que no existe.

### La comprobación que lo confirma

Comparando `difficulty` de nuestro catálogo con `level` de free-exercise-db en
los 15 ejercicios: **6 discrepancias de 15**. Nuestro catálogo llama
"intermedio" a la sentadilla, al press de banca, al press militar y al remo;
free-exercise-db los llama "beginner". Y al revés en dominadas.

Ojo, esto **no** significa que free-exercise-db tenga razón: su `level` es
colaborativo y llamar "beginner" al press militar es discutible. Lo que
demuestra es que **dos fuentes no certificadas discrepan casi la mitad de las
veces**, que es justo lo que cabe esperar cuando se está midiendo algo sin
definición operativa.

### Plan revisado

| Campo actual | Qué se hace | Procedencia resultante |
|---|---|---|
| `joints`, `is_unilateral`, `equipment`, patrón | Derivar de estructura y de free-exercise-db | Hecho verificable + fuente con licencia |
| `mechanic` (nuevo: multiarticular/monoarticular) | **Sustituye a `systemic_fatigue`** | free-exercise-db + ACSM |
| `force` (empuje/tracción/isométrico) | Campo nuevo | free-exercise-db |
| `resistance_profile`, `hardest_point` | Literatura biomecánica por ejercicio, donde exista; vacío donde no | Grado C, o ausente |
| `stability` | **Sustituir por categoría** estable/inestable, que es como lo trata el ACSM | ACSM |
| `technical_demand`, `progression_ease` | **Retirar.** Sin definición operativa ni fuente posible | ninguna |
| `systemic_fatigue` | **Retirar el 1-10**, queda cubierto por multiarticular/monoarticular | ninguna |

**El cambio de fondo no es rellenar los números con mejores datos. Es dejar de
guardar números y guardar las categorías que las fuentes reales sí publican.**

Eso además arregla el problema de golpe: una categoría con fuente se puede
mostrar y explicar; un 7 sobre 10 no, aunque venga de donde venga.

### Qué sigue necesitando una persona

Solo si se quiere conservar una noción de dificultad técnica más fina que
"multiarticular con barra frente a monoarticular en máquina". Con el plan de
arriba, **el motor puede funcionar sin ningún juicio humano**, apoyado solo en
categorías con procedencia. Es la opción recomendada.

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
