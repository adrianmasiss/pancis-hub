import { cn } from "@/lib/utils";

type FoodThumbnailProps = {
  src: string | null;
  alt: string;
  className?: string;
};

/** Miniatura de alimento/receta. Si no hay foto, no renderiza nada. */
export function FoodThumbnail({ src, alt, className }: FoodThumbnailProps) {
  if (!src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element -- storage propio, sin next/image en el resto del proyecto
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={cn("bg-muted shrink-0 rounded-md object-cover", className)}
    />
  );
}
