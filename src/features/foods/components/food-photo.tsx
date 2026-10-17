"use client";
import { useState } from "react";
import type { LibraryCardFood } from "../library-types";
import { foodIllustration } from "../lib/food-illustrations";
import { FOOD_GROUP_ICONS } from "../lib/group-icons";

/**
 * Lo que se ve dentro de la caja de foto de un alimento: la foto del
 * proveedor, la ilustración del atlas o el icono de su grupo, en ese orden.
 * La caja (tamaño, fondo, etiquetas encima) la pone quien la usa; aquí sólo
 * va el contenido, para que la tarjeta y la ficha no puedan divergir.
 */
export function FoodPhoto({
  food,
  iconSize = 34,
}: {
  food: LibraryCardFood;
  iconSize?: number;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const illustration = food.local
    ? foodIllustration(food.name, food.cookedState, food.brand)
    : null;
  const GroupIcon = FOOD_GROUP_ICONS[food.group];
  if (food.imageUrl && !imageFailed)
    return (
      // eslint-disable-next-line @next/next/no-img-element -- bounded provider image with failure fallback
      <img
        src={food.imageUrl}
        alt={food.name}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setImageFailed(true)}
      />
    );
  if (illustration)
    return (
      <>
        <div
          className="library-food-illustration"
          role="img"
          aria-label={`Imagen ilustrativa de ${food.name}`}
          style={illustration}
        />
        {/* Sigue diciendo que no es una foto del producto, pero sin competir
            con la categoría: una marca, no una etiqueta. */}
        <span className="library-food-illustrative" aria-hidden="true">
          Ilustración
        </span>
      </>
    );
  return (
    <div className="library-photo-fallback" aria-hidden="true">
      <GroupIcon size={iconSize} strokeWidth={1.3} />
    </div>
  );
}
