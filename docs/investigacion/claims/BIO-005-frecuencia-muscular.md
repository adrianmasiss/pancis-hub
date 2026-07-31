# BIO-005 · Frecuencia por músculo

**Dónde aplica:** `muscleFrequency()` en `src/features/training/lib/stats.ts`, análisis de rutina, y `spec/docs/07A`
**Estado: corregida** · **Grado A** · Revisado 2026-07-28

---

## Pregunta

¿Entrenar un músculo más veces por semana produce más músculo, con el volumen
igualado?

## Referencias

| Ref | Identificador | Tipo | Verificado |
|---|---|---|---|
| Pelland JC et al. The Resistance Training Dose Response: Meta-Regressions Exploring the Effects of Weekly Volume and Frequency. *Sports Med*. 2026. | PMID 41343037 · DOI 10.1007/s40279-025-02344-w | Metarregresión multinivel | sí |
| Schoenfeld BJ et al. How many times per week should a muscle be trained to maximize muscle hypertrophy? *J Sports Sci*. 2019. | PMID 30558493 | Metaanálisis | sí |
| Ramos-Campo DJ et al. Efficacy of Split Versus Full-Body Resistance Training on Strength and Muscle Growth. *J Strength Cond Res*. 2024. | PMID 38595233 · DOI 10.1519/JSC.0000000000004774 | Revisión sistemática con metaanálisis | sí |

## Resultado principal

**La frecuencia se comporta distinto para hipertrofia que para fuerza**, y en
hipertrofia el efecto es mucho menor de lo que se suele decir.

Pelland 2026, ajustando por duración y nivel de entrenamiento:

| Desenlace | Probabilidad posterior de pendiente > 0 | Lectura |
|---|---|---|
| **Hipertrofia** | **menor que 100 %** | Compatible con efectos insignificantes |
| **Fuerza** | **100 %** | La fuerza aumenta con la frecuencia, con rendimientos decrecientes |

Los autores concluyen que solo en fuerza se identifican efectos de forma
consistente.

## Por qué esto importa para el producto

La creencia extendida es que hay que entrenar cada músculo dos veces por
semana para maximizar la hipertrofia. **Con el volumen igualado, la evidencia
no lo sostiene con firmeza.** Lo que sostiene es que la frecuencia sirve para
**repartir** el volumen, no para añadir estímulo por sí misma.

Es exactamente lo que ya dice `spec/docs/07A`:

> Debe interpretar la frecuencia principalmente como una forma de distribuir
> volumen y calidad de trabajo.

Y encaja con el otro hallazgo del mismo bloque: **con el volumen igualado, las
rutinas divididas y de cuerpo completo producen resultados similares**
(Ramos-Campo 2024). La división es una herramienta de reparto, no un estímulo
superior. Esto se detalla en BIO-008.

## Lo que hace hoy el sistema

`muscleFrequency()` cuenta estímulos semanales por músculo y los muestra. Está
bien que lo muestre. El riesgo está en el **encuadre**: si la interfaz presenta
la frecuencia como un objetivo a maximizar, o si el análisis de rutina marca
como deficiente una frecuencia de una vez por semana, estaría afirmando algo
que la evidencia no respalda.

## Cambio propuesto

1. **Presentar la frecuencia como reparto, no como objetivo.** "Tu pectoral
   recibe 18 series repartidas en 2 días" comunica mejor que "frecuencia 2".
2. **No marcar como problema una frecuencia baja si el volumen es adecuado**,
   salvo que las sesiones sean tan largas que la calidad se degrade, que es el
   argumento práctico real a favor de repartir.
3. **Diferenciar por objetivo:** en fuerza sí hay motivo para subir la
   frecuencia; en hipertrofia el motivo es logístico.
4. Misma limitación de muestra que BIO-004: adultos jóvenes, 79 % hombres.

## Claim propuesto

> Repartir tus series en más días no produce por sí solo más músculo si el
> total semanal es el mismo: la frecuencia sirve sobre todo para que las
> sesiones no se hagan larguísimas y cada serie salga con calidad. En fuerza sí
> hay algo de ventaja en entrenar más a menudo.

## Nivel de evidencia

**A.** Metarregresión reciente con muestra grande, concordante con metaanálisis
previos y con la revisión de divisiones frente a cuerpo completo.

## Decisión

- [ ] Incorporar
- [x] Incorporar con advertencia
- [ ] No incorporar
- [ ] Requiere revisión

**Cambio de código requerido:** ninguno en el cálculo. El cambio es de
encuadre en la interfaz y en el texto del análisis de rutina.

## Revisor y fecha

Redactado por el agente el 2026-07-28. **Pendiente de aprobación humana.**
