# BIO-008 · Equivalencia entre divisiones con volumen igualado

**Dónde aplica:** comparador de divisiones de `spec/docs/07A`, todavía sin implementar
**Estado: sostenida** · **Grado A** · Revisado 2026-07-28

---

## Pregunta

¿Una rutina dividida produce más músculo o más fuerza que una de cuerpo
completo?

## Referencias

| Ref | Identificador | Tipo | Verificado |
|---|---|---|---|
| Ramos-Campo DJ, Benito-Peinado PJ, Caravaca LA, Rojo-Tirado MA, Rubio-Arias JÁ. Efficacy of split versus full-body resistance training on strength and muscle growth: a systematic review with meta-analysis. *J Strength Cond Res*. 2024;38(7):1330-1340. | PMID 38595233 · DOI 10.1519/JSC.0000000000004774 | Revisión sistemática con metaanálisis, PRISMA | sí |

## Población

14 estudios, 392 adultos sanos. Muestra modesta, pero es la comparación
directa que no existía antes: los autores señalan que ningún estudio previo
había comparado sistemáticamente ambas rutinas.

## Resultados

Ninguna diferencia significativa, con el volumen igualado:

| Desenlace | Diferencia de medias | IC 95 % | p | k |
|---|---|---|---|---|
| Fuerza en press de banca | 1.19 | -1.28 a 3.65 | 0.34 | 14 |
| Fuerza en tren inferior | 2.47 | -2.11 a 7.05 | 0.29 | 14 |
| Sección transversal, extensores del codo | 0.30 | -2.65 a 3.24 | 0.84 | 4 |
| Sección transversal, flexores del codo | 0.17 | -2.54 a 2.88 | 0.91 | 5 |
| Sección transversal, vasto lateral | -0.08 | -1.82 a 1.66 | 0.93 | 5 |
| Masa magra corporal | -0.07 | -1.59 a 1.44 | 0.92 | 6 |

Los autores lo cierran sin ambigüedad: la evidencia es sólida en que usar una
u otra **no afecta de forma significativa** ni a la fuerza ni a la hipertrofia
cuando el volumen está igualado, y por tanto las personas pueden elegir con
confianza según sus preferencias.

## Consecuencia para el producto, que es fuerte

**La división no es una decisión de eficacia. Es una decisión de logística y
adherencia.**

Esto valida punto por punto lo que ya dice `spec/docs/07A`:

> Por tanto, la división debe tratarse como una herramienta para distribuir
> volumen, frecuencia, fatiga, tiempo y preferencias. No como un estímulo
> independiente superior.

Y encaja con BIO-005: si la frecuencia con volumen igualado apenas mueve la
hipertrofia, es coherente que la división tampoco.

También significa que el comparador de divisiones **no debe rankear**. Si
presenta Push/Pull/Legs como "mejor" que Full Body, estaría afirmando algo que
esta revisión desmiente. Debe comparar **encaje**: días disponibles, duración
por sesión, recuperación, solapamientos y preferencias. Es el mismo principio
que ya rige el motor biomecánico, donde `rateExercise` valora por contexto y
no por ranking universal.

## Limitaciones

1. **392 participantes** repartidos en 14 estudios es una base modesta, y
   algunos desenlaces se apoyan en solo 4 o 5 estudios.
2. **"Con el volumen igualado" es la condición que lo cambia todo.** En la
   vida real las divisiones no igualan volumen: quien entrena 5 días suele
   acumular más series que quien entrena 3. La equivalencia es del diseño, no
   necesariamente del resultado práctico.
3. No informa sobre solapamientos de fatiga entre días, que `07A` sí pide
   detectar y que queda como BIO-008b, pendiente.

## Claim propuesto

> Ninguna división es mejor que otra para ganar músculo o fuerza si haces el
> mismo volumen semanal. Full Body, Upper/Lower o Push/Pull/Legs dan
> resultados equivalentes. Elige según los días que tengas, cuánto puedas durar
> por sesión y cuál te resulte más fácil de sostener.

## Nivel de evidencia

**A.** Revisión sistemática con metaanálisis siguiendo PRISMA, comparación
directa, resultados consistentes en seis desenlaces y conclusión explícita de
los autores.

## Decisión

- [x] Incorporar
- [ ] Incorporar con advertencia
- [ ] No incorporar
- [ ] Requiere revisión

**Requisito de diseño para la Fase 6:** el comparador de divisiones compara
encaje, nunca eficacia. Prohibido ordenar divisiones por calidad.

## Revisor y fecha

Redactado por el agente el 2026-07-28. **Pendiente de aprobación humana.**
