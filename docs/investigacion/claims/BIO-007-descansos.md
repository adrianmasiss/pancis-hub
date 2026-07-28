# BIO-007 · Descanso entre series

**Constante:** campo `rest` en `GOAL_PRESCRIPTIONS`, `src/features/training/lib/prescription.ts`
**Valor actual:** fuerza 210 s compuesto / 120 s aislado · hipertrofia 150 / 90 · recomposición 150 / 90 · **resistencia 75 / 60**
**Estado: corregida** · **Grado B** · Revisado 2026-07-28

---

## Pregunta

¿Cuánto conviene descansar entre series para hipertrofia, y hay un mínimo por
debajo del cual se pierde?

## Referencias

| Ref | Identificador | Tipo | Verificado |
|---|---|---|---|
| Singer A et al. Give it a rest: a systematic review with Bayesian meta-analysis on the effect of inter-set rest interval duration on muscle hypertrophy. *Front Sports Act Living*. 2024. | PMID 39205815 · DOI 10.3389/fspor.2024.1429789 | Revisión sistemática con metaanálisis bayesiano | sí |

Registro del protocolo disponible en OSF (DOI 10.17605/OSF.IO/YWEVC), lo cual
es un punto a favor de la calidad metodológica.

## Población

9 estudios, 19 mediciones (muslo 10, brazo 6, cuerpo entero 3), adultos sanos,
con el resto de variables de entrenamiento controladas.

## Resultados

**Hay un beneficio pequeño en descansar más de 60 segundos**, probablemente
mediado por la reducción de la carga de volumen que provocan los descansos
cortos.

**Por encima de 90 segundos no se detectan diferencias apreciables**, algo
coherente con que el efecto perjudicial sobre la carga de volumen tiende a
estabilizarse pasado ese punto.

Los efectos controlados, comparando descanso corto contra largo:

| Región | Tamaño del efecto | Intervalo de credibilidad 95 % |
|---|---|---|
| Brazo | 0.13 | -0.27 a 0.51 |
| Muslo | 0.17 | -0.13 a 0.43 |
| Cuerpo entero | -0.08 | -0.45 a 0.29 |

**Los tres intervalos cruzan el cero.** Las estimaciones centrales favorecen
descansos más largos en brazo y muslo, pero la incertidumbre es amplia y hay
heterogeneidad sustancial entre estudios.

Un dato adicional útil: entrenar al fallo o quedarse corto **no modificó de
forma relevante** la interacción entre descanso e hipertrofia.

## El problema con la prescripción actual

El objetivo "resistencia" prescribe **60 segundos en aislados y 75 en
compuestos**. Eso está justo en el punto donde la evidencia sí señala pérdida:
por debajo de 60 segundos el descanso empieza a costar carga de volumen.

`spec/docs/07A` ya advierte de esto:

> No imponer descansos cortos solo por sensación de intensidad.

Es exactamente lo que hace hoy el motor cuando el objetivo es resistencia:
acorta el descanso porque "resistencia suena a poco descanso", no porque
mejore nada.

**Matiz honesto:** si el objetivo del usuario es resistencia muscular y no
hipertrofia, esta fuente no es la que decide, porque mide hipertrofia. Pero el
motor no debería acortar descansos como si fuera gratis, y desde luego no
debería hacerlo en un usuario cuyo objetivo real es composición corporal.

## Los valores de fuerza e hipertrofia

Los 210 y 150 segundos para compuestos quedan cómodamente por encima del
umbral donde el efecto se estabiliza, así que **no hay motivo para tocarlos**.
Los 90 segundos de aislados en hipertrofia están justo en el borde, y podrían
subir un poco.

## Cambio propuesto

1. **Suelo de 60 segundos** en cualquier prescripción, con 90 como
   recomendación por defecto.
2. **Revisar el objetivo "resistencia"**, que hoy baja de ese suelo.
3. **Expresar el descanso como rango**, no como cifra exacta. "210 segundos"
   sugiere una precisión que ni la evidencia ni el cronómetro del usuario
   sostienen.
4. **Explicar el mecanismo**, que es lo interesante: descansar poco no
   perjudica por sí mismo, perjudica porque llegas peor a la serie siguiente y
   haces menos trabajo total.

## Claim propuesto

> Descansa al menos un minuto entre series, y alrededor de minuto y medio si
> puedes. Más allá de eso no parece haber diferencia para ganar músculo.
> Descansar poco no es malo en sí: lo malo es que llegas cansado a la serie
> siguiente y acabas haciendo menos trabajo.

## Nivel de evidencia

**B.** Metaanálisis bayesiano con protocolo registrado, pero base estrecha
(9 estudios), heterogeneidad sustancial e intervalos de credibilidad que
cruzan el cero en las comparaciones controladas.

## Decisión

- [ ] Incorporar
- [x] Incorporar con advertencia
- [ ] No incorporar
- [ ] Requiere revisión

## Revisor y fecha

Redactado por el agente el 2026-07-28. **Pendiente de aprobación humana.**
