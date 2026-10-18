# Formularios con el acabado de la ficha de alimento — 2026-10-17

Pedido: que crear rutina, registrar medición, generar con IA, importar rutina,
importar dieta y «Cómo hacerlo» se vean como la ficha de alimento (centrado,
fondo difuminado, entrada con escala+desenfoque).

- `components/ui/dialog.tsx` + `dialog.css` (nuevo): TODOS los `Dialog` usan
  el material de la tarjeta de foco (`pc-dialog pc-live-edge`, radio 28,
  overlay difuminado, entrada 420ms), cerrar de 38px, título 21px, y
  `DialogFooter` fijo abajo con vidrio. Arreglado de paso: `sm:max-w-sm` por
  defecto pisaba los `max-w-lg/2xl` de cada diálogo.
- `components/shared/form-kit.tsx/.css` (nuevo): `MetricField` (unidad dentro),
  `FormGroup` (panel con rótulo; plegable con contador de rellenos; se abre
  solo si `defaultOpen` pasa a true), `FileField` (sustituye al input nativo en
  inglés), `ChoicePills`.
- Registrar medición: Lo esencial + Composición/Perímetros/Notas plegados.
  «Peso (kg)» → «Peso»; Fuente son pastillas (sin «Onboarding» salvo que ya lo
  tenga). Verificado en BD con un e2e temporal (borrado).
- Generar con IA: tres bloques, músculos plegado, aviso IA en el pie fijo.
- «Cómo hacerlo»: de Sheet lateral a Dialog centrado.
- Importar dieta: `FileField`.
- e2e `flujo-minimo` actualizado a los rótulos nuevos.

Fallos e2e PREEXISTENTES (no de este cambio): `esperarAcceso` busca
`input[name=email]` (el login usa `identifier`); `TodayRemainingCard` no se
monta («te faltan hoy»); `.nutrition-energy-value`; Papaya externo;
`alternative-explorer` desborda a 320px en FocusCard.

Pendiente: revisión de «Importar rutina» por dentro (el área de subida y la
pantalla de revisión), «Crear rutina» y el resto de diálogos al kit.

## Segunda ronda (mismo día)

- Importar rutina en dos pasos: origen (`DropZone` + «o pégala como texto»)
  y revisión (avisos ámbar, nombre, días plegables con contador, cinco cifras
  por ejercicio, «Volver a cargar», «Crear rutina» fijo). Días sin problemas
  llegan plegados: el e2e abre «Torso» antes de mirar su descanso.
- `ExercisePicker` acepta `triggerVariant="swap"` (pastilla «Cambiar»).
- Crear rutina, Subir foto y Crear/editar receta pasados al kit; foto sin
  archivo deja «Guardar» deshabilitado (el input oculto no puede mostrar el
  aviso de `required`).
- `SelectField`: 44px, radio 12, flecha propia (`pc-select`, importa
  form-kit.css por sí mismo porque se usa fuera de diálogos).
- Rótulos de cualquier Dialog: 12.5px apagados.
- Importar dieta: `DropZone` con archivo elegido, tamaño y quitar; fila de
  acción con lo que va a pasar. La revisión (DietReviewEditor) NO se tocó ni
  se probó: requiere llamar a Gemini (cuota 20/día).
- Verificado con e2e temporales (borrados): importar rutina completa, crear
  rutina y receta con los valores en BD.
