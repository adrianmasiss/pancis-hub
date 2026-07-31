# NUT-003 · Proteína por kilogramo

**Constante:** `PROTEIN_G_PER_KG` en `src/features/onboarding/lib/nutrition-targets.ts`
**Valor actual:** 1.8 g/kg de peso corporal, fijo para todos
**Estado: sostenida con matiz** · **Grado A** · Revisado 2026-07-28

---

## Pregunta

¿Cuánta proteína por kilogramo sostiene la literatura para una persona que
entrena fuerza y busca ganar o preservar masa magra, y es 1.8 g/kg un valor
defendible?

## Referencias

| Ref | Identificador | Tipo | Verificado |
|---|---|---|---|
| Morton RW et al. A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. *Br J Sports Med*. 2018. | PMID 28698222 · DOI 10.1136/bjsports-2017-097608 | Metaanálisis con metarregresión | sí |
| Tagawa R et al. Dose-response relationship between protein intake and muscle mass increase: a systematic review and meta-analysis of randomized controlled trials. *Nutr Rev*. 2020. | PMID 33300582 | Metaanálisis dosis-respuesta | sí |
| Helms ER et al. A systematic review of dietary protein during caloric restriction in resistance trained lean athletes. *Int J Sport Nutr Exerc Metab*. 2014. | PMID 24092765 · DOI 10.1123/ijsnem.2013-0054 | Revisión sistemática | sí |
| Jäger R et al. International Society of Sports Nutrition Position Stand: protein and exercise. *J Int Soc Sports Nutr*. 2017. | PMID 28642676 | Posición oficial | sí |
| Nunes EA et al. Systematic review and meta-analysis of protein intake to support muscle mass and function in healthy adults. *J Cachexia Sarcopenia Muscle*. 2022. | PMID 35187864 | Metaanálisis | sí |

**Errata leída** (2026-07-29, PMC7513243, CC BY-NC). **No corrige ningún
número.** Es una declaración tardía de conflicto de interés: uno de los
coautores declara que formaba parte del consejo asesor de un fabricante de
suplementos deportivos en el momento de escribirse el trabajo, y que sigue en
él.

No invalida el metaanálisis ni cambia sus resultados, pero **sí pesa en la
valoración de la evidencia**: un metaanálisis sobre suplementación de proteína
con un autor vinculado a un fabricante de suplementos merece leerse con eso
presente. Es exactamente el tipo de dato que `04_SCIENTIFIC_GOVERNANCE` obliga
a registrar y que desaparece si uno se queda en el resumen.

## Población

Morton 2018: 49 estudios, 1863 participantes adultos sanos, entrenamiento de
fuerza de 6 semanas o más. Helms 2014: atletas entrenados y magros **en
déficit calórico**, que es una población distinta y relevante aparte.

**Distancia respecto a nuestro usuario:** buena para adultos que entrenan
fuerza. Menor para quien empieza de cero, y menor aún para mujeres, que están
infrarrepresentadas en esta literatura. Es una limitación que hay que declarar
en pantalla, no esconder.

## Resultados

**Morton 2018.** La suplementación de proteína aumentó de forma significativa
la fuerza (1RM +2.49 kg, IC 95 % 0.64 a 4.33) y la masa libre de grasa
(+0.30 kg, IC 95 % 0.09 a 0.52). El hallazgo clave: **por encima de una
ingesta total de 1.62 g/kg/día no se observaron más ganancias** de masa libre
de grasa atribuibles a la suplementación. El efecto disminuye con la edad y es
mayor en personas ya entrenadas.

### El dato que solo aparece en el texto completo

Leído el artículo completo en Europe PMC (PMC5867436, CC BY-NC), el famoso
1.62 g/kg resulta ser bastante más frágil de lo que su fama sugiere:

| Parámetro del análisis de punto de quiebre | Valor |
|---|---|
| Punto de quiebre | 1.62 g/kg/día |
| **Intervalo de confianza 95 %** | **1.03 a 2.20 g/kg/día** |
| **p** | **0.079** |
| R² | 0.19 |
| Base | 42 brazos de estudio, 723 participantes |

Los propios autores lo dicen en la tabla suplementaria: la regresión bifásica
**se presenta pese a no ser estadísticamente significativa**.

