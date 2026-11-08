import { Barcode, Camera, PenLine } from "lucide-react";
import type { FabAction } from "@/mobile/ui/fab";

/** Mismas opciones de alta en Hoy y en la biblioteca. */
export const ADD_FOOD_OPTIONS: FabAction[] = [
  {
    label: "Código de barras",
    sub: "Escanéalo con la cámara.",
    icon: Barcode,
    href: "/nutricion?vista=escanear",
  },
  {
    label: "Foto de etiqueta",
    sub: "La tabla nutricional, leída de una foto.",
    icon: Camera,
    href: "/nutricion/alimentos?metodo=foto",
  },
  {
    label: "Manual",
    sub: "Escribe tú los valores por 100 g.",
    icon: PenLine,
    href: "/nutricion/alimentos?metodo=manual",
  },
];
