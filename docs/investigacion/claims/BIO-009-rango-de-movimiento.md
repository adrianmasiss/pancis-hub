# BIO-009 · Rango de movimiento

**Constante:** `range_of_motion` (1-10) en `exercise_catalog`, consumida por `rateExercise()`
**Estado: corregida** · **Grado B para tren inferior, sin grado para el resto** · Revisado 2026-07-28

---

## Referencias

| Ref | Identificador | Tipo | Acceso |
|---|---|---|---|
| Effects of range of motion on muscle development during resistance training interventions: A systematic review. *SAGE Open Med*. 2020. | PMID 32030125 | Revisión sistemática | **abierto**, PMC6977096, leído completo |
| Does Muscle Length Influence Regional Hypertrophy? A Systematic Review and Meta-Analysis. *Int J Sports Med*. 2025. | PMID 40570881 · DOI 10.1055/a-2615-4935 | Revisión sistemática con metaanálisis | resumen |

## Resultados, leídos del texto completo

La conclusión es mucho más matizada de lo que sugiere el eslogan "rango
completo siempre":

1. **Tren inferior: sí.** El rango completo produce mejores efectos sobre la
   hipertrofia que el rango parcial.
2. **Pero con un techo.** Al menos en cuádriceps, y según la interpretación de
   los propios autores, el beneficio **solo se aprecia hasta cierto umbral de
   rango, y se atenúa más allá**.
3. **Tren superior: no se sabe.** La investigación es limitada y
   contradictoria, lo que impide extraer inferencias prácticas sólidas. Los
   autores son explícitos: no hay razón convincente para preferir un rango
   sobre otro en los músculos del tren superior.
4. **Tronco: cero estudios.** Ninguno ha investigado cómo influye el rango en
   la musculatura del tronco.
5. **La respuesta puede ser específica de cada músculo**, aunque es una
   hipótesis que requiere más estudio.
6. **No es binario.** Los estudios comparan rangos mayores frente a menores;
   combinar variaciones de rango podría tener efectos sinérgicos, y eso es un
   hueco de la literatura.

## Por qué el campo actual no puede sostenerse

`range_of_motion` guarda un número del 1 al 10 por ejercicio, y `rateExercise`
lo usa con peso 0.45 en el ajuste al objetivo de hipertrofia.

Tres problemas, en orden de gravedad:

1. **El valor está generado y sin procedencia** (ver BIO-002).
2. **La escala no tiene referente**, igual que el resto de campos 1-10.
3. **Aunque tuviera fuente, la evidencia no permite usarlo como un factor
   uniforme.** Vale para tren inferior, no se sabe para tren superior y no
   existe para tronco. Aplicar el mismo peso de 0.45 a un curl de bíceps que a
   una sentadilla es afirmar algo que la revisión desmiente explícitamente.

## Cambio propuesto

1. **Retirar el 1-10**, coherente con BIO-002.
2. **Guardar en su lugar el rango que el ejercicio permite** como propiedad
   descriptiva del movimiento, si aporta, no como puntuación de calidad.
3. **Limitar la afirmación al tren inferior.** Si el motor va a decir algo
   sobre rango, que lo diga donde hay evidencia y calle donde no.
4. **No presentar "más rango es mejor" como regla universal**, porque incluso
   en cuádriceps hay atenuación pasado cierto punto.

## Claim propuesto

> En pierna, entrenar con recorrido completo produce más músculo que hacerlo
> a medias, aunque el beneficio deja de crecer pasado cierto punto. En tren
> superior la evidencia es escasa y contradictoria, así que aquí no te vamos a
> decir que un recorrido sea mejor que otro. En tronco no hay estudios.

## Nivel de evidencia

**B** para tren inferior. **Sin grado** para tren superior (evidencia
conflictiva) y para tronco (inexistente).

## Decisión

- [ ] Incorporar
- [x] Incorporar con advertencia
- [ ] No incorporar
- [x] Requiere revisión

## Revisor y fecha

Redactado por el agente el 2026-07-28, con lectura de texto completo.
**Pendiente de aprobación humana.**
