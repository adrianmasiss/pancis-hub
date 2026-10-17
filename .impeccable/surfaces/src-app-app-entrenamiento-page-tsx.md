---
version: 1
slug: "src-app-app-entrenamiento-page-tsx"
primary_target: "src/app/(app)/entrenamiento/page.tsx"
related_targets: ["src/features/training/components/training-focus.tsx","src/features/training/components/training-workspace.css"]
---

# Entrenamiento · contrato de superficie

Ámbito: /entrenamiento, modo operativo, dentro de Pancis. El usuario pidió rediseño completo con la dirección acordada en nutrición y OpenGym como referencia. Se conserva la paleta, logo y bordes de Pancis. Implementación independiente; no se copia código ni recursos AGPL de OpenGym.

Primer viewport: cabecera compacta con logo e importación, navegación de sesión/rutinas/actividad/catálogo, cuatro cards de resumen real, selector del día y comienzo del panel de ejercicios junto al mapa muscular. En móvil los cuatro cards se organizan 2×2 y el panel/mapa se apilan.

Interacción principal: elegir día actualiza las prescripciones y los resúmenes; elegir ejercicio resalta sus músculos y ofrece ficha técnica. Iniciar sesión conserva la rutina/día elegido; una sesión en curso se puede reanudar.

Sin rutina: resúmenes sin datos ficticios; explicación breve y acciones crear/importar/sesión libre; catálogo como alternativa útil. Sin maqueta de rutina ni tutorial extenso. Sin ejercicios no se monta el modelo 3D.

Referencias: screenshot Figma de nutrición proporcionado por usuario para jerarquía y reparto, no copia literal de contenido; https://github.com/alexpcosta/opengym para prioridad de sesión, lista de ejercicios, mapa y actividad. Code-led, dirección fijada por usuario; no comp nuevo ni cambios globales de identidad.

Verificación: typecheck, ESLint y E2E con cuenta desechable local: 320/390/768/1024/1440, seleccionar día/ejercicio, iniciar/reanudar, fallback modelo, estado sin rutina e inicio libre.


## Overview

Registro de implementación final de esta superficie; no sustituye `DESIGN.md`, `PRODUCT.md` ni `.impeccable/design.json`. Dirección: sesión operativa dentro del mundo existente de Pancis. La jerarquía de cuatro tarjetas procede de la referencia de nutrición; OpenGym informa el flujo de sesión, no la identidad ni los recursos.

## Colors

Se heredan los tokens del tema: `--primary` para acciones y selección; `--card` para superficies; `--foreground` y `--muted-foreground` para jerarquía; `--v11-line` para contornos. `--chart-2` identifica trabajo muscular registrado y un icono de resumen; `--chart-3` distingue otro icono. Las selecciones usan mezclas suaves del primario sin crear una paleta local.

**Regla de continuidad.** Conservar logo, paleta y tratamiento de borde de Pancis al ampliar esta superficie.

## Typography

La interfaz hereda la sans de la aplicación. Títulos de sección entre 18 y 25 px; título del panel de sesión de 22 px; nombres de ejercicios de 14 px; metadatos de 11–13 px. Los valores de las cuatro tarjetas usan 30 px, reducidos a 28 px en móvil, peso 600 y cifras tabulares. La información operativa domina sobre titulares decorativos.

## Layout

Orden implementado: logo y título con importación, navegación, próxima sesión, cuatro resúmenes, días, estado de sesión en curso cuando existe, sesión con ejercicios y anatomía, rutinas, actividad y récords. Las tarjetas de resumen son cuatro columnas y pasan a dos bajo 600 px. La sesión y la anatomía usan proporción 1.75:1 y se apilan cuando el contenedor baja de 880 px. La anatomía distribuye modelo y leyenda en dos columnas intermedias y vuelve a apilarlas en móvil. Las rutinas usan dos columnas y una bajo 600 px.

Ritmo dominante: separación de 24–28 px entre bloques, 12–16 px entre elementos próximos. El panel de sesión usa 24 px de relleno y 20 × 16 px en móvil. La navegación puede desplazarse horizontalmente.

## Elevation & Depth

Las tarjetas conservan superficies, sombra ambiental y borde luminoso heredados de Pancis. La superficie desactiva animación y desplazamiento de las tarjetas para mantener estable la lectura de la sesión. Selección, borde y tono comunican estado; las transiciones locales de color y fondo duran 180 ms y se desactivan con movimiento reducido.

## Shapes

Se reutiliza la tarjeta Pancis de esquinas amplias (24 px); el panel de sesión tiene radio de 20 px. Controles y filas de ejercicios usan 10 px; selección ampliada y aviso de reanudación, 12 px. Los contornos finos separan elementos sin sustituir el borde de marca.

## Components

- **Resumen:** ejercicios, series previstas, grupos musculares y última sesión; datos reales y guion cuando no existe información. Cambiar día recalcula los tres primeros.
- **Días y ejercicios:** botones con `aria-pressed`; cambiar día limpia la selección de ejercicio. Seleccionar una fila enfoca sus músculos y muestra acceso a la ficha técnica; pulsarla de nuevo o usar «Ver toda la sesión» restablece el conjunto.
- **Sesión:** iniciar conserva rutina y día seleccionados; una sesión en curso presenta acceso para continuarla.
- **Anatomía:** modelo, vista frontal/posterior y nombres de músculos. La lista textual permanece útil ante fallo de carga 3D. Sin ejercicios se muestra acceso al catálogo y no se monta el modelo.
- **Trabajo muscular:** barras proporcionales de series registradas durante siete días; no se confunden con prescripción ni se fabrican datos.
- **Sin rutina:** explicación breve, crear/importar y sesión libre; catálogo como alternativa. Los resúmenes no simulan un plan.
- **Actividad:** filas legibles con fecha, rutina o sesión libre, series, volumen y duración disponible. No presentan navegación hacia sesiones completadas que redirigen al resumen.
- **Accesibilidad:** foco visible de 2 px con separación de 4 px; controles principales con altura mínima de 44 px; inicio con 48 px; anuncios discretos para selección y sesión en curso.

## Do's and Don'ts

- **Do** mantener visible la relación entre día, prescripciones y acción de inicio.
- **Do** mantener el texto muscular como respaldo funcional del modelo.
- **Do** conservar el reparto de cuatro tarjetas y su adaptación 2×2 en móvil.
- **Don't** convertir esta composición de entrenamiento en una regla global de Pancis.
- **Don't** añadir contenido ficticio al estado sin rutina ni importar código o recursos de OpenGym.

Evidencia: `.impeccable/review/training/entrenamiento-{1440,390}.png` y `sin-rutina-{1440,390}.png`. Validación comunicada por implementación: typecheck, ESLint y E2E a 320/390/768/1024/1440 px; selección, inicio/reanudación, fallo 3D y sesión libre. Disposición final del revisor: **ship**, bajo revisión de respaldo independiente, sin correcciones materiales pendientes.

No canonizado: valores puntuales de ilustración, geometría del modelo y excepciones locales de color; no son nuevos tokens de marca. No se identificó una infracción de base que deba convertirse en regla visual.
