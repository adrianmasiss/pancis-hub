# BIA-001 · Incertidumbre de la bioimpedancia segmental

**Dónde aplica:** `body_measurements` (`body_fat_percentage`, `skeletal_muscle_kg`, `body_water_percentage`), módulo de progreso, y el aviso de `spec/docs/09_BIOMETRICS_INBODY_3D.md`
**Estado: sostenida, y con cifras que hay que mostrar** · **Grado B** · Revisado 2026-07-29

---

## Pregunta

¿Cuánto se equivoca una medición de bioimpedancia segmental en una persona
concreta?

## Referencias

| Ref | Identificador | Tipo | Acceso |
|---|---|---|---|
| LaForgia J, Gunn S, Withers RT. Body composition: validity of segmental bioelectrical impedance analysis. *Asia Pac J Clin Nutr*. 2008. | PMID 19114394 | Estudio de validación contra modelo de cuatro compartimentos | resumen |
| Ward LC. Segmental bioelectrical impedance analysis: an update. *Curr Opin Clin Nutr Metab Care*. 2012. | PMID 22814626 | Revisión | resumen |

Ninguno en acceso abierto, pero **los resúmenes contienen las cifras
cuantitativas**, que es lo que hacía falta aquí.

## Resultados

### El patrón vuelve a aparecer: acierta en el grupo, falla en la persona

LaForgia 2008 comparó un dispositivo de bioimpedancia segmental contra un
modelo de cuatro compartimentos, que es el criterio de referencia:

| Hallazgo | Detalle |
|---|---|
| Medias de grasa corporal y masa libre de grasa | **no significativamente distintas** |
| Diferencias **intraindividuales** | **considerables** |
| Rango de error en grasa corporal | **-3.0 a +4.4 puntos porcentuales** |
| Rango de error en masa libre de grasa | **-3.3 a +1.9 kg** |
| Agua corporal total | significativamente distinta, rango -0.6 a +3.6 kg |
| Hidratación de la masa libre de grasa | 68.5 % frente a 72.0 % del criterio (p < 0.001) |

Conclusión de los autores: **exactitud individual pobre**.

Es el mismo patrón que apareció en NUT-002 con los factores de actividad y en
BIO-004 con el volumen. Un método puede ser válido para describir un grupo y
poco fiable para una persona. **Y una app de uso personal solo trabaja con
personas.**

### El sesgo tiene dirección conocida

Ward 2012: la bioimpedancia segmental **tiende a subestimar la masa libre de
grasa y a sobrestimar la masa grasa**.

No es un error aleatorio que se cancele con el tiempo. Es un sesgo con
dirección, y conviene decírselo al usuario: si tu InBody dice que tienes más
grasa de la que esperabas, parte de esa diferencia puede ser el método.

### El hallazgo más incómodo

Ward 2012, textual:

> Los algoritmos incorporados en el firmware del instrumento no deberían
> considerarse fiables.

El rendimiento mejora con ecuaciones de predicción específicas de la
población. **Un informe InBody es precisamente la salida de un algoritmo de
firmware propietario**, no de una ecuación validada para la población del
usuario.

Esto no dice que los números del InBody sean inútiles. Dice que su exactitud
absoluta merece menos confianza de la que su presentación sugiere, y que su
valor está en **la tendencia bajo condiciones similares**, que es exactamente
lo que ya sostiene el doc 09.

## Qué hace hoy el sistema y qué le falta

Lo que ya está bien:

- `body_measurements` guarda solo valores medidos o importados, sin inferir.
- Existe `source` para distinguir el origen.
- El módulo de progreso prioriza tendencias, y hay umbrales de ruido.
- El doc 09 ya advierte de que la bioimpedancia es una estimación indirecta.

Lo que falta:

1. **La advertencia no lleva números.** "Es una estimación" es mucho más débil
   que "en una persona concreta puede desviarse entre 3 y 4 puntos de grasa
   corporal". Con la cifra el usuario entiende por qué no debe reaccionar a un
   cambio de un punto.
2. **No se comunica la dirección del sesgo.**
3. **Las condiciones de medición no se exigen.** El doc 09 pide registrarlas y
   la tabla `body_measurements` no tiene campos para hidratación, ayuno, hora
   ni entrenamiento previo. Sin eso, "comparar bajo condiciones similares" no
   se puede verificar.

## Cambio propuesto

1. **Poner la cifra en la advertencia**, no solo el adjetivo.
2. **Declarar la dirección del sesgo.**
3. **Añadir campos de condiciones de medición** a `body_measurements`, y
   marcar las comparaciones entre mediciones con condiciones distintas.
4. **Calibrar los umbrales de ruido con estas cifras.** Si el error individual
   llega a 3 o 4 puntos de grasa, un umbral por debajo de eso está tratando
   como señal lo que puede ser método.
5. **Consecuencia para NUT-001b:** usar la masa libre de grasa del InBody para
   estimar el metabolismo basal heredaría un error de hasta 3.3 kg. No lo
   descarta, pero deja de ser obviamente mejor que Mifflin-St Jeor.

## Claim propuesto

> La bioimpedancia estima, no mide. En una persona concreta puede desviarse
> entre 3 y 4 puntos de porcentaje de grasa y unos 3 kg de masa magra respecto
> a los métodos de referencia, y tiende a quedarse corta en músculo y larga en
> grasa. Por eso lo que importa es la tendencia entre mediciones hechas en
> condiciones parecidas, no el número de un día.

## Nivel de evidencia

**B.** Estudio de validación contra criterio de referencia más revisión, con
cifras concordantes. No es A porque el estudio de validación es de muestra
pequeña y de un dispositivo concreto, no de todos los equipos.

## Decisión

- [x] Incorporar
- [ ] Incorporar con advertencia
- [ ] No incorporar
- [x] Requiere revisión (umbrales de ruido y campos de condiciones)

## Revisor y fecha

Redactado por el agente el 2026-07-29. **Pendiente de aprobación humana.**
