# Biblioteca de alimentos y Dietly

La biblioteca conserva alimentos propios, favoritos, recientes y correcciones personales. La sección Dietly consulta productos externos con sus imágenes y procedencia; guardar o elegir un sustituto importa el registro por su identificador, recuperando de nuevo los nutrientes en el servidor.

- Lecturas públicas sin clave; `DIETLY_API_KEY` opcional, exclusivamente servidor.
- Contrato: https://www.getdietly.com/api-guide y https://www.getdietly.com/openapi.json.
- Nutrientes por 100 g, porciones separadas. Valores ausentes permanecen `null` en la ficha. El catálogo local requiere los cinco valores (calorías, proteína, carbohidratos, grasa y fibra); una ficha incompleta no se importa ni se utiliza para calcular sustituciones. Las estimaciones IA se muestran identificadas y son solo de consulta.
- Caché de descubrimiento por consulta durante una hora en `external_food_cache`, con claves `catalogue:*`, separadas de la búsqueda híbrida. No se cachean errores. HTTP 429 muestra estado de límite, sin reintentos inmediatos; timeout de 8 segundos. La biblioteca local se conserva si el proveedor falla. «Volver a intentar» usa un enlace nativo a la selección actual: recarga el documento y vuelve a consultar el servidor conservando los filtros.
- Créditos Open Food Facts (ODbL), USDA y Dietly visibles. La importación conserva el origen en `foods.source`; `external_source = dietly` y `external_id` identifican el registro.

## Sustitución

La acción valida usuario, fecha en su zona horaria, alimento accesible, item de la dieta activa, comida pendiente y restricciones guardadas. Las correcciones propias se aplican antes del cálculo. La propuesta usa el motor existente de equivalencias; el usuario puede editar gramos y recalcular. Solo la confirmación escribe en `diet_item_day_swaps`; la plantilla habitual no cambia. Deshacer elimina la sustitución del día.

La importación de un alimento externo guarda ese alimento en la biblioteca aunque después se cancele la comparación. Los macronutrientes nunca se aceptan desde el cliente al importar o confirmar.

## Base de datos y despliegue

`supabase/migrations/20260929000000_dietly_food_provider.sql` amplía únicamente las restricciones de proveedores permitidos. Aplicada al Supabase local durante el desarrollo. Para otros entornos, aplicar esta migración con el proceso habitual antes de usar las importaciones. No se realizó despliegue remoto ni contratación de un plan de Dietly.

## Imágenes

`public/images/foods/food-atlas.png` es un único atlas ilustrativo de 6 × 4, generado con la herramienta integrada imagegen (sin CLI). El mapeo por nombre está en `food-illustrations.ts`. Las fotos del proveedor tienen prioridad; las ilustraciones están rotuladas y no se asignan a productos de marca. No representan medidas, recomendaciones o información nutricional.

Prompt utilizado:

> Create ONE production sprite atlas image for a nutrition food library UI. Landscape 3:2 canvas, exactly 6 equal columns and 4 equal rows (24 tiles), invisible grid. Every tile has identical warm off-white #f4f2ed background, a single centered photorealistic studio food cutout with soft contact shadow, very generous margin (object fits inner 65% of its tile), front three-quarter angle. NO text, NO labels, NO gridlines, NO borders, NO UI. Objects must never cross tile boundaries. ORDER LEFT TO RIGHT, TOP TO BOTTOM, exactly: row1: small glass bottle olive oil; halved avocado with pit; pile almonds; bowl uncooked white rice; bowl cooked white rice; bowl flaked canned tuna. row2: bowl rolled oat flakes; bunch yellow bananas; fresh broccoli head; orange sweet potato cut in half; bowl egg whites; bowl cooked black beans. row3: two brown eggs one cracked open; glass milk; bowl cooked lentils; red apple; wholemeal sliced bread; two potatoes. row4: plain cooked chicken breast on a small white plate; block white fresh cheese; stack corn tortillas; bowl plain Greek yogurt; lemon; strawberry. The sheet is a single image asset used by CSS background-position, exact uniform cell registration is essential. Fresh natural realistic colors and appetizing genuine food textures. No packaging brands, no hands, no props beyond vessels required to contain food. All food depictions are illustrative, not nutrition measurements.

## Verificación

- Unitarias: `dietly.test.ts`, `library-swap-actions.test.ts`, `providers.test.ts`.
- E2E: `food-library.spec.ts`, exclusivamente Supabase local y cuentas desechables. El caso de importación Dietly consulta un producto real y depende de la disponibilidad de su API. El registro importado de prueba se elimina si no existía antes.
- Capturas en `.impeccable/review/library/`.
