# NUT-006 · Fibra

**Constante:** `FIBER_G_PER_1000_KCAL` en `src/features/onboarding/lib/nutrition-targets.ts`
**Valor actual:** 14 g por cada 1000 kcal
**Estado: sostenida** · **Grado B** · Revisado 2026-07-28

---

## Pregunta

¿De dónde sale 14 g por 1000 kcal y qué tipo de recomendación es?

## Referencias

| Ref | Identificador | Tipo | Verificado |
|---|---|---|---|
| Institute of Medicine. *Dietary Reference Intakes for Energy, Carbohydrate, Fiber, Fat, Fatty Acids, Cholesterol, Protein, and Amino Acids*. National Academies Press, 2005. | DOI 10.17226/10490 | Guía oficial | sí, vía Crossref |

Resuelto en Crossref como `edited-book`, 2005. Es la fuente original de la
cifra, no una cita de segunda mano.

## Población

Población adulta general de Estados Unidos y Canadá. **No es una recomendación
para deportistas**, y no hay motivo para pensar que quien entrena necesite
más fibra por caloría.

## Qué tipo de recomendación es

Esto es lo que más importa y casi nunca se dice: **es una Ingesta Adecuada, no
un Requerimiento Medio Estimado.** La diferencia no es burocrática.

- Un requerimiento se establece cuando se conoce la cantidad necesaria para
  cubrir una función fisiológica.
- Una **ingesta adecuada** se fija cuando esa evidencia no existe, a partir de
  niveles de consumo observados que se asocian con un desenlace favorable.

Los 14 g/1000 kcal salen de la asociación observada entre consumo de fibra y
menor riesgo de enfermedad coronaria. **Es un objetivo de salud poblacional a
largo plazo, no una necesidad diaria que produzca un déficit si no se cumple.**

## Limitaciones

1. Es una ingesta adecuada, con la incertidumbre que eso implica.
2. Se basa en evidencia observacional de riesgo cardiovascular, no en
   ensayos.
3. **Escalar con las calorías tiene un efecto perverso en déficit:** a menos
   calorías, menos fibra objetivo, justo cuando la saciedad más importa. El
   sistema debería avisar en lugar de bajar el objetivo en silencio.
4. No distingue tipos de fibra, cuyos efectos difieren.
5. Población norteamericana; el patrón alimentario costarricense es distinto,
   aunque la cifra por caloría es razonablemente trasladable.

## Aplicabilidad a Pancis Hub

**El valor se sostiene y no hay que cambiarlo.** Es una de las pocas
constantes del archivo que proviene directamente de una guía oficial
identificable.

Lo que sí hay que cambiar es cómo se presenta:

1. **Dejar de mostrarlo junto a proteína y grasa como si fuera del mismo
   tipo.** Proteína y grasa son objetivos de rendimiento y composición
   corporal; la fibra es un objetivo de salud a largo plazo. Mezclarlos sugiere
   que fallar en fibra un día tiene el mismo peso que fallar en proteína, y no
   lo tiene.
2. **Poner un piso absoluto** para que en déficits fuertes el objetivo no caiga
   a una cifra irrelevante.
3. `spec/docs/01_SCOPE_AND_MVP.md` ya trata la fibra como advertencia y no como
   bloqueo. Es coherente con lo anterior y confirma el criterio.

## Claim propuesto

> El objetivo de fibra viene de las Ingestas Dietéticas de Referencia:
> 14 gramos por cada 1000 kcal. Es un objetivo de salud a largo plazo asociado
> a menor riesgo cardiovascular, no una necesidad diaria: quedarte corto un día
> no tiene la misma consecuencia que quedarte corto de proteína.

## Nivel de evidencia

**B.** Guía oficial reconocida, pero se trata de una ingesta adecuada
sustentada en evidencia observacional, no de un requerimiento demostrado.

## Decisión

- [x] Incorporar
- [ ] Incorporar con advertencia
- [ ] No incorporar
- [ ] Requiere revisión

**Cambio de código requerido:** ninguno en el valor. Sí en la presentación
(punto 1) y un piso absoluto (punto 2).

## Revisor y fecha

Redactado por el agente el 2026-07-28. **Pendiente de aprobación humana.**
