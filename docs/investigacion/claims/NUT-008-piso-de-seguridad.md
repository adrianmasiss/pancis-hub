# NUT-008 · Piso de seguridad calórico

**Constante:** `SAFETY_FLOOR_FACTOR` en `src/features/onboarding/lib/nutrition-targets.ts`
**Valor actual:** las calorías nunca bajan de metabolismo basal x 1.1
**Estado: corregida, con umbrales** · **Grado B** · Revisado 2026-07-28, ampliado 2026-07-29

> **Es el hallazgo más consecuente de este bloque.** El piso actual no protege
> de lo que dice proteger.

---

## Pregunta

¿Un suelo calórico definido sobre el metabolismo basal protege a alguien que
entrena de comer demasiado poco?

## Referencias

| Ref | Identificador | Tipo | Verificado |
|---|---|---|---|
| Mountjoy M et al. 2023 International Olympic Committee's (IOC) consensus statement on Relative Energy Deficiency in Sport (REDs). *Br J Sports Med*. 2023. | PMID 37752011 | Declaración de consenso | sí |
| Mountjoy M et al. IOC consensus statement on relative energy deficiency in sport (RED-S): 2018 update. *Br J Sports Med*. 2018. | PMID 29773536 | Declaración de consenso | sí |
| Sims ST et al. International society of sports nutrition position stand: nutritional concerns of the female athlete. *J Int Soc Sports Nutr*. 2023. | PMID 37221858 · PMC10210857, CC BY-NC | Posición oficial, **acceso abierto, leída** | sí |

Consenso de una autoridad internacional. Es el nivel más alto de la jerarquía
de `04_SCIENTIFIC_GOVERNANCE`.

## El problema

El constructo que la literatura usa para esto **no es la ingesta frente al
metabolismo basal**, sino la **disponibilidad energética**:

```
disponibilidad energética = (ingesta - gasto del ejercicio) / masa libre de grasa
```

La diferencia es decisiva porque **el gasto del ejercicio se resta**. El piso
actual lo ignora por completo.

### Ejemplo con números del propio sistema

Una mujer de 60 kg, metabolismo basal estimado 1350 kcal:

| | Cálculo | Resultado |
|---|---|---|
| Piso actual | 1350 x 1.1 | **1485 kcal** |
| Si entrena y gasta 400 kcal en la sesión | (1485 - 400) / ~45 kg de masa libre de grasa | **~24 kcal/kg** |

El piso da luz verde a una situación de disponibilidad energética baja. **El
sistema cree estar protegiendo y no protege.** Cuanto más entrena la persona,
más falla, que es exactamente al revés de lo que debería.

## Por qué importa más que una imprecisión

`spec/docs/14_SECURITY_PRIVACY_SAFETY.md` obliga a escalar ante dietas
extremas y señales de trastorno alimentario. Un piso que se calcula mal es
justo el mecanismo que debería disparar esa alerta y no la dispara.

Además el riesgo no es simétrico: afecta más a mujeres, a personas ligeras y a
quien más entrena. Es decir, precisamente al perfil de una usuaria que empieza
de cero y entrena varios días por semana.

## Cambio propuesto

1. **Sustituir el piso por disponibilidad energética** cuando haya datos para
   calcularla: gasto de la sesión y masa libre de grasa. El módulo de
   entrenamiento ya registra series y el de biometría puede aportar masa
   magra.
2. **Cuando no haya datos**, conservar un piso sobre el metabolismo basal pero
   **subirlo** y decir en pantalla que es una guarda cruda que no descuenta el
   ejercicio.
3. **Añadir una alerta explícita**, no solo un tope silencioso. Hoy el sistema
   corrige el número sin decir nada; el usuario nunca se entera de que su
   configuración era problemática.
4. **Umbrales, ya disponibles.** El consenso del COI no está en acceso
   abierto, pero el **position stand del ISSN sobre la atleta femenina**
   (PMID 37221858, PMC10210857, CC BY-NC) sí, y publica los umbrales:

| Disponibilidad energética | Qué significa, según el documento |
|---|---|
| **> 45 kcal/kg de masa libre de grasa al día** | Energía suficiente para ganancia de peso e hipertrofia |
| **≥ 45** | Umbral para asegurar función fisiológica y mantenimiento del peso en atletas femeninas |
| **30 o menos** | Umbral en el cual y por debajo del cual se observan hormonas metabólicas suprimidas y reducción de la pulsatilidad de la hormona luteinizante, **en tan poco como 5 días** en mujeres sanas |

Dos matices que el propio documento declara y hay que arrastrar:

- Los umbrales provienen de **modelos conceptuales** derivados de estudios de
  laboratorio bien controlados, y el documento dice explícitamente que **no se
  han establecido guías específicas** de disponibilidad óptima para atletas
  femeninas de competición.
- Están descritos **en mujeres**. Es la primera vez en toda esta fase que la
  literatura disponible favorece a las mujeres en lugar de excluirlas, y
  conviene aprovecharlo: es justo el perfil en que el piso actual falla más.

**El ejemplo del apartado anterior queda contrastado.** Los ~24 kcal/kg de masa
libre de grasa que resultaban de aplicar el piso actual están **por debajo del
umbral de 30**, es decir en la zona donde se describen consecuencias
hormonales en menos de una semana.

## Claim propuesto

> Tus calorías no bajan de un mínimo de seguridad. Ojo: este mínimo no
> descuenta lo que gastas entrenando, así que si entrenas mucho puedes quedarte
> corta aunque el número parezca correcto. Comer muy poco de forma sostenida
> afecta a hormonas, hueso y rendimiento.

## Nivel de evidencia

**B** para la afirmación de que el constructo correcto es la disponibilidad
energética: hay consenso internacional explícito.
**B** para los umbrales de 30 y 45 kcal/kg de masa libre de grasa: proceden de
una posición oficial que los recoge de estudios de laboratorio controlados,
pero el propio documento aclara que son modelos conceptuales y no guías
establecidas.

## Decisión

- [ ] Incorporar
- [ ] Incorporar con advertencia
- [x] No incorporar tal como está
- [ ] Requiere revisión

El piso actual **no se sostiene como mecanismo de seguridad**. Se mantiene en
el código como guarda mínima hasta que la Fase 3 lo sustituya, pero deja de
presentarse o documentarse como protección frente a la ingesta insuficiente.

**Tareas abiertas:**
1. ~~Extraer umbrales~~ **resuelto** vía el position stand del ISSN sobre la
   atleta femenina, en acceso abierto. El consenso del COI sigue tras muro de
   pago, pero ya no bloquea.
2. Decidir de dónde sale el gasto del ejercicio: estimación desde las series
   registradas o entrada del usuario.
3. Diseñar la alerta, que es cambio de interfaz y no solo de fórmula.
4. Comprobar si los umbrales descritos en mujeres son trasladables a hombres,
   o si hay que declarar la diferencia.

## Revisor y fecha

Redactado por el agente el 2026-07-28. **Pendiente de aprobación humana.**
Este claim toca seguridad: según el orden de prioridades de
`PROMPT_IMPLEMENTACION.md`, va por delante de cualquier otra corrección.
