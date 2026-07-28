# EQ-001 · Índice de saciedad

**Constante:** `satietyIndex()` en `src/features/foods/lib/equivalence.ts`
**Valor actual:** `proteína x 1.5 + fibra x 2`
**Estado: corregida (el nombre es el problema)** · **Grado B en la dirección, D en los coeficientes** · Revisado 2026-07-28

---

## Pregunta

¿Se puede estimar la saciedad de un alimento combinando linealmente su
proteína y su fibra?

## Referencias

| Ref | Identificador | Tipo | Verificado |
|---|---|---|---|
| Holt SH, Miller JC, Petocz P, Farmakalidis E. A satiety index of common foods. *Eur J Clin Nutr*. 1995. | PMID 7498104 | Estudio experimental original | sí |
| Effect of short- and long-term protein consumption on appetite and appetite-regulating gastrointestinal hormones. *Physiol Behav*. 2020. | PMID 32768415 | Metaanálisis | sí |
| The effect of fiber on satiety and food intake: a systematic review. *J Am Coll Nutr*. 2013. | PMID 23885994 | Revisión sistemática | sí |

## Lo que sí está respaldado

**La dirección es correcta.** Existe evidencia de que tanto la proteína como
la fibra influyen en el apetito y la saciedad, cada una con su propia revisión
sistemática o metaanálisis. Ordenar alternativas dando más peso a esos dos
componentes no es arbitrario.

## Lo que no está respaldado, y es el problema

**El nombre.** "Índice de saciedad" no es una expresión genérica: es una medida
concreta y publicada. Holt 1995 lo construyó **midiendo experimentalmente** la
saciedad de alimentos reales tras una carga isocalórica, y comparándolos con
el pan blanco como referencia 100.

Dos consecuencias:

1. **No es una fórmula a partir de macros.** Es una medición empírica por
   alimento. Nuestra función no calcula el índice de saciedad de Holt; calcula
   otra cosa y la llama igual.
2. **La saciedad no se reduce a proteína y fibra.** El propio trabajo de Holt
   mostró que factores como la forma del alimento, la densidad energética, el
   agua y el procesado pesan mucho. El caso más citado del estudio es que las
   patatas hervidas salieron muy arriba, algo que una fórmula
   proteína-más-fibra no predeciría jamás.

**Los coeficientes 1.5 y 2 no proceden de ninguna fuente.** No hay literatura
que asigne esas ponderaciones.

## Atenuante: el código ya era honesto

El comentario dice literalmente que es "una APROXIMACION util para ordenar, no
una medida validada". Eso está bien y evita que sea un caso como BIO-002.

El problema es que la honestidad vive en un comentario que el usuario no lee,
mientras que el nombre de la función viaja hasta la interfaz.

## Cambio propuesto

1. **Renombrar.** `satietyIndex` pasa a algo que describa lo que hace, del
   tipo `saciedadAproximada` o directamente `densidadProteinaFibra`. El filtro
   de la interfaz deja de llamarse "más saciedad" y pasa a "más proteína y
   fibra", que es exactamente lo que ordena.
2. **Conservar la función y los coeficientes**, etiquetados como parámetro de
   producto calibrable. No hay motivo para cambiar 1.5 y 2 por otros números
   igual de arbitrarios.
3. **No prometer saciedad.** Si el usuario pregunta, decirle que la proteína y
   la fibra ayudan, pero que qué te llena depende también de la forma del
   alimento, el volumen y el agua.

## Claim propuesto

> Ordenamos las alternativas por proteína y fibra, que son los componentes con
> más respaldo para ayudar a que llegues con menos hambre a la siguiente
> comida. No es una medida de saciedad: eso depende también del volumen, el
> agua y lo procesado que esté el alimento.

## Nivel de evidencia

**B** para que proteína y fibra influyen en el apetito.
**D** para los coeficientes concretos, que son parámetro de producto.

## Decisión

- [ ] Incorporar
- [x] Incorporar con advertencia
- [ ] No incorporar

**Cambio de código requerido:** renombrar función y etiqueta de la interfaz.
El cálculo no cambia.

## Revisor y fecha

Redactado por el agente el 2026-07-28. **Pendiente de aprobación humana.**
