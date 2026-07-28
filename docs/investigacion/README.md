# Fase 2 · Investigación fundacional

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

### Erratas pendientes de leer

Bloquean el cierre de sus claims:

| Claim | Errata | DOI |
|---|---|---|
| NUT-003 | Morton 2018 | 10.1136/bjsports-2017-097608corr1 (verificada, sin leer) |
| NUT-005 | Whittaker & Wu 2021 | 10.1016/j.jsbmb.2025.106880 |

### Motor de equivalencias (`src/features/foods/lib/equivalence.ts`)

| Id | Constante | Valor actual | Estado |
|---|---|---|---|
| EQ-001 | Índice de saciedad | `proteína x 1.5 + fibra x 2` | pendiente |
| EQ-002 | Pesos de compatibilidad | 0.25 / 0.35 / 0.15 / 0.15 / 0.10 | pendiente |
| EQ-003 | Tolerancias por macro | ±5 % / ±10 % / ±15 % | pendiente |
| EQ-004 | Grupos de alérgenos | ver `lib/allergens.ts` | pendiente |

### Biomecánica y programación (`src/features/training/lib/`, `spec/docs/07A`)

| Id | Afirmación | Estado |
|---|---|---|
| BIO-001 | Clasificación por región muscular | pendiente |
| BIO-002 | Valores de estabilidad, rango y fatiga del catálogo | pendiente |
| BIO-003 | Proximidad al fallo | pendiente |
| BIO-004 | Volumen semanal y rendimientos decrecientes | pendiente |
| BIO-005 | Frecuencia por músculo | pendiente |
| BIO-006 | Tempo y duración de la repetición | pendiente |
| BIO-007 | Descansos entre series | pendiente |
| BIO-008 | Equivalencia entre divisiones con volumen igualado | pendiente |
| BIO-009 | Rango de movimiento | pendiente |

### Biometría (`spec/docs/09`)

| Id | Afirmación | Estado |
|---|---|---|
| BIA-001 | Incertidumbre de la bioimpedancia segmental | pendiente |
| BIA-002 | Qué se puede afirmar de la masa magra segmental | pendiente |

**Avance: 8 de 28.** Bloque de objetivos nutricionales completo.

## Cómo verificar una referencia

```bash
# PubMed: existe y con qué título
curl -s "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=PMID"

# Abstract completo, para leerlo antes de citarlo
curl -s "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=text&rettype=abstract&id=PMID"

# Crossref: resolver un DOI
curl -s "https://api.crossref.org/works/DOI"
```
