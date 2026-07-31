# Fase 2 · Resumen ejecutivo y hoja de aprobación

**Fecha:** 2026-07-29 · **Avance:** 27 de 32 claims
**Para:** Adrián, para aprobar o rechazar antes de que la Fase 3 toque código.

Ningún claim se aplica sin tu firma. `04_SCIENTIFIC_GOVERNANCE` exige
aprobación humana para reglas de alto impacto, y ocho de estos cambian valores
que hoy están en producción.

---

## 1. Lo que salió de la fase, en cuatro frases

1. **Casi ningún valor estaba mal. Casi todos los criterios sí.** Unidades que
   no son las de la literatura, multiplicadores fijos donde hay tasas, umbrales
   donde hay curvas, y precisión de tres decimales sobre métodos con error de
   dos dígitos.
2. **El sistema afirma con más exactitud de la que la evidencia permite.** No
   miente en el número; miente en la confianza.
3. **Hay un fallo de seguridad real:** el piso calórico no protege de lo que
   dice proteger, y falla más cuanto más entrena la persona.
4. **El catálogo biomecánico no tiene procedencia**, y la escala 1 a 10 en que
   está expresado no existe en ninguna fuente del mundo.

---

## 2. Las cuatro observaciones transversales

Aparecieron de forma independiente, en dominios distintos, con fuentes
distintas. Son más importantes que cualquier claim suelto porque cada una
implica una decisión de producto, no un ajuste de constante.

### A. Válido en el grupo, poco fiable en la persona

| Claim | Válido para | Poco fiable para |
|---|---|---|
| Factores de actividad | poblaciones | un individuo |
| Mifflin-St Jeor | grupos | un individuo |
| Volumen semanal | promedios de 67 estudios | tu caso |
| Bioimpedancia | medias de grupo | la persona (3 a 4 puntos de grasa) |

**Pancis Hub solo trabaja con individuos.**

### B. Fuerza e hipertrofia no responden igual

| Variable | Fuerza | Hipertrofia |
|---|---|---|
| Proximidad al fallo | relación insignificante | mejora al acercarse |
| Volumen | rendimientos decrecientes muy pronunciados | más suaves |
| Frecuencia | efecto identificable | compatible con insignificante |

El motor prescribe hoy casi lo mismo para ambos.

### C. Falsa precisión sistemática

| Constante | La evidencia dice | El sistema muestra |
|---|---|---|
| Tempo | igual entre 0.5 y 8 s | un tempo concreto |
| Descanso | sin diferencia pasados 90 s | "210 segundos" |
| RIR | exposición estimada | "RIR 2" |
| Volumen | curva que se aplana | umbral en 22 series |
| Actividad | rango amplio | 1.375 |

### D. La literatura está construida sobre hombres jóvenes

Pelland 2026: 79.1 % hombres, edad media 25. Morton 2018: mujeres
infrarrepresentadas. Whittaker 2021: solo varones. El ACSM 2026 avisa de que
buena parte de su evidencia viene de personas sin experiencia previa.

**Única excepción encontrada:** los umbrales de disponibilidad energética están
descritos en mujeres, y es justo donde el sistema falla más.

---

## 3. Hoja de aprobación

Marca cada uno. **Cambia valor en producción** significa que hoy hay usuarios
con ese número aplicado.

### Prioridad 1 · Seguridad

| Id | Qué se propone | Cambia valor | Aprobar |
|---|---|---|---|
| **NUT-008** | Sustituir el piso calórico por disponibilidad energética (umbrales 30 y 45 kcal/kg de masa libre de grasa). Añadir alerta visible, hoy corrige en silencio | **sí** | ☐ |
| **EQ-004** | Sésamo y demás alérgenos. **Ya aplicado** el 2026-07-29. Falta contraste normativo | ya hecho | ☐ |

### Prioridad 2 · Afectan al plan diario

| Id | Qué se propone | Cambia valor | Aprobar |
|---|---|---|---|
| **NUT-003** | Proteína: de 1.8 g/kg fijo a rango por objetivo | **sí** | ☐ |
| **NUT-004** | Déficit: de multiplicador fijo a tasa de 0.5 a 1 %/semana | **sí** | ☐ |
| **BIO-003** | RIR distinto para fuerza y para hipertrofia | **sí** | ☐ |
| **BIO-007** | Suelo de 60 s de descanso. Hoy "resistencia" prescribe 60 y 75 | **sí** | ☐ |
| **EQ-002** | Implementar los 3 perfiles de pesos del doc 05, hoy hay 1 | **sí** | ☐ |
| **EQ-003** | Implementar las tolerancias. Sin ellas no hay métrica North Star | nuevo | ☐ |

