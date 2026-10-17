import { Fingerprint } from "lucide-react";

/** Registration hint: enrolling a passkey requires an authenticated account. */
export function SocialAuthRow() {
  return (
    <p className="text-muted-foreground flex items-center justify-center gap-2 text-center text-xs">
      <Fingerprint className="size-[18px] shrink-0" aria-hidden="true" />
      Después de crear tu cuenta, activa Face ID o huella en Configuración.
    </p>
  );
}
