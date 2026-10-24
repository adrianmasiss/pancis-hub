# Auditoría responsive (2026-10-22)

Capturas a 360, 390, 820, 1024 y 1440 px (Playwright, demo local).

- Sin scroll horizontal en ninguna pantalla principal.
- Fallos: cabecera de la tabla de comidas se monta («AlimProteína») a 820px;
  línea de macros por comida apretada a 360px («72gC», «11g524kcal»);
  pestañas de Progreso cortan «Bienestar» sin pista de scroll; el CTA
  «Iniciar entrenamiento» queda bajo el dock a 390px.
- Propuesta móvil: quitar el marco del escenario <768px, cabecera única por
  sección, «Hoy» con franja de resumen arriba, Nutrición con sólo la comida en
  turno desplegada y acciones por fila en una hoja, CTA fijo sobre el dock.
- Tablet 768–1023: el riel lateral ocupa ~1/3; debería arrancar plegado.
