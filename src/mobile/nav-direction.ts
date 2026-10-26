/**
 * Hacia donde va la siguiente navegacion, para la transicion entre pantallas
 * (mobile.css, `.m-page`): adelante desliza desde la derecha, atras desde la
 * izquierda, entre pestañas funde y `none` no anima.
 *
 * Va en un atributo de `<html>` y no en `transitionTypes` porque «Volver»
 * usa `router.back()`, que entra por `popstate` y pierde el tipo. Los
 * pseudo-elementos de la transicion cuelgan de `<html>`, asi que el CSS lo
 * lee con `:root[data-m-nav=…]`.
 */
export type NavDirection = "forward" | "back" | "back-root" | "tab" | "none";

let limpiar: number | undefined;

function programarLimpieza(ms: number) {
  window.clearTimeout(limpiar);
  limpiar = window.setTimeout(
    () => delete document.documentElement.dataset.mNav,
    ms,
  );
}

export function markNav(direction: NavDirection) {
  document.documentElement.dataset.mNav = direction;
  // Techo por si la navegacion no llega (cancelada, error).
  programarLimpieza(6000);
}

let llegada: (() => void) | undefined;

/** La ruta ya cambio: al terminar la animacion, vuelve a «adelante». */
export function navArrived() {
  llegada?.();
  llegada = undefined;
  if (document.documentElement.dataset.mNav) programarLimpieza(600);
}

/**
 * `router.back()` no corre dentro de una transicion de React, asi que la
 * View Transition se abre aqui a mano y se cierra cuando llega la ruta (o a
 * los 1,5 s, para no congelar la pantalla si la vuelta tarda).
 */
export function animateBack(navigate: () => void) {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduce) {
    markNav("back");
    navigate();
    return;
  }
  markNav("back-root");
  const transition = document.startViewTransition(
    () =>
      new Promise<void>((resolve) => {
        llegada = resolve;
        window.setTimeout(resolve, 1500);
        navigate();
      }),
  );
  // Si otra transicion la interrumpe, el navegador la salta: no es un error.
  transition.ready.catch(() => {});
  transition.updateCallbackDone.catch(() => {});
}

/**
 * Atras del sistema (gesto de iOS, boton de Android): el navegador ya anima
 * a su manera; encima no va otra.
 */
export function onSystemBack() {
  const actual = document.documentElement.dataset.mNav;
  if (actual !== "back" && actual !== "back-root") markNav("none");
}
