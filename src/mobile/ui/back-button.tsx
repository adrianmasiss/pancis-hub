"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

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
      onClick={() => {
        const desdeLaApp =
          window.history.length > 1 &&
          document.referrer.startsWith(window.location.origin);
        if (desdeLaApp) router.back();
        else router.push(fallback);
      }}
    >
      <ChevronLeft size={20} aria-hidden="true" />
    </button>
  );
}
