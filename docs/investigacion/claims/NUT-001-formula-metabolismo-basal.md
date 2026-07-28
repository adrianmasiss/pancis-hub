# NUT-001 · Fórmula de metabolismo basal

**Constante:** `calculateBmr()` en `src/features/onboarding/lib/nutrition-targets.ts`
**Valor actual:** Mifflin-St Jeor
`10 x peso(kg) + 6.25 x altura(cm) - 5 x edad + 5` (masculino) `/ -161` (femenino)
**Estado: sostenida** · **Grado A** · Revisado 2026-07-28

---

## Pregunta

¿Es Mifflin-St Jeor la ecuación con mejor respaldo para estimar el gasto
energético en reposo cuando no se dispone de datos de composición corporal?

## Referencias

| Ref | Identificador | Tipo | Verificado |
|---|---|---|---|
| Mifflin MD et al. A new predictive equation for resting energy expenditure in healthy individuals. *Am J Clin Nutr*. 1990. | PMID 2305711 | Estudio original de derivación | sí |
| Frankenfield D, Roth-Yousey L, Compher C. Comparison of predictive equations for resting metabolic rate in healthy nonobese and obese adults: a systematic review. *J Am Diet Assoc*. 2005. | PMID 15883556 | Revisión sistemática comparativa | sí |

Ninguna retractada. Sin erratas registradas.

## Población

Mifflin 1990 deriva la ecuación en 498 adultos sanos, con y sin obesidad, de
ambos sexos, en Estados Unidos. Frankenfield 2005 la compara con las
alternativas en adultos sanos con y sin obesidad.

**Distancia respecto a nuestro usuario:** población adulta general, no
específicamente entrenada en fuerza. Los usuarios de Pancis Hub entrenan, y el
entrenamiento de fuerza modifica la masa magra, que es el principal
determinante del metabolismo basal. La ecuación no lo captura porque no
recibe composición corporal.

## Diseño

Derivación por regresión sobre calorimetría indirecta (Mifflin), y revisión
sistemática de la exactitud comparada de las ecuaciones disponibles
(Frankenfield).

## Resultados

Frankenfield 2005 concluye que Mifflin-St Jeor es la ecuación que predice el
gasto en reposo con menor error en adultos sanos, con y sin obesidad, frente a
Harris-Benedict, Owen y Food and Agriculture Organization/World Health
Organization/United Nations University. Es la razón por la que se convirtió en
la recomendación habitual de la práctica dietética.

## Limitaciones

1. **Es una estimación de grupo aplicada a un individuo.** Aun siendo la mejor
   ecuación disponible, el error individual es relevante. Ninguna ecuación
   sustituye a la calorimetría indirecta.
2. **No usa composición corporal.** En una persona con masa magra alta
   subestima, y en una con masa magra baja sobrestima. Esto es directamente
   relevante para Pancis Hub, cuyo usuario entrena fuerza.
3. **Derivada en población estadounidense**, sin validación específica para
   Costa Rica ni para población latinoamericana.
4. **No estaba validada en atletas** en el momento de la derivación.

## Aplicabilidad a Pancis Hub

Se sostiene como punto de partida, y es la elección correcta dado que el
onboarding no pide composición corporal.

**Consecuencia de producto:** cuando el usuario tenga una medición InBody con
masa magra, hay una vía mejor (ecuaciones basadas en masa libre de grasa, tipo
Katch-McArdle). Queda anotado como NUT-001b, pendiente, para cuando el módulo
de biometría alimente al de nutrición.

## Claim propuesto

> Tu gasto en reposo se estima con la ecuación de Mifflin-St Jeor, que es la
> que menos se equivoca en adultos sanos sin datos de composición corporal.
> Es una estimación, no una medición: tu valor real puede diferir, sobre todo
> si tienes bastante masa muscular.

## Nivel de evidencia

**A.** Revisión sistemática comparativa que respalda directamente la elección,
en población aplicable. El grado se refiere a la elección de la ecuación, no a
su exactitud individual, que es limitada por naturaleza.

## Decisión

- [x] Incorporar
- [ ] Incorporar con advertencia
- [ ] No incorporar
- [ ] Requiere revisión

**Cambio de código requerido:** ninguno en el valor. Sí en la trazabilidad:
`calculateBmr` pasa a leer su definición desde `formula_versions` con estas
dos referencias asociadas (Fase 3), y la UI debe mostrar la limitación 2.

El comentario actual del código (`"la formula con mejor evidencia sin datos de
composicion"`) resulta ser correcto. Es la única constante del archivo que ya
estaba bien justificada.

## Revisor y fecha

Redactado por el agente el 2026-07-28. **Pendiente de aprobación humana.**
