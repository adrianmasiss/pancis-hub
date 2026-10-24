import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/**
 * Pantallas de escritorio que se usan tal cual en el telefono (editar el
 * perfil, el editor de rutinas, el alta de alimentos), dentro de la vista
 * movil: con su «volver», su titulo y margen, sin barra inferior.
 */
export function MobileFormsFrame({
  children,
  title = "Editar perfil",
  backHref = "/configuracion",
  backLabel = "Volver al perfil",
}: {
  children: React.ReactNode;
  title?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="m-screen" data-m-fullscreen="">
      <header className="m-step-head">
        <Link
          href={backHref}
          aria-label={backLabel}
          className="m-icon-btn m-press"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </Link>
        <span style={{ fontSize: 17, fontWeight: 800 }}>{title}</span>
      </header>
      <div className="m-forms">{children}</div>
    </div>
  );
}
