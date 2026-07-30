# Fase 2 · Investigación fundacional

> **Para aprobar los claims, empieza por [RESUMEN_EJECUTIVO.md](RESUMEN_EJECUTIVO.md).**
> Ver también [RECONCILIACION_INFO.md](RECONCILIACION_INFO.md), que integra la
> investigación aportada en `/Info`: 16 de 16 PMIDs y 87 de 87 DOIs verificados,
> converge en seis puntos y **completa el hueco de BIO-004**.
> Trae las cuatro observaciones transversales, la hoja de aprobación de los 27
> claims agrupada por prioridad, y las tres decisiones de producto pendientes.

Fase sin código. Su entregable es un cuerpo de revisiones argumentadas que la
Fase 3 convierte en `research_sources` y `formula_versions`.

Existe porque hoy el sistema afirma cosas que no puede demostrar. Cada número
que sale en pantalla y afecta a la dieta o al entrenamiento de una persona
tiene que poder rastrearse hasta una fuente, cambiarse si la fuente no lo
sostiene, o etiquetarse como lo que es si nunca fue científico.

## Principio que gobierna la fase

> **Ningún número mágico sin fuente.** (`_old-docs-2026-07-27/00-README.md`)

## Reglas que no se negocian

1. **Cero identificadores inventados.** Cada PMID y cada DOI se verifica
   contra PubMed E-utilities o Crossref **antes** de escribirlo. Si no
   resuelve, no entra. No basta con que el título suene plausible: durante la
   verificación inicial, un PMID tanteado a ojo (`36778042`) resultó ser un
   estudio sobre neoplasia gástrica.
2. **Jerarquía de `spec/docs/04_SCIENTIFIC_GOVERNANCE.md`.** Consensos y
   revisiones sistemáticas por encima de estudios sueltos. Un EMG informa
   excitación aguda y no prueba hipertrofia, y eso queda escrito en cada claim
   que se apoye en uno.
3. **Verificación de erratas y retractaciones** en cada fuente.
4. **Sin PDFs protegidos.** Metadatos, resúmenes propios y fragmentos
   autorizados.
5. **Población declarada siempre.** Un dato de varones entrenados de 22 años
   no se presenta como universal. Importa de verdad: el producto va a generar
   planes para personas que no se parecen a esas muestras.
6. **La aprobación es humana.** La investigación se redacta aquí; validar una
   regla de alto impacto es decisión de una persona, no del agente.

## Los tres resultados posibles, y los tres son válidos

| Resultado | Qué significa |
|---|---|
| **Se sostiene** | Entra como `formula_version` con grado A-D, fuentes, población y limitaciones. |
| **No se sostiene** | Se cambia el valor y se documenta por qué el anterior estaba mal. |
| **No es científico** | Es un parámetro de producto. Se etiqueta como tal y deja de presentarse como ciencia. |

El tercero es el que más higiene aporta. El código de hoy mezcla los tres
tipos de número sin distinguirlos.

## Criterio de terminado

Ninguna constante llega a producción sin una de las tres etiquetas. Es la
puerta de entrada a la generación automática de planes (Fase 7): no se genera
una dieta entera para alguien con fórmulas que no podemos defender.

---

## Estado del registro de fuentes semilla

`spec/docs/19_SOURCE_REGISTER.md` es un documento generado, así que sus
referencias eran afirmaciones sin comprobar. **Verificadas las 21 contra
PubMed E-utilities el 2026-07-28: las 21 existen y los títulos concuerdan.**
Ninguna aparece como retractada.

Discrepancias menores de año entre el registro y PubMed (`36334240` 2022 vs
2023, `33497853` 2021 vs 2022, `41343037` 2025 vs 2026): son diferencias entre
publicación en línea y número asignado. Se usa el año de PubMed.

---

## Registro de afirmaciones

Estado: `pendiente` · `en curso` · `sostenida` · `corregida` · `parámetro de producto`

### Cálculo de objetivos nutricionales (`src/features/onboarding/lib/nutrition-targets.ts`)

