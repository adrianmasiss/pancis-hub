# Fase 4: Nutricion — el heroe del dia, y lo que el handoff no trae

**Fecha**: 2026-09-20
**Fase**: 4 de la implementacion de `desing-reference/`

## Hallazgo que cambia el alcance

El README del handoff describe Nutricion con **cuatro vistas** bajo un
segmentado: Hoy, Biblioteca, Comer fuera, Historial. El prototipo que acompana
al README **no las tiene**. Contrastado token a token contra el estado real de
`Pancis Hub v8.dc.html`:

| Declarado en el README | En el prototipo |
| --- | --- |
| `nutView` | NO EXISTE |
| `mealDone` | NO EXISTE |
| `libQ`, `libCat`, `libPick`, `libBasis`, `libGrams` | NO EXISTEN (hay `libQuery`, `libGroup`) |
| `outStep`, `outKind`, `outQ`, `outPick` | NO EXISTEN |
| `histRange` | NO EXISTE |
| `dietRange`, `subTab`, `mealOpen`, `foodQuery`, `foodPick` | presentes |

La captura `03-nutricion.png` coincide con el prototipo, no con el README: el
segmentado que se ve es **Hoy / Semana / Bloque** (el rango del heroe), no las
cuatro vistas.

Conclusion: "Comer fuera" e "Historial" existen solo como prosa. Implementarlas
seria inventar dos pantallas sin referencia visual, en una fase en la que el
color y la tipografia todavia no estan decididos. Se dejan fuera y se dice.

## Lo que si se construyo

**El heroe del dia** (`day-hero-card.tsx`), que el handoff llama la referencia
de densidad y jerarquia del resto de la aplicacion, y la unica excepcion
documentada a su sistema de tarjetas.

La logica de cada macro es la del prototipo, literal:

```js
left  = round(target - consumed)
state = left > 0 ? 'Faltan' : left < 0 ? 'De sobra' : 'Cumplido'
value = (left < 0 ? '+' : '') + abs(left) + ' g'
pct   = min(100, round(consumed / target * 100))
```

El numero grande es lo que FALTA, no lo consumido. Es la inversion que hace que
la tarjeta responda "que me queda" en vez de "que llevo".

**Cambio de jerarquia.** La respuesta del dia vivia en una tarjeta lateral de
340px; ahora abre la pantalla a ancho completo y el plan queda debajo, donde se
actua. `PlanTotalsCard` se queda sin usos: decia la misma cifra dos veces.

**Adaptado**, que era la condicion no negociable: los cuatro macros van en una
columna en telefono, dos en tablet y cuatro en escritorio. Una rejilla de dos
en 390px partia la cifra en dos lineas.

## Desviaciones deliberadas

1. **La banda de acento es un filete y un tenido al 5,5 %**, no el lavado
   completo del prototipo: DESIGN.md prohibe los degradados de interfaz y el
   color no esta decidido. Cuando lo este, aqui es donde sube.
2. **Semana y Bloque se rinden inertes** con su motivo en el `title`. No hay
   consulta que los alimente todavia, e inventar cifras en una app cuyo lema es
   "ningun numero sin fuente" no es una opcion.
3. **La fibra toma la tinta secundaria.** El prototipo la tine con el lienzo
   oscurecido, que sobre su banda crema se lee y sobre una tarjeta oscura
   desaparece.

## Estado vacio nuevo

El heroe salio de la rama "hay plantilla de dieta": habla de energia contra
objetivo, y eso existe con plan o sin el. Sin plan aparece un estado propio con
salida, en vez de repetir los totales.

## La base local perdio la dieta del demo

`diet_templates` tiene **0 filas** para el usuario demo
(`11111111-1111-4111-8111-111111111111`); las que hay pertenecen a usuarios que
crea el e2e. Por eso `/nutricion` solo puede mostrar la rama sin plan. **No se
recreo**: es la base de desarrollo del usuario, no un entorno desechable.

## Verificacion

- 390 / 834 / 1440: heroe presente, 4 macros, rejilla 1 / 2 / 4, sin desborde.
- `tsc`, `eslint` y `next build` limpios; e2e 4/4.
