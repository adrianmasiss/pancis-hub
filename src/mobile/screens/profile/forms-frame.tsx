import Link from "next/link";
import { ChevronLeft } from "lucide-react";

/**
 * Los formularios de configuracion de siempre (perfil, objetivo,
 * tolerancias, cuenta), dentro de la vista movil con su «volver». Son los
 * mismos de escritorio: editar a fondo no necesita otra version.
 */
export function MobileFormsFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="m-screen" data-m-fullscreen="">
      <header className="m-step-head">
        <Link
          href="/configuracion"
          aria-label="Volver al perfil"
          className="m-icon-btn m-press"
        >
          <ChevronLeft size={20} aria-hidden="true" />
        </Link>
        <span style={{ fontSize: 17, fontWeight: 800 }}>Editar perfil</span>
      </header>
      <div className="m-forms">{children}</div>
    </div>
  );
}
