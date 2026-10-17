import {
  Apple,
  Bean,
  Carrot,
  CupSoda,
  Droplet,
  Drumstick,
  Fish,
  Milk,
  Utensils,
  Wheat,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { foodVisual, type FoodIllustration } from "../lib/food-visual";

const ICONS: Record<FoodIllustration, LucideIcon> = {
  proteina: Drumstick,
  pescado: Fish,
  lacteo: Milk,
  carbohidrato: Wheat,
  grasa: Droplet,
  fruta: Apple,
  legumbre: Bean,
  verdura: Carrot,
  bebida: CupSoda,
  otro: Utensils,
};

/**
 * Foto del alimento sobre un plato oscuro, o su ilustracion de grupo cuando
 * no hay foto. Decorativa: el nombre siempre va escrito al lado.
 */
export function FoodAvatar({
  name,
  group,
  imageUrl,
  size = "md",
  className,
}: {
  name: string;
  group?: string | null;
  imageUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const { src, illustration } = foodVisual({ name, group, imageUrl });
  const Icon = ICONS[illustration];
  return (
    <span
      className={cn("food-avatar", className)}
      data-size={size}
      data-kind={src ? "photo" : "illustration"}
      data-group={illustration}
      aria-hidden="true"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- fotos locales o de catalogo, igual que FoodThumbnail
        <img src={src} alt="" loading="lazy" decoding="async" />
      ) : (
        <Icon strokeWidth={1.6} />
      )}
    </span>
  );
}
