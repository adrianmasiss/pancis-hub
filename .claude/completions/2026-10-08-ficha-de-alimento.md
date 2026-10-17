# Ficha de alimento de la biblioteca, más clara

- Ilustraciones sin estirar: la celda del atlas (cuadrada, fondo transparente) se pinta como cuadrado centrado dentro de una caja 4:3. Antes `background-size: 600% 400%` estiraba cada celda al ancho de la caja.
- Fotos de proveedor: `object-fit: contain` + `mix-blend-mode: multiply` para que el fondo blanco se funda con el papel.
- Una sola etiqueta en la foto (categoría); «Ilustración» pasa a marca discreta.
- Cuerpo: nombre (2 líneas máx.), marca/estado, kcal «/ 100 g», macros, fuente en una línea, sello si hay cotejo.
- Acciones: «Usar en mi dieta» + botón ⓘ (ficha). Fibra sale de la tarjeta (sigue en la ficha). En móvil el botón dice «Usar»; el nombre accesible sigue completo.
- Sin foto: icono del grupo (`features/foods/lib/group-icons.ts`, compartido con las categorías).
- Nombres accesibles que usa `e2e/food-library.spec.ts` intactos. e2e no ejecutado (toca datos del demo).

## Ficha completa («Ver ficha»)

- `food-detail-card.tsx` + `.css`: ahora en `FocusCard` (tarjeta centrada, fondo difuminado), como sustituir/comparar.
- Foto grande arriba (16:9; 16:11 en móvil) con `FoodPhoto` compartido con la tarjeta (`food-photo.tsx`).
- Energía con cifra que cuenta desde cero (motion, respeta movimiento reducido) y brillo naranja.
- «De dónde vienen sus calorías»: barra apilada P/C/G con % (Atwater 4·4·9, dicho en pantalla); se dibuja de izquierda a derecha. Sólo si están los tres macros.
- «Qué hay en 100 g»: barra por nutriente (g sobre 100 g), crecen escalonadas. Colores = los de Mi plan; fibra en neutro.
- Trampa: el scroll del FocusCard es flex column; sin `flex-shrink: 0` en los hijos, la foto se aplastaba.
- Texto «Información nutricional por 100 g» conservado (lo espera el e2e).

## Gramos editables (misma sesión)

- Sin caja de energía: llama naranja grande + kcal + cápsula «en [−] 100 g [+]» (escribible, ±10 g, flechas ↑↓, 1–2000 g).
- Todo escala con los gramos y se anima desde el valor que había en pantalla (`AnimatedNumber`, motion; texto escrito en `useLayoutEffect` para no mostrar el final un fotograma antes).
- Barras = % del objetivo diario de la dieta activa (`diet.target*`, ya llegaba a la biblioteca); >100 % llena la pista y la enciende. Sin dieta: g sobre la porción. Fibra sin objetivo → línea de texto.
- «X % de tus N kcal del día» bajo el control.
- Barras: `width` con transición para los cambios + `transform` para la entrada (propiedades distintas, no se pisan).
- Foco del campo: el anillo lo pone la cápsula; se anula el outline global de Pancis en ese input.

## Contador de gramos estilo referencia (2026-10-09)

- `grams-stepper.tsx`: cápsula hundida, disco elevado (círculo 56px) con la cifra y «g», − / + de trazo fino (lucide, strokeWidth 1.4).
- Editable: el disco es el input (transparente fuera de edición; encima rueda la cifra). Enter/blur confirma, Escape cancela, ↑↓ pasos.
- Movimiento: la cifra rueda en la dirección del cambio (AnimatePresence popLayout, 200ms, ease-out 0.23,1,0.32,1); el disco se inclina 3px hacia el botón; en el tope rebota (dice «hasta aquí»). Paso al apretar (pointerdown), mantener repite acelerando (380ms, luego 110→45ms). Mientras se escribe no rueda nada.
- Pasos redondean a la decena (37 → 40 / 30).
- Lint React compiler: nada de refs en render; dirección como estado; borrador sólo durante edición (sin efecto de sincronización).

## Ajustes finales (2026-10-09)

- Contador más pequeño a petición («se ven muy grandes», «todavía más pequeño»): cápsula 42px, disco 36px (círculo con 3 dígitos, píldora con 4; el ancho sigue a `--digits` con transición), − / + 14px.
- «100g» en una línea: cifra y «g» a 14px, mismo alto de línea, centradas en el disco. En móvil el contador baja a su fila, centrado.
- kcal 28px (26 en móvil), llama 46px (40 en móvil).
- Contorno «te pasaste» (>100 %) con transición de 200ms partiendo de un contorno transparente.
- «Favoritos y ajustes»: `::details-content` + `interpolate-size` (250ms, curva drawer), chevron que gira; con movimiento reducido sólo funde. Sin soporte del navegador, abre como antes.
