# Reconciliación con la investigación de `/Info`

**Fecha:** 2026-07-30
**Fuente:** `Info/informe_completo_integrado.md` y sus dos módulos, aportados por
Adrián, elaborados por él con ayuda de IA.

---

## 1. Verificación de identificadores

Se aplicó la misma regla que a los claims propios: nada entra sin resolver
contra la fuente. Extraídos automáticamente de los tres documentos:

| | Total | Verificados | Fallidos |
|---|---|---|---|
| PMIDs | 16 | **16** | 0 |
| DOIs | 87 | **87** | 0 |

**Ni un solo identificador inventado.** Es un resultado que no se puede dar por
supuesto: `19_SOURCE_REGISTER.md` también salió limpio, pero durante esta fase
un PMID tanteado a ojo resultó ser un estudio de neoplasia gástrica. Aquí no
hay ninguno.

El documento además trae metodología explícita: preguntas de investigación,
criterios de inclusión y exclusión, evaluación de calidad por once dimensiones
(incluyendo **conflictos de interés declarados**), y un sistema de niveles A a
D equivalente al de `04_SCIENTIFIC_GOVERNANCE`.

**Conclusión: es material utilizable como fuente secundaria de trabajo.** No
sustituye la lectura de las fuentes primarias, pero orienta bien y su aparato
de citas resiste la comprobación.

---

## 2. Dónde converge con los claims ya escritos

Coincidencias independientes, que refuerzan ambos trabajos:

| Claim | Mi conclusión | La suya |
|---|---|---|
| NUT-003 proteína | rango por objetivo, no cifra fija | tabla de 7 contextos, 1.6 a 2.4 g/kg según caso |
| NUT-004 déficit | tasa de 0.5 a 1 %/semana (Helms) | idéntico, mismo origen, nivel B-C |
| BIO-005 frecuencia | herramienta de reparto, no estímulo | "la frecuencia es una herramienta de distribución del volumen" |
| BIO-004 volumen | curva con rendimientos decrecientes, sin techo | rangos por nivel, sin número universal |
| BIO-008 divisiones | elegir por encaje, no por eficacia | misma conclusión |
| Limitaciones de muestra | literatura sesgada a hombres jóvenes | "la evidencia en mujeres, adultos mayores, atletas avanzados y poblaciones latinoamericanas suele estar menos representada" |

Que dos trabajos independientes lleguen a lo mismo por caminos distintos es
la mejor señal de que las conclusiones se sostienen.

---

## 3. Lo que su investigación aporta y a los claims les faltaba

Esto es lo valioso, y es concreto.

### 3.1 BIO-004 · El reemplazo del umbral de 22 series

Mi claim decía que `HIGH_WEEKLY_SETS = 22` es un error conceptual y hay que
retirarlo, **pero no proponía con qué sustituirlo.** Su documento sí:

| Contexto | Series duras por músculo y semana |
|---|---|
| Mantenimiento | 2 a 6 |
| Principiante | 6 a 10 |
| Intermedio | 8 a 16 |
| Avanzado | 10 a 20+ |
| Déficit calórico | 6 a 14 |
| Superávit | 10 a 20+ |
| Poco tiempo | 4 a 8 |

Y un anclaje del ACSM 2026 que yo no había extraído: **mayor hipertrofia con
volumen alto, aproximadamente 10 o más series por semana**, con la salvedad
explícita de que no implica que todo músculo o persona necesite siempre esa
cifra.

**Esto cierra el hueco de BIO-004.** El sistema pasa de un umbral único a
rangos contextuales, que es exactamente lo que pedía `07A`.

### 3.2 BIO-004 · Señales accionables de volumen insuficiente o excesivo

Su documento las enumera, y son directamente implementables en el análisis de
rutina, que hoy solo compara contra un número:

- **Poco:** sin progreso en 4 a 8 semanas pese a buena técnica, comida y sueño.
- **Excesivo:** rendimiento que baja semana a semana, molestias articulares
  persistentes, agujetas que impiden entrenar, sesiones largas e
  improductivas, peor sueño o motivación.

Es mejor criterio que cualquier umbral, porque usa datos que la app ya tiene.

### 3.3 BIO-003 · La precisión del RIR del propio usuario

Mi claim recogía que en los estudios el RIR fue **estimado y no medido**. Su
documento añade el otro lado del problema, que yo no había tratado:

> Las personas suelen estimar peor el RIR cuando son principiantes o cuando
> están lejos del fallo.

Tiene consecuencia directa: prescribir "RIR 2" a un principiante es pedirle
una precisión que no tiene. Refuerza el ajuste que el código ya hace de dejar
más margen a quien empieza, y refuerza expresar el RIR como rango.

### 3.4 BIO-003 · Fallo por tipo de ejercicio

Tabla práctica que operacionaliza lo que `07A` decía en prosa: rara vez en
sentadilla y peso muerto, ocasional en press de banca con seguridad, más
viable en máquinas y aislados. **Es implementable tal cual** y encaja con la
distinción multiarticular/monoarticular que BIO-002 propone guardar.

### 3.5 NUT-003 · El caso de sobrepeso, que faltaba

