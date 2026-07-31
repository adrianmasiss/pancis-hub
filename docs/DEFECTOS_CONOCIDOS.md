# Defectos conocidos

Defectos detectados y todavía no corregidos. Cada uno indica cómo se
reproduce y por qué no se arregló en el momento, para que la decisión de
posponerlo sea explícita y no un olvido.

---

## D-001 · La biomecánica del catálogo se pierde en cada `supabase db reset`

**Detectado:** 2026-07-28, escribiendo el e2e de la Fase 1.
**Gravedad:** alta. Degradaba en silencio, que es lo peor que puede hacer.
**RESUELTO el 2026-07-30.** Ver "Solución aplicada" al final.

### Qué pasa

`supabase/migrations/20260723000002_exercise_biomechanics.sql` puebla las
columnas biomecánicas (`joints`, `resistance_profile`, `stability`,
`range_of_motion`, `technical_demand`, `systemic_fatigue`, `common_errors`,
`technique_cues`, ...) con sentencias `update ... where id = '...'`.

Pero las filas de `exercise_catalog` las crea `supabase/seed.sql`, y el seed
corre **después** de todas las migraciones. En una base recién reseteada la
migración actualiza cero filas, y después el seed inserta los ejercicios sin
ningún dato biomecánico.

Solo funcionó en la base original, donde las filas ya existían de un seed
anterior.

### Cómo reproducirlo

```
supabase db reset
docker exec supabase_db_pancis-hub psql -U postgres -d postgres \
  -Atc "select count(*) filter (where array_length(joints,1)>0), count(*) from public.exercise_catalog;"
```

Devuelve `0|15`. Debería devolver `15|15`.

### Por qué importa más de lo que parece

`rateExercise()` usa `DEFAULT_SCORE = 5` cuando el catálogo no trae el dato.
Así que el motor **no falla ni avisa**: sigue devolviendo valoraciones, todas
mediocres y todas iguales, con sus razones redactadas como si tuviera datos.
Es exactamente la falsa precisión que el producto se compromete a no tener.

También afecta a `07_TRAINING_BIOMECHANICS_ENGINE.md` y bloquea de hecho la
comparación de ejercicios, que es una de las cuatro funciones del MVP.

### Situación en producción

**Sin verificar.** `supabase db push` no ejecuta `seed.sql`, así que en
producción el catálogo pudo poblarse por otra vía y estar bien, o no existir.
Hay que comprobarlo antes de dar por bueno el motor biomecánico desplegado.

### Arreglo propuesto

Mover los datos biomecánicos a `seed.sql`, dentro del mismo `insert` que crea
los ejercicios, y dejar la migración solo con el `alter table`. Los datos de
catálogo semilla pertenecen al seed; la migración solo debería definir la
forma.

No se arregló en la Fase 1 por disciplina de alcance: esa fase era la
excepción diaria de entrenamiento y las alergias duras. Entra como primera
tarea de la fase que toque el catálogo de ejercicios (Fase 6, regiones
musculares), o antes si se confirma que producción también está afectada.

### Solución aplicada (2026-07-30)

Las sentencias `update` se replicaron en `supabase/seed.sql`, justo después
del `insert` que crea los ejercicios. Así el seed deja la base correcta por sí
mismo.

**La migración se conserva intacta**, porque es la que arregló las bases que
ya existían, incluida producción. A partir de ahora `seed.sql` es el sitio
donde se editan estos valores.

**Verificado con un `supabase db reset` real:**

```
antes:   0 de 15 ejercicios con biomecánica
después: 15 de 15
```

Y la suite completa de 18 pruebas e2e pasa sobre una base reseteada desde
cero, cosa que antes era imposible.

**Nota relacionada:** las imágenes de ejercicios también desaparecen en un
reset, pero eso no es un defecto: es un paso de puesta a punto documentado
(`npm run import:exercise-images`), que descarga de una fuente externa y no
puede vivir en el seed.

**Lo que este arreglo NO resuelve:** los valores siguen sin procedencia. Ver
`docs/investigacion/claims/BIO-002-valores-del-catalogo.md`. Ahora son
reproducibles, que no es lo mismo que ser correctos.

---

## D-002 · `nutrition-targets.ts` fija constantes sin fuente

**Detectado:** 2026-07-27, en la auditoría.
**Gravedad:** alta, pero ya planificada.

`PROTEIN_G_PER_KG = 1.8`, `MIN_FAT_G_PER_KG = 0.8`,
`FIBER_G_PER_1000_KCAL = 14`, `WATER_ML_PER_KG = 35` y los factores de
actividad viven como constantes en el código, sin `research_sources` detrás.
Contradice el principio "ningún número mágico sin fuente".

Además, `calculateInitialTargets` solo se invoca en el onboarding: los
objetivos no se recalculan al cambiar peso u objetivo.

**Arreglo:** Fases 2 y 3 del plan (ver `AUDITORIA_2026-07-27.md`, R2.3).

---

## D-003 · El escáner de código de barras no funciona en Safari ni iPhone

**Detectado:** antes de esta auditoría.
**Gravedad:** media.
**RESUELTO el 2026-07-31.**

### Qué pasaba

El escáner usaba `BarcodeDetector`, la API nativa del navegador. Safari e iOS
no la implementan, así que el botón abría la cámara y no leía nunca nada.

### Solución aplicada

Se añadió `barcode-detector@3.2.1` (MIT), que **no es una librería paralela
sino un polyfill de la misma API** sobre ZXing compilado a WebAssembly. Por eso
el resto del componente no cambió: sea nativo o polyfill, se usa igual.

Decisiones de implementación:

- **Carga bajo demanda.** El `import()` dinámico ocurre al abrir el escáner, no
  al montar el componente. En Chrome y Android, que traen la API nativa, no se
  descarga nada. Verificado en el build: el polyfill queda en chunks de 24 a
  44 KB separados del bundle principal.
- **La entrada manual del código no se tocó.** No es redundante: si el polyfill
  no carga por falta de red o WebAssembly bloqueado, es lo único que queda.
- **`supportsCamera` pasó a `useSyncExternalStore`** para que el servidor
  devuelva `false` sin provocar desajuste de hidratación.

### Pendiente

**Verificación en un iPhone real.** Ni las pruebas unitarias ni Playwright con
Chromium pueden comprobar esto: hace falta abrir el escáner en Safari con un
producto delante.

---

## D-004 · La Academia tiene contenido de demostración

**Detectado:** antes de esta auditoría.
**Gravedad:** media, y se convierte en alta si se presenta como evidencia.

`articles` trae un solo bloque de siembra y `article_references` tiene columna
`doi` pero no hay biblioteca científica detrás. No debe presentarse como
respaldo de nada hasta la Fase 8.

### Decisión (2026-07-31)

**Se pospone a propósito hasta que las fuentes estén listas y confirmadas.**
Decisión del usuario, y es la correcta: llenar la Academia antes de tener el
modelo de datos de evidencia detrás produciría exactamente el problema que la
Fase 2 acaba de desmontar, contenido que parece respaldado y no lo está.

**Exposición actual: baja.** La Academia está suspendida de la navegación
desde el repliegue a cuatro pantallas, así que hoy no la ve nadie salvo quien
escriba la URL a mano.

Se retoma en la Fase 8, junto con `evidence_documents` y `evidence_claims`.
