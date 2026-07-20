"use client";

import { useState } from "react";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  /** Alto del logo en px cuando existe /logo.png. */
  height?: number;
  className?: string;
};

/**
 * Logo de Pancis Hub. Usa public/logo.png si existe; mientras no este
 * el archivo, muestra el wordmark con el gradiente de marca.
 */
export function BrandLogo({ height = 28, className }: BrandLogoProps) {
  const [imageAvailable, setImageAvailable] = useState(true);

  if (imageAvailable) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/logo.png"
        alt={messages.app.name}
        style={{ height }}
        className={cn("w-auto", className)}
        onError={() => setImageAvailable(false)}
      />
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