Mi claim señalaba el problema de calcular sobre peso total en vez de masa
libre de grasa, pero no daba regla. La suya sí: en sobrepeso u obesidad,
**1.2 a 1.8 g/kg de peso objetivo o de masa libre de grasa**, para evitar
inflar la cifra partiendo de un peso total alto.

También añade contextos que yo no cubría: adultos mayores (1.2 a 1.6+, por
resistencia anabólica) y deporte de resistencia.

### 3.6 GEN-001 · Dosis por comida más matizada

Yo tenía 0.25 g/kg del position stand del ISSN. La suya propone **0.25 a 0.55
g/kg por comida según tamaño corporal, edad y número de comidas**, con dosis
mayores en adultos mayores. Es más aplicable a un generador real.

### 3.7 Formato de matriz de evidencia

Su matriz tiene columnas que mi plantilla no contempla y deberían adoptarse:
**población**, **excepciones** y **aplicación práctica** en la misma fila que
la recomendación y el nivel. Facilita que la interfaz muestre la limitación
junto al dato.

---

## 4. Lo que los claims aportan y su documento no tiene

No es competencia: son capas distintas. Su documento sintetiza literatura; los
claims auditan **el código contra esa literatura**.

1. **La no significación del punto de quiebre de Morton.** Su documento dice
   que los beneficios "tendieron a estabilizarse alrededor de 1.6 g/kg", que
   es la lectura habitual. El texto completo revela que ese punto tiene
   **p = 0.079, intervalo de 1.03 a 2.20 y R² de 0.19**, y que los autores lo
   presentan pese a no ser significativo. Solo aparece en la tabla
   suplementaria.
2. **El conflicto de interés de Morton 2018**, declarado en una errata de 2020:
   un coautor en el consejo asesor de un fabricante de suplementos. Su propio
   sistema de evaluación incluye "conflictos de interés declarados" como
   criterio, así que este dato le corresponde.
3. **NUT-008, el fallo de seguridad.** Su documento trata la baja
   disponibilidad energética correctamente **como criterio de derivación
   clínica**, pero no da los umbrales numéricos ni la conecta con el cálculo
   del piso calórico. Mi claim establece que el piso actual (metabolismo basal
   x 1.1) no descuenta el gasto del ejercicio y da luz verde a situaciones por
   debajo de 30 kcal/kg de masa libre de grasa. **Sigue siendo el hallazgo
   prioritario y su documento no lo cubre.**
4. **BIO-002:** que los valores biomecánicos del catálogo están generados sin
   procedencia, y que la escala 1 a 10 no existe en ninguna fuente.
5. **Las cuatro observaciones transversales**, que salen de comparar claims
   entre sí y no de la literatura.
6. **El diagnóstico de unidades:** grasa en g/kg cuando la literatura usa
   porcentaje de calorías, agua en ml/kg cuando ninguna autoridad lo expresa
   así.

---

## 5. La única tensión real, y cómo se resuelve

Su sección 5.3 concluye que entrenar al fallo **no es claramente superior**
para hipertrofia ni fuerza con el volumen controlado, citando Grgic 2022,
nivel A-B.

Mi BIO-003 concluye, con Robinson 2024, que **la fuerza no depende de la
proximidad al fallo pero la hipertrofia sí mejora al acercarse.**

**No se contradicen: responden preguntas distintas.**

- Grgic 2022 compara **al fallo contra no al fallo**, dos categorías.
- Robinson 2024 modela la **relación continua** con las repeticiones en
  reserva, que es otra pregunta.

Se puede ir al fallo sin ventaja clara frente a quedarse a una o dos
repeticiones, y a la vez que acercarse desde cinco hasta dos sí aporte. La
síntesis correcta para el producto:

> Acercarse al fallo importa para hipertrofia; llegar hasta el fallo, no
> necesariamente. Para fuerza, ninguna de las dos cosas parece decisiva.

Esa formulación es más precisa que cualquiera de las dos por separado, y es la
que debe ir al claim.

---

## 6. Efecto sobre la hoja de aprobación

No cambia ninguna decisión. **Refuerza cuatro claims y completa dos.**

| Claim | Efecto |
|---|---|
| NUT-003 | se completa con sobrepeso, adultos mayores y dosis por comida |
| NUT-004 | confirmado por fuente independiente |
| BIO-003 | se matiza con la tensión resuelta y la precisión del RIR |
| **BIO-004** | **se completa**: ya hay con qué sustituir el umbral de 22 |
| BIO-005, BIO-008 | confirmados |
| GEN-001 | dosis por comida más aplicable |

**Sigue haciendo falta lo mismo que antes:** tu firma en la hoja de aprobación
y las tres decisiones de producto. Este documento no las sustituye, porque no
son preguntas de evidencia.

---

## 7. Recomendación de tratamiento

1. **Conservar `/Info` en el repositorio**, versionado, como fuente secundaria
   de trabajo. No sustituye a `docs/investigacion/`, que audita el código.
2. **Incorporar los seis aportes de la sección 3** a sus claims.
3. **Trasladar a su autor los dos hallazgos de la sección 4** que afectan a su
   propio texto: la no significación del punto de quiebre y el conflicto de
   interés de Morton.
4. **No usar sus tablas como fuente primaria en el código.** Cuando un valor
   entre en `formula_versions`, la referencia debe ser el estudio, no este
   informe.
