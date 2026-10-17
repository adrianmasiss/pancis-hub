# Cerrar sesion: se monta el menu de cuenta

**Fecha**: 2026-09-20

## El problema

No habia ninguna forma de cerrar sesion en la interfaz. `UserMenu` estaba
escrito y nunca se renderizaba; `TopBar` —que lo habria alojado— tampoco se
renderiza en ningun sitio. La server action `signOut()` funcionaba, pero nada
la llamaba. El pie del riel mostraba "Ver perfil", un texto inerte.

## Lo que se hizo

**Escritorio.** El pie del riel pasa de bloque inerte a disparador del menu de
cuenta: avatar, nombre, correo y "Cerrar sesion". `UserMenu` gana una variante
`row` (fila ancha del riel) junto a la `icon` original; conserva el
`aria-label` "Abrir menu" en las dos.

**Movil.** El riel solo existe desde 1024px, asi que Configuracion recibe una
tarjeta `Cuenta` con el correo de la sesion y el boton de cierre. Es un `form`
con server action, no un `onClick`: funciona sin JavaScript y no obliga a
marcar la pagina de ajustes como cliente.

**Plomeria.** `user.email` baja por `(app)/layout.tsx` -> `AppShell` ->
`Sidebar` -> `UserMenu`. `initialsOf` se movio del riel a `UserMenu`.

## Verificacion

Con Playwright contra el Supabase local, las dos vias:

- Escritorio 1440×900, menu del riel -> `/login`, cero cookies.
- Movil 390×844, tarjeta de Configuracion -> `/login`, cero cookies.
- Volver a `/` redirige a `/login?next=%2F`: la sesion quedo cerrada de verdad.

`tsc`, `eslint` y `next build` limpios.

## Lo que sigue roto

`flujo-minimo.spec.ts:781` ("tema, cierre de sesion y persistencia") **todavia
falla**, pero ya no por el cierre de sesion: muere antes, en la linea 789,
buscando el boton "Cambiar tema". `ThemeToggle` tiene el mismo problema que
tenia `UserMenu` —solo se usa dentro de `TopBar`, que nadie monta—, asi que
cambiar de tema tampoco se puede desde la interfaz.
