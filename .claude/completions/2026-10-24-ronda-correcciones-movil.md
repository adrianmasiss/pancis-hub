# Ronda de correcciones móvil (pancis-hub-cambios-prompt.md)

## Fase 1 · Bugs (hecha, sin commit)

- **1.1 Volver lento:** `document.referrer` llega vacío tras navegar en el
  cliente (y siempre en la app instalada), así que «Volver» hacía `push` al
  respaldo (~800 ms al servidor). Ahora `NavTracker` (montado en
  `MobileShell`) marca si hubo navegación interna y `goBack()` usa
  `router.back()`, que reusa la caché de atrás/adelante de Next: ~80 ms.
  Detalle de comida y sesión activa usan `BackButton` en vez de `Link`.
- **1.2 Escáner:** pantalla móvil nueva `?vista=escanear`
  (`src/mobile/screens/nutrition/scanner.tsx`): permiso explicado, video de
  fondo, recuadro con esquinas en acento, línea de escaneo, linterna si el
  navegador la expone, «Escribir código», permiso negado con guía. Al leer:
  importa (si hace falta) y abre la ficha móvil. Si no existe: crear con foto o
  a mano (todavía van a `/nutricion/alimentos`, formularios de escritorio).
  `useBarcodeCamera` ganó `denied`, `torchAvailable` y `setTorch`.
- **1.3 Puntos cortados:** sólo pasaba en el login: el botón tenía
  `overflow-hidden` y la bola que se balancea salía de su caja. Ahora sólo
  recorta mientras encoge con texto.
- **1.4 Isla dinámica:** faltaba `viewportFit: "cover"` (sin él
  `env(safe-area-inset-top)` vale 0). `--m-top` = safe area + 16 px en `.m-app`,
  usado por encabezados, la barra de la sesión, el escáner y el alto máximo de
  los sheets.
- **1.5 Modelo 3D:** GLB con Meshopt 5,47 MB → 1,30 MB (0,93 MB gzip). La
  cuantización mueve las posiciones a otro espacio; `enEspacioOriginal()` las
  devuelve para que las zonas del shader y `modelRegionAt` sigan iguales
  (comparado por captura). Descarga compartida en
  `src/features/training/lib/model-preload.ts`, precarga al entrar a Entrenar,
  caché en el service worker (`/anatomy/`), silueta de 5 KB con fundido.
  4G simulada en dev: 6,9 s → 4,9 s hasta modelo listo.

## Fase 2 · Entrenamiento
- **Saira** para las cifras móviles (`--m-font-num`), elegida por el usuario.
- **2.1 Rutinas:** cada día en acordeón dentro de Entrenar › Rutinas (el de
  hoy abierto), «Usar esta rutina» y «Editar» dentro; sin sheet.
- **2.2 Detalle de ejercicio:** 4 tarjetas (series, reps, RIR, descanso),
  «Última vez», músculos principales/secundarios, énfasis con check.
- **2.3 Sesión activa:** filas de serie de 64 px, la actual con acento.
- **2.4 Descartar:** hoja de confirmación propia con botón destructivo.
- **2.5 Cuestionario IA:** 7 pasos, uno por pantalla, con progreso y Atrás.

## Fase 3 · Nutrición
- **3.1/3.2** `plan-meal.tsx`: cada comida se despliega en Hoy con tabla de
  ingredientes (P/C/G en color, números tabulares), total y acciones.
- **3.3** `water.tsx`: tanque con ola, háptica, meta en verde, deshacer.
- **3.4** `compare.tsx`: miniaturas (`ui/food-thumb.tsx`), frase de
  conclusión, anillo de similitud con etiqueta, barras por macro con ↑/↓ y
  CTA pegajoso sobre la barra.
- **3.5** opciones de sustituto como tarjetas (`.m-swap-card`): foto/ícono,
  porción, % y mini barra; la elegida con borde de acento y check. También
  en el sheet «¿Qué alimento cambias?».
- **3.6** ficha: anillo partido por macro con kcal al centro, leyenda con
  g y %; el resto («Más detalle», vitaminas) en tablas discretas.
- **3.7** historial: tocar un día abre un sheet con kcal y comidas con
  casillas; «Copiar a hoy» / «Copiar a otra fecha»; toast con «Deshacer».
  Acciones nuevas en `src/features/nutrition/copy-meals-actions.ts`
  (`getDayMeals`, `copyMealsToDate`, `undoCopiedMeals`). La copia conserva
  estado, hora y la comida del plan (si ese día no está ya registrada).
  `?copiar=1` muestra la indicación arriba.

## Fase 4 · Progreso y Evidencia
- **4.1** Resumen compacto: peso 32 px, gráfico de 110 px, métricas a 22 px,
  barra de constancia. (Ojo: `.m-progress` ya existía —barra del
  cuestionario—; la clase nueva es `.m-prog-summary`.)
- **4b** El segmento de fotos de Progreso se llama «Fotos»
  (`?vista=fotos`; `?vista=evidencia` sigue valiendo).
- `/evidencia` en el teléfono: lista con búsqueda y filtros (por tema; por
  tipo de estudio mientras no haya temas) y vista de lectura
  (`?id=` o `?ref=PMID …`) con «En resumen», texto a 16/1,6, fuente
  original y «Preguntarle al copiloto» (`/asistente?borrador=`, no envía).
- El texto no se cortaba por CSS: la tabla solo guardaba metadatos.
  Migración `20261026000000_evidencia_lectura.sql`: `topic`, `summary`,
  `key_points`, `body` (opcionales). No se redactó ningún resumen: el
  usuario traerá los artículos.
- Copiloto: chips «Basado en: …» bajo la respuesta y títulos enlazados a la
  lectura (se resuelven por identificador o título; `ai_citations` no guarda
  el id de la fuente).

## Fase 5 · Notificaciones
- Web Push propio con VAPID (gratis), como ya estaba.
- Migración `20261026010000_notificaciones_por_tipo.sql`:
  `profiles.notification_prefs` (jsonb) y `reminder_log.kind` con `agua` y
  `semanal`. Esquema y valores por defecto en
  `src/features/reminders/prefs.ts` (con tests).
- Perfil › Notificaciones (`/configuracion?vista=notificaciones`): estado del
  teléfono (activas, apagadas con pantalla previa al permiso, guía para
  instalar en iPhone, permiso negado con pasos para los ajustes), y por tipo
  interruptor y hora: comidas (a la hora/15/30 min antes), entreno, agua,
  fin del descanso, resumen semanal (día y hora).
- Cron: lee las preferencias y suma agua y resumen semanal.
- Fin del descanso: aviso local del service worker cuando la app no está a
  la vista (`src/mobile/rest-notice.ts`). En iPhone con la app suspendida
  el temporizador no corre: llega al volver.

## Pendiente en producción
- Aplicar las dos migraciones nuevas (`supabase db push`). Hasta entonces el
  cron no encuentra `notification_prefs` y no envía avisos; la lista de
  Evidencia funciona igual (lee con `*`).
- Probar en el iPhone: isla dinámica en la app instalada, «Volver», la
  pantalla previa al permiso (Playwright sin pantalla no la deja ver).

## Decisiones del usuario
- Colores de macros: los actuales (como Inicio/escritorio).
- Saira para las cifras.
- Evidencia: los estudios son de ejemplo; él traerá los artículos.
