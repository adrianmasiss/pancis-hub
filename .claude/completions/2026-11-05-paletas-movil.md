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

## Comer fuera según la referencia (nov 2026)

- Migración `20261105000000_comer_fuera_menu.sql` (aplicada SOLO en local): `restaurants.category`, `restaurant_items.section`, tabla `restaurant_item_options` (diferencias por porción, RLS lectura para autenticados, inserción propia) y política de update de la categoría. **Antes de desplegar: `supabase db push`.** Tipos regenerados.
- Lógica pura en `src/features/restaurants/lib/menu.ts` (+ tests): categorías, secciones, `dishMacros`, `fitOf` (cabe / justo >80 % / te pasas), `bestForToday` (más proteína que quepa), `dishFacts` (umbrales FDA por porción), `initials`.
- Directorio (`eat-out.tsx`): buscador, copiloto, chips por tipo, filas con avatar de iniciales, «¿No está tu restaurante?» → hoja con nombre + tipo, «Agregar y buscar menú» (IA).
- Menú (`restaurant-menu.tsx`, `?vista=fuera&r=`): encabezado con «Te quedan», buscar en el menú, «Mejor opción para hoy», chips por sección, grupos con Cabe/Justo/Te pasas, agregar plato (con sección) y buscar con IA.
- Ficha del plato (`dish-detail.tsx`, `&plato=`): sello de si cabe, aporta, kcal con contador y macros contra la meta, Personaliza (interruptores), Porción ½/1/2, Cómo lo registro (extra / en lugar de una comida del plan), proyección del día, «Después te quedarían» con dos tramos, consejo, tabla plegable y CTA fija.
- `logRestaurantItem` acepta opciones y `insteadOfTemplateMealId`; el reemplazo queda como «Cambiada hoy» en Hoy, con el nombre de lo comido (`plan-meal.tsx`). `logMeal` acepta `sourceTemplateMealId`. La IA ahora devuelve sección, opciones con cifras publicadas y categoría.
- `useCountUp` pasó a `src/mobile/ui/use-count-up.ts` (lo usan Comparar y la ficha del plato).
- Datos de prueba SOLO en local: 4 restaurantes (Subway con 8 platos y 3 opciones), nota «Prueba local (datos de ejemplo)».
- Omitido de la referencia: carrusel de fotos (no hay fotos de platos), corazón/compartir, botón «Comparar».

## Comer fuera: logos reales y check de verificado (nov 2026)

- `restaurants.logo_url` (en la misma migración 20261105000000, aún solo local): archivo de Wikimedia Commons; un check solo acepta `commons.wikimedia.org/wiki/Special:FilePath/…`.
- `lib/logo.ts`: Wikidata (P154) por nombre, filtra por descripción de comida, elige el logo vigente sin eslogan ni de un solo país; `commonsThumb` arma la miniatura PNG directa por md5 (evita 3 redirecciones). Se busca al crear el restaurante y al investigarlo con IA.
- Avatar: logo sobre blanco con padding en px (el % se mide contra el contenedor y lo hacía gigante); si no carga, iniciales.
- Check: `status = 'verificado'` (ya existía; RLS solo deja ponerlo a un admin). Se ve en filas del menú, mejor opción, ficha del plato, «N verificados» en el directorio y chip «Verificados» en el menú. Hoy ningún plato lo tiene.

## Tabla nutricional del plato (nov 2026)

- «Ver tabla nutricional» pasó a «Tabla nutricional» plegada al pie de la tarjeta de macros, con el mismo marcado que «Más detalle» de alimentos (`.m-more`, `.m-macro-legend`, barras que se redibujan al abrir), contra el VD de la FDA.
- Nuevas columnas `restaurant_items.sat_fat_g`, `sugar_g`, `sodium_mg` (misma migración, solo local); la IA las pide al investigar. Lo que no publica el restaurante no se lista y se dice en la nota.

## Progreso rediseñado + menú «+» en tarjetas (2026-11-06)

- Referencia del usuario: Resumen / Escaneos / Fotos. Resumen = `BodyCard` (maniquí `tone="acento"` con rótulos y líneas guía, Composición/Medidas, «Girar 360°»), `RangeCards` (Bajo/Normal/Alto con el rango del propio informe; visceral 1–9 por defecto), `Trends` (pestañas Peso/Grasa/Músculo, rango anclado a la ÚLTIMA medición, lista con sparklines por color de métrica), constancia + récord, `ScanHistory`.
- Escaneos: `ScansList` desplegable con todas las cifras y edición; `?m=` abre una.
- `Fab` ahora es speed-dial (tarjetas apiladas, fondo oscurecido, «×» con aro del acento) en todas las pantallas. Progreso: Medición manual / Importar InBody (IA, 1 petición de Gemini por lectura, se revisa antes de guardar) / Foto. Se quitaron los botones viejos (`m-legacy-cta`) de Resumen y Fotos.
- Lógica en `src/features/progress/lib/trends-view.ts` (tests). CSS al final de `mobile.css` (sección «Progreso (nov 2026)»).

