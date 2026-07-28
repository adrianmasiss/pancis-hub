# EQ-004 · Grupos de alérgenos

**Constante:** `GROUP_TERMS` y `GROUP_ALIASES` en `src/features/foods/lib/allergens.ts`, escritas en la Fase 1
**Estado: corregida, con una omisión relevante** · **Grado A por naturaleza regulatoria** · Revisado 2026-07-28

> Auditoría de trabajo propio: estas listas las escribí en la Fase 1 hace unas
> horas. Revisarlas contra la fuente correcta destapa una omisión.

---

## La fuente correcta no es científica, es regulatoria

Los alérgenos alimentarios mayores no se establecen por metaanálisis: los fija
la **normativa de etiquetado**, que es lo que obliga a declararlos en un
producto. Para este claim, la jerarquía de `04_SCIENTIFIC_GOVERNANCE` se
aplica a través de su primer escalón, "guías y consensos reconocidos".

| Marco | Ámbito |
|---|---|
| Codex Alimentarius (FAO/OMS) | Referencia internacional |
| Reglamento (UE) 1169/2011, anexo II | Unión Europea, 14 sustancias |
| FALCPA y su ampliación de 2023 | Estados Unidos, 9 alérgenos mayores |
| RTCA de etiquetado | Centroamérica, aplicable a Costa Rica |

Como apoyo conceptual: *What is a food allergen?* *Clin Exp Allergy*. 2008.
PMID 18498418, verificado.

> **Limitación declarada:** los textos normativos concretos **no se han
> consultado directamente** en esta revisión. Lo que sigue se apoya en el
> conocimiento general de esas listas, que es exactamente el tipo de apoyo que
> esta fase desconfía. **Antes de cerrar el claim hay que abrir el anexo II del
> reglamento europeo y el RTCA aplicable y contrastar término por término.**

## Lo que hay hoy y lo que falta

Grupos implementados: lácteos, huevo, gluten, frutos secos, maní, soja,
mariscos, pescado. **Ocho.**

Aciertos:

- **Separar maní de frutos secos** es correcto y no trivial. Son alergias
  distintas y las normativas las listan aparte. La prueba de la Fase 1 lo
  cubre.
- **Gluten como grupo de cereales** en vez de solo "trigo".

**Omisión: el sésamo.** Es un alérgeno mayor reconocido, y en Estados Unidos
se incorporó como noveno alérgeno declarable en 2023. **No está en la lista.**
Alguien con alergia al sésamo recibiría hoy candidatos incompatibles, que es
precisamente lo que el doc 14 prohíbe:

> Son restricciones duras: nunca mostrar candidatos incompatibles.

Otras ausencias frente a la lista europea, de menor prevalencia pero
declarables: sulfitos, apio, mostaza, altramuz, y moluscos separados de
crustáceos (nuestro grupo "mariscos" los mezcla).

## Consecuencia y cómo mitigarla

El motor de sustituciones **no puede ser la última línea de defensa** frente a
una alergia. Ninguna lista de términos cubre todos los nombres comerciales, y
un producto empacado puede contener sésamo sin llevarlo en el nombre.

Esto no es una excusa para dejar la lista incompleta: es un motivo adicional
para que la interfaz diga lo que la lista puede y no puede hacer.

## Cambio propuesto

1. **Añadir sésamo** como grupo. Es la corrección con impacto real.
2. **Separar moluscos de crustáceos.**
3. **Añadir sulfitos, apio, mostaza y altramuz**, aunque su prevalencia local
   sea baja: el coste de añadirlos es un término en una lista.
4. **Contrastar contra el RTCA** aplicable en Costa Rica, que es la normativa
   que rige los productos que el usuario va a encontrar.
5. **Advertir en la interfaz** que el filtro se apoya en el nombre del alimento
   y no sustituye leer la etiqueta.
6. **Registrar la fuente normativa** de cada grupo en `formula_versions`, para
   que la lista sea auditable y actualizable cuando cambie la normativa.

## Claim propuesto

> Filtramos por el nombre del alimento según las listas de alérgenos de
> declaración obligatoria. No sustituye a leer la etiqueta: un producto
> empacado puede contener un alérgeno sin que aparezca en su nombre.

## Nivel de evidencia

**A** en cuanto la fuente es normativa y no discutible, **una vez contrastada
contra los textos**. Hasta entonces, el estado real de este claim es
"pendiente de verificación documental".

## Decisión

- [ ] Incorporar
- [x] Incorporar con advertencia
- [ ] No incorporar
- [x] Requiere revisión

**Prioridad alta pese a ser un claim del bloque EQ:** toca seguridad, y hay
una omisión concreta y corregible.

## Revisor y fecha

Redactado por el agente el 2026-07-28, auditando trabajo propio de la Fase 1.
**Pendiente de aprobación humana y de contraste documental.**
