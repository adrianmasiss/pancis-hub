# Identidad Pancis — 22 de septiembre de 2026

La especificación cromática del usuario es la autoridad. La estructura y funciones del sistema se conservan.

| Rol | Oscuro | Claro |
| --- | --- | --- |
| Fondo | #090909 | #FFF3E6 |
| Superficie | #1A1A1A | #FFFFFF |
| Principal | #F0793F | #300C2D |
| Acento | #3FF4E5 | #EADDE7 |
| Texto | #FFFFFF | #211D22 |
| Texto secundario | #B0B0B0 | #71666E |
| Texto de botón | #090909 | #FFFFFF |
| Serie principal | #3FF4E5 | #300C2D |

Los degradados destacados usan los extremos definidos por el usuario. Las tarjetas normales son sólidas; el vidrio se reserva al resumen principal y panel de Copilot, con alternativa sólida. Se conservan colores semánticos de error, advertencia y confirmación con texto/iconos.

## Compatibilidad y logos

Pancis es el valor predeterminado. `pancis-palette-v2` inicia la nueva identidad sin borrar la preferencia anterior. Gilded conserva sus valores y puede seleccionarse como respaldo en Configuración → Apariencia. La preferencia explícita se guarda y persiste al recargar. Los tokens se emiten desde servidor para evitar el destello de la paleta anterior.

Los logos se pintan mediante máscaras de los archivos originales, sin redibujar la geometría ni las letras. El símbolo y Hub usan el color principal; Pancis usa la tinta del tema. El eslogan pequeño se omite; en acceso/registro se presenta como texto separado.

## Carga y accesibilidad

Péndulo de cuatro bolas, 1.2s y giros de ±70°, reutilizado en introducción, carga de rutas y operaciones pendientes. En botones usa la tinta accesible del control. Se detiene cuando queda fuera del viewport, al ocultar la pestaña y con movimiento reducido. Los contenedores conservan los nombres accesibles de los estados de carga.

El gris secundario sobre lavanda da menos de 4.5:1; las etiquetas lavanda usan texto principal o morado. Pruebas automáticas verifican los pares de texto a 4.5:1 y controles, foco y series a 3:1, incluyendo degradados y colores semánticos.

## Validación

- 478 pruebas pasan, incluidas 24 comprobaciones de contraste.
- TypeScript, ESLint de los cambios y compilación de producción correctos.
- Chromium local: acceso, Home, Nutrición, Progreso y Copilot en ambos modos; móvil sin desbordamiento horizontal.
- Selección de Gilded y persistencia al recargar verificadas.
- Movimiento del péndulo, cuatro bolas y preferencia de movimiento reducido verificados.
- Capturas: `.impeccable/review/identity-*.png`.
