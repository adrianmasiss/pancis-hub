# BIO-001 · Clasificación por región muscular

**Dónde aplica:** `primary_muscle` y `secondary_muscles` en `exercise_catalog`; requisito RF-010 y `spec/docs/07_TRAINING_BIOMECHANICS_ENGINE.md`
**Estado: no implementado, y la evidencia obliga a implementarlo con cautela** · **Grado B/C según la afirmación** · Revisado 2026-07-28

---

## Pregunta

¿Se puede enfatizar una región concreta de un músculo eligiendo ejercicios, y
con qué seguridad puede afirmarlo el sistema?

## Referencias

| Ref | Identificador | Tipo | Verificado |
|---|---|---|---|
| Does Muscle Length Influence Regional Hypertrophy? A Systematic Review and Meta-Analysis. *Int J Sports Med*. 2025. | PMID 40570881 · DOI 10.1055/a-2615-4935 | Revisión sistemática con metaanálisis | sí |
| The role of exercise selection in regional Muscle Hypertrophy: A randomized controlled trial. *J Sports Sci*. 2021. | PMID 34743671 · DOI 10.1080/02640414.2021.1929736 | Ensayo controlado aleatorizado | sí |
| Effects of range of motion on muscle development during resistance training interventions: A systematic review. *SAGE Open Med*. 2020. | PMID 32030125 | Revisión sistemática | sí |
| Non-uniform excitation of the pectoralis major muscle during flat and inclined bench press exercises. *Scand J Med Sci Sports*. 2022. | PMID 34644424 · DOI 10.1111/sms.14082 | Estudio de electromiografía | sí |

## Estado actual del sistema

`exercise_catalog` guarda `primary_muscle` y `secondary_muscles` como texto
libre, con valores del tipo `pecho`, `espalda`, `hombros`, `cuadriceps`. **No
existe modelo de regiones.** RF-010 y el doc 07 piden porción clavicular y
esternocostal del pectoral, y nada de eso está.

Además el doc 07 prohíbe expresamente el término "pecho medio" sin definición,
y el catálogo usa hoy `pecho` a secas.

## La distinción que hay que respetar al construirlo

Las cuatro fuentes **no aportan el mismo peso**, y meterlas en el mismo saco
sería exactamente lo que `04_SCIENTIFIC_GOVERNANCE` prohíbe:

| Fuente | Qué puede sostener | Qué NO puede sostener |
|---|---|---|
| Revisión sistemática sobre longitud muscular (40570881) | Que la longitud a la que se entrena influye en la hipertrofia regional | Un mapa ejercicio a región |
| Ensayo controlado sobre selección de ejercicios (34743671) | Que la selección de ejercicios produce diferencias regionales medibles | Generalizar a todos los músculos |
| Revisión sobre rango de movimiento (32030125) | Efectos del rango sobre el desarrollo muscular | Afirmaciones regionales finas |
| Electromiografía del pectoral (34644424) | Que la **excitación** del pectoral no es uniforme entre banca plana e inclinada | **Que eso produzca hipertrofia regional** |

La última fila es la regla explícita del proyecto:

> Un estudio EMG puede informar excitación muscular aguda, pero no prueba por
> sí solo hipertrofia regional longitudinal.

**Esa distinción tiene que estar en el modelo de datos, no solo en la
documentación.** Si `exercise_muscle_targets` guarda una relación
ejercicio-región sin decir de qué tipo de evidencia viene, el sistema acabará
presentando un hallazgo de electromiografía con la misma cara que un ensayo
longitudinal.

## Requisito de diseño que se deriva

Cuando se implemente `exercise_muscle_targets` (Fase 6), cada fila necesita:

- región anatómica con nombre definido, nunca coloquial;
- **tipo de evidencia** que la sostiene, con la escala del doc 07:
  longitudinal regional, longitudinal general, biomecánica, electromiografía,
  inferencia anatómica, experiencia;
- grado A-D;
- referencia concreta.

Y la interfaz debe **decir de qué tipo es** cuando muestre una diferencia
regional. "Enfatiza la porción clavicular" y "muestra mayor excitación de la
porción clavicular en un estudio agudo" no son la misma afirmación.

## Alcance realista

Las fuentes disponibles cubren bien el **pectoral**, y de forma desigual el
resto. Construir un mapa regional completo de los 15 ejercicios con este
material no es posible.

**Recomendación:** empezar por los músculos donde hay evidencia (pectoral, y
revisar qué hay de cuádriceps e isquiotibiales), y dejar el resto sin
regiones antes que rellenarlo por simetría. Un catálogo con regiones en tres
músculos y sin regiones en el resto es honesto; uno con regiones en los quince
sería BIO-002 otra vez.

## Claim propuesto

> Elegir unos ejercicios u otros puede cambiar en qué parte de un músculo se
> nota más el crecimiento, sobre todo por la longitud a la que trabajas.
> Cuando lo que hay detrás es solo un estudio de activación eléctrica, se te
> dice: eso mide qué se enciende durante la serie, no qué crece con los meses.

## Nivel de evidencia

**B** para que la selección de ejercicios y la longitud muscular influyen en
la hipertrofia regional.
**C o D** para el mapa concreto de cada ejercicio a cada región, según de qué
tipo de estudio venga.

## Decisión

- [ ] Incorporar
- [x] Incorporar con advertencia
- [ ] No incorporar
- [x] Requiere revisión

**Depende de BIO-002:** no tiene sentido añadir regiones a un catálogo cuyos
demás campos biomecánicos están sin procedencia.

## Revisor y fecha

Redactado por el agente el 2026-07-28. **Pendiente de aprobación humana.**
