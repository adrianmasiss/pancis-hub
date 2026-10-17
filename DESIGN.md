---
name: Pancis Hub
description: Identidad Pancis: oscuro negro/carbón con naranja y turquesa; claro beige/blanco con morado profundo. Gilded queda como respaldo.
colors:
  background-dark: "#090909"
  background-light: "#FFF3E6"
  card-dark: "#1A1A1A"
  card-light: "#FFFFFF"
  ink-dark: "#FFFFFF"
  ink-light: "#211D22"
  primary: "#F0793F"
  primary-light: "#300C2D"
  primary-foreground: "#090909"
  primary-foreground-light: "#FFFFFF"
  primary-strong: "#FFAA68"
  primary-strong-light: "#74366F"
  muted-foreground-dark: "#B0B0B0"
  muted-foreground-light: "#71666E"
  accent-dark: "#3FF4E5"
  accent-light: "#EADDE7"
  chart-dark: "#3FF4E5"
  chart-light: "#300C2D"
  border-dark: "#707070"
  border-light: "#91808B"
  brand-from: "#F0793F"
  brand-to: "#FFAA68"
typography:
  headline:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "clamp(22px, 2.7cqw, 29px)"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.028em"
  title:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    letterSpacing: "-0.01em"
  number:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "34px"
    fontWeight: 600
    lineHeight: 0.94
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "14px"
    lineHeight: 1.55
  label:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "10px"
    fontWeight: 500
    letterSpacing: "0.11em"
rounded:
  card: "24px"
  composer: "26px"
  stage: "30px"
  pill: "999px"
spacing:
  grid: "16px"
  card: "22px"
  section: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.pill}"
    padding: "0 19px"
  button-primary-hover:
    backgroundColor: "{colors.primary-strong}"
  button-secondary:
    rounded: "{rounded.pill}"
    padding: "0 19px"
  card:
    rounded: "{rounded.card}"
    padding: "{spacing.card}"
  chip:
    rounded: "{rounded.pill}"
    height: "30px"
    padding: "0 12px"
  composer:
    rounded: "{rounded.composer}"
    padding: "14px 16px"
---

# Design System: Pancis Hub

## Overview

**Creative North Star: "Pancis Hub v11 suministrado"**

La autoridad visual es el prototipo ejecutable Claude Design `Pancis Hub v11.dc.html` fijado por el usuario. Esta actualización documenta su implementación; no propone otro concepto ni sortea una dirección. La estructura del v11 se conserva; la identidad cromática vigente es la especificación del usuario del 22 de septiembre. Superficies sólidas, reflejos moderados y vidrio reservado a tarjetas destacadas o paneles flotantes.

La evidencia local está en `src/app/layout.tsx` (contrato de dirección), las reglas v11 y sus ajustes finales en `src/app/globals.css`, `src/components/shared/v11-card.tsx` y `src/components/layout/app-shell.tsx`. El paquete histórico `desing-reference/design_handoff_pancis_hub/` conserva v8 y activos; sus comentarios y reglas antiguas no sustituyen la autoridad v11. `PRODUCT.md` conserva el contexto de producto.

**Key Characteristics:**

- Pancis como identidad principal en dos modos; Gilded se conserva como respaldo seleccionable.
- Columna contenida, riel flotante y tarjetas con borde especular.
- Geist Sans en títulos, cuerpo y cifras; mono en pequeños datos y etiquetas.
- Movimiento breve con alternativa reducida y estados de datos explícitos.

## Colors

Los valores del frontmatter registran la identidad Pancis del 22 de septiembre; `src/lib/theme/palettes.ts` es la fuente de todas las variantes. El proveedor asigna variables `--pc-*`, mapeadas a roles semánticos en `globals.css`. Las paletas son Gilded, Pancis, Sunset, Ocean, Forest, Orquidea, Vanillia y Violet Dusk.

### Primary

Naranja es el acento de acción en oscuro y morado #300C2D en claro. Las gráficas usan turquesa en oscuro y morado en claro. Lavanda es un fondo suave y lleva texto principal o morado: el gris secundario no alcanza 4.5:1 sobre ese fondo. Los componentes consumen los roles activos, no los valores oscuros del frontmatter directamente.

