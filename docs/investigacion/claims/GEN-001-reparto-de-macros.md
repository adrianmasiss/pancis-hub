# GEN-001 · Reparto de macros entre comidas

**Dónde aplicará:** generación de `diet_day` base en la Fase 7
**Estado: sostenida** · **Grado A para proteína, B para el resto** · Revisado 2026-07-29

---

## Pregunta

Al generar una dieta desde cero, ¿cómo se reparten las calorías y los macros
entre las comidas del día?

## Referencias

| Ref | Identificador | Tipo | Acceso |
|---|---|---|---|
| Jäger R et al. International Society of Sports Nutrition Position Stand: protein and exercise. *J Int Soc Sports Nutr*. 2017. | PMID 28642676 · PMC5477153, **CC BY** | Posición oficial | **abierto, leído** |
| Helms ER, Aragon AA, Fitschen PJ. Evidence-based recommendations for natural bodybuilding contest preparation. *J Int Soc Sports Nutr*. 2014. | PMID 24864135 | Revisión con recomendaciones | resumen |

## Resultados

### Proteína: hay una recomendación concreta y por comida

El position stand del ISSN, leído completo:

> Las recomendaciones generales son **0.25 g de proteína de alta calidad por kg
> de peso corporal**, o una **dosis absoluta de 20 a 40 g**. [...] Estas dosis
> de proteína deberían idealmente distribuirse **de forma uniforme, cada 3 a 4
> horas**, a lo largo del día.

Helms 2014 concuerda y añade el contexto de entrenamiento: de tres a seis
comidas al día, con una comida que contenga **0.4 a 0.5 g/kg** de peso corporal
de proteína antes y después del entrenamiento de fuerza.

Combinado, sale una regla implementable: reparto uniforme, con un mínimo de
0.25 g/kg por comida, y las comidas cercanas al entrenamiento algo más
cargadas.

### Pero el reparto importa menos que el total

Helms 2014 es explícito, y este matiz es el que evita construir la generación
sobre una precisión falsa:

> Las alteraciones en el momento y la frecuencia de los nutrientes parecen
> tener **poco efecto** sobre la pérdida de grasa o la retención de masa magra.

Y el ISSN, sobre el momento de la ingesta:

> El período óptimo para ingerir proteína es probablemente una cuestión de
> tolerancia individual [...] el efecto anabólico del ejercicio es duradero,
> al menos 24 horas.

**Conclusión para el producto:** el reparto es una cuestión de comodidad y
adherencia, no de eficacia. El total del día es lo que decide.

## Cómo debe generar el sistema

1. **Fijar el total primero** (viene de NUT-003 y NUT-004).
2. **Repartir la proteína de forma uniforme** entre las comidas que el usuario
   declaró en el onboarding (`profiles.meals_per_day` ya existe), respetando el
   mínimo de 0.25 g/kg por comida.
3. **Si el reparto uniforme deja alguna comida por debajo del mínimo**, reducir
   el número de comidas en lugar de bajar la dosis. Es más útil decirle a
   alguien "con tu proteína objetivo te salen mejor 4 comidas que 6" que darle
   6 comidas insuficientes.
4. **Carbohidratos y grasas: sin regla fina.** No hay base para prescribir un
   reparto concreto. Repartir proporcionalmente y dejar que el usuario mueva.
5. **Los horarios de comida ya existen** en `diet_template_meals.scheduled_time`,
   así que el intervalo de 3 a 4 horas es comprobable y se puede avisar si el
   plan generado los agrupa demasiado.
6. **No prometer beneficio por el timing.** Si el usuario pregunta por qué esa
   distribución, la respuesta honesta es que se reparte así porque es cómodo y
   ayuda a llegar al total, no porque el reloj cambie el resultado.

## Claim propuesto

> Repartimos tu proteína de forma parecida entre las comidas, buscando al menos
> unos 0.25 g por kilo de peso en cada una y unas 3 o 4 horas de separación.
> Esto es sobre todo por comodidad: lo que de verdad decide es el total del día,
> no a qué hora comes.

## Nivel de evidencia

**A** para la dosis por comida de proteína: posición oficial con recomendación
cuantitativa explícita.
**B** para que el momento y la frecuencia importan poco: coincidencia de dos
revisiones publicadas.
**Sin grado** para el reparto de carbohidratos y grasas, que queda como
parámetro de producto.

## Decisión

- [x] Incorporar
- [ ] Incorporar con advertencia
- [ ] No incorporar

## Revisor y fecha

Redactado por el agente el 2026-07-29, con lectura de texto completo.
**Pendiente de aprobación humana.**
