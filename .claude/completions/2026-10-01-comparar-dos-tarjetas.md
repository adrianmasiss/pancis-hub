# Comparar: dos tarjetas, una barra y un filo que gira

**Fecha**: 1 oct 2026 · **Rama**: `diseno/sistema-del-handoff`

## Qué se pidió

Una referencia visual de dos tarjetas enfrentadas, fondo difuminado, una barra
para buscar el alimento o añadirlo, esquinas redondeadas y **el borde dinámico
del botón de Copilot**, «para más dinamismo».

## El filo, compartido en vez de copiado

El degradado cónico giratorio ya estaba escrito dos veces —el anillo del botón
de Copilot y el borde de su compositor—. Una tercera copia habría sido otro
sitio donde cambiar el mismo ángulo, así que se extrajo a **`.pc-live-edge`**,
con grosor, presencia y velocidad por variable. El compositor del asistente
ahora usa esa clase; no cambió de aspecto.

**Va en `::after` y no en `::before`.** `.v11-card::before` ya es el filete
cónico de esquinas del v11: una tarjeta con las dos clases peleaba por el mismo
pseudo-elemento y el filo giratorio simplemente no aparecía — se vio en la
primera captura. En `::after` conviven: el del v11 enciende las esquinas
opuestas al pasar el puntero y éste da la vuelta entera cada 4,6 s. Comprobado
en el navegador: 57° → 131° en 900 ms.

**Y significa algo.** Sólo lo lleva la tarjeta que va a recibir lo que se
busque arriba. Es la respuesta a «¿dónde va a caer esto?», no un adorno.

## La pantalla

- **Una barra de entrada, arriba y única.** Antes cada tarjeta llevaba su
  propio buscador diminuto: la misma acción duplicada y ninguna de las dos se
  veía. La barra dice a cuál de las dos tarjetas va a parar lo que se añada, y
  si la elegida deja de admitir alimentos el destino se mueve solo — dejarlo
  apuntando a una tarjeta que no puede recibir nada haría que buscar no
  hiciera aparentemente nada.
- **Tres formas de llegar, las tres reales**: buscar en el catálogo, leer el
  código de barras con la cámara (`BarcodeScanner`, ya existía) y escribir los
  datos de la etiqueta a mano (`FoodFormDialog`, ya existía).
- **A y B con palabras, no con letras sueltas.** «Comida A» no explica qué se
  mira; «lo que ibas a comer» y «la alternativa» sí, y el orden de lectura deja
  de ser arbitrario.
- **La diferencia alineada por nutriente** —origen, alternativa y cambio en una
  misma fila— en lugar de la tabla de cuatro columnas, que en móvil se rompía.
- Naranja en la energía, turquesa en los macros, como manda DESIGN.md. El
  signo delante del cambio dice si sube o baja sin depender del color: subir no
  es malo ni bajar bueno, depende del objetivo.

## La aritmética salió del JSX

`src/features/nutrition/lib/compare.ts` (+ 9 pruebas). Estaba entre el marcado
y por eso no se podía probar sin montar media pantalla. Incluye por qué el
umbral del veredicto es **relativo**: 40 kcal arriba son ruido en un almuerzo
de 700 y una quinta parte de una merienda de 200.

## Lo que la prueba en el navegador destapó

1. **El filo no aparecía** — el choque de `::before` descrito arriba.
2. **Las dos tarjetas tenían alturas distintas**, y eso se lee como si una
   pesara más que la otra. Ahora miden lo mismo y el contenido se empaca
   arriba, así que energía y macros quedan a la misma altura.
3. **En móvil el contenido salía recortado** aunque la página no desbordaba.
   Causa: los hijos de una rejilla traen `min-width: auto`, no bajan de su
   ancho mínimo y se salen de la pista; el `overflow: hidden` del v11 cortaba
   lo que sobraba. La fila del buscador medía 335 px en una pista de 308. Se
   declara `min-width: 0` una vez para todo el comparador.
4. **«CARBOHIDRATOS» no cabía** en una casilla de teléfono: rótulos cortos, los
   mismos de las fichas de la biblioteca.
5. **El halo sumaba 21 px al ancho de desplazamiento** por un margen negativo
   lateral, para un adorno que nadie puede tocar. El desenfoque de 90 px ya lo
   extiende visualmente; `filter` no ocupa sitio en el flujo.

## Lo que NO se hizo

Se pidió «añadir por foto». Existe leer el **código de barras** con la cámara,
y está puesto. **Reconocer un plato en una fotografía no existe** en la
aplicación y sería una funcionalidad aparte (visión, y habría que ver cómo
encaja con «todo gratis, siempre»). Poner un botón que no hace nada habría sido
peor que no tenerlo.

## Archivos

- `src/app/globals.css` — `.pc-live-edge` extraída; `::before` → `::after`;
  movimiento reducido y pausa actualizados.
- `src/features/assistant/components/assistant-chat.tsx` — usa la clase común.
- `src/features/nutrition/components/compare-tool.tsx` — reescrita.
- `src/features/nutrition/components/compare.css` — nueva.
- `src/features/nutrition/lib/compare.ts` + `compare.test.ts` — nuevos.
- La hoja lateral (`meal-compare-sheet.tsx`) comparte el componente y el CSS.

## Comprobado

`tsc --noEmit` limpio · `eslint src` limpio · **571 pruebas en 51 archivos** ·
navegador a 1440 y a 390 px: sin desbordes, sin objetivos táctiles bajo 32 px,
el filo gira, y el compositor de Copilot conserva el suyo.
