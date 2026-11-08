# Buscar productos y agregarlos desde el copiloto

Escribí, por ejemplo, «Buscá Choco QuQi y agregala a mi biblioteca». El
copiloto tiene `find_and_save_food`: busca primero una coincidencia local
por nombre o alias y, si no existe, investiga el producto para Costa Rica
con Google Search mediante la conexión existente de Gemini.

Si puede identificar el producto, la base de medida y todos los nutrientes
obligatorios del catálogo, guarda una ficha personal automáticamente. No
modifica la dieta ni registra una comida. Los valores se convierten a 100 g
o se conservan por 100 ml; nunca se supone que mililitros son gramos.

La ficha conserva consulta, fecha, fuentes y transcripción en
`foods.web_provenance`. Sigue sin verificar: una transcripción asistida por
IA no equivale a revisar la etiqueta. Las fuentes se muestran tanto en el
chat como en el detalle del alimento, en móvil y escritorio.

## Límites deliberados

- Una investigación web por turno, con tiempos de espera acotados y sin
  reintentos automáticos que multipliquen la cuota de Gemini.
- No se extraen valores desde páginas cerradas ni se completan desde la
  memoria del modelo. La extracción solo admite fragmentos con citas
  devueltas por el proveedor. Esto no reemplaza una revisión humana.
- Si la variante, el mercado o la porción son ambiguos, si las fuentes
  discrepan o faltan calorías, proteína, carbohidratos, grasa o fibra, se
  informa lo pendiente y no se guarda una ficha incompleta. La fibra es
  obligatoria porque el catálogo actual no representa su ausencia como null.
- Azúcares y sodio desconocidos quedan null, nunca cero.
- Se guardan alias con la consulta original. Los reintentos del mismo
  producto/usuario comparten un identificador determinista y no sobrescriben
  las correcciones ni resucitan una ficha eliminada.
- No se genera una foto del producto ni se toma una foto genérica como si
  fuera el empaque real.

## Puesta en marcha

Aplicar `20261107000000_food_web_provenance.sql` antes de desplegar el código.
Agrega el campo de procedencia y permite insertar alias únicamente de
alimentos propios bajo RLS. No requiere nuevas claves: utiliza
`GOOGLE_GENERATIVE_AI_API_KEY` y `GEMINI_MODEL` existentes, con Google Search
habilitado para ese modelo/cuenta. Cuota o indisponibilidad se muestran como
error recuperable; no se habilita facturación automáticamente.

Google Search se ejecuta en una llamada separada del bucle de herramientas
del copiloto. Las sugerencias HTML que devuelve Google se muestran en un
iframe aislado sin permisos de scripts ni acceso al origen de la app.

Pruebas: `web-food.test.ts` cubre conversión, fuentes, porciones ambiguas,
ausencias y límites; `import-web-food.test.ts` cubre sesión, guardado,
deduplicación, fallos y que no se escriba en el registro de comidas.