| Id | Constante | Valor actual | Estado |
|---|---|---|---|
| [NUT-001](claims/NUT-001-formula-metabolismo-basal.md) | Fórmula de metabolismo basal | Mifflin-St Jeor | **sostenida** (grado A) |
| [NUT-002](claims/NUT-002-factores-actividad.md) | Factores de actividad | 1.2 / 1.375 / 1.55 / 1.725 | **corregida** (grado C) |
| [NUT-003](claims/NUT-003-proteina-por-kg.md) | Proteína | 1.8 g/kg | **sostenida con matiz** (grado A) |
| [NUT-004](claims/NUT-004-ajuste-por-objetivo.md) | Ajuste por objetivo | 0.85 / 0.95 / 1.0 / 1.1 | **corregida** (grado B) |
| [NUT-005](claims/NUT-005-piso-de-grasa.md) | Piso de grasa | 0.8 g/kg | **corregida** (grado C) |
| [NUT-006](claims/NUT-006-fibra.md) | Fibra | 14 g/1000 kcal | **sostenida** (grado B) |
| [NUT-007](claims/NUT-007-agua.md) | Agua | 35 ml/kg | **parámetro de producto** (grado D) |
| [NUT-008](claims/NUT-008-piso-de-seguridad.md) | Piso de seguridad calórico | BMR x 1.1 | **no se sostiene** (grado B) |

**Bloque de objetivos nutricionales cerrado.** Ninguna de las ocho constantes
resultó estar mal por casualidad: los valores caen casi todos dentro de rangos
defendibles. Lo que falla sistemáticamente es el **criterio**: unidades que no
son las de la literatura (NUT-005, NUT-007), multiplicadores fijos donde la
evidencia habla de tasas (NUT-004), granularidad falsa (NUT-002) y un
mecanismo de seguridad que mide lo que no debe (NUT-008).

### Prioridad de aplicación

`PROMPT_IMPLEMENTACION.md` pone seguridad por delante de todo, así que el
orden de la Fase 3 no es el numérico:

1. **NUT-008** — el piso de seguridad no protege de lo que dice proteger, y
   falla más cuanto más entrena la persona.
2. **NUT-003** y **NUT-004** — afectan al plan diario de todo el mundo.
3. **NUT-002** — falsa precisión visible en pantalla.
4. **NUT-005**, **NUT-006**, **NUT-007** — presentación y etiquetado.
5. **NUT-001** — solo trazabilidad, sin cambio de valor.

### Acceso a texto completo

Sin acceso institucional (confirmado el 2026-07-28). La vía disponible es
**Europe PMC**, que da texto completo legal de lo que esté en acceso abierto.
Comprobado por claim:

| Fuente | Acceso abierto | Estado |
|---|---|---|
| Morton 2018 (NUT-003) | **sí**, PMC5867436, CC BY-NC | **leído**, ver hallazgo abajo |
| **Errata de Morton 2018** | **sí**, PMC7513243 | **leída**: es una declaración de conflicto de interés, no una corrección numérica |
| Tagawa 2020, Helms 2014 culturismo, Refalo 2023, Grgic 2022, Singer 2024 | **sí** | abiertos, pendientes de lectura completa |
| Corrigendum de Whittaker 2021 (PMID 41139558) | no | bloquea NUT-005 |
| Whittaker & Wu 2021 (NUT-005) | no | bloqueado |
| Consenso COI sobre deficiencia energética (NUT-008) | no | **desbloqueado por otra vía**, ver abajo |
| ISSN, atleta femenina (NUT-008, y el hueco de las mujeres) | **sí**, PMC10210857, CC BY-NC | **leído** |
| ISSN, proteína y ejercicio (GEN-001) | **sí**, PMC5477153, CC BY | **leído** |
| **ACSM Position Stand 2026** (BIO-002, BIO-003, BIO-004) | **sí**, PMC12965823 | **disponible**, 116 000 caracteres |
| Revisión sobre rango de movimiento (BIO-009) | **sí**, PMC6977096 | disponible |

La autoridad certificadora del área resultó estar en acceso abierto. Es la
fuente de mayor rango de toda la jerarquía y no hacía falta pagar por ella.