### Ronda 2 de Progreso (2026-11-06)
- La pagina quedaba 14 px mas ancha (la marca de los rangos se salia): `overflow: clip` en `.m-prog-range`. Verificado `scrollWidth - innerWidth = 0`.
- Maniqui quieto (`pointer-events: none` en el canvas, sin girar ni acercar). Con segmentos del InBody: rotulos por brazo/pierna/tronco con magra y evaluacion. Sin ellos: maniqui a la izquierda y cifras principales a la derecha. Se elige la ultima medicion con segmentos, si no con composicion (`medicionDelCuerpo`).
- «Más del escaneo» (`scan-detail.tsx`): el resto en dos columnas, tabla por segmento y fotos de esa medicion con «Agregar foto» ya ligada.
- Fuera constancia y récord (y sus consultas). Tarjetas de rango solo si el informe trae rango.
- Fotos ligadas: importar InBody acepta frente/lado/espalda (se suben colgadas del escaneo, `saveInbodyReading` devuelve `id`); el «+» → foto elige la ultima medicion por defecto; Fotos muestra peso/grasa/musculo de cada foto comparada. Tabla de Fotos sin verificar en pantalla: la demo no tiene fotos.

### Paleta neón + desplegable (2026-11-06)
- Resumen: maniquí → las 4 tarjetas de rango (siempre) → «Más del escaneo» plegado → tendencia → historial.
- Paleta neón del usuario (modo oscuro): acentos lima/burgundy/gold/cyan/merlot en `accent.ts` (fill, onFill, chip, zonas, degradado; `inkLight` propio para claro). Cookies viejas: naranja/rosa→burgundy, menta→cyan (`resolveMobileAccent`); por defecto lima.
- Base oscura #070708 / tarjetas #0F0F11 / héroe #0C0C0E / borde #1C1C1F; chips «va bien» en acento y «va mal» ámbar (coral en gold); series `--m-serie-*` (gold y cyan cambian grasa/músculo vía `.m-app[data-accent]`).
- Neón: resplandor arriba (`.m-app::before`), brillo y viñeta en la tarjeta del maniquí, degradado en «+» y píldora de la barra, «+» respira (2,8 s; sin movimiento reducido).
- (nov 6, después del push) Quitada la lista «Mediciones · rango» bajo la tendencia: al usuario no le aportaba. El gráfico queda con Peso/Grasa/Músculo.

## Tu cuerpo en dos vistas (2026-11-06)
- Elegida la opción A del lienzo (https://claude.ai/artifact/MRzaC1pEDaHbt6T4Bkefnc) con la vista 2 de la C.
- `body.tsx`: un solo maniquí quieto; segmentado «Resumen | Segmentos» (solo si hay segmentos).
  Resumen = Peso/Grasa/Músculo con cambio. Segmentos = barras derecha/izquierda desde el centro
  (escala 85 % de la extremidad mayor, «iguales» bajo 0,1 kg, ámbar si «Bajo») + tronco; tocar un
  lado lo señala en el maniquí (punto, línea, rótulo) y apaga los demás. Sin segmentos: nota.
- `MuscleModel` nuevo prop `lado` (-1 = derecha de la persona, a la izquierda de la pantalla).
- «Ver todo el escaneo» abre y baja a «Más del escaneo» (estado levantado a `summary.tsx`).
- Se quitaron la vista al lado (`.m-prog-side*`) y la ficha del puntaje (ahora «· 78 pts» en el eyebrow).
- Verificado: oscuro/claro, con y sin segmentos (borrados y restaurados en local, 5 filas), overflow 0, 711 tests.

## Sin tarjetas de rango y «Más del escaneo» en bandejas (2026-11-06)
- Quitadas las 4 tarjetas de rango del Resumen (`ranges.tsx` borrado y todo `.m-prog-range*` del CSS).
- `scan-detail.tsx`: `ScanDetail` = bandejas por tema (Principal/Composición/Metabolismo/Medidas),
  «Por segmento» (pares der/izq juntos, grasa en gris) y «Fotos de ese día». Se usa en «Más del
  escaneo» y en cada escaneo de la pestaña Escaneos. `filasDe` ahora separa valor y unidad.
- Bandeja: rótulo pequeño encima, vidrio apenas más claro con filo de luz, filas de 42 px con
  pelo `--tray-line`; entran subiendo 8 px escalonadas 40 ms al abrir. Chevron en círculo.
