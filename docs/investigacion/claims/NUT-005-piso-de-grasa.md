# NUT-005 · Piso de grasa

**Constante:** `MIN_FAT_G_PER_KG` en `src/features/onboarding/lib/nutrition-targets.ts`
**Valor actual:** 0.8 g/kg de peso corporal
**Estado: corregida** · **Grado C** · Revisado 2026-07-28

---

## Pregunta

¿Existe un mínimo de grasa dietética por kilogramo, y el argumento hormonal
que suele invocarse lo sostiene?

## Referencias

| Ref | Identificador | Tipo | Verificado |
|---|---|---|---|
| Helms ER, Aragon AA, Fitschen PJ. Evidence-based recommendations for natural bodybuilding contest preparation. *J Int Soc Sports Nutr*. 2014. | PMID 24864135 | Revisión con recomendaciones | sí |
| Whittaker J, Wu K. Low-fat diets and testosterone in men: Systematic review and meta-analysis of intervention studies. *J Steroid Biochem Mol Biol*. 2021. | PMID 33741447 · DOI 10.1016/j.jsbmb.2021.105878 | Metaanálisis | sí |

> **Errata sin leer.** Whittaker & Wu 2021 tiene una fe de erratas publicada
> en *J Steroid Biochem Mol Biol*. 2026;255:106880
> (DOI 10.1016/j.jsbmb.2025.106880). **No se ha consultado su contenido.**
> Dado que este metaanálisis es el único apoyo directo del argumento hormonal
> y ya de por sí es frágil, leer la errata es condición para cerrar el claim.

## Población

Helms: culturistas naturales. Whittaker & Wu: **solo varones**, 6 estudios de
intervención, 206 participantes en total.

**Distancia respecto a nuestro usuario:** el argumento hormonal está estudiado
en hombres. Extenderlo a mujeres, que son la mitad del público objetivo
declarado de Pancis Hub, no está respaldado por esta fuente.

## Resultados

**Helms 2014** recomienda **15 a 30 % de las calorías totales** en forma de
grasa. Fíjate en la unidad: porcentaje de calorías, no gramos por kilo.

**Whittaker & Wu 2021** encuentra descensos significativos de testosterona con
dietas bajas en grasa frente a altas en grasa:

| Resultado | Diferencia de medias estandarizada | IC 95 % | p |
|---|---|---|---|
| Testosterona total | -0.38 | -0.75 a -0.01 | 0.04 |
| Testosterona libre | -0.37 | -0.63 a -0.11 | 0.005 |
| Testosterona urinaria | -0.38 | -0.66 a -0.09 | 0.009 |
| Dihidrotestosterona | -0.30 | -0.56 a -0.03 | 0.03 |

Los propios autores concluyen que **hacen falta más ensayos aleatorizados para
confirmar el efecto.**

## Por qué el argumento hormonal es más débil de lo que se repite

Esto es lo que suele omitirse cuando se cita este trabajo:

1. **Los tamaños de efecto son pequeños** (0.30 a 0.38).
2. **El intervalo de la testosterona total casi toca el cero** (-0.75 a
   -0.01). Es significativo por poco.
3. **Seis estudios, 206 personas.** Base muy estrecha para una regla que se
   aplica a todo el mundo.
4. **Solo hombres.**
5. **Los autores piden confirmación**, no dan el asunto por cerrado.
6. **Descenso de testosterona dentro del rango normal no equivale a perjuicio
   clínico ni a menos hipertrofia.** Ese salto lógico no está en el trabajo.
7. **Hay una errata sin leer.**

Nada de esto dice que el piso de grasa esté mal. Dice que **la certeza con la
que se suele presentar no está justificada**, y Pancis Hub se comprometió a no
hacer eso.

## El defecto de unidad

`0.8 g/kg` no es como la literatura expresa la recomendación. Para una persona
de 70 kg con 2200 kcal, 0.8 g/kg son 56 g, que son 504 kcal, un **23 % de las
calorías**: dentro de la banda 15-30 % de Helms. Coincide, pero por
casualidad. En alguien con mucho peso y pocas calorías, la misma regla se sale
por arriba de la banda.

## Cambio propuesto

1. **Expresar la grasa como porcentaje de calorías** (banda 20 a 30 %,
   centrada dentro de la de Helms), y usar un piso en g/kg solo como guarda
   secundaria contra configuraciones extremas.
2. **Reescribir la justificación.** El comentario del código dice "por razones
   hormonales" sin más. Debe decir que el efecto está descrito en hombres, es
   pequeño, con base estrecha y pendiente de confirmación.
3. **No extender el argumento hormonal a mujeres** sin evidencia propia.
   Queda como NUT-005b, pendiente.

## Claim propuesto

> Se te reserva entre un 20 y un 30 % de las calorías en grasa. Es la banda
> habitual en las recomendaciones para gente que entrena. Se dice a menudo que
> bajar mucho la grasa reduce la testosterona: hay indicios en hombres, pero
> el efecto medido es pequeño, se apoya en pocos estudios y los propios
> autores piden confirmarlo.

## Nivel de evidencia

**C.** La banda de porcentaje tiene respaldo práctico razonable (grado B), pero
el argumento fisiológico con el que se justifica el piso es débil, estrecho,
limitado a varones y con una errata sin consultar.

## Decisión

- [ ] Incorporar
- [x] Incorporar con advertencia
- [ ] No incorporar
- [ ] Requiere revisión

**Condición para cerrar:** leer la errata de 2026.

## Revisor y fecha

Redactado por el agente el 2026-07-28. **Pendiente de aprobación humana.**
