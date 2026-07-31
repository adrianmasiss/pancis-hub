# BIO-003 · Proximidad al fallo

**Constante:** valores de `rir` en `GOAL_PRESCRIPTIONS`, `src/features/training/lib/prescription.ts`
**Valor actual:** fuerza compuesto RIR 2 / aislado 2 · hipertrofia compuesto 2 / aislado 1 · recomposición 2 / 2 · resistencia 3 / 2, ajustado ±1 por experiencia y por demanda técnica
**Estado: corregida** · **Grado B** · Revisado 2026-07-28

---

## Pregunta

¿Cuánto conviene acercarse al fallo, y la respuesta es la misma para fuerza
que para hipertrofia?

## Referencias

| Ref | Identificador | Tipo | Verificado |
|---|---|---|---|
| Robinson ZP et al. Exploring the Dose-Response Relationship Between Estimated Resistance Training Proximity to Failure, Strength Gain, and Muscle Hypertrophy. *Sports Med*. 2024. | PMID 38970765 · DOI 10.1007/s40279-024-02069-2 | Metarregresión multinivel | sí |
| Refalo MC et al. Influence of Resistance Training Proximity-to-Failure on Skeletal Muscle Hypertrophy: A Systematic Review with Meta-Analysis. *Sports Med*. 2023. | PMID 36334240 | Revisión sistemática con metaanálisis | sí |
| Grgic J et al. Effects of resistance training performed to repetition failure or non-failure on muscular strength and hypertrophy. *J Sport Health Sci*. 2022. | PMID 33497853 · DOI 10.1016/j.jshs.2021.01.007 | Metaanálisis | sí |

## Resultado principal

**La respuesta no es la misma para fuerza que para hipertrofia**, y eso es lo
que el sistema no distingue hoy.

Robinson 2024, tras ajustar por carga, método de igualación de volumen,
duración y nivel de entrenamiento:

| Desenlace | Relación con las repeticiones en reserva |
|---|---|
| **Fuerza** | Los intervalos de confianza de las pendientes **contienen el punto nulo**. Relación insignificante. Las ganancias de fuerza fueron similares en un rango amplio de repeticiones en reserva. |
| **Hipertrofia** | Pendientes **negativas**, con intervalos que **no** contienen el nulo. El tamaño muscular aumenta a medida que las series terminan más cerca del fallo. |

## Las advertencias de los propios autores

Esto no puede omitirse al citar este trabajo:

1. **Las repeticiones en reserva fueron estimadas**, no medidas. Se dedujeron
   de las descripciones de los protocolos de cada estudio.
2. **Los mejores modelos tuvieron una calidad de ajuste modesta.**
3. Los autores califican el análisis de **exploratorio** y piden cautela
   explícitamente.
4. Concluyen que **la relación exacta sigue sin estar clara** y piden estudios
   diseñados a propósito.

Así que la dirección del efecto en hipertrofia es creíble, pero **no hay base
para afirmar que un valor concreto sea el óptimo.**

## Qué hace hoy el sistema y qué está mal

El motor prescribe RIR 2 para fuerza y RIR 2 en compuestos de hipertrofia,
prácticamente lo mismo. Según Robinson, eso es exactamente al revés de lo que
la evidencia sugiere:

- **En fuerza**, la proximidad al fallo apenas importa. Se podría dejar más
  margen sin perder ganancias, y ganar en calidad técnica y fatiga.
- **En hipertrofia**, acercarse más sí aporta. Es donde tiene sentido apretar.

Los ajustes por experiencia (±1) y por demanda técnica (+1) que ya tiene el
código **están bien orientados** y son coherentes con `spec/docs/07A`, que
señala que el coste de fatiga depende del ejercicio y que el fallo es más
practicable en ejercicios estables y aislados.

## Cambio propuesto

1. **Separar la recomendación por objetivo**, que hoy está casi igualada:
   dejar más margen en fuerza (RIR 2 a 3) y menos en hipertrofia (RIR 0 a 2 en
   aislados, 1 a 2 en compuestos).
2. **Expresar el RIR como rango**, no como cifra exacta. Un "RIR 2" comunica
   una precisión que ni el método de medición ni la percepción del usuario
   sostienen.
3. **No convertir "más cerca del fallo es mejor para hipertrofia" en "entrena
   al fallo siempre".** El propio `07A` lo prohíbe, y la fatiga acumulada no
   entra en estos modelos.
4. **Conservar** los ajustes por experiencia y demanda técnica.

## Claim propuesto

> Para fuerza, lo cerca que llegues del fallo importa poco: puedes dejar dos o
> tres repeticiones en reserva sin perder ganancias. Para hipertrofia sí parece
> haber ventaja en acercarse más, sobre todo en ejercicios aislados donde
> fallar cuesta menos. Es una tendencia, no un número exacto: los estudios
> estimaron el margen al fallo en vez de medirlo.

## Nivel de evidencia

**B.** Varios metaanálisis concordantes en la dirección del efecto, pero el
análisis dosis-respuesta es exploratorio, con ajuste modesto y exposición
estimada. No es A porque los propios autores piden cautela.

## Decisión

- [ ] Incorporar
- [x] Incorporar con advertencia
- [ ] No incorporar
- [ ] Requiere revisión

**Pendiente:** leer Refalo 2023 y Grgic 2022 completos para fijar los extremos
de cada rango.

## Revisor y fecha

Redactado por el agente el 2026-07-28. **Pendiente de aprobación humana.**
