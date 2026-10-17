# «Hoy»: el maniquí como protagonista, sin tarjeta naranja

- Sin tarjeta: todo con tokens del tema. Escritorio: maniquí alto y sticky a la izquierda; título, datos (una línea), CTA y «Tus días» a la derecha. Móvil: una columna.
- Tono `piel` en `MuscleModel`: cuerpo color piel, músculo principal rojo anaranjado (#e04a22), asistente intermedio.
- Las zonas musculares se evalúan por píxel en el shader (`MODEL_REGIONS` como uniformes). Antes eran colores de vértice y el borde salía dentado ("manchado"). Afecta a todos los tonos (Progreso también, comprobado).
- Latido de los músculos (`pulse`), pausado fuera de pantalla y con reduced-motion.
- Zoom: abrir un ejercicio en las filas de «Tus días» lo pone en foco (`enFoco` = fila abierta). La cámara gira al lado correcto y se acerca a sus principales; etiqueta con nombre y músculos sobre el maniquí; «Ver el día» cierra.
- Se descartó la tira de ejercicios dentro de la tarjeta (el usuario prefirió elegir desde la lista).
- e2e `training-workspace.spec.ts`: la alternativa sin 3D se comprueba con `.today-stats`.
