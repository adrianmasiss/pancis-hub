# BIA-002 · Qué se puede afirmar de la masa magra segmental

**Dónde aplica:** el cuerpo 3D segmentado de `spec/docs/09_BIOMETRICS_INBODY_3D.md` (Fase 9), y las tablas `segmental_measurements` que aún no existen
**Estado: sostenida, y limita el 3D antes de construirlo** · **Grado B** · Revisado 2026-07-29

---

## Pregunta

¿Se puede mostrar músculo por segmento corporal, como pide el cuerpo 3D?

## Referencias

| Ref | Identificador | Tipo | Acceso |
|---|---|---|---|
| Ward LC. Segmental bioelectrical impedance analysis: an update. *Curr Opin Clin Nutr Metab Care*. 2012. | PMID 22814626 | Revisión | resumen |
| LaForgia J et al. Body composition: validity of segmental bioelectrical impedance analysis. *Asia Pac J Clin Nutr*. 2008. | PMID 19114394 | Validación contra cuatro compartimentos | resumen |

## Resultado principal

Ward 2012, sobre lo que el 3D quiere mostrar:

> La predicción de la masa muscular esquelética apendicular, aunque
> prometedora, **requiere más investigación**.

"Apendicular" es precisamente brazos y piernas: cuatro de los cinco segmentos
que el doc 09 quiere pintar en el modelo 3D.

Y un segundo hallazgo que desinfla un supuesto razonable:

> La predicción de la composición corporal completa a partir de la suma de los
> segmentos individuales, aunque teóricamente preferible, **muestra poca
> ventaja** sobre el enfoque de impedancia de muñeca a tobillo.

Es decir: medir por segmentos y sumar no resulta mejor que medir el cuerpo
entero de una vez. Lo segmental aporta **distribución**, no exactitud.

## Lo que esto significa para el cuerpo 3D

El doc 09 ya tiene la regla correcta, y esta evidencia la refuerza:

> Si el reporte solo ofrece masa magra segmental, no inventar grasa segmental
> ni llamarla músculo exacto: la masa libre de grasa incluye otros
> componentes.

Se puede ser más preciso todavía. Lo que un informe da por segmento es **masa
libre de grasa**, que incluye agua, hueso, piel y órganos, no solo músculo. Y
la predicción de la parte muscular de esa masa está, según la revisión, sin
consolidar.

### Tres afirmaciones distintas que el 3D podría hacer

| Afirmación | ¿Se sostiene? |
|---|---|
| "Tu brazo izquierdo tiene 3.2 kg de masa libre de grasa" | Sí, si es lo que el aparato reportó |
| "Tu brazo izquierdo tiene 3.2 kg de músculo" | **No.** Confunde masa libre de grasa con músculo |
| "Tu brazo izquierdo tiene 1.4 kg de grasa" | **No**, salvo que el informe lo dé explícitamente |

La segunda es la que un modelo 3D coloreado invita a hacer sin querer: si se
pinta un brazo en función de un número y se pone un músculo debajo, el usuario
lee músculo.

## Requisitos de diseño para la Fase 9

Estos son requisitos, no sugerencias. Conviene fijarlos antes de escribir el
3D, porque después cuesta mucho más:

1. **Etiquetar cada valor con lo que es.** Si el dato es masa libre de grasa,
   la etiqueta dice masa libre de grasa. Nunca "músculo" a secas.
2. **No interpolar segmentos que el informe no trae.** Si solo hay cuatro
   segmentos, el quinto no se estima.
3. **No derivar grasa segmental** de masa libre de grasa segmental.
4. **El modelo es genérico.** Ya lo dice el doc 14: no es un escaneo del
   usuario. El color representa un número, no su anatomía.
5. **La alternativa tabular es obligatoria**, y no solo por accesibilidad:
   una tabla con la etiqueta correcta al lado de cada cifra es más difícil de
   malinterpretar que un cuerpo coloreado.
6. **Comparar solo bajo condiciones similares**, con el arrastre de BIA-001.

## Consecuencia sobre la prioridad del 3D

El cuerpo 3D es lo más vistoso que queda por construir y está en la última
fase. Esta revisión da un argumento para dejarlo ahí: **es la función con
mayor riesgo de comunicar falsa precisión y la que menos información nueva
aporta**, porque lo segmental no mejora la exactitud, solo muestra reparto.

No es motivo para no hacerlo. Es motivo para hacerlo con las etiquetas
correctas y sin prisa.

## Claim propuesto

> Lo que tu InBody mide por brazo o pierna es masa libre de grasa, que
> incluye agua, hueso y otros tejidos además del músculo. Separar la parte
> muscular es algo que la investigación todavía no tiene consolidado, así que
> aquí verás lo que el aparato reportó, con su nombre correcto, y no una
> estimación de músculo por segmento.

## Nivel de evidencia

**B.** Revisión que aborda directamente la pregunta, con una conclusión
explícita sobre el estado de la evidencia.

## Decisión

- [x] Incorporar como restricción de diseño
- [ ] Incorporar con advertencia
- [ ] No incorporar

## Revisor y fecha

Redactado por el agente el 2026-07-29. **Pendiente de aprobación humana.**
