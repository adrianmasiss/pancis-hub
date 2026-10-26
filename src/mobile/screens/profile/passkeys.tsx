"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Fingerprint } from "lucide-react";
import { toast } from "sonner";
import { passkeyError } from "@/features/auth/passkeys";
import { usePasskeySupport } from "@/features/auth/use-passkey-support";
import { createClient } from "@/lib/supabase/client";
import { triggerHaptic } from "@/lib/haptics";
import { Switch } from "@/mobile/ui/controls";
import { OFFER_FLAG } from "@/mobile/passkey-offer-flag";
import { Sheet } from "@/mobile/ui/sheet";

/** Ya se ofrecio (o se acepto): no se vuelve a preguntar en este equipo. */
const OFFERED_KEY = "pc-llave-ofrecida";

const store = {
  get(key: string) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string | null) {
    try {
      if (value === null) localStorage.removeItem(key);
      else localStorage.setItem(key, value);
    } catch {}
  },
};

/* Si hay que ofrecer se decide una vez por carga: la marca se borra al
   leerla, y el valor no debe cambiar por eso. */
let offerAtLoad: boolean | undefined;
function readOffer() {
  offerAtLoad ??=
    store.get(OFFER_FLAG) === "1" && store.get(OFFERED_KEY) !== "1";
  return offerAtLoad;
}
const noSubscribe = () => () => {};

/**
 * Las llaves de acceso (passkeys de Supabase) de la cuenta: cuantas hay,
 * crear una y quitarlas todas. La biometria nunca sale del telefono.
 */
function usePasskeys(enabled: boolean) {
  const [count, setCount] = useState<number | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let vivo = true;
    // Si la lista falla (llaves apagadas en el servidor), queda `unavailable`:
    // ni se ofrece ni se puede encender.
    void createClient()
      .auth.passkey.list()
      .then(({ data, error }) => {
        if (!vivo) return;
        if (error) setUnavailable(true);
        else setCount(data?.length ?? 0);
      })
      .catch(() => vivo && setUnavailable(true));
    return () => {
      vivo = false;
    };
  }, [enabled]);

  const create = async () => {
    setBusy(true);
    try {
      const { data, error } = await createClient().auth.registerPasskey();
      if (error || !data) throw error;
      setCount((c) => (c ?? 0) + 1);
      store.set(OFFERED_KEY, "1");
      triggerHaptic("success");
      toast.success("Listo: la próxima vez entras con Face ID o huella.");
      return true;
    } catch (error) {
      toast.error(passkeyError(error));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const removeAll = async () => {
    setBusy(true);
    try {
      const auth = createClient().auth;
      const { data, error } = await auth.passkey.list();
      if (error) throw error;
      for (const key of data ?? []) {
        const r = await auth.passkey.delete({ passkeyId: key.id });
        if (r.error) throw r.error;
      }
      setCount(0);
      toast("Acceso con Face ID o huella apagado. Entras con tu contraseña.");
    } catch (error) {
      toast.error(passkeyError(error));
    } finally {
      setBusy(false);
    }
  };

  return { count, unavailable, busy, create, removeAll };
}

/** Perfil › Seguridad: el interruptor de Face ID / huella. */
export function PasskeyRow() {
  const supported = usePasskeySupport();
  const { count, unavailable, busy, create, removeAll } =
    usePasskeys(supported);
  const [confirmOff, setConfirmOff] = useState(false);
  const on = (count ?? 0) > 0;

  return (
    <>
      <div className="m-pref-row">
        <span className="m-pref-label">
          Face ID o huella
          <small className="m-pref-hint">
            {!supported
              ? "Este navegador no admite llaves de acceso."
              : unavailable
                ? "No está disponible por ahora."
                : on
                  ? `Entras sin contraseña${count! > 1 ? ` · ${count} llaves` : ""}.`
                  : "Entra sin escribir tu contraseña."}
          </small>
        </span>
        <Switch
          label="Entrar con Face ID o huella"
          checked={on}
          disabled={!supported || unavailable || busy || count === null}
          onCheckedChange={(v) => (v ? void create() : setConfirmOff(true))}
        />
      </div>
      <Sheet
        open={confirmOff}
        onOpenChange={setConfirmOff}
        title="¿Apagar Face ID o huella?"
        description="Se borran las llaves de acceso de tu cuenta, también las de otros equipos. Entrarás con tu contraseña."
      >
        <button
          type="button"
          className="m-btn m-press"
          data-variant="danger"
          data-block=""
          disabled={busy}
          onClick={async () => {
            await removeAll();
            setConfirmOff(false);
          }}
        >
          Apagar
        </button>
        <button
          type="button"
          className="m-btn m-press"
          data-variant="ghost"
          data-block=""
          onClick={() => setConfirmOff(false)}
        >
          Cancelar
        </button>
      </Sheet>
    </>
  );
}

/**
 * Tras entrar con contraseña, una sola vez por equipo: «¿Entrar con Face ID
 * la próxima vez?». Solo si el navegador lo admite y la cuenta aun no tiene
 * llaves.
 */
export function PasskeyOffer() {
  const supported = usePasskeySupport();
  const pathname = usePathname();
  const pendiente = useSyncExternalStore(noSubscribe, readOffer, () => false);
  const { count, busy, create } = usePasskeys(supported && pendiente);
  const [dismissed, setDismissed] = useState(false);
  const open =
    pendiente && !dismissed && supported && count === 0 && pathname === "/";

  // La marca del login se consume al leerla, se muestre o no.
  useEffect(() => {
    readOffer();
    store.set(OFFER_FLAG, null);
  }, []);

  const close = () => {
    store.set(OFFERED_KEY, "1");
    setDismissed(true);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => !o && close()}
      title="¿Entrar con Face ID la próxima vez?"
      description="Tu teléfono hace la verificación; Pancis no recibe tu rostro ni tu huella. Puedes apagarlo en Perfil › Seguridad."
      icon={<Fingerprint size={22} aria-hidden="true" />}
    >
      <button
        type="button"
        className="m-btn m-press"
        data-variant="primary"
        data-block=""
        disabled={busy}
        onClick={async () => {
          if (await create()) setDismissed(true);
        }}
      >
        {busy ? "Esperando…" : "Activar"}
      </button>
      <button
        type="button"
        className="m-btn m-press"
        data-variant="ghost"
        data-block=""
        onClick={close}
      >
        Ahora no
      </button>
    </Sheet>
  );
}
