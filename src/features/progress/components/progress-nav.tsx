import Link from "next/link";

export type ProgressView = "resumen" | "historial" | "fotos" | "bienestar";

/**
 * Las cuatro vistas de Progreso. Va por URL y no por estado de cliente para
 * que una pestaña concreta se pueda compartir, recargar y volver atrás con el
 * botón del navegador — que es lo que la gente espera de algo que se ve como
 * una navegación.
 */
const VISTAS: { slug: ProgressView; rotulo: string; href: string }[] = [
  { slug: "resumen", rotulo: "Resumen", href: "/progreso" },
  { slug: "historial", rotulo: "Historial", href: "/progreso?vista=historial" },
  { slug: "fotos", rotulo: "Fotos", href: "/progreso?vista=fotos" },
  {
    slug: "bienestar",
    rotulo: "Bienestar",
    href: "/progreso?vista=bienestar",
  },
];

export function ProgressNav({ active }: { active: ProgressView }) {
  return (
    <nav className="progress-nav" aria-label="Vistas de progreso">
      {VISTAS.map(({ slug, rotulo, href }) => (
        <Link
          key={slug}
          href={href}
          aria-current={active === slug ? "page" : undefined}
        >
          {rotulo}
        </Link>
      ))}
    </nav>
  );
}
