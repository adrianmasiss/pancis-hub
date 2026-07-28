# NUT-002 · Factores de actividad

**Constante:** `ACTIVITY_FACTORS` en `src/features/onboarding/lib/nutrition-targets.ts`
**Valor actual:** sedentario 1.2 · ligero 1.375 · moderado 1.55 · alto 1.725
**Estado: corregida** · **Grado C** · Revisado 2026-07-28

---

## Pregunta

¿Multiplicar el metabolismo basal por un factor de actividad de cuatro
categorías estima el gasto energético total de una persona concreta con
precisión suficiente para fijar sus calorías diarias?

## Referencias

| Ref | Identificador | Tipo | Verificado |
|---|---|---|---|
| Shetty P. Energy requirements of adults. *Public Health Nutr*. 2005. | PMID 16277816 | Revisión, base FAO/WHO/UNU | sí |
| Westerterp KR, Plasqui G. Physical activity and human energy expenditure. *Curr Opin Clin Nutr Metab Care*. 2004. | PMID 15534427 | Revisión con agua doblemente marcada | sí |

Ninguna retractada.

## Población

Adultos en libertad, con medición por agua doblemente marcada, que es el
método de referencia. Poblaciones amplias y heterogéneas, incluidos países en
desarrollo (Shetty).

## Resultados

Lo que **sí** está respaldado:

1. El marco del nivel de actividad física (gasto total dividido entre
   metabolismo basal) es válido como índice y se confirma su uso para
   categorizar el patrón de actividad. Shetty concluye explícitamente la
   validez del nivel de actividad física como índice del gasto total ajustado
   por metabolismo basal.
2. Los **límites** del gasto diario en adultos en libertad se sitúan en torno
   a 1.2 x metabolismo basal en el extremo bajo. Westerterp confirma un techo
   del índice de actividad en torno a 2.5 en datos transversales y en estudios
   de intervención con entrenamiento.
3. En adultos, dentro del rango normal, lo que determina el nivel de actividad
   es el tiempo en actividades de intensidad baja y moderada. **La actividad
   de alta intensidad no aporta gran cosa al gasto diario.**

Lo que **no** está respaldado:

4. Los valores concretos **1.375, 1.55 y 1.725** no provienen de ninguna de
   estas fuentes. Son la escala de cinco categorías que popularizaron las
   calculadoras derivadas de Harris-Benedict. La literatura primaria trabaja
   con rangos, no con esos escalones.
5. La validez demostrada es **poblacional**. Asignar a una persona concreta
   una de cuatro categorías y multiplicar es una operación distinta y con
   error mucho mayor, que ninguna de estas fuentes respalda.

## Limitaciones

- El punto 5 es la limitación central y no se resuelve buscando mejores
  fuentes: es una limitación del método, no del estado del conocimiento.
- Las categorías dependen de que el usuario se autoclasifique, y la
  autopercepción de actividad es notoriamente poco fiable.
- El hallazgo 3 tiene una consecuencia contraintuitiva para el producto:
  entrenar fuerza cuatro veces por semana **no** mueve tanto el gasto diario
  como la gente cree. Los pasos y el movimiento cotidiano pesan más.

## Aplicabilidad a Pancis Hub

**El marco se conserva, la falsa precisión se va.**

Mantener cuatro escalones con tres decimales comunica una exactitud que no
existe. 1.375 sugiere que se distingue de 1.4, y no se distingue.

### Cambios propuestos

1. **Redondear los factores** a 1.2 / 1.4 / 1.6 / 1.75. Deja de aparentar
   precisión, y la diferencia frente a los valores actuales está muy por
   debajo del error del método.
2. **Mostrar el resultado como rango, no como cifra.** El objetivo calórico
   debería presentarse como un intervalo con el punto medio destacado, y no
   como un número exacto.
3. **Usar los pasos diarios cuando existan.** `profiles.daily_steps` ya está
   en el esquema y no se usa para esto. Por el hallazgo 3, el movimiento
   cotidiano informa mejor que la categoría autodeclarada.
4. **Etiquetar el techo.** Ningún factor por encima de 2.5, que es el límite
   observado en adultos en libertad.
5. **Calibrar con el peso real.** La corrección honesta a largo plazo no es
   una fórmula mejor sino observar la tendencia de peso del usuario durante
   dos o tres semanas y ajustar. Queda anotado como NUT-002b, pendiente, y
   depende del módulo de seguimiento.

## Claim propuesto

> Tus calorías salen de tu gasto en reposo multiplicado por tu nivel de
> actividad. Es una estimación con margen amplio: el método está validado
> para grupos, no para acertar con una persona concreta. Tómalo como punto de
> partida y ajústalo con lo que haga tu peso en las próximas semanas.

## Nivel de evidencia

**C.** El marco tiene respaldo bueno, pero los valores concretos son
convención heredada y su aplicación individual es una extrapolación. No es D
porque el rango y los límites sí están medidos con el método de referencia.

## Decisión

- [ ] Incorporar
- [x] Incorporar con advertencia
- [ ] No incorporar
- [ ] Requiere revisión

**Cambio de código requerido (Fase 3):** redondear los factores, presentar
rango en vez de cifra exacta, y registrar el nivel de evidencia junto al
objetivo calórico para que la UI lo pueda mostrar.

## Revisor y fecha

Redactado por el agente el 2026-07-28. **Pendiente de aprobación humana.**
Este claim cambia un valor en producción: requiere aprobación explícita antes
de tocar código.
