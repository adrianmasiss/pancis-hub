# Defectos conocidos

Defectos detectados y todavía no corregidos. Cada uno indica cómo se
reproduce y por qué no se arregló en el momento, para que la decisión de
posponerlo sea explícita y no un olvido.

---

## D-001 · La biomecánica del catálogo se pierde en cada `supabase db reset`

**Detectado:** 2026-07-28, escribiendo el e2e de la Fase 1.
**Gravedad:** alta. Degrada en silencio, que es lo peor que puede hacer.

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

### Mitigación aplicada en local

Se reejecutaron a mano las sentencias `update` de la migración contra la base
local para dejar la suite e2e en verde. **Es una mitigación, no el arreglo:**
el próximo `supabase db reset` vuelve a borrarlas.

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

Falta una librería tipo ZXing. En Safari la función existe en la interfaz
pero no llega a leer nada.

---

## D-004 · La Academia tiene contenido de demostración

**Detectado:** antes de esta auditoría.
**Gravedad:** media, y se convierte en alta si se presenta como evidencia.

`articles` trae un solo bloque de siembra y `article_references` tiene columna
`doi` pero no hay biblioteca científica detrás. No debe presentarse como
respaldo de nada hasta la Fase 8.