O sea que la cifra que circula por todas partes como un hecho establecido es
**un punto de quiebre no significativo, con un intervalo que va de 1.03 a
2.20 y un modelo que explica el 19 % de la variación.**

Esto no invalida el metaanálisis, cuyos resultados principales sí son
significativos. Invalida la costumbre de citar "1.6 g/kg" como si fuera un
umbral demostrado.

**Consecuencia directa para el producto:** no se puede construir la
recomendación alrededor del 1.62 ni presentarlo como el punto donde deja de
servir comer más proteína. Refuerza que la respuesta correcta es un rango
ancho, no una cifra.

**Helms 2014**, en atletas magros y en déficit, sostiene ingestas
**superiores**, del orden de 2.3 a 3.1 g/kg de masa libre de grasa, para
preservar masa magra cuando se restringen calorías. Es la situación de mucha
gente en recomposición, y contradice usar un valor único.

## Limitaciones

1. **Un número fijo para todos es lo que la literatura no respalda.** La
   necesidad cambia con el objetivo, el déficit energético, la edad y el
   nivel de entrenamiento.
2. **Por peso corporal contra por masa libre de grasa.** Helms razona sobre
   masa libre de grasa. En una persona con porcentaje graso alto, calcular
   sobre peso total infla la cifra. Pancis Hub usa peso total porque en el
   onboarding no siempre hay composición corporal.
3. **Mujeres infrarrepresentadas** en la literatura de referencia.
4. La errata de Morton está pendiente de leer.

## Aplicabilidad a Pancis Hub

**1.8 g/kg es defendible, pero como valor fijo es la decisión equivocada.**

Está por encima del punto de quiebre de Morton (1.62), lo cual es prudente y
tiene margen de seguridad. Pero deja corto a quien está en déficit, para quien
Helms sostiene más, y es innecesariamente alto para quien solo mantiene.

### Cambio propuesto

Sustituir la constante por un rango dependiente del objetivo, que es
exactamente lo que pide `spec/docs/04_SCIENTIFIC_GOVERNANCE.md` al prohibir el
número universal:

| Objetivo | Propuesta | Apoyo |
|---|---|---|
| Pérdida de grasa (déficit) | 2.0 a 2.4 g/kg | Helms 2014 |
| Recomposición | 1.8 a 2.2 g/kg | Helms 2014, Morton 2018 |
| Ganancia muscular | 1.6 a 2.0 g/kg | Morton 2018, Tagawa 2020 |
| Mantenimiento | 1.6 a 1.8 g/kg | Morton 2018 |

Los valores concretos de cada celda quedan **pendientes de fijar tras leer la
errata de Morton y los textos completos de Helms y Tagawa.** Esta tabla es la
forma propuesta, no todavía el valor aprobado.

## Claim propuesto

> Tu objetivo de proteína depende de lo que estés buscando. En déficit
> calórico conviene subirla para conservar músculo; en mantenimiento no hace
> falta tanto. Estos rangos vienen de metaanálisis en adultos que entrenan
> fuerza, donde las mujeres están poco representadas.

## Nivel de evidencia

**A** para el rango general en adultos que entrenan fuerza: hay metaanálisis y
una posición oficial concordantes.
**B** para los valores en déficit: la evidencia es sólida pero de una revisión
sistemática en una población más estrecha.

## Decisión

- [ ] Incorporar
- [x] Incorporar con advertencia
- [ ] No incorporar
- [ ] Requiere revisión

**Tareas abiertas antes de cerrar este claim:**
1. ~~Leer la errata de Morton 2018~~ **hecho.** Es una declaración de
   conflicto de interés, no una corrección numérica.
2. Leer texto completo de Tagawa 2020 (**abierto**, PMC7727026) y de Helms
   2014 sobre culturismo (**abierto**, PMC4033492) para fijar los extremos de
   la tabla. Helms 2014 sobre déficit (PMID 24092765) sigue cerrado.
3. Decidir si se calcula sobre peso total o sobre masa libre de grasa cuando
   el usuario tenga InBody. Ojo: BIA-001 acota esa idea, porque la masa libre
   de grasa del InBody arrastra un error de hasta 3.3 kg.

## Revisor y fecha

Redactado por el agente el 2026-07-28. **Pendiente de aprobación humana.**
Este claim cambia un valor en producción: requiere aprobación explícita.
