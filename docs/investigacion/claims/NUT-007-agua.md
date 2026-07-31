# NUT-007 · Agua

**Constante:** `WATER_ML_PER_KG` en `src/features/onboarding/lib/nutrition-targets.ts`
**Valor actual:** 35 ml por kg de peso corporal
**Estado: parámetro de producto** · **Grado D** · Revisado 2026-07-28

---

## Pregunta

¿Existe una recomendación oficial de agua expresada por kilogramo de peso?

## Referencias

| Ref | Identificador | Tipo | Verificado |
|---|---|---|---|
| EFSA Panel on Dietetic Products, Nutrition and Allergies. Scientific Opinion on Dietary Reference Values for water. *EFSA Journal*. 2010. | DOI 10.2903/j.efsa.2010.1459 | Dictamen oficial | sí, vía Crossref |
| Institute of Medicine. *Dietary Reference Intakes for Water, Potassium, Sodium, Chloride, and Sulfate*, 2005. | ver nota | Guía oficial | referencia no verificada |

> **Nota de honestidad.** El informe del Institute of Medicine sobre agua se
> cita aquí de memoria y **no se ha resuelto su identificador**. Hasta que se
> verifique, no debe usarse como respaldo. El dictamen de EFSA sí está
> verificado y basta para el argumento.

## Resultado principal

**Ninguna autoridad expresa la recomendación de agua por kilogramo de peso.**
Se expresa como ingesta total diaria diferenciada por sexo, incluyendo el agua
de los alimentos y de todas las bebidas, no solo el agua bebida.

`35 ml/kg` es una **regla clínica de cabecera**, útil en entornos hospitalarios
y de nutrición aplicada, pero no una cifra derivada de estas guías.

Para una persona de 70 kg da 2.45 L, que cae cerca de las ingestas adecuadas
de referencia. **La cifra es razonable; su presentación como dato científico
derivado no lo es.**

## Por qué es un parámetro de producto y no ciencia

1. **Unidad equivocada.** Las guías no usan ml/kg.
2. **Ignora las dos variables que más pesan.** El ejercicio y el calor dominan
   la necesidad de líquido, muy por encima del peso corporal. Una persona de
   70 kg entrenando en el Valle Central de Costa Rica y esa misma persona
   sedentaria en un clima templado no tienen la misma necesidad, y la fórmula
   les da idéntico número.
3. **Ignora el agua de los alimentos.** Las ingestas adecuadas se refieren a
   agua total. Presentar la cifra como agua a beber la sobrestima.
4. **La sed y el color de la orina son mejores guías** para una persona sana
   que cualquier cifra fija.

## Aplicabilidad a Pancis Hub

**Se conserva el valor y se cambia la etiqueta.** No hay motivo para quitar
una referencia orientativa que resulta razonable, pero deja de presentarse
como un objetivo del mismo tipo que la proteína.

### Cambios propuestos

1. **Reclasificar como orientación**, no como objetivo nutricional. Sale del
   bloque de macros.
2. **Decir que incluye el agua de los alimentos**, o subir la cifra si se
   quiere expresar solo lo bebido.
3. **Ajustar por entrenamiento y clima**, o declarar explícitamente que no lo
   hace. Lo segundo es aceptable; lo que no es aceptable es callarlo.
4. **Etiquetar como parámetro de producto** en `formula_versions`, con grado D
   y sin fingir respaldo primario.

## Claim propuesto

> Unos 35 ml por kilo es una referencia práctica de uso clínico, no una
> recomendación oficial: las guías hablan de ingesta total diaria por sexo,
> contando el agua de los alimentos. Si entrenas fuerte o hace calor,
> necesitas más. Para una persona sana, la sed y el color de la orina orientan
> mejor que cualquier número fijo.

## Nivel de evidencia

**D.** Inferencia y práctica clínica. No es una recomendación derivada de las
guías citadas, aunque su magnitud sea compatible con ellas.

## Decisión

- [ ] Incorporar
- [x] Incorporar con advertencia
- [ ] No incorporar
- [ ] Requiere revisión

**Tarea abierta:** verificar el identificador del informe del Institute of
Medicine sobre agua, o retirarlo de las referencias.

## Revisor y fecha

Redactado por el agente el 2026-07-28. **Pendiente de aprobación humana.**
