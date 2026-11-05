# 2026-11-05 · Paletas del teléfono: naranja, rosa, lima y menta

- `src/mobile/accent.ts`: quedan cuatro acentos: naranja #FF4829, rosa #FF5FA2, lima #D4FF3A y menta #6EF5C6. Se quitaron amarillo y violeta; las cookies viejas caen en naranja. Antes se probaron vino, celeste, oro, rojo, petróleo, hielo y papaya, y se descartaron.
- `phoneAccentCss()` y `src/app/layout.tsx`: solo en teléfono (`isPhone()`), una `<style>` con `!important` pisa `--pc-primary`, `-strong`, `-fg` y `--pc-brand-*` en `<html>`, y el naranja fijo de `.login-sheet`. Así el logo, la intro del acceso, el formulario, el cargador de envío, la carga de la app y el onboarding usan el acento elegido. Escritorio no recibe la hoja.
- Verificado con capturas de rosa en oscuro y menta en claro: intro, acceso, envío, Inicio y Configuración.
- Fuera de alcance: el ícono de la pantalla de inicio y el del PWA (`public/icons/*.png`) son fijos, iOS no deja cambiarlos por usuario. Ya estaba así: en modo claro, «Pancis» del logo del acceso sale oscuro sobre la foto oscura, porque `--logo-ink` usa `--pc-fg`.

## Biblioteca de alimentos igual que la de ejercicios
- `src/mobile/screens/nutrition/library.tsx` copia la estructura de `training/library.tsx`:
  - buscador con botón «Filtrar», que abre una hoja con el grupo de alimento y «Ver alimentos»;
  - el filtro activo como chip para quitarlo;
  - Todos / Favoritos con la cuenta («N alimentos»);
  - filas `m-list-row` con `FoodThumb`, la estrella si es favorito (solo se ve, se marca en la ficha) y chevron;
  - paginación de 24 con Anterior / Siguiente.
- Se mantiene el «+» para agregar alimentos. La ficha del alimento no cambia.
- `nutrition-mobile.tsx` pasa `grupo`, `pagina`, `total` y `pageSize`. Trampa: una constante exportada desde un módulo «use client» llega al servidor como referencia, no como número, y la consulta devolvía 0 filas. Por eso el tamaño vive en el servidor y baja como prop.

## Logo con lima
- El logotipo son dos capas de la misma máscara: el acento en toda la palabra y, encima, la tinta en «Pancis». En los bordes suavizados se asomaba la capa del acento; con lima se veía un halo verde alrededor de «Pancis».
- En el teléfono, `phoneAccentCss` recorta el acento a «Hub» (`.brand-artwork-name::before` con inset 60% y el polígono equivalente en `-wordmark`).
- En el acceso y la carga el fondo siempre es oscuro, pero en modo claro «Pancis» y el lema salían casi negros (ya pasaba antes). Ahora la tinta va blanca y el lema #b0b0b0, solo en teléfono.

## Comparar alimentos, rediseño según la referencia del usuario
- `compare.tsx` reescrito:
  - Arriba: el segmentado y «de {comida}».
  - Una tarjeta con la pareja: «En tu plan» arriba (al tocarla se cambia el alimento) y «Sustituto sugerido» abajo, resaltado. Entre las dos, el botón de intercambiar; debajo, «Buscar otro sustituto…».
  - La similitud: % grande con la lectura y 20 segmentos.
  - La cantidad del sustituto: arranca a las mismas kcal; con «Igualar kcal» se vuelve a ellas. La similitud se recalcula con `compatibilityScore`.
  - Los macros en dos anillos (`MacroRing`, contra la meta del día) con la diferencia en una píldora.
  - El botón fijo «Sustituir hoy», con la nota de que el plan no cambia.
  - Se quitaron la frase de resumen y las «Otras opciones» de la pantalla. Ahora están en la hoja «Otro sustituto»: los sugeridos y la búsqueda en la biblioteca, ajustada a las mismas kcal.
