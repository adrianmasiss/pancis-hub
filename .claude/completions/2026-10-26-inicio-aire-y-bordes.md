# Inicio móvil: aire, barra de estado y barra inferior (2026-10-26)

- `layout.tsx`: `statusBarStyle: "black-translucent"`. Con "default" iOS
  reservaba la franja de la barra de estado en la app instalada y la pintaba
  negra (el «corte» sobre el brillo de Inicio). Ahora la app dibuja hasta
  arriba y cada pantalla se aparta con `--m-top`. Lo que no es `.m-app`
  (acceso, onboarding, pantallas sin porte) baja con `body { padding-top:
  env(safe-area-inset-top) }` en `movil.css`. Ojo: la hora/batería quedan en
  blanco siempre, también en modo claro.
- `mobile.css`: nuevo `--m-dock` (= inset inferior − 12px, mínimo 10px) para
  la barra de pestañas; todo lo que flota encima (mini barra de sesión,
  compositor del Copiloto, CTA de Comparar, relleno de `.m-screen`) se mide
  desde él.
- Inicio: cabecera en `--m-top + 6px`, brillo que sube bajo la barra de
  estado, tarjetas de entreno/nutrición con 22/20px de relleno y 18px entre
  filas, separación entre tarjetas 16px, «Empezar» de 48 → 38px.

## Ronda 3 (2026-10-27): tarjetas minimalistas desde una referencia del usuario

- Entreno: eyebrow apagado + «Ver rutina ↗», título 28px partido de
  «Nombre (Énfasis)» y subtítulo «énfasis · N ejercicios · ~M min»; semana
  en fichas propias (`HomeWeek`, ya no `WeekStrip`; la leyenda sólo aparece
  al tocar un día); píldora clara «Empezar entreno» con disco en acento.
- Nutrición: título + flecha en círculo, comido en firme / meta apagada,
  «Siguiente comida · hora» con chip invertido de kcal.
- Agua/Peso: misma forma; Peso pierde la línea de tendencia y gana
  «Registrar» (enlaza a /progreso, donde vive el diálogo de medidas).
- `ESTADO` de week.tsx exportado. CSS nuevo al final de la sección
  «Inicio, ronda 3»; borradas las reglas muertas (mini, spark).
- Tarjeta de entreno invertida: blanca en oscuro, negra en claro, redefiniendo
  los tokens `--m-*` dentro de `.m-card.m-home-train` (sin brillo).
- Cambio: Nutrición es la invertida (blanca en oscuro, negra en claro, con
  macros en los tonos del fondo) y Entreno va en acento sólido con texto en
  tinta, hoy en negro y píldora negra. En tarjetas oscuras de Inicio el peso
  baja un paso (texto claro sobre oscuro se ve más grueso).
- Acento «Naranja» móvil: #F0793F → #FF4829 (tinta en claro #C42A12, 5,6:1
  sobre blanco; #111113 sobre el relleno 5,6:1). Escritorio sin cambios.
- Ronda 4: Entreno oscuro en ambos temas con acento solo en detalles;
  Nutrición siempre clara; anillo 116px; chip de kcal en acento; Copiloto
  en una fila (icono, texto ≤3 líneas, chevron) y en acento, sin el morado.
- Chip de kcal: sólo contorno en acento (cifra en tinta oscura sobre blanco).
- Modo claro: Entreno en acento sólido con tinta #111113 en peso 500/400;
  en oscuro sigue oscura con detalles en acento.
- PRUEBA pendiente: selector temporal «Actual · C · N · D · G» bajo la tarjeta de
  entreno (ambos temas, localStorage `m-prueba-entreno`). Al elegir:
  dejar la ganadora como regla normal y borrar `.m-home-prueba`,
  `useVarianteEntreno`, `VARIANTES` y los `[data-variante]`.