**Hallazgo de leer el texto completo de Morton.** El famoso 1.62 g/kg de
proteína resulta ser un punto de quiebre **no significativo** (p = 0.079), con
intervalo de confianza de **1.03 a 2.20 g/kg** y R² de 0.19. Los propios
autores señalan en la tabla suplementaria que la regresión bifásica se
presenta pese a no ser estadísticamente significativa. La cifra que circula
por todas partes como umbral demostrado no lo es. **Solo se ve leyendo el
artículo completo**, y justifica por sí sola la insistencia de esta fase.

### Motor de equivalencias (`src/features/foods/lib/equivalence.ts`)

| Id | Constante | Valor actual | Estado |
|---|---|---|---|
| [EQ-001](claims/EQ-001-indice-de-saciedad.md) | Índice de saciedad | `proteína x 1.5 + fibra x 2` | **corregida** (B/D) |
| [EQ-002](claims/EQ-002-EQ-003-parametros-de-producto.md) | Pesos de compatibilidad | 0.25 / 0.35 / 0.15 / 0.15 / 0.10 | **parámetro de producto** |
| [EQ-003](claims/EQ-002-EQ-003-parametros-de-producto.md) | Tolerancias por macro | ±5 % / ±10 % / ±15 % | **parámetro de producto, sin implementar** |
| [EQ-004](claims/EQ-004-grupos-de-alergenos.md) | Grupos de alérgenos | ver `lib/allergens.ts` | **corregida, falta sésamo** (grado A) |

### Biomecánica y programación (`src/features/training/lib/`, `spec/docs/07A`)

| Id | Afirmación | Estado |
|---|---|---|
| [BIO-001](claims/BIO-001-regiones-musculares.md) | Clasificación por región muscular | **no implementado, con requisito de diseño** (grado B/C) |
| [BIO-002](claims/BIO-002-valores-del-catalogo.md) | Valores de estabilidad, rango y fatiga del catálogo | **no es evidencia** (sin grado) |
| [BIO-003](claims/BIO-003-proximidad-al-fallo.md) | Proximidad al fallo | **corregida** (grado B) |
| [BIO-004](claims/BIO-004-volumen-semanal.md) | Volumen semanal y rendimientos decrecientes | **sostenida parcialmente** (grado A / D) |
| [BIO-005](claims/BIO-005-frecuencia-muscular.md) | Frecuencia por músculo | **corregida** (grado A) |
| [BIO-006](claims/BIO-006-tempo.md) | Tempo y duración de la repetición | **corregida** (grado B) |
| [BIO-007](claims/BIO-007-descansos.md) | Descansos entre series | **corregida** (grado B) |
| [BIO-008](claims/BIO-008-divisiones.md) | Equivalencia entre divisiones con volumen igualado | **sostenida** (grado A) |
| [BIO-009](claims/BIO-009-rango-de-movimiento.md) | Rango de movimiento | **corregida** (grado B tren inferior, sin grado el resto) |

### Generación de planes (Fase 7, todavía sin código)

Ampliación de alcance acordada el 2026-07-28. La Fase 7 va a tomar decisiones
que hoy no se toman en ningún sitio, y si llega sin respaldo nacerá con los
mismos números mágicos que esta fase acaba de retirar.

| Id | Afirmación | Estado |
|---|---|---|
| [GEN-001](claims/GEN-001-reparto-de-macros.md) | Reparto de macros entre comidas del día | **sostenida** (grado A/B) |
| [GEN-002](claims/GEN-002-GEN-003-GEN-004-rutina-inicial.md) | Cuántos días recomendar según disponibilidad y experiencia | **sostenida** (grado A) |
| [GEN-003](claims/GEN-002-GEN-003-GEN-004-rutina-inicial.md) | Selección de ejercicios para cubrir el cuerpo de forma equilibrada | **sostenida, depende de BIO-002** (grado B) |
| [GEN-004](claims/GEN-002-GEN-003-GEN-004-rutina-inicial.md) | Progresión inicial para alguien sin historial | **sostenida** (grado B) |

### Biometría (`spec/docs/09`)

| Id | Afirmación | Estado |
|---|---|---|
| [BIA-001](claims/BIA-001-incertidumbre-de-la-bioimpedancia.md) | Incertidumbre de la bioimpedancia segmental | **sostenida** (grado B) |
| [BIA-002](claims/BIA-002-masa-magra-segmental.md) | Qué se puede afirmar de la masa magra segmental | **sostenida, limita el 3D** (grado B) |