### Neutral

Carbón construye el lienzo y el riel. Pizarra tiñe tarjetas e interiores, con tinta crema en oscuro y tinta oscura en claro. Los filetes v11 derivan de foreground al 9%; las pistas, al 8%. El fondo ambiental incorpora un halo azul y los extremos del degradado de marca.

Positivo, precaución y crítico son roles de estado, acompañados de contexto textual. Nutrición se diseña exclusivamente en oscuro: carbón mate, texto claro, naranja en energía y acciones, turquesa en macros. Esta decisión no modifica el selector global de tema.

## Typography

Geist Sans local es la voz de las superficies v11. Los roles del frontmatter corresponden a la lectura del día, encabezados de tarjeta, cifra del anillo, texto explicativo y etiquetas pequeñas. Las cifras comparables llevan números tabulares; mono se reserva para etiquetas y algunos chips de datos, no para toda cifra grande.

Karrik sigue cargada localmente en `src/app/layout.tsx` y permanece en utilidades anteriores. Su presencia no obliga a usarla en los encabezados v11. No introducir fuentes remotas ni describir Inter como dependencia pendiente de este sistema.

## Layout

La columna principal tiene un máximo de 1160px, relleno horizontal de 22px y separación vertical de 24px; en escritorio usa 64px arriba y 110px abajo. El escenario exterior y el riel flotante enmarcan el contenido. El riel mide 86px colapsado y 250px expandido; la selección de la persona controla su expansión. La barra superior aloja los controles de tema y Copilot.

Hoy usa tres columnas con tarjetas alternas de dos y una columnas, separación de 16px y cierre a todo el ancho. La última regla de contenedor, hasta 900px de **ancho del contenido**, convierte toda la rejilla en una columna y conserva el orden de lectura. No aplicar el antiguo estado intermedio de dos columnas que todavía aparece antes en la cascada.

Por debajo de 768px de viewport, el escenario tiene radio de tarjeta, el contenido usa 24px 14px 32px de relleno y el shell deja espacio al dock inferior y al área segura. Las rejillas de dominio se apilan a 760px de contenido; el historial de Nutrición, a 700px. Estas son reglas de superficies concretas, no un único breakpoint universal.

## Elevation & Depth

La tarjeta v11 combina un fondo de tarjeta al 58% sobre transparencia y una luz radial de primary al 8%, con desenfoque de 26px y saturación de 150%. Lleva filete fino, brillo interior y sombra larga. Su borde con máscara usa un degradado cónico de luz en esquinas opuestas; no es un borde uniforme ni una decoración prescindible del mundo elegido. La definición exacta vive en `globals.css` y el sidecar.

En dispositivos con hover, la tarjeta sube 3px y aumenta la presencia de borde y sombra. La entrada dura 200ms con 50ms de escalonado por posición y usa el muelle `--pc-spring`. Las preferencias de movimiento reducido eliminan desplazamientos no esenciales; transparencia reducida vuelve sólidas tarjetas y escenario; contraste aumentado refuerza filetes y elimina el borde especular.

Los controles marcados `data-glow` recortan una luz radial al borde de 1.5px; `SurfaceLighting` actualiza su centro desde el puntero una vez por frame, sin renders de React. Las esquinas opuestas de `.v11-card` pasan de 0° a 26° en 1.1s y vuelven al salir. Copilot conserva el anillo de 4.6s (velocidad equivalente a 1.8s en hover, mediante `updatePlaybackRate` para preservar la fase sin saltos); el compositor comparte el filo giratorio y el acceso flotante respira con sombra durante 3.6s. El escenario recorre su borde en 18s. Los bucles se pausan al ocultar la pestaña; movimiento reducido mantiene el acabado estático. La flecha de 13px tiene un área pulsable de 44px y vive en el borde derecho de la isla principal, entre los dos primeros destinos; gira al expandir el riel.

## Shapes

