# BIO-006 · Tempo y duración de la repetición

**Dónde aplica:** campo `tempo` en `workout_plan_exercises` y `workout_sets`, tempo de cuatro fases de `spec/docs/07A`
**Estado: corregida** · **Grado B** · Revisado 2026-07-28

---

## Pregunta

¿Modificar la velocidad de la repetición cambia la hipertrofia?

## Referencias

| Ref | Identificador | Tipo | Verificado |
|---|---|---|---|
| Schoenfeld BJ, Ogborn DI, Krieger JW. Effect of repetition duration during resistance training on muscle hypertrophy: a systematic review and meta-analysis. *Sports Med*. 2015. | PMID 25601394 · DOI 10.1007/s40279-015-0304-0 | Revisión sistemática con metaanálisis | sí |

## Población

Ocho estudios, en adultos sin enfermedad crónica ni lesión. **Criterio de
inclusión relevante: todos los protocolos llevaban las series al fallo.** Lo
que se compara, por tanto, es la velocidad a igualdad de esfuerzo terminal.

## Resultados

**La hipertrofia es similar con duraciones de repetición de 0.5 a 8 segundos.**

Ese rango es enorme. Cubre desde una repetición explosiva hasta una muy
controlada, y dentro de él la velocidad no decide el resultado.

Solo aparece un límite: entrenar a duraciones voluntariamente muy lentas,
**por encima de 10 segundos por repetición, resulta inferior** para
hipertrofia. Los autores matizan que la falta de estudios controlados sobre
ese extremo impide conclusiones definitivas.

## Consecuencia: el tempo importa menos de lo que se cree

El tempo es una de las variables que más se prescribe con aire de precisión en
las rutinas escritas, y esta revisión dice que dentro de un rango muy amplio no
cambia el resultado.

Eso **no** significa que el campo `tempo` sobre. Significa que su valor es
otro:

- **Técnica y consistencia.** Una excéntrica controlada ayuda a repetir bien el
  movimiento, que es justo lo que dice `07A`.
- **Comunicación.** "Baja controlando" es una instrucción útil.
- **Lo que no es:** una palanca de hipertrofia, ni algo que justifique
  prescribir `3-1-1-0` en vez de `2-0-1-0` con cara de saber por qué.

## Lo que `07A` ya tenía bien

Dos cosas del documento se sostienen:

1. **Guardar el tempo en cuatro fases** (excéntrica, pausa inferior,
   concéntrica, pausa superior). Es la forma correcta de registrarlo y evita la
   ambigüedad.
2. **"Cadencia 2" es ambiguo y hay que preguntarlo.** Correcto, y ahora con
   más motivo: si el rango útil es tan amplio, lo importante es entender qué
   quiso decir quien lo escribió, no acertar el número.

Y una que conviene reforzar: `07A` dice que "el tempo no debe ser
innecesariamente lento". Con esta fuente se puede ser más concreto y poner el
umbral en 10 segundos por repetición.

## Cambio propuesto

1. **No prescribir tempo por defecto.** Dejarlo vacío salvo que el usuario o
   su entrenador lo especifiquen. Rellenarlo automáticamente sería falsa
   precisión.
2. **Avisar solo en el extremo:** si un tempo suma más de 10 segundos por
   repetición, advertir que ahí sí hay evidencia de que resulta inferior.
3. **Al importar una rutina** con tempo, conservarlo tal cual y no
   interpretarlo.
4. **Explicar para qué sirve** cuando el usuario pregunte: técnica y control,
   no crecimiento extra.

## Claim propuesto

> La velocidad a la que haces cada repetición no cambia gran cosa el músculo
> que ganas: entre medio segundo y ocho segundos por repetición los resultados
> son parecidos. Sirve para controlar la técnica, no para crecer más. Lo único
> que parece contraproducente es ir extremadamente lento, por encima de diez
> segundos por repetición.

## Nivel de evidencia

**B.** Revisión sistemática con metaanálisis, pero de solo ocho estudios, y con
la advertencia de los propios autores sobre el extremo lento. La base es
estrecha aunque el resultado sea consistente.

## Decisión

- [ ] Incorporar
- [x] Incorporar con advertencia
- [ ] No incorporar
- [ ] Requiere revisión

**Nota:** todos los estudios entrenaban al fallo. El hallazgo no se puede
extender sin más a series lejos del fallo, donde la velocidad podría interactuar
con el esfuerzo de otra forma. Queda como BIO-006b, pendiente.

## Revisor y fecha

Redactado por el agente el 2026-07-28. **Pendiente de aprobación humana.**
