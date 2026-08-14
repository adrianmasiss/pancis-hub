"use client";

import { useState } from "react";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  /** Alto del logotipo en px. */
  height?: number;
  className?: string;
};

/**
 * Logotipo real, con su variante por tema.
 *
 * El naranja del acento del sistema (#F05A27) se muestreo de este PNG: es el
 * punto medio de su degradado. Por eso la marca y la interfaz por fin
 * concuerdan, cosa que no pasaba con las paletas que se probaron antes.
 *
 * Si las imagenes faltan, cae a un wordmark de una sola tinta.
 */
export function BrandLogo({ height = 30, className }: BrandLogoProps) {
  const [imageAvailable, setImageAvailable] = useState(true);

  if (imageAvailable) {
    return (
      <span className={cn("inline-flex", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.png"
          alt={messages.app.name}
          style={{ height }}
          className="w-auto dark:hidden"
          onError={() => setImageAvailable(false)}
        />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-dark.png"
          alt={messages.app.name}
          style={{ height }}
          className="hidden w-auto dark:block"
          onError={() => setImageAvailable(false)}
        />
      </span>
    );
  }

  return (
    <span
      className={cn(
        "text-primary text-lg font-bold [letter-spacing:-0.02em]",
        className,
      )}
    >
      {messages.app.name}
    </span>
  );
}
