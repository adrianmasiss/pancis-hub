import type { CSSProperties } from "react";
import { messages } from "@/i18n/es-419";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  height?: number;
  className?: string;
  variant?: "wordmark" | "mark" | "name";
};

/** Alpha masks from the original production artwork preserve every letter and
 * the PH geometry. Only the paint changes; the small slogan is omitted. */
export function BrandLogo({
  height = 30,
  className,
  variant = "wordmark",
}: BrandLogoProps) {
  return (
    <span
      role="img"
      aria-label={messages.app.name}
      className={cn("brand-artwork", `brand-artwork-${variant}`, className)}
      style={{ "--logo-height": `${height}px` } as CSSProperties}
    />
  );
}
