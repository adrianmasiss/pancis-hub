"use client";

import { useState } from "react";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  /** Alto del logo en px. */
  height?: number;
  className?: string;
};

/**
 * Logo de Pancis Hub con variante por tema: logo.png (texto oscuro)
 * en claro y logo-dark.png (texto blanco) en oscuro. Si las imagenes
 * faltan, cae al wordmark con gradiente de marca.
 */
export function BrandLogo({ height = 36, className }: BrandLogoProps) {
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
        "text-brand-gradient text-lg font-bold tracking-tight",
        className,
      )}
    >
      {messages.app.name}
    </span>
  );
}
