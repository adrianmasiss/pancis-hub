import {
  Apple,
  Bean,
  Beef,
  Carrot,
  Droplets,
  GlassWater,
  LayoutGrid,
  Milk,
  Utensils,
  Wheat,
} from "lucide-react";
import type { FoodGroup } from "../schemas";

/* Un icono por grupo. Lo usan las categorías de la biblioteca y la ficha que
   no tiene foto: el mismo dibujo en los dos sitios dice «esto es una grasa»
   sin otra palabra. */
export const FOOD_GROUP_ICONS = {
  proteina: Beef,
  carbohidrato: Wheat,
  grasa: Droplets,
  lacteo: Milk,
  fruta: Apple,
  verdura: Carrot,
  legumbre: Bean,
  bebida: GlassWater,
  mixto: Utensils,
  otro: LayoutGrid,
} satisfies Record<FoodGroup, typeof Apple>;