- Barra: tinta de la píldora centrada (sin el -1px del icono, etiqueta line-height 1, padding-top 2px; medido por píxeles 8,25 vs 9 pt).
- PRUEBA: selector «Borde · Relleno» del chip de kcal (localStorage `m-prueba-kcal`, `data-kcal` en la tarjeta). Hook genérico `usePrueba`.
- Agua/Peso: gotas y línea de cambio con el mismo alto (22px) y 6px extra; los dos botones quedan a 14px de lo de encima.
- Pildora del entreno y fila de siguiente comida: +8px de aire arriba.
- PRUEBA: selector de variantes de Nutrición (Actual · C · N · D · G), solo modo claro (`m-prueba-nutri`, `data-solo-claro`).
- DECIDIDO (oct 27): Entreno «Actual» (claro: acento sólido con tinta fina;
  oscuro: oscura con detalles en acento), Nutrición blanca en los dos temas,
  chip de kcal con relleno. Selectores de prueba y variantes borrados.
- Botones de Agua y Peso con tinte: celeste (agua) y acento (peso), texto en su tono.
- CORRECCIÓN: Entreno es la tarjeta oscura del modo oscuro también en claro (el usuario no quería el naranja en claro).
- Háptica en iPhone: `src/lib/haptics.ts` cae a un `<input type=checkbox switch>`
  invisible (toque del sistema, iOS 18+) cuando no hay `navigator.vibrate`.
- Acento Violeta → #420D4B. accent.ts ahora emite `--m-on-accent` (texto
  sobre el relleno), `--m-accent-line-dark/-light`; mobile.css usa
  `--m-accent-line` para bordes, trazos, textos, tintes y brillos, y
  `--m-accent` sólo para rellenos. Violeta: relleno #420D4B con texto
  #F4F4F1, línea en oscuro #CF8FDC. En los demás acentos línea = relleno.

## Rutinas y botón «+» (oct 27)

- `src/mobile/ui/fab.tsx`: botón «+» flotante (54px, acento) abajo a la
  derecha, en el portal `m-portal`. Una acción → la hace; varias → hoja
  con opciones. Se oculta en pantallas completas y en edición en línea;
  sube si está la mini barra de sesión; `.m-screen` gana aire al final.
  Usado en Entrenar › Rutinas (Importar del coach / Crear con IA),
  Nutrición › Biblioteca (código de barras / foto / manual) y Nutrición ›
  Hoy (Nueva comida). Se borraron las tiles y el botón «Nueva comida».
- Rutinas: vuelve la tarjeta original (etiqueta de origen, «Activa»,
  título 20px, «N días · objetivo») y se despliega en el lugar con los días
  y ejercicios (foto en círculo). Usar esta rutina pide confirmación.
- Etiqueta de origen con color propio: IA violeta (`ia`), coach turquesa
  (tono nuevo `coach`, tokens `--m-coach-bg/-text`).
- Entrenar › Hoy: solo «Tu rutina» (la activa, sin las demás).
  `active-routine.tsx`: acordeón de días con foto circular por ejercicio
  y «Hacer este día hoy»; «Editar» la vuelve editable ahí mismo (asa para
  reordenar, deslizar para quitar, Cambiar/Editar, Agregar ejercicio) con
  barra Cancelar/Guardar en el portal (el `transform` de la entrada de Hoy
  atrapa un `fixed`). Se edita la rutina guardada (fecha 1970-01-01), no
  la de hoy con sustituciones.
- `routine-editor.tsx`: el núcleo pasó a `usePlanEditor` + `DiscardSheet`
  + `ExerciseAvatar`; la pantalla completa los reutiliza y ahora también
  muestra las fotos. `routines-today.tsx` borrado.

## Elegir el día de Hoy (oct 28)

- `nextPlanDay` (week-data.ts): toca el primer día del plan no hecho esta
  semana; con la semana completa, el siguiente al último (repite). Lo usan
  Entrenar y Inicio en móvil; escritorio sigue con la regla vieja.
- Tocar un día en «Tu rutina» lo despliega y lo elige (tarjeta de arriba
  «Elegido · Día N», número en acento, «Toca hoy / Elegido / ✓ Hecho»).
  Empezar un día fuera de orden abre la hoja «Por orden hoy toca el Día X»
  (Empezar igual / Hacer el Día X); el saltado sigue pendiente.