Tarjetas, compositor y escenario usan los radios del frontmatter; botones, chips y segmentos recurren a pastillas. Los componentes auxiliares existentes también usan radios menores: no imponer la antigua regla de cuatro radios sin excepciones. Las ilustraciones anatómicas conservan proporción y encuadre; no se estiran para llenar una tarjeta.

## Components

### Cards / Containers

Usar `V11Card`, `V11CardHead` y `V11Chip` desde `src/components/shared/v11-card.tsx` para compartir material, encabezado y dato auxiliar. El relleno común es 22px. La lectura principal del día tiene su propio relleno y onda inferior. Las secuencias de macros y comidas conservan filas y separadores dentro de su grupo.

### Buttons / Chips

Los botones v11 tienen altura mínima de 44px, forma de pastilla y texto semibold. La acción primaria usa primary sobre primary-foreground; al pasar el puntero usa primary-strong. La secundaria refuerza el fondo de pista. La presión escala a 0.97 y el foco visible global tiene contorno de 2px con separación de 2px. Los chips informativos miden 30px de alto; no confundirlos con objetivos táctiles de acción principal.

### Inputs / Copilot

El compositor de Copilot es una superficie oscura propia con textarea transparente y botón circular. El borde se refuerza al recibir foco. `src/features/assistant/` conecta el envío a `askAssistant`; el cajón y la ruta completa comparten la conversación. El estado pendiente deshabilita el envío; la apariencia no debe prometer ejecución de acciones que la respuesta no haya realizado.

### Navigation

El shell usa riel flotante, control de expansión, segmento de tema superior y dock móvil. Conservar texto accesible, estados actuales y enlace para saltar al contenido. Nutrición usa enlaces Hoy, Mi plan y Comparar; Tendencias es un acceso secundario. Biblioteca y Comer fuera se mantienen en el panel de herramientas. Comparar también abre una hoja lateral desde cada comida, con la selección de origen preparada.

### Nutrition / Data surfaces

`src/app/(app)/nutricion/page.tsx` separa un resumen compacto de consumo real, el plan del día y herramientas. **La sección «Registro del día» se retiró (28 sep 2026):** repetía la lista entera debajo de la del plan, así que la misma comida aparecía dos veces. Lo registrado vive ahora en la propia fila del plan («Registrada»), las comidas ajenas al plan cierran esa misma lista bajo el rótulo «Fuera del plan» y se despliegan para editarlas, «Agregar comida» es la fila de filete discontinuo que remata la lista, y el menú de acciones secundarias subió a la cabecera del panel. Mi plan muestra la plantilla habitual sin las sustituciones de una fecha. El resumen cuenta únicamente comidas completadas o completadas con cambios; las pendientes se muestran por separado. Los estilos propios viven en `nutrition-workspace.css`. El material de esta superficie es carbón mate, sin elevación al pasar el puntero. **Excepción de acento (28 sep 2026):** el filete cónico de esquinas encendidas del v11 vuelve en DOS tarjetas y solo dos — Calorías, la cifra que manda en el resumen, y Sustituto rápido, la única accionable de la columna — teñido del turquesa `--chart-1` que ya vive en la paleta. Las demás siguen mates. El turquesa aquí es señal de «mira esto», nunca un dato: la barra de calorías se queda naranja, porque naranja es energía y turquesa es macros. Extenderlo a las cuatro tarjetas del resumen daría un color por macro, que es el «código de disco» ya descartado. El punto de entrada es la primera comida pendiente según el orden del plan, con Registrar como acción principal y Comparar/Sustituir visibles. Al registrarla, la siguiente pendiente ocupa su lugar. La energía y los macros se sitúan al lado en escritorio y después en móvil. Las tarjetas recuperan la iluminación de superficie y los bordes sutiles de Hoy. Cada comida vive en una tarjeta independiente con horario, icono, calorías, macros y acciones de 44px. En escritorio amplio, la comida destacada y el resumen forman la composición principal; las demás comidas se distribuyen en dos columnas, conservando su orden. En móvil se apilan. Plan activo y herramientas forman tarjetas secundarias. El comparador alinea origen, alternativa y diferencia por nutriente. La sustitución mantiene una confirmación fija fuera del área desplazable, con alcance explícito al día o al plan. `src/features/nutrition/components/nutrition-history.tsx` ofrece ventanas de 7, 30 y 90 días desde snapshots reales de comidas completadas, en lectura: un día sin registros no equivale a cero calorías. Los estados vacíos, errores y tabla por fecha forman parte del componente.