- «Libre» usa la misma tarjeta, similitud y macros.
- Animaciones, filtradas con find-animation-opportunities:
  - el sustituto entra con fundido y 6 px al cambiar;
  - al intercambiar, cada fila llega desde el lugar de la otra y la flecha gira 180°;
  - los segmentos se encienden en orden (16 ms cada uno; al montar, con `@starting-style`);
  - el % cuenta hasta su valor en 450 ms;
  - los anillos transicionan;
  - las píldoras de diferencia aparecen escalonadas.
  - Con movimiento reducido: solo fundidos.
- `nutrition-mobile.tsx` pasa `targets` del día.
- El CSS viejo de `.m-compare-*` queda sin uso en esta pantalla.

## Ficha de alimento: anillo con barras y «Más detalle» plegable
- Se cierra el pendiente «Anillo o Barras»: van los dos juntos. `MacroBreakdown` muestra el anillo (104 px) y, al lado, cada macro con su valor, el % de las kcal y su barra; la fibra cuenta sobre 10 g. Se quitaron el segmentado, la preferencia en localStorage (`pc-m-macros-ficha`), `MacroBarsCard` y su CSS (`.m-macro-bars*`, `.m-seg-compact`).
- «Más detalle» es una tarjeta plegable (`.m-more`, cerrada por defecto, con `aria-expanded` e `inert`) con las mismas filas y barras:
  - saturada contra 20 g VD, sodio contra 2300 mg VD y colesterol contra 300 mg VD;
  - el azúcar contra 50 g de azúcares añadidos, sin «% VD».
  - Se abre con `grid-template-rows` y las barras crecen desde 0.
- «Vitaminas y minerales» no cambia.

## Comparar, ajustes
- Segmentado más bajo, solo en Comparar: `.m-cmp-mode .m-seg-item` mide 32 px de alto y 13 px de letra (el general `.m-seg-item` sigue en 40 px), con ancho 196 en `compare.tsx`.
- Tarjeta de cantidad más compacta (stepper de 38 px) y movida antes de la similitud.
- «Plan / Sustituto» y «A / B» van encima de su columna de anillos: el encabezado usa la misma grilla que las filas.
- Segunda pasada a pedido: «se ve pegado y pequeño».
  - El segmentado mide 36 px y 14 px de letra, con ancho 212.
  - El modo tiene margen de 14 px arriba y 10 px abajo.
  - Las secciones van a 22 px entre sí.
  - La cantidad: stepper de 44 px, relleno de 12 a 18 px y textos de 13 px.
- Segmentado «Desde mi plan / Libre»: columnas al ancho de su texto (`grid-auto-columns: max-content`) en vez de mitades de un ancho fijo de 212 px; padding 4 px y 0 16 px. El fondo activo ya no se sale ni se encima.
- Ficha de alimento: «Más detalle» ahora vive al pie de la misma tarjeta de macros (separado por una línea), plegable. Sus filas llevan punto y barra de color como los macros (saturada = color de grasas, azúcar = carbohidratos, sodio `--m-sodium`, colesterol `--m-cholesterol`, nuevos tokens claro/oscuro) y las barras se dibujan con la misma animación al abrir (la lista se vuelve a montar con `key`).
- Check de verificado (como el de las redes): `src/features/foods/lib/confirmed.ts` (`isConfirmedFood`, con tests). Lo lleva sólo un genérico de USDA (laboratorio, sin código de barras), sin `data_issue`, sin desacuerdo entre fuentes > 15 %, no corregido por el usuario y no propio. Las marcas de USDA ya no dicen «Verificado» en la ficha (son la etiqueta del fabricante; texto de la fuente corregido). `LibraryFood` gana `confirmed` y `branded`. Sello `src/mobile/ui/verified-badge.tsx` en el color del acento, en filas de la biblioteca, título de la ficha y la etiqueta de la fuente. Filtro «Verificados» (`?filtro=verificados`, `onlyConfirmed` en la consulta, misma regla en SQL y excluye los corregidos): 11 978 en local. La cuenta pasó a su propia línea. Escritorio sin tocar.
