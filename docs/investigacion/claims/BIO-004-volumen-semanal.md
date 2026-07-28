# BIO-004 · Volumen semanal y rendimientos decrecientes

**Constantes:** `SECONDARY_SET_WEIGHT = 0.5`, `LOW_WEEKLY_SETS = 6`, `HIGH_WEEKLY_SETS = 22` en `src/features/training/lib/routine-analysis.ts`
**Estado: sostenida parcialmente** · **Grado A** · Revisado 2026-07-28

---

## Pregunta

¿Cómo se relaciona el volumen semanal con la ganancia de músculo y fuerza, y
cómo debe contarse una serie que trabaja un músculo de forma indirecta?

## Referencias

| Ref | Identificador | Tipo | Verificado |
|---|---|---|---|
| Pelland JC et al. The Resistance Training Dose Response: Meta-Regressions Exploring the Effects of Weekly Volume and Frequency on Muscle Hypertrophy and Strength Gains. *Sports Med*. 2026. | PMID 41343037 · DOI 10.1007/s40279-025-02344-w | Metarregresión multinivel | sí |
| Schoenfeld BJ et al. Dose-response relationship between weekly resistance training volume and increases in muscle mass. *J Sports Sci*. 2017. | PMID 27433992 · DOI 10.1080/02640414.2016.1210197 | Metaanálisis | sí |
| Currier BS et al. ACSM Position Stand. Resistance Training Prescription. *Med Sci Sports Exerc*. 2026. | PMID 41843416 | Posición oficial | sí |

> El registro semilla no traía el DOI de Pelland. Resuelto y verificado:
> `10.1007/s40279-025-02344-w`. Conviene añadirlo a
> `spec/docs/19_SOURCE_REGISTER.md`.

## Población

Pelland 2026: 67 estudios, 2058 participantes. **79.1 % hombres, 20.9 %
mujeres.** Edad media 25.16 ± 5.22 años.

**Distancia respecto a nuestro usuario:** adultos jóvenes, con las mujeres en
una quinta parte de la muestra. Es la misma limitación que apareció en el
bloque de nutrición, y va a repetirse: **esta literatura está construida sobre
hombres jóvenes.** El producto tiene que decirlo cuando le prescriba volumen a
una mujer de 40 años.

## Resultados

**1. Más volumen produce más músculo y más fuerza, con rendimientos
decrecientes.** La probabilidad posterior de que la pendiente marginal supere
cero fue del **100 %** tanto para hipertrofia como para fuerza. Los dos
mejores modelos indican rendimientos decrecientes, y **son bastante más
pronunciados para fuerza**.

**2. La forma de contar las series indirectas es determinante.** Los autores
compararon tres métodos y **el fraccional (contar la serie indirecta como 0.5)
resultó el de mayor respaldo relativo**, y es el que usaron en los modelos
principales. Concluyen que distinguir entre series directas e indirectas
resulta esencial para predecir adaptaciones.

## Lo que el código ya tenía bien

```ts
/** Un musculo secundario recibe estimulo parcial, no equivale a una serie directa. */
const SECONDARY_SET_WEIGHT = 0.5;
```

**Es exactamente el método fraccional que Pelland identifica como el mejor
respaldado.** Estaba puesto por criterio razonable y sin fuente; ahora tiene
una. Es el segundo caso, tras Mifflin-St Jeor, en que la investigación
confirma una decisión previa en vez de corregirla.

También valida `spec/docs/07A`, que ya pedía distinguir series directas,
indirectas y fraccionales.

## Lo que no está respaldado: los umbrales 6 y 22

`LOW_WEEKLY_SETS = 6` y `HIGH_WEEKLY_SETS = 22` no salen de estas fuentes. El
problema no es que los números sean disparatados, es **conceptual**:

Una relación con rendimientos decrecientes **no tiene un techo**. La curva se
aplana, no se cae. Marcar 22 series como "demasiado" convierte una curva
continua en un umbral binario que la evidencia no describe. Y el punto donde
deja de compensar depende de la recuperación, la experiencia y el tiempo
disponible, no de una cifra universal.

`spec/docs/07A` es explícito: **"No usar un número universal de series ideal."**
El código lo incumple hoy.

## Cambio propuesto

1. **Conservar el 0.5**, ahora con fuente.
2. **Sustituir el umbral alto por lenguaje de rendimientos decrecientes.** En
   vez de "22 series es mucho", decir que a partir de cierto punto cada serie
   extra aporta menos y cuesta la misma recuperación.
3. **Conservar el umbral bajo** como aviso de volumen probablemente
   insuficiente, que es una afirmación más segura que la del techo.
4. **Diferenciar por objetivo.** Los rendimientos decrecientes son más
   pronunciados en fuerza, así que quien entrena fuerza gana menos subiendo
   volumen que quien busca hipertrofia.
5. **Declarar la composición de la muestra** cuando el sistema prescriba
   volumen.

## Claim propuesto

> Más series por semana produce más músculo y más fuerza, pero cada serie
> extra aporta menos que la anterior, y el efecto se aplana antes en fuerza que
> en hipertrofia. Las series en que un músculo trabaja de forma secundaria
> cuentan como media serie. Estos datos vienen de 67 estudios en adultos
> jóvenes, cuatro de cada cinco hombres.

## Nivel de evidencia

**A** para la relación dosis-respuesta con rendimientos decrecientes y para el
método fraccional: metarregresión reciente con muestra grande y probabilidad
posterior del 100 %.
**D** para los umbrales 6 y 22, que no proceden de estas fuentes.

## Decisión

- [x] Incorporar (relación y método fraccional)
- [ ] Incorporar con advertencia
- [ ] No incorporar
- [x] Requiere revisión (umbrales)

## Revisor y fecha

Redactado por el agente el 2026-07-28. **Pendiente de aprobación humana.**