**Avance: 27 de 32 (los 5 restantes son sub-claims abiertos).** Todo lo que el
sistema afirma hoy y todo lo que la Fase 7 va a necesitar está revisado.

### Sub-claims abiertos, surgidos durante la fase

| Id | Qué falta | Depende de |
|---|---|---|
| NUT-001b | Metabolismo basal desde masa libre de grasa cuando haya InBody | BIA-001 acota su utilidad |
| NUT-002b | Calibrar el gasto con la tendencia real de peso | módulo de seguimiento |
| NUT-004b | Evidencia específica de recomposición corporal | - |
| NUT-005b | Argumento hormonal de la grasa en mujeres | acceso a texto completo |
| BIO-006b | Tempo en series lejos del fallo | - | Bloque de objetivos nutricionales completo; bloque de
biomecánica avanzado: volumen, frecuencia, fallo, tempo, descansos y
divisiones.

### Cuarta observación transversal: válido en el grupo, poco fiable en la persona

El patrón más repetido de toda la fase, y el que más consecuencias tiene. Con
fuentes y dominios completamente independientes:

| Claim | Válido para | Poco fiable para |
|---|---|---|
| NUT-002 factores de actividad | poblaciones | un individuo |
| NUT-001 Mifflin-St Jeor | grupos | un individuo |
| BIO-004 volumen | promedios de 67 estudios | tu caso |
| BIA-001 bioimpedancia | medias de grupo (no difieren del criterio) | la persona (error de 3 a 4 puntos de grasa) |

**Pancis Hub es una app de uso personal: solo trabaja con individuos.** Esto no
invalida ninguna fórmula, pero sí obliga a una decisión de producto que atañe a
toda la interfaz: presentar rangos con incertidumbre visible en vez de cifras,
y apoyarse en la tendencia propia del usuario antes que en el valor puntual que
predice cualquier ecuación.

### Tercera observación transversal: el sistema prescribe con más precisión de la que la evidencia permite

Cinco de los seis claims de entrenamiento terminan pidiendo lo mismo:
**expresar la recomendación como rango y no como cifra exacta.**

| Constante | Lo que la evidencia dice | Lo que el sistema muestra |
|---|---|---|
| Tempo | igual entre 0.5 y 8 s por repetición | un tempo concreto |
| Descanso | sin diferencia por encima de 90 s | "210 segundos" |
| RIR | exposición estimada, ajuste modesto | "RIR 2" |
| Volumen | curva que se aplana | umbral en 22 series |
| División | ninguna es mejor | (comparador aún sin construir) |

Ninguna de esas cifras está mal. Todas comunican una exactitud que no
existe.

### Hallazgo transversal: fuerza e hipertrofia no responden igual

Aparece de forma independiente en BIO-003, BIO-004 y BIO-005, con fuentes
distintas y siempre en la misma dirección:

| Variable | Fuerza | Hipertrofia |
|---|---|---|
| Proximidad al fallo | relación insignificante | mejora al acercarse |
| Volumen | rendimientos decrecientes **muy** pronunciados | rendimientos decrecientes más suaves |
| Frecuencia | efecto identificable | compatible con efecto insignificante |

El motor de prescripción actual apenas diferencia por objetivo: prescribe
RIR 2 casi para todo y usa umbrales de volumen únicos. **Es la corrección de
fondo del bloque de entrenamiento**, y no se arregla ajustando constantes sino
separando las recomendaciones por objetivo.

### Segunda observación transversal: la muestra

La literatura de entrenamiento en la que se apoya todo esto está construida
sobre adultos jóvenes y en torno a un 80 % hombres (Pelland 2026: 2058
participantes, 79.1 % hombres, edad media 25). Ya apareció lo mismo en el
bloque de nutrición con la proteína. **El producto tiene que declararlo cuando
prescriba a alguien que no se parece a esa muestra.**

## Cómo verificar una referencia

```bash
# PubMed: existe y con qué título
curl -s "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=PMID"

# Abstract completo, para leerlo antes de citarlo
curl -s "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=text&rettype=abstract&id=PMID"

# Crossref: resolver un DOI
curl -s "https://api.crossref.org/works/DOI"
```