Entrenamiento y Progreso presentan registros del usuario. Entrenamiento usa carbón mate y ordena la preparación de la sesión y sus ejercicios junto al mapa muscular. Seleccionar un ejercicio filtra el resaltado; iniciar conserva el día seleccionado. Un único bloque muestra las series registradas por músculo de los últimos siete días. El modelo local `public/anatomy/muscle-body.glb` sustituye el maniquí procedural: 210.000 triángulos, unos 5,5 MB, carga diferida y render bajo demanda. Autor DB3D2534, CC BY 4.0; atribución en la interfaz y en `public/anatomy/ATTRIBUTION.md`. Sus regiones son orientativas, no segmentación anatómica exacta. La lista textual permanece disponible si falla WebGL o la descarga. `src/components/shared/body-regions.tsx` permite alternar `/anatomy/front.png` y `/anatomy/back.png`; son ilustraciones de referencia, no mapas calculados de recuperación. Los datos regionales provienen del plan o de medidas registradas y muestran ausencia cuando corresponda.

**Límite de implementación:** Hoy aún mezcla datos consultados y cifras de maqueta; algunas tarjetas y valores de reserva no están conectados. Nutrición ya consulta comidas, objetivos y sustituciones reales. Registrar guarda snapshots mediante la operación transaccional existente; sustituir en Hoy cambia solo la fecha y sustituir desde Mi plan modifica la plantilla habitual. El comparador no ejecuta sustituciones por sí solo. Este documento captura la forma construida, no certifica persistencia de esos controles, cobertura completa del prototipo ni datos clínicos calculados.

## Do's and Don'ts

### Do:

- **Do** conservar la autoridad del v11 suministrado y comprobar la cascada final antes de reutilizar reglas antiguas.
- **Do** reutilizar roles de tema, material de tarjeta y estados accesibles existentes.
- **Do** mantener el material oscuro de Nutrición también en las hojas de comparar y sustituir.
- **Do** distinguir ausencia de registros, datos reales y contenido de maqueta.
- **Do** respetar las preferencias de movimiento, transparencia y contraste.

### Don't:

- **Don't** prohibir vidrio o degradados que forman parte explícita del v11.
- **Don't** convertir Karrik o mono en la fuente dominante de las superficies v11.
- **Don't** inventar puntuaciones regionales de recuperación ni presentar la anatomía como medición.
- **Don't** describir switches locales o métricas de ejemplo como datos persistidos del usuario.
- **Don't** sustituir la dirección elegida por otra estética o por reglas genéricas de diseño.

El card principal de Hoy añade luz radial al cursor en una capa independiente de sus esquinas. En el riel colapsado, el logotipo completo se disuelve durante los primeros 120px de scroll y deja el isotipo visible; al volver arriba se recupera. El riel expandido conserva la marca completa y muestra los nombres de Cambios del plan y Configuración.

## Login — referencia de movimiento del 22 de septiembre

Para `/login`, la referencia vigente es `v14044g50000d9h0h97og65vrguv66tg.MP4` proporcionada por el usuario (SOLE). `LoginStage` reemplaza en esta ruta la antigua entrada de hoja curva: isotipo PH con giro y flotación inicial, nombre que se revela, barra fina de introducción y hoja clara que sube bajo la cabecera. La secuencia dura aproximadamente 3.3s, se puede omitir y termina inmediatamente al enfocar el formulario. Movimiento reducido muestra directamente el estado final. La barra es decorativa, sin porcentaje ficticio ni vínculo con la autenticación.

Identidad: fondo marino `#08151d`, isotipo oficial, acento rojo/naranja, formulario claro y tipografía del proyecto. En móvil la hoja ocupa el ancho disponible; en escritorio se limita a 460px. Se conserva la lógica de acceso por correo, recuperación y creación de cuenta. Registro comparte `LoginStage` con el acceso: misma tarjeta, selector, campos, botón y orden de elementos. Recuperación mantiene su superficie existente.

