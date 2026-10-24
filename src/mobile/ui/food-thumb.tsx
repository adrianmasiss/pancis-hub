import { FOOD_GROUP_ICONS } from "@/features/foods/lib/group-icons";
import type { FoodGroup } from "@/features/foods/schemas";

/**
 * Foto del alimento o, si no tiene, el icono de su grupo: el mismo dibujo que
 * la biblioteca, asi «esto es una grasa» se lee sin otra palabra.
 */
export function FoodThumb({
  imageUrl,
  foodGroup,
  size = 44,
}: {
  imageUrl?: string | null;
  foodGroup?: string | null;
  size?: number;
}) {
  const Icon =
    FOOD_GROUP_ICONS[(foodGroup ?? "otro") as FoodGroup] ??
    FOOD_GROUP_ICONS.otro;
  return (
    <span
      className="m-food-thumb"
      data-photo={imageUrl ? "" : undefined}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt="" loading="lazy" />
      ) : (
        <Icon size={Math.round(size * 0.45)} strokeWidth={2} />
      )}
    </span>
  );
}
