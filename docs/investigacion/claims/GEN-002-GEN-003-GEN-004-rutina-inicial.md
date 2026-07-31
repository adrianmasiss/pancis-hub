# GEN-002, GEN-003, GEN-004 · Generar una rutina desde cero

**Dónde aplicará:** generación de `routine` completa en la Fase 7
**Estado: sostenidas, y la conclusión es liberadora** · Revisado 2026-07-29

---

## La conclusión de conjunto, antes del detalle

Los claims del bloque BIO ya respondieron casi todo, y en la misma dirección:
**para generar una rutina no hay que acertar con la estructura, porque la
estructura no es lo que decide el resultado.**

| Lo que decide | Lo que casi no decide |
|---|---|
| Volumen semanal por músculo (BIO-004) | La división elegida (BIO-008) |
| Que la persona sostenga el plan | La frecuencia, con volumen igualado (BIO-005) |
| Proximidad al fallo, en hipertrofia (BIO-003) | El tempo (BIO-006) |

Eso quita mucha presión al generador y cambia lo que tiene que optimizar: **no
la eficacia teórica, sino el encaje con la vida de la persona.**

---

## GEN-002 · Cuántos días recomendar

**Grado A**, apoyado en claims ya cerrados.

Con el volumen igualado, dividida y cuerpo completo empatan (Ramos-Campo 2024,
BIO-008), y la frecuencia por sí sola apenas mueve la hipertrofia (Pelland
2026, BIO-005). Por tanto **el número de días no es una decisión de eficacia.**

`spec/docs/07A` ya lo tenía resuelto y su orden de prioridad se sostiene:

> La recomendación debe priorizar: 1. adherencia, 2. volumen distribuible,
> 3. recuperación, 4. frecuencia práctica, 5. preferencias.

Y su regla negativa también:

> No debe asumir que entrenar más días siempre es mejor.

### Cómo debe decidir el generador

1. **Partir de los días que la persona dice tener**, no de un ideal.
2. **Comprobar que el volumen cabe** en esos días con sesiones de duración
   aceptable. Si no cabe, el problema es el volumen objetivo o la duración,
   no el número de días.
3. **Elegir la división por reparto**, nunca por calidad. Es requisito de
   BIO-008.
4. **No sugerir subir de días** salvo que la sesión se alargue tanto que la
   calidad se degrade, que es el único argumento con base para repartir.
5. **Un aviso honesto:** el ACSM 2026 señala que buena parte de la evidencia
   sintetizada proviene de personas con poca o ninguna experiencia previa. Para
   quien empieza, la literatura aplica bien.

---

## GEN-003 · Selección de ejercicios para cubrir el cuerpo

**Grado B**, con una restricción heredada.

### Lo que se puede usar

`spec/docs/07A` pide distinguir volumen directo, indirecto y fraccional, y
BIO-004 confirmó con fuente que **el método fraccional (indirecta = 0.5) es el
mejor respaldado**. Eso da al generador un criterio real: **cubrir el volumen
objetivo por músculo contando las series fraccionales**, no "un ejercicio por
grupo muscular".

`07A` también pide detectar solapamientos, y con el conteo fraccional se
detectan de forma natural: si el press militar aporta 0.5 al tríceps y luego
hay extensiones directas, el tríceps acumula más de lo que parece a simple
vista.

### La restricción heredada

**No se puede usar el catálogo biomecánico actual para elegir.** BIO-002
estableció que `stability`, `technical_demand`, `systemic_fatigue` y
`progression_ease` están generados sin procedencia, y BIO-009 que
`range_of_motion` además no puede aplicarse uniformemente.

Es decir: **GEN-003 depende de que BIO-002 se resuelva primero.** Generar una
rutina eligiendo ejercicios por puntuaciones inventadas produciría un plan que
parece razonado y no lo está.

Con el plan de BIO-002 aplicado (categorías en vez de números 1-10), el
generador tiene lo que necesita: multiarticular o monoarticular, empuje o
tracción, equipo, músculos primario y secundarios. Suficiente para equilibrar.

### Y una restricción de honestidad

Sin regiones musculares (BIO-001, sin implementar), el generador **no puede
prometer equilibrio regional**, solo por músculo. Debe decirlo así.

---

## GEN-004 · Progresión inicial sin historial

**Grado B**, y es el más simple de los cuatro.

`spec/docs/07A` describe la doble progresión con detalle suficiente:

1. mantener carga;
2. aumentar repeticiones;
3. al completar el máximo del rango con el RIR objetivo, aumentar carga;
4. volver a la parte baja del rango.

El motor **ya la implementa**: `buildProgression()` en `prescription.ts`
genera exactamente esa instrucción. No hay que inventar nada.

### Lo que sí hay que corregir, heredado de BIO-003

El RIR de partida debe diferenciar por objetivo, porque la proximidad al fallo
importa en hipertrofia y no en fuerza. Y para alguien sin historial, el ajuste
que ya hace el código (dejar más margen al fallo cuando la persona empieza) es
correcto y se conserva.

### Lo que el generador no debe hacer

**Prescribir cargas iniciales.** No hay forma de estimar el peso que alguien
sin historial puede mover, y adivinarlo es peligroso en ejercicios con barra.
El plan generado debe dejar la carga en blanco y pedirle al usuario que la
encuentre en las primeras sesiones dentro del rango de repeticiones y RIR
indicado. Eso además alimenta el historial que la progresión necesita.

---

## Claims propuestos

> **Días.** Partimos de los días que tengas. Entrenar más días no produce por
> sí solo mejores resultados: lo que cuenta es el volumen semanal y que puedas
> sostenerlo.

> **Ejercicios.** Elegimos ejercicios para cubrir tu volumen objetivo por
> músculo, contando como media serie las que trabajan un músculo de forma
> secundaria. Equilibramos por músculo, no por zonas dentro de un músculo.

> **Progresión.** Empieza con un peso que te deje terminar el rango de
> repeticiones con el margen indicado. Cuando completes el tope del rango en
> todas las series manteniendo ese margen, sube la carga y vuelve al extremo
> bajo.

## Decisión

- [x] Incorporar los tres
- [ ] Incorporar con advertencia
- [ ] No incorporar

**Dependencia dura:** GEN-003 no se puede implementar antes de que BIO-002
esté resuelto.

## Revisor y fecha

Redactado por el agente el 2026-07-29. **Pendiente de aprobación humana.**