La cabecera de acceso y registro conserva el orden vertical: isotipo, Pancis Hub, Nutrición · Entrenamiento · Recuperación. El aviso educativo se centra bajo ambos formularios, con ancho máximo de 520px y líneas balanceadas.

## Implementación de la identidad vigente

`palettes.ts` centraliza fondo, superficie, tinta, acción, acento, gráfica y estado. Los tokens se emiten en el HTML del servidor y se actualizan al cambiar tema. La clave de preferencia `pancis-palette-v2` adopta Pancis por defecto sin borrar las antiguas selecciones; Gilded permanece como respaldo explícito y persistente en Apariencia.

Los logos se colorean mediante máscaras alfa de `public/logo-dark.png` y `public/icons/icon-192.png`: geometría y letras originales; se omite el eslogan rasterizado a tamaños pequeños. El nombre del login también usa la tipografía del archivo original, con el eslogan legible separado.

El péndulo de Newton conserva cuatro bolas, 1.2s y giros ±70°. Los extremos usan acción y el centro el color de gráfica. Dentro de botones hereda la tinta del control. Reemplaza la barra introductoria y los spinners de espera; los esqueletos conservan la geometría mientras llegan los datos. Se detiene fuera de pantalla, en pestañas ocultas y con movimiento reducido.

Verificación de contraste: texto normal >=4.5:1 y controles/foco/gráficas >=3:1 para los pares usados; se validan también extremos del degradado y estados semánticos.

## Riel vigente — dos cápsulas separadas

La captura confirmada por el usuario restaura el isotipo arriba, la cápsula central con Asistente, Hoy, Nutrición, Entrenamiento, Progreso y Evidencia, y otra cápsula inferior para Cambios del plan, Configuración y cuenta. La flecha vive entre los dos primeros destinos del menú principal. No hay panel continuo, segunda columna ni submenús. Arranca contraído; al expandir muestra los nombres en ambas cápsulas. `pancis-rail-capsules` conserva la nueva preferencia de apertura, independiente del panel descartado. Los colores siguen los tokens Pancis oscuro/claro.

### Home: distribución de cinco tarjetas

La referencia de distribución del usuario manda únicamente sobre la jerarquía: título «Hoy» y fecha arriba; Copilot y Actividad de la semana con Adherencia integrada en dos columnas iguales; Macros del día, Ingesta y Sueño en tres columnas iguales debajo. Se conservan materiales, colores y efectos existentes. Con contenedores de hasta 900 px, las cinco tarjetas siguen ese orden en una columna.

En escritorio (desde 1024 px), Home ocupa el ancho de su panel exterior, con 16 px de margen interno lateral e inferior y 24 px arriba. En móvil y tablet se conservan los márgenes existentes. Adherencia usa dos filas de 14 días cuando su tarjeta tiene al menos 480 px de contenido; en tarjetas estrechas conserva cuatro filas de siete.

### Formularios de acceso: referencia mate

Login y registro comparten tarjeta negra opaca, campos carbón, etiquetas visibles y tipografía sans sobria. Sin bisel de vidrio ni selector superior duplicado; los enlaces inferiores permiten cambiar de formulario. Naranja reservado para acción principal, enlaces y foco. El fondo y los logos existentes se conservan. Los márgenes compactos de escritorio (24 px arriba y 16 px laterales/inferiores) aplican ahora a todas las pantallas del shell; móvil mantiene su espaciado.

El modelo anatómico comparte acabado mineral cálido entre Entrenamiento y Progreso. Conserva normales originales y vértices de la cara; incorpora oclusión ambiental precalculada y microtextura procedural mate. Los resaltados usan un contorno pectoral y perfiles inclinados para extremidades, compartidos por el shader y la selección. Siguen siendo aproximaciones visuales; no segmentación anatómica exacta. Preparación reproducible: `node scripts/prepare-anatomy.mjs /ruta/muscle_body.glb`.
