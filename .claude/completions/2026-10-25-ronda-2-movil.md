# Ronda 2 del móvil (2026-10-25)

Prompt: `~/Downloads/pancis-hub-cambios-2-prompt.md`. Plan aprobado por fases;
todo sin commit. Escritorio sin cambios visuales salvo los avisos de abajo.

## Fases 1 y 2 (perfil, diálogos, sesión, notificaciones, fluidez)
- Perfil, diálogos, plan de dieta, revisar fuentes, «No cerrar sesión» que
  ahora funciona, cerrar sesión borra la suscripción push, notificaciones,
  ejercicios en español (`scripts/datos/ejercicios-es.json`).
- Fluidez: `nav-direction.ts`, esqueletos, prefetch, avatar reducido.

## Fase 3 · Entrenar
- 3.1–3.3: rutinas en Hoy, «R» de día repetido en Semana, crédito del 3D.
- 3.4 Entrenamiento activo: `ui/wheel.tsx` (ruedas), `ui/swipe-row.tsx`
  (deslizar/mantener → basurero, asa para reordenar, acciones secundarias),
  progreso en `localStorage` (`live-store.ts`), «+ Serie», «Deshacer», hoja de
  salida (Terminar / Dejar en curso / Descartar), mini barra
  `shell/live-session-bar.tsx`, `use-exit-guard.ts`.
- 3.5 Editor de rutina (`routine-editor.tsx`, `routine-edit-kit.tsx`,
  `features/training/plan-edit-actions.ts`), versionado antes y después.
- 3.6 Importar: «¿Quisiste decir…?», Reemplazar/Eliminar por fila; opción
  aditiva `sameMovement` en el matcher y `suggestions` en la vista previa.

## Fase 4 · Nutrición
- **Migración** `20261027000000_extras_de_comida.sql`:
  `meals.extra_of_template_meal_id` (FK a `diet_template_meals`, `on delete
  set null`). Aplicada solo en local. `logMeal` acepta `extraOfTemplateMealId`;
  `getDayPlan` lo expone; `logDietTemplateMeal` devuelve también `mealId`.
- 4.1 `plan-meal.tsx` reescrito: tocar un alimento lo sustituye, deslizarlo
  cambia la cantidad (hoja con stepper) o lo quita hoy (con «Deshacer»); extras
  dentro de la comida («Extra de hoy»); fila de hora (rueda) + «Agregar extra»
  + menú «⋯» (cambiar por receta, editar gramos, volver a la hora del plan,
  quitar hoy). Sin botón «Marcar como comida»: queda el check.
  `LooseMeal` para las comidas nuevas, mismo diseño. Mantener presionada una
  comida y arrastrarla le da una hora intermedia solo ese día
  (`timeBetween`, con test). Hojas en `day-sheets.tsx`; `ExtraSheet` admite
  varios alimentos y destinos (suelto, extra, nueva con hora, agregar).
- 4.2 «kcal» pequeño en Consumidas/Meta y macros en grilla de 3 columnas.
- 4.3 Comparar: «Desde mi plan» (picker agrupado por comida) y «Libre» (dos
  alimentos del catálogo a calorías iguales, misma similitud).
- 4.4 Ficha: «Fuente de los datos» con confianza (Verificado / Estimado /
  Pendiente); variante de macros en barras junto al anillo (selector
  Anillo/Barras, se recuerda — **el usuario debe elegir una**); «Usar hoy»
  abre `use-today-sheet.tsx` (a qué comida o nueva con hora, y cantidad).
- 4.5 Historial: resumen del día (`day-history-actions.ts`): kcal frente a la
  meta con diferencia, macros, cada alimento según el plan / sustituido (con
  el original) / por receta / extra / no comido, aviso de entreno; «Copiar»
  al final como acción secundaria.

## Fase 5 · Pulido
- 5.1 Tarjetas de Inicio con 18–20 px y mínimo igual por fila.
- 5.2 Barra: una sola píldora con `translateX(índice × 100%)`, resorte que sale
  al tocar (sin esperar la ruta) y leve rebote del ícono.
- 5.3 Campos: sin apariencia nativa ni cruz de búsqueda ni resaltado al tocar;
  foco con borde de acento 1,5 px y halo (`:focus-visible` más marcado). Se
  excluyen range, checkbox, radio y file.
- 5.4 Isla dinámica: sin cambios — `statusBarStyle: "default"` deja la vista
  bajo la barra de estado; nada queda tapado.
- 5.5 Passkeys: Perfil › Seguridad con interruptor (encender registra una
  llave; apagar borra todas, con confirmación) y ofrecimiento único tras
  entrar con contraseña (`PasskeyOffer`; marca en `mobile/passkey-offer-flag.ts`
  que deja `login-form.tsx`). Si el servidor no tiene passkeys, ni se ofrece ni
  se puede encender. **No probado de punta a punta en local**: el auth local
  responde 404 en `/auth/v1/passkeys`.

## Verificación
- `tsc`, `eslint src`, `vitest` (682 tests) en verde.
- Flujos probados con Playwright (iPhone UA): plan del día completo
  (cantidad, hora, extra, nueva comida, arrastre), Comparar en dos modos,
  ficha (variante recordada, «Usar hoy» liga el extra), historial, barra,
  foco, perfil. Datos del demo restaurados.

## Pendiente del usuario
- `supabase db push` (migración de extras) **antes** de desplegar: el código
  nuevo lee `extra_of_template_meal_id`.
- Vercel: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`,
  `VAPID_SUBJECT`; redesplegar.
- Supabase prod: activar Passkeys con RP ID `pancis-hub.vercel.app`.
- `npm run ejercicios -- --solo-con-fotos` contra prod.
- Elegir Anillo o Barras en la ficha de alimento.
- Resubir el avatar desde el teléfono; probar passkeys en un iPhone real.

## Escritorio
- A/B HEAD contra árbol actual (webpack, movimiento reducido, 1440/1024/820):
  16 de 18 capturas idénticas; `/configuracion` a 1024 y 1440 difiere en 12
  píxeles de suavizado (invisible).

## Limitaciones corregidas (móvil)
- «Quitar hoy» / «Deshacer» / «Restaurar comida» usan la acción nueva
  `setDietItemOmittedForDay`: conserva la sustitución previa y solo cambia
  `omitted`. Escritorio sigue con `omitDietItemForDay` (mismo problema allá).
- «Cambiar por receta»: abrir la hoja ya no registra la comida; las
  sugerencias salen de los macros del plan (`getRecipeSwapSuggestions` acepta
  `{ planned }` además de `{ mealId }`). Elegir una receta sí la registra como
  hecha, y la hoja lo avisa.
