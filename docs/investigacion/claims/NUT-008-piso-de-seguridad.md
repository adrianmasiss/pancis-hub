# NUT-008 · Piso de seguridad calórico

**Constante:** `SAFETY_FLOOR_FACTOR` en `src/features/onboarding/lib/nutrition-targets.ts`
**Valor actual:** las calorías nunca bajan de metabolismo basal x 1.1
**Estado: corregida** · **Grado B** · Revisado 2026-07-28

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
4. **No fijar aquí el umbral numérico.** Los valores de referencia de
   disponibilidad energética baja deben salir de la lectura del texto completo
   del consenso de 2023, que no se ha hecho. Ponerlo de memoria sería
   exactamente lo que esta fase existe para evitar.

## Claim propuesto

> Tus calorías no bajan de un mínimo de seguridad. Ojo: este mínimo no
> descuenta lo que gastas entrenando, así que si entrenas mucho puedes quedarte
> corta aunque el número parezca correcto. Comer muy poco de forma sostenida
> afecta a hormonas, hueso y rendimiento.

## Nivel de evidencia

**B** para la afirmación de que el constructo correcto es la disponibilidad
energética: hay consenso internacional explícito.
**Sin grado** para los umbrales concretos, hasta leer el texto completo.

## Decisión

- [ ] Incorporar
- [ ] Incorporar con advertencia
- [x] No incorporar tal como está
- [ ] Requiere revisión

El piso actual **no se sostiene como mecanismo de seguridad**. Se mantiene en
el código como guarda mínima hasta que la Fase 3 lo sustituya, pero deja de
presentarse o documentarse como protección frente a la ingesta insuficiente.

**Tareas abiertas:**
1. Leer el texto completo del consenso de 2023 y extraer umbrales.
2. Decidir de dónde sale el gasto del ejercicio: estimación desde las series
   registradas o entrada del usuario.
3. Diseñar la alerta, que es cambio de interfaz y no solo de fórmula.

## Revisor y fecha

Redactado por el agente el 2026-07-28. **Pendiente de aprobación humana.**
Este claim toca seguridad: según el orden de prioridades de
`PROMPT_IMPLEMENTACION.md`, va por delante de cualquier otra corrección.
