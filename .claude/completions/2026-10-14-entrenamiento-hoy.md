# Entrenamiento: tarjeta «Hoy» con el maniquí

**Fecha:** 2026-10-14 · sin commit

Referencia del usuario: tarjeta naranja con maniquí negro encendido en los
músculos del día, tres datos, chips de músculos y «Empezar entrenamiento»;
debajo, ejercicios por músculo en filas-píldora que se despliegan.

- `training-today.tsx` + `.css` reemplazan a `training-focus.tsx` (borrado).
- `MuscleModel` acepta `tone="maniqui"` (cuerpo negro mate, músculos en blanco
  cálido); el tono `anatomia` sigue igual para las demás pantallas.
- El maniquí abre de espaldas si el día es sobre todo posterior; botón para girar.
- Datos reales: `exerciseHistory`, `latestRecord` y `estimatedMinutes` en
  `lib/stats.ts` (con tests); la consulta ordena las series por fecha.
  La duración se marca «≈» y explica su cálculo.
- Chips: hasta 3 principales y 2 asistentes, el resto como «+N».
- Atribución CC BY 4.0 del modelo al pie de la lista.
- `e2e/training-workspace.spec.ts` actualizado: pasa (35,8 s). 621 tests unitarios.

Pendiente posible: barra de navegación flotante tipo referencia 2 (círculos).

## Segunda vuelta (mismo día)

- Pestañas reales en la URL: Hoy · Historial · Rutinas (`?vista=`).
- «Tus días»: cada día de la rutina es una tarjeta redonda (título = sus
  músculos) que se despliega con sus ejercicios; al elegirla, la página sube
  con animación a la tarjeta naranja, que cambia a ese día. En escritorio no
  sube: la tarjeta está fija a la izquierda.
- Historial (`training-history.tsx`): series por músculo de 7 días, buscador
  sin tildes, ejercicios con mejor marca y todas sus series por fecha
  (calentamientos marcados), y vista por sesiones. `lib/exercise-log.ts` +
  tests; consulta `getTrainingLog`.
- Maniquí: contorno de zonas más definido (`borde`), asistentes en gris claro
  y no beige, y las zonas se apagan de a poco hacia los costados
  (`model-regions.ts`) en vez de un corte seco que las dejaba moteadas.
- Barra inferior móvil: cápsula flotante de círculos con disco naranja que se
  desliza (`bottom-navigation.tsx/.css`).
- e2e: training-workspace pasa. flujo-minimo falla en su primer paso por
  «te faltan hoy» en la pantalla de Inicio (cambio previo de la rama, ajeno a
  esto); se apuntaron sus pasos de rutinas a `?vista=rutinas`.

## Tercera vuelta: importar el PDF del coach y entrenar en vivo

- Prueba real con «Rutina 6» (PDF de 3 páginas, 5 días): antes 9 de 65
  líneas bien entendidas; ahora 41 de 42 ejercicios emparejados.
- `routine-parser.ts`: notas de día y generales, nombre del día en la línea
  siguiente, subtítulos de grupo, superseries («más», «+», partidas en dos
  renglones, y dos ejercicios seguidos), indicaciones a notas, circuitos,
  «N series», «150 abdominales», descanso general desde las notas.
- `exercise-matcher.ts`: español de gimnasio → catálogo en inglés, exige el
  mismo movimiento; también da la búsqueda del selector (`searchExercises`).
  `catalog-cache.ts` carga el catálogo entero (antes se cortaba en 500).
- Importar: subir PDF (`extractRoutinePdf`, pdf.js en el servidor;
  `serverExternalPackages: ["pdfjs-dist"]` en next.config), vista previa con
  lo escrito por el coach, notas y «Cambiar» por ejercicio.
- Modo en vivo en la misma pantalla (`live-session.tsx`): «Empezar» ya no
  lleva a /sesion para días del plan. Peso y reps con el mismo contador de la
  ficha de alimentos (`quantity-stepper.css` aparte), series S1…Sn, quitar
  con doble toque, descanso flotante con +15 s/Saltar, vibración y pitido,
  cronómetro para ejercicios por tiempo, ✓ y salto al siguiente ejercicio,
  reloj/series/volumen arriba, Terminar y Descartar.
- Demo: quedó importada «Rutina 6» (inactiva); la sesión de prueba se borró.
