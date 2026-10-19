import "./nutrition-dashboard.css";
import {
  ArrowLeftRight,
  Apple,
  History,
  Store,
  UtensilsCrossed,
} from "lucide-react";
import { IconTabs } from "@/components/ui/icon-tabs";

export function NutritionNav({
  active,
  date,
}: {
  active: "day" | "plan" | "compare" | "history" | "library";
  date?: string;
}) {
  const suffix = date ? `fecha=${date}` : "";
  const compareQuery = [suffix, active === "plan" ? "origen=plan" : ""]
    .filter(Boolean)
    .join("&");
  return (
    <div className="nutrition-navigation">
      <IconTabs
        label="Secciones de nutrición"
        items={[
          {
            href: `/nutricion${suffix ? `?${suffix}` : ""}`,
            label: "Mi plan",
            icon: UtensilsCrossed,
            active: active === "day" || active === "plan",
          },
          {
            href: "/nutricion/alimentos",
            label: "Biblioteca",
            icon: Apple,
            active: active === "library",
          },
          {
            href: `/nutricion/comparar${compareQuery ? `?${compareQuery}` : ""}`,
            label: "Comparar comida",
            icon: ArrowLeftRight,
            active: active === "compare",
          },
          {
            href: "/asistente?q=Ayúdame%20a%20elegir%20qué%20comer%20fuera%20según%20mi%20plan",
            label: "Fuera",
            icon: Store,
          },
          {
            href: "/nutricion?vista=historial",
            label: "Historial",
            icon: History,
            active: active === "history",
          },
        ]}
      />
    </div>
  );
}
