"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import {
  animateBack,
  markNav,
  navArrived,
  onSystemBack,
} from "@/mobile/nav-direction";

/**
 * Si en esta carga de la pagina ya hubo una navegacion dentro de la app.
 * Vive en el modulo: una recarga o una entrada directa lo devuelven a false.
 *
 * Antes se decidia con `document.referrer`, pero tras navegar en el cliente
 * llega vacio (y en la app instalada siempre): «Volver» caia en `push` al
 * respaldo, una ida al servidor de ~800 ms. `router.back()` reusa la cache
 * de atras/adelante de Next y vuelve al instante.
 */
let navegoDentro = false;

/** Lo monta el armazon movil: marca la primera navegacion en el cliente. */
export function NavTracker() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const first = useRef(`${pathname}?${search}`);
  useEffect(() => {
    if (`${pathname}?${search}` !== first.current) navegoDentro = true;
    navArrived();
  }, [pathname, search]);
  useEffect(() => {
    window.addEventListener("popstate", onSystemBack);
    return () => window.removeEventListener("popstate", onSystemBack);
  }, []);
  return null;
}

/** ¿Hay una pantalla anterior de la app a la que volver con `history`? */
export function canGoBackInApp() {
  return navegoDentro && window.history.length > 1;
}

/** Vuelve a la pantalla anterior de la app o, si no la hay, a `fallback`. */
export function goBack(router: ReturnType<typeof useRouter>, fallback: string) {
  if (canGoBackInApp()) {
    animateBack(() => router.back());
  } else {
    markNav("back");
    router.push(fallback);
  }
}

/**
 * «Volver» que regresa a donde estabas (si llegaste desde la app) y, si la
 * pantalla se abrio directo, a `fallback`. En la app instalada no hay boton
 * atras del navegador: este es el unico camino.
 */
export function BackButton({
  fallback,
  glass,
  label = "Volver",
}: {
  fallback: string;
  glass?: boolean;
  label?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      aria-label={label}
      className="m-icon-btn m-press"
      data-glass={glass ? "" : undefined}
      onClick={() => goBack(router, fallback)}
    >
      <ChevronLeft size={20} aria-hidden="true" />
    </button>
  );
}
