# EQ-002 y EQ-003 · Pesos de compatibilidad y tolerancias

**Constantes:** `COMPATIBILITY_WEIGHTS`, `COMPATIBILITY_PENALTIES`, `MACRO_WEIGHTS`, `PENALTIES`, `COMPATIBILITY_FLOORS` en `equivalence.ts`; tolerancias de `spec/docs/01_SCOPE_AND_MVP.md`
**Estado: parámetro de producto** · **Sin grado, y así debe quedar** · Revisado 2026-07-28

---

## Estos no son claims científicos, y la propia documentación lo dice

No hay que buscarles fuente. Hay que **etiquetarlos** para que dejen de
parecer lo que no son.

`spec/docs/05_NUTRITION_SWAP_ENGINE.md`, tras enumerar los pesos:

> Son parámetros a calibrar, no conclusiones científicas.

`spec/docs/01_SCOPE_AND_MVP.md`, tras enumerar las tolerancias:

> Son parámetros del producto, no límites científicos universales.

Ambos documentos ya habían resuelto la cuestión. **El problema es que el
código no lo refleja y la interfaz tampoco.**

---

## EQ-002 · Pesos de compatibilidad

**Valor actual:** calorías 0.25 · proteína 0.35 · carbohidratos 0.15 · grasa
0.15 · fibra 0.10

### Hallazgo: el código implementa un solo perfil donde el documento pide tres

`05_NUTRITION_SWAP_ENGINE.md` define **tres perfiles contextuales** según el
papel del alimento:

| Perfil | Cal | Prot | Carb | Grasa | Fibra |
|---|---|---|---|---|---|
| Alimento proteico | 0.25 | **0.35** | 0.15 | 0.20 | 0.05 |
| Fuente de carbohidratos | 0.25 | 0.15 | **0.35** | 0.15 | 0.10 |
| Comida completa | 0.25 | 0.30 | 0.20 | 0.15 | 0.10 |

El código usa **un único perfil fijo** (0.25 / 0.35 / 0.15 / 0.15 / 0.10), que
no coincide exactamente con ninguno de los tres, aunque se parece al de
alimento proteico.

Consecuencia práctica: al sustituir arroz por pasta, el motor pondera la
proteína con 0.35 y los carbohidratos con 0.15, cuando lo que define el papel
de ese alimento en el plan es justo lo contrario.

**Curiosamente el motor ya sabe cuál es el rol del alimento**:
`anchorMacroForGroup()` lo determina para calcular la cantidad equivalente.
Está calculado y no se usa para ponderar.

### Cambio propuesto

1. **Implementar los tres perfiles** del documento, seleccionados con
   `anchorMacroForGroup()`, que ya existe.
2. **Etiquetar como parámetro de producto** en `formula_versions`, sin grado
   de evidencia.
3. **No mostrar el peso al usuario** como si fuera un dato. Sí se puede
   explicar el criterio: "al cambiar una fuente de proteína miramos sobre todo
   que la proteína cuadre".

---

## EQ-003 · Tolerancias por macro

**Valores documentados:** calorías ±5 % por comida · proteína ±10 % ·
carbohidratos ±10 % · grasas ±15 % · fibra advertencia, no bloqueo

### Hallazgo: no están implementadas

Confirmado en la auditoría: las tolerancias del doc 01 **no existen en el
código** y no son configurables por el usuario, pese a que el documento las
describe como configurables.

El motor calcula una compatibilidad de 0 a 10 pero no compara contra ningún
umbral de tolerancia. Es decir, la métrica que el North Star propone como
**métrica principal del producto** no se puede calcular hoy:

> Porcentaje de sustituciones confirmadas que mantienen el plan dentro de la
> tolerancia definida por el usuario.

Sin tolerancias no hay métrica North Star.

### Cambio propuesto

1. **Implementarlas** como campos en `profiles`, con los valores del doc 01
   como predeterminados.
2. **Etiquetarlas como preferencia del usuario**, no como límite científico.
   La redacción importa: "te avisamos si te alejas más de un 10 % de tu
   proteína" es una preferencia; "no debes exceder el 10 %" sería una
   afirmación falsa.
3. **Fibra como advertencia**, nunca bloqueo, como ya indica el documento y
   como refuerza NUT-006.

---

## Nivel de evidencia

**Sin grado, deliberadamente.** Asignar uno sería el error. Estos valores se
calibran con el uso real, no con literatura.

## Decisión

- [x] Incorporar como parámetro de producto explícitamente etiquetado
- [ ] Incorporar con advertencia
- [ ] No incorporar

## Revisor y fecha

Redactado por el agente el 2026-07-28. **Pendiente de aprobación humana.**
