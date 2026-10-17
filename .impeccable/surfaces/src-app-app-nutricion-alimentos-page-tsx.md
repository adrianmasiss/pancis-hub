---
version: 1
slug: "src-app-app-nutricion-alimentos-page-tsx"
primary_target: "src/app/(app)/nutricion/alimentos/page.tsx"
related_targets: ["src/features/foods/components/food-library-grid.tsx","src/features/foods/components/food-library.css","src/features/foods/components/library-swap-sheet.tsx"]
---

# Biblioteca de alimentos

Superficie /nutricion/alimentos. Modo operativo; se conserva identidad Pancis, colores del tema, logo y bordes de cards compartidos. Referencias del usuario: imágenes de catálogos de supermercado, categorías y cards con fotos. Sin precios, carrito ni promociones.

Primer viewport: cabecera compacta, navegación nutricional, buscador destacado, acceso a dieta, categorías horizontales y colecciones. Grid de 4 cards, 3 hasta 1050 px de contenedor y 2 hasta 760 px; una columna bajo 359 px de viewport. Bloques de biblioteca propia y descubrimiento Dietly. Imagen de alimento arriba, nombre, marca o estado de cocción cuando existen debajo del título, kcal/100 g, proteína/carbohidratos/grasas/fibra, procedencia y acción Usar en mi dieta. La categoría queda en la imagen, sin repetirse como kicker.

Geist y roles cromáticos compartidos; título de página de 22–30 px, secciones de 19 px, nombres de 16 px (14 px en móvil) y energía de 25 px (23 px en móvil). Las cards conservan el material y borde v11, sin entrada animada ni desplazamiento al pasar el puntero. El acceso a dieta usa un separador neutro de 1 px. Fotos sobre fondo claro; acciones principales y favoritos con objetivos de 44 px. Estos valores describen esta superficie y no amplían los tokens globales.

Fotos de Dietly conservan procedencia. Alimentos de inicio sin foto disponen de atlas generado con imagegen, rotulado Imagen ilustrativa; es arte representativo, no foto de marca ni evidencia nutricional. Mapeo exacto por nombre, sin sustituir productos de marca. Asset public/images/foods/food-atlas.png. Fuente nutricional real siempre independiente de la imagen.

La sustitución se inicia desde un alimento de biblioteca o Dietly: elegir item pendiente de dieta actual, previsualizar porción y cambios de macros, editar gramos, recalcular, confirmar solo hoy. No se modifica plantilla habitual. Respeta correcciones de usuario y restricciones guardadas. Deshacer conserva acceso a la acción existente. Sin dieta, guía breve con enlace a su importación. Comidas registradas no elegibles.

Dietly usa endpoints públicos, clave opcional solo servidor, caché de una hora y timeout. Datos faltantes se presentan como guion, nunca cero. Fichas incompletas y estimaciones IA se pueden consultar pero no importar ni usar en sustituciones. Origen visible y atribución Open Food Facts. Al fallar Dietly, biblioteca local disponible y mensaje explícito; Volver a intentar es un enlace nativo que recarga el documento conservando los filtros.

Pruebas de normalización, límites de confianza, importación y validación del cambio. E2E con cuenta desechable local en 320/390/768/1024/1440, filtros/favoritos, comparación, confirmar, deshacer y sin dieta.