## Biblioteca de ejercicios por músculo (oct 28)

- REHECHO a pedido («mucha info»): botón de filtro junto al buscador que
  abre una hoja: músculo principal (`GRUPOS_MUSCULARES`, ahora con oblicuos
  y hombro anterior/posterior) y, al elegirlo, los secundarios que trabajan
  sus ejercicios (≥3, por frecuencia; `secondaryByGroup`, leído en tandas
  de 1000 por el `max_rows`). Fuera de la hoja solo chips de lo activo con
  ×. URL: `grupo`, `sec=a,b` (principal en el grupo Y algún secundario).
  `getExerciseLibrary` acepta `secondaryMuscles` (overlaps).
- La búsqueda encuentra por músculo (`musculosDeBusqueda`: sin tildes, por
  valor del catálogo o nombre del grupo) además del nombre; aplica también
  en escritorio. Equipo con tildes (`rotuloCatalogo`).
- Ficha de ejercicio (desde Biblioteca): sin «Empezar entrenamiento»; solo
  queda «Volver a la sesión» si hay un entreno en curso.
- Ficha de ejercicio: series/reps/RIR/descanso en una fila tipo tablero
  (icono + cifra, etiqueta debajo, línea fina entre columnas), sin cajas.
- Ficha: sin iconos, cifra 21px centrada, «min» al lado, último peso en
  negrita (probó más grande y pidió volver a 21/13).
- Entrenar · Hoy: Ejercicios/Series/Duración en columna estilo tablero
  (icono + cifra, etiqueta debajo, línea fina entre ellos; `.m-day-stats`).
- «Tu rutina» (Hoy) con la franja de la variante D: cabecera (origen,
  nombre, resumen, Editar) sobre acento sólido con tinta `--m-on-accent`;
  días sobre la tarjeta. La etiqueta conserva su color de origen.
- DECIDIDO (oct 28, «de momento»): «Tu rutina» con franja BLANCA arriba y
  cuerpo NEGRO abajo en los dos temas (tokens redefinidos en
  `.m-routine[data-band]` y `.m-routine-band`). Selector de prueba borrado;
  el usuario puede querer cambiarlo después (opciones vistas: naranja,
  crema, tinte, degradado / actual, blanco, grafito).
- Franja: etiqueta de origen y «Editar» en una línea, ambos de 30px.
  En edición, filas de ejercicio negras (#000) con filo `--m-line`.

## Nutrición · Hoy: resumen nuevo y agua aparte (2026-10-28)
- `src/mobile/screens/nutrition/today.tsx`: el anillo se reemplazó por la tarjeta `.m-nutri-sum` (sin rótulo ni ↗: el usuario los quitó; espaciado compacto). Tiene la cifra de kcal restantes en 52px, una barra fina en acento, la fila «consumidas / Meta» y la lista de macros con punto, mini barra y «comido / meta g». Primero se probó blanca; el usuario la pidió oscura como antes (superficie normal con `data-glow`).
- El agua (`WaterCard`) va dentro de la misma tarjeta, al final, tras un divisor (el usuario no la quiso separada). Sus botones copian el «+ 250 ml» de Inicio: tinte celeste, texto celeste, sin icono (`.m-water-btn`).
- CSS al final de `src/mobile/mobile.css`. Se quitó el import de `Ring`.

## Háptica en iPhone (2026-10-28)
- El usuario confirmó que no vibraba. En `src/lib/haptics.ts` quité el corte por «Reducir movimiento», que en iPhone dejaba la app sin háptica. El interruptor `switch` ahora vive fijo en el `body`, renderizado fuera de pantalla, en vez de crearse en el `head` con `display:none`.
- Solo puede sonar dentro del toque. Las llamadas que van después de un `await` (los «success» al guardar) no suenan en iOS.
- Pendiente: que el usuario lo pruebe en el iPhone.
