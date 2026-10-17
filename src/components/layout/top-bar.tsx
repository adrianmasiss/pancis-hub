"use client";

import { useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { BrandLogo } from "@/components/shared/brand-logo";
import { UserMenu } from "@/features/auth/components/user-menu";
import { CopilotDrawer } from "@/features/assistant/components/copilot-drawer";

type TopBarProps = {
  displayName?: string;
  avatarUrl?: string | null;
  email?: string;
};

/**
 * Barra superior del lienzo v11: tema, copiloto y cuenta a la derecha.
 *
 * La marca solo aparece en telefono. En escritorio la lleva el riel, y
 * repetirla ponia DOS logotipos a sesenta pixeles de distancia —el de la isla
 * y el de aqui— que se leian como un error de maquetado, no como una marca.
 *
 * El copiloto abre un cajon lateral en vez de navegar: la pregunta se hace
 * sobre la pantalla que la provoco, sin perderla de vista. El destino
 * completo sigue en el riel para quien quiera la conversacion entera.
 */
export function TopBar({ displayName, avatarUrl, email }: TopBarProps) {
  const ring = useRef<HTMLSpanElement>(null);
  const setRingSpeed = (hovered: boolean) => {
    // Preserve the current phase when accelerating or returning to idle.
    for (const animation of ring.current?.getAnimations() ?? []) {
      animation.updatePlaybackRate(hovered ? 4.6 / 1.8 : 1);
    }
  };
  const [copilotOpen, setCopilotOpen] = useState(false);

  return (
    <>
      <header className="app-topbar">
        <span className="md:hidden" aria-hidden="true">
          <BrandLogo variant="mark" height={28} />
        </span>

        {/* El conmutador de claro/oscuro sale de aqui: la barra de cada
            pantalla no es sitio para una preferencia que se toca una vez. El
            modo sigue estando, con las paletas, en Configuracion > Apariencia. */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setCopilotOpen(true)}
            className="copilot-trigger"
            onPointerEnter={(event) => {
              if (event.pointerType !== "touch") setRingSpeed(true);
            }}
            onPointerLeave={() => setRingSpeed(false)}
          >
            <span ref={ring} className="copilot-ring" aria-hidden="true" />
            <span className="copilot-core" aria-hidden="true" />
            <span className="copilot-label">
              <Sparkles className="text-primary size-4" aria-hidden="true" />
              Copilot
            </span>
          </button>

          {displayName ? (
            <UserMenu
              variant="pill"
              displayName={displayName}
              avatarUrl={avatarUrl}
              email={email}
            />
          ) : null}
        </div>
      </header>

      <CopilotDrawer open={copilotOpen} onOpenChange={setCopilotOpen} />
    </>
  );
}