### Prioridad 3 · Presentación y etiquetado

| Id | Qué se propone | Cambia valor | Aprobar |
|---|---|---|---|
| **NUT-002** | Redondear factores de actividad, mostrar rango | **sí** | ☐ |
| **NUT-005** | Grasa como % de calorías, no g/kg. Rebajar el argumento hormonal | **sí** | ☐ |
| **NUT-006** | Fibra sale del bloque de macros: es salud a largo plazo | no | ☐ |
| **NUT-007** | Agua pasa a orientación, grado D | no | ☐ |
| **NUT-001** | Solo trazabilidad. Mifflin-St Jeor se confirma | no | ☐ |
| **BIO-004** | Retirar el umbral de 22 series, lenguaje de rendimientos decrecientes | **sí** | ☐ |
| **BIO-005** | Frecuencia como reparto, no como objetivo | no | ☐ |
| **BIO-006** | No prescribir tempo por defecto | **sí** | ☐ |
| **EQ-001** | Renombrar "índice de saciedad" | no | ☐ |
| **BIA-001** | Poner cifras en la advertencia. Recalibrar umbrales de ruido | **sí** | ☐ |

### Prioridad 4 · Restricciones de diseño para fases futuras

| Id | Qué se propone | Aprobar |
|---|---|---|
| **BIO-002** | Retirar la escala 1-10 del catálogo, sustituir por categorías con fuente | ☐ |
| **BIO-001** | `exercise_muscle_targets` debe guardar el tipo de evidencia por fila | ☐ |
| **BIO-008** | El comparador de divisiones compara encaje, nunca eficacia | ☐ |
| **BIO-009** | Afirmar sobre rango solo en tren inferior | ☐ |
| **BIA-002** | El 3D nunca etiqueta masa libre de grasa como músculo | ☐ |
| **GEN-001** | Reparto de macros: uniforme, mínimo 0.25 g/kg por comida | ☐ |
| **GEN-002/3/4** | Días por disponibilidad, ejercicios por volumen fraccional, sin cargas iniciales | ☐ |

---

## 4. Las tres decisiones que son tuyas, no de la evidencia

**No las puede resolver ninguna fuente.** Son producto.

### D1. ¿Rangos en vez de cifras?

Las observaciones A y C apuntan las dos ahí. Sería el cambio más honesto y el
más caro: toca objetivos nutricionales, prescripción, progreso y biometría.

- **Sí:** el producto deja de fingir exactitud. Coherente con el North Star.
- **No:** se conservan las cifras y se añade la incertidumbre al lado.
- **Intermedio:** rangos donde el error es grande (calorías, grasa corporal),
  cifras donde el usuario necesita un número accionable (gramos de un alimento).

### D2. ¿El umbral de volumen se retira o se queda como aviso?

La curva se aplana, no cae, así que "22 series es mucho" no lo dice la
evidencia. Pero un aviso suave puede tener valor práctico.

### D3. ¿Qué pasa con los campos de juicio del catálogo?

- **Opción recomendada:** retirar la escala 1-10 y quedarse con categorías con
  fuente. El motor funciona sin ningún juicio humano.
- **Alternativa:** conservarlos si consigues quién los firme, y pasan a grado D
  legítimo.

---

## 5. Estado de acceso, comprobado el 2026-07-29

**Abierto y leído:** ACSM Position Stand 2026 · ISSN atleta femenina · ISSN
proteína y ejercicio · Morton 2018 y **su errata** · revisión de rango de
movimiento.

**Abierto, sin leer todavía:** Tagawa 2020 (PMC7727026) · Helms 2014
culturismo (PMC4033492) · Refalo 2023 (PMC9935748) · Grgic 2022 (PMC9068575) ·
Singer 2024 (PMC11349676).

**Cerrado, y hace falta:**

| Fuente | Bloquea |
|---|---|
| Corrigendum de Whittaker 2021 (PMID 41139558) | cerrar NUT-005 |
| Helms 2014 sobre déficit (PMID 24092765) | fijar los extremos de NUT-003 |
| Consenso COI REDs 2023 | nada, resuelto por otra vía |

**Hallazgo sobre la errata de Morton:** no corrige ningún número. Es una
declaración tardía de conflicto de interés (un coautor en el consejo asesor de
un fabricante de suplementos). No invalida el trabajo, pero pesa al valorar un
metaanálisis sobre suplementación de proteína.

---

## 6. Qué desbloquea la Fase 3

Por orden:

1. **Tu firma en la sección 3.** Es el cuello de botella real.
2. **Tus tres decisiones de la sección 4.**
3. Nada más. La investigación pendiente son detalles de calibración que no
   impiden empezar por NUT-008, que es lo urgente.
