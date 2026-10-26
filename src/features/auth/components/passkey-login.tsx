"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Fingerprint, ScanFace } from "lucide-react";
import { usePasskeySupport } from "@/features/auth/use-passkey-support";
import { createClient } from "@/lib/supabase/client";
import { REMEMBER_COOKIE } from "@/lib/supabase/remember";
import { passkeyDestination, passkeyError } from "@/features/auth/passkeys";

export function PasskeyLogin({
  next,
  disabled,
  onBusyChange,
  remember = true,
}: {
  next: string | null;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
  /** «No cerrar sesión»: desmarcado, las cookies de auth mueren con el navegador. */
  remember?: boolean;
}) {
  const router = useRouter();
  const supported = usePasskeySupport();
  const [busy, setBusy] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const operation = useRef<AbortController | null>(null);
  useEffect(() => {
    return () => operation.current?.abort();
  }, []);

  async function signIn() {
    if (operation.current || disabled) return;
    setShowInstructions(true);
    const controller = new AbortController();
    operation.current = controller;
    setBusy(true);
    onBusyChange(true);
    setError(null);
    document.cookie = remember
      ? `${REMEMBER_COOKIE}=; Path=/; Max-Age=0`
      : `${REMEMBER_COOKIE}=1; Path=/; SameSite=Lax`;
    try {
      const { data, error } = await createClient().auth.signInWithPasskey({
        options: { signal: controller.signal },
      });
      if (controller.signal.aborted) return;
      if (error || !data?.session) {
        setError(passkeyError(error));
        return;
      }
      router.replace(passkeyDestination(next));
      router.refresh();
    } catch (error) {
      if (!controller.signal.aborted) setError(passkeyError(error));
    } finally {
      operation.current = null;
      if (!controller.signal.aborted) {
        setBusy(false);
        onBusyChange(false);
      }
    }
  }

  if (!supported) return null;
  return (
    <div className="flex w-full flex-col items-center gap-3 text-center">
      <button
        type="button"
        onClick={signIn}
        disabled={disabled || busy}
        aria-busy={busy}
        className="group text-foreground focus-visible:ring-ring flex flex-col items-center gap-3 rounded-2xl px-5 py-2 outline-none focus-visible:ring-2 disabled:opacity-50"
      >
        {/* El disco se apoyaba solo en un relleno al 10% del acento: sobre el
            vidrio de la tarjeta —que ya deja pasar el fondo— ese relleno y la
            tarjeta quedaban casi al mismo valor y el circulo no tenia canto.
            El filete del acento es lo que lo separa, y se enciende al pasar
            por encima junto con el relleno. */}
        <span className="bg-primary/10 text-primary border-primary/45 group-hover:bg-primary/15 group-hover:border-primary/75 grid size-20 place-items-center rounded-full border transition-colors">
          {/* Los dos metodos, alternandose. El boton ofrece Face ID Y huella,
              y un solo icono contaba la mitad: quien tiene reconocimiento
              facial veia una huella y creia que no era para el. Los dos
              iconos ocupan la MISMA celda de la rejilla —no se suman al
              ancho— y se cruzan en fundido; el CSS lleva el ciclo y respeta
              `prefers-reduced-motion`. */}
          <Fingerprint
            className="auth-biometric-icon size-10"
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <ScanFace
            className="auth-biometric-icon auth-biometric-icon--alt size-10"
            strokeWidth={1.5}
            aria-hidden="true"
          />
        </span>
        <span className="text-sm font-semibold">
          {busy ? "Verificando…" : "Ingresar con Face ID o huella"}
        </span>
      </button>
      {showInstructions && (
        <div
          role="status"
          className="text-muted-foreground max-w-xs space-y-3 text-xs"
        >
          <p>
            Usa una llave de acceso guardada. Tu dispositivo también puede
            pedirte su PIN.
          </p>
          <p>¿Primera vez? Actívala en Configuración después de ingresar.</p>
        </div>
      )}
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      <span className="text-muted-foreground text-sm">
        o ingresa con contraseña
      </span>
    </div>
  );
}
