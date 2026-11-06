# Imágenes de Comer fuera

Fotografías y marcas extraídas de páginas públicas oficiales de Costa Rica y menús locales de Uber Eats/Rappi. El logo de TGI Fridays procede del sitio global de la marca. Consulta: 06/11/2026.

`images.json` enlaza cada restaurante/producto con el archivo WebP local y su página de origen. `scripts/datos/imagenes-restaurantes-fuentes.json` conserva las URLs originales. Regenerar con `node scripts/importar-imagenes-restaurantes.mjs`; los archivos existentes se reutilizan. Las imágenes pertenecen a sus respectivos titulares.

Cobertura: 40 restaurantes y 94 de los 111 productos del informe. Se revisaron hojas de contacto; se descartó la imagen de salmón mediterráneo porque la web devuelve un marcador de cámara, y el avatar de Linktree de TGI Fridays porque no era su logo. Los logos blancos usan fondo oscuro. Las fotos no verifican valores nutricionales ni garantizan una porción/configuración idéntica a la tabla. No se asignan fotos por semejanza ni de otras cadenas. Sin foto exacta, la interfaz conserva el icono.

Pendientes de foto exacta accesible:

- McDonald's · Cappuccino
- McDonald's · Frappé Chocomenta
- Subway · Jamón
- Subway · Pollo asado
- Subway · Roast beef
- Subway · Subway Club
- Subway · Pollo teriyaki
- Subway · Pavo
- Subway · Veggie Delite
- Subway · Italian B.M.T.
- KFC · 10 nuggets
- KFC · Coleslaw
- KFC · Papas combo
- La Oliva Verde · Ensalada pollo griega
- La Oliva Verde · Ensalada salmón mediterráneo
- La Oliva Verde · Ensalada veggie
- La Oliva Verde · Piadine pollo griego
