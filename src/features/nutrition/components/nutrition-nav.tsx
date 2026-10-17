import "./nutrition-dashboard.css";
import Link from "next/link";

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
      <nav
        className="nutrition-workspace-tabs"
        aria-label="Secciones de nutrición"
      >
        <Link
          href={`/nutricion${suffix ? `?${suffix}` : ""}`}
          aria-current={
            active === "day" || active === "plan" ? "page" : undefined
          }
        >
          Mi plan
        </Link>
        <Link
          href="/nutricion/alimentos"
          aria-current={active === "library" ? "page" : undefined}
        >
          Biblioteca
        </Link>
        <Link
          href={`/nutricion/comparar${compareQuery ? `?${compareQuery}` : ""}`}
          aria-current={active === "compare" ? "page" : undefined}
        >
          Comparar comida
        </Link>
        <Link href="/asistente?q=Ayúdame%20a%20elegir%20qué%20comer%20fuera%20según%20mi%20plan">
          Fuera
        </Link>
        <Link
          href="/nutricion?vista=historial"
          aria-current={active === "history" ? "page" : undefined}
        >
          Historial
        </Link>
      </nav>
    </div>
  );
}
