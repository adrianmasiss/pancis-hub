# InBody / Biometría 3D

**Fase:** v2 (no MVP)

## Por qué se pospone

Es la pieza visualmente más ambiciosa del sistema ("un cuerpo humano en 3D premium de alta calidad, donde al pasar el mouse o seleccionar alguna parte dice la cantidad de grasa corporal y músculo") y también la de mayor costo de construcción real. Tiene sentido esperar a que el resto del sistema ya tenga usuarios con datos biométricos reales cargados — de lo contrario el modelo 3D queda vacío o con datos de prueba, que no demuestra nada.

## Qué resuelve

Un apartado de datos biométricos con nivel profesional, equivalente a lo que muestra un InBody real (composición corporal por segmento: tronco, brazos, piernas), pero presentado como un modelo humano 3D interactivo en vez de una tabla plana.

## Requisitos de la experiencia

- Modelo 3D de cuerpo humano de calidad premium — no un modelo genérico de stock de baja fidelidad. Esto es una decisión de presupuesto real (ver más abajo), no solo de diseño.
- Interacción por hover/click sobre una región del cuerpo (torso, brazo derecho, brazo izquierdo, pierna derecha, pierna izquierda, etc.) que muestra los datos biométricos de esa región específica: % grasa corporal, masa muscular, y cualquier otra métrica que el usuario haya cargado o que venga de una medición tipo InBody real.
- Debe reflejar el historial: no solo el dato más reciente, sino poder ver la evolución de una región a través del tiempo.

## Decisión pendiente: cómo se construye el modelo 3D

Esto es lo que más tensiona el principio de "gratis por defecto" del proyecto, y hay que decidirlo con presupuesto real antes de empezar esta fase:

1. **Asset 3D premium comprado** (marketplace de modelos 3D anatómicos): más rápido de conseguir con calidad alta, pero tiene costo único no recurrente.
2. **Librería anatómica open-source** (ej. modelos base de anatomía disponibles con licencias abiertas) adaptada visualmente: gratis, pero requiere más trabajo de diseño para que se vea "premium" y no genérico.
3. **Encargar el modelo:** máxima calidad y ajuste exacto a la identidad visual del proyecto, pero es la opción más cara y más lenta.

Este documento no toma la decisión — la deja explícita para que se resuelva con presupuesto real al llegar a esta fase, en vez de descubrir el costo a mitad de la implementación.

## Requisitos técnicos

- Renderizado 3D interactivo en una PWA móvil implica WebGL (típicamente vía Three.js, que ya aparece como librería disponible en el stack de artifacts/herramientas del proyecto). Hay que validar rendimiento en dispositivos móviles de gama media, no solo en desktop.
- Mapeo entre zonas clicables del modelo y los datos (`body_regions_3d` en el modelo de datos, ver `03-modelo-de-datos.md`) debe ser independiente del modelo 3D concreto elegido, para poder cambiar de asset sin rehacer la lógica de datos.
- Fallback obligatorio: en un dispositivo que no soporte bien WebGL, debe existir una vista de datos biométricos por segmento en formato tabla/lista, no dejar al usuario sin acceso a su información.

## Qué queda fuera de esta fase

- Animaciones de cambio corporal a través del tiempo (ej. "ver" visualmente el progreso) — evaluar en v3 si aporta valor real más allá de lo estético.
- Comparación entre usuarios (no aplica: los datos son privados y por-usuario).
