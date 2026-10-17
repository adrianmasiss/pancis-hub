# Fase 4c: comparar y sustituir en tres niveles

**Fecha**: 2026-09-20
**Fase**: 4 de la implementacion de `desing-reference/`

## Lo construido

`swap-verdict.tsx` — los tres niveles del handoff dentro de la hoja de
sustitucion de cada alimento:

1. **La frase.** Proteina y energia, que son los dos ejes con los que se decide
   una sustitucion. Tres formas segun el caso: gana, sale a perdida, o deja el
   dia practicamente igual.
2. **Las cinco cifras.** kcal y los cuatro macros, con signo explicito.
3. **El efecto en el dia.** Ahora -> Despues contra el objetivo.

El detalle nutriente a nutriente queda plegado, como pide el handoff.

## La desviacion importante: el color mide TU plan, no una opinion

El prototipo fija `higherIsBetter` por macro: mas proteina bueno, menos
carbohidrato bueno, menos grasa bueno. Eso es una opinion sobre la dieta de
alguien, y este producto tiene el objetivo del dia en la base de datos.

Aqui el color dice si el cambio te **acerca o te aleja de tu objetivo**:

```
antes  = |objetivo - consumido|
despues = |objetivo - (consumido + delta)|
direccion = despues < antes ? "te acerca" : "te aleja"
```

Se ve funcionando en la captura: bajar 1,1 g de grasa sale en ambar, porque el
usuario va 0 de 60 g y bajar lo aleja. Con la regla del prototipo habria salido
en verde. Sin objetivos se cae a la regla del prototipo y se avisa de que es
una regla general y no tu plan.

## Un cambio de flujo, y el boton que lo delataba

Elegir una alternativa ya no aplica el cambio: lo **selecciona** y abre el
veredicto. Es lo que pide el handoff y lo que dice PRODUCT.md — proponer, no
ejecutar. Antes, un toque en la lista cambiaba el plan del dia sin ensenar que
pasaba con el.

Al hacerlo quedo un boton que decia "Confirmar intercambio" y ya no confirmaba.
Renombrado a **"Ver el cambio"**: un boton que promete una cosa y hace otra es
una interfaz que miente. El que confirma vive ahora en el veredicto.

## Adaptado

Cinco ejes no caben en cinco columnas a 390px: los rotulos se truncaban a
"Pro…" y "Car…", y el valor se partia en dos lineas. En telefono van en filas
con el rotulo a la izquierda y la cifra a la derecha; desde `sm` recuperan la
rejilla del handoff.

## Dos regresiones que salieron en el e2e, y como se resolvieron

1. **`getByText("Pancakes caseros")` daba dos nodos.** Causa: el resumen de
   alimentos que ahora lleva la comida plegada. El comportamiento era correcto
   y el localizador quedo ambiguo, asi que se afirmo sobre la FILA del
   alimento. No se debilito la prueba: ahora apunta a lo que de verdad
   comprueba.
2. **`getByLabel("Registrada hoy")` no encontraba nada.** Esta si era culpa del
   componente: al reescribir la tarjeta cambie el `aria-label` del indicador
   por `title` mas un `sr-only`, y el nombre accesible dejo de ser un label.
   Restaurado el `aria-label`.

## Verificacion

- Flujo ejercitado en telefono y escritorio: antes de elegir no hay veredicto;
  al elegir aparecen la frase, el efecto en el dia, el detalle plegable y
  "Aplicar el cambio".
- `tsc`, `eslint`, `next build` limpios.
- 446 pruebas unitarias en 37 archivos. E2E 4/4.
