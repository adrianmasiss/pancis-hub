# NUT-004 · Ajuste calórico por objetivo

**Constante:** `GOAL_ADJUSTMENTS` en `src/features/onboarding/lib/nutrition-targets.ts`
**Valor actual:** pérdida de grasa 0.85 · recomposición 0.95 · mantenimiento 1.0 · ganancia muscular 1.1
**Estado: corregida** · **Grado B** · Revisado 2026-07-28

---

## Pregunta

¿Multiplicar el gasto total por un porcentaje fijo es la forma correcta de
fijar el déficit o el superávit?

## Referencias

| Ref | Identificador | Tipo | Verificado |
|---|---|---|---|
| Helms ER, Aragon AA, Fitschen PJ. Evidence-based recommendations for natural bodybuilding contest preparation: nutrition and supplementation. *J Int Soc Sports Nutr*. 2014. | PMID 24864135 · DOI 10.1186/1550-2783-11-20 | Revisión con recomendaciones | sí |
| Helms ER et al. A systematic review of dietary protein during caloric restriction in resistance trained lean athletes. *Int J Sport Nutr Exerc Metab*. 2014. | PMID 24092765 | Revisión sistemática | sí |

## Población

Culturistas naturales y atletas entrenados y magros, en preparación de
competición. **Distancia notable respecto a nuestro usuario:** es una
población más magra, más disciplinada y con un objetivo temporal extremo.
Aplicar sus tasas a una persona que solo quiere mejorar composición corporal
es una extrapolación que hay que declarar.

## Resultados

Helms 2014 es explícito y no habla de porcentajes del gasto:

> La ingesta calórica debe fijarse en un nivel que resulte en pérdidas de peso
> corporal de aproximadamente **0.5 a 1 % por semana** para maximizar la
> retención de masa muscular.

El anclaje correcto es la **tasa de cambio de peso**, no un multiplicador.

## El defecto real

Un multiplicador fijo produce tasas semanales muy distintas según el tamaño de
la persona. Con 0.85:

| Persona | Gasto estimado | Déficit diario | Pérdida semanal aprox. | % del peso |
|---|---|---|---|---|
| 55 kg, gasto 1800 | 1800 | 270 kcal | ~0.24 kg | **0.44 %** |
| 100 kg, gasto 3000 | 3000 | 450 kcal | ~0.41 kg | **0.41 %** |

Da la casualidad de que ambos quedan cerca, porque el gasto escala con el
peso. Pero la coincidencia se rompe en los extremos: alguien muy sedentario y
pesado, o muy activo y ligero, se sale de la banda sin que el sistema lo
detecte. **El valor no está mal, el criterio sí.**

## El lado del superávit está peor respaldado

El 1.1 para ganancia muscular no tiene en estas fuentes un respaldo comparable
al del déficit. La literatura sobre tasa óptima de superávit es
considerablemente más débil que la de déficit, y depende mucho del nivel de
entrenamiento: un principiante gana masa magra a un ritmo que un avanzado no
puede sostener. **No se debe presentar el 1.1 con la misma confianza que el
0.85.**

## Cambio propuesto

1. **Calcular el objetivo desde la tasa semanal**, no desde un multiplicador.
   El usuario elige o acepta una tasa (por defecto 0.5 %/semana en déficit) y
   de ahí sale el ajuste calórico.
2. **Acotar a la banda de 0.5 a 1 %/semana** en déficit, y avisar si la
   configuración se sale.
3. **Bajar la confianza declarada del superávit** respecto a la del déficit.
4. **Recomposición** (0.95) es un caso aparte, con evidencia propia que este
   claim no cubre. Queda como NUT-004b, pendiente.

## Claim propuesto

> En déficit, el objetivo se fija para que pierdas entre 0.5 y 1 % de tu peso
> por semana, que es la banda donde mejor se conserva el músculo según
> revisiones en atletas entrenados. Bajar más rápido no acelera el resultado,
> te cuesta masa magra.

## Nivel de evidencia

**B.** Recomendación bien argumentada de una revisión publicada, pero derivada
de una población más estrecha (atletas magros en preparación) que la nuestra,
y el lado del superávit es más débil que el del déficit.

## Decisión

- [ ] Incorporar
- [x] Incorporar con advertencia
- [ ] No incorporar
- [ ] Requiere revisión

**Pendiente:** evidencia específica de recomposición corporal (NUT-004b) y de
tasa de superávit por nivel de entrenamiento.

## Revisor y fecha

Redactado por el agente el 2026-07-28. **Pendiente de aprobación humana.**
Cambia la forma de calcular en producción.
