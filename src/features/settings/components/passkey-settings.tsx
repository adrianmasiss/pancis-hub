"use client";
import { useEffect, useRef, useState } from "react";
import type { PasskeyListItem } from "@supabase/supabase-js";
import { Fingerprint, Trash2 } from "lucide-react";
import { ActionButton } from "@/components/ui/action";
import { Button } from "@/components/ui/button";
import { usePasskeySupport } from "@/features/auth/use-passkey-support";
import { createClient } from "@/lib/supabase/client";
import { passkeyError } from "@/features/auth/passkeys";

export function PasskeySettings() {
  const supported = usePasskeySupport();
  const [keys, setKeys] = useState<PasskeyListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const operation = useRef<AbortController | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { data, error } = await createClient().auth.passkey.list();
        if (!active) return;
        if (error) setError(passkeyError(error));
        else setKeys(data ?? []);
      } catch (error) {
        if (active) setError(passkeyError(error));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
      operation.current?.abort();
    };
  }, []);

  async function update(passkeyId?: string) {
    if (operation.current) return;
    const controller = new AbortController();
    operation.current = controller;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const auth = createClient().auth;
      if (passkeyId) {
        const { error } = await auth.passkey.delete({ passkeyId });
        if (error) throw error;
        if (controller.signal.aborted) return;
        setKeys((keys) => keys.filter((key) => key.id !== passkeyId));
        setConfirmDelete(null);
        setNotice(
          "Llave eliminada de tu cuenta. Puedes seguir ingresando con tu contraseña.",
        );
      } else {
        const { data, error } = await auth.registerPasskey({
          options: { signal: controller.signal },
        });
        if (error || !data) throw error;
        if (controller.signal.aborted) return;
        setKeys((keys) => [...keys, data]);
        setNotice(
          "Llave de acceso registrada. Ya puedes usarla para ingresar.",
        );
      }
    } catch (error) {
      if (!controller.signal.aborted) setError(passkeyError(error));
    } finally {
      operation.current = null;
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  return (
    <div className="border-border mt-6 space-y-4 border-t pt-6">
      <div className="flex items-start gap-3">
        <Fingerprint
          className="text-primary mt-0.5 size-6 shrink-0"
          aria-hidden="true"
        />
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Face ID, huella o PIN</h3>
          <p className="text-muted-foreground text-sm">
            Crea una llave de acceso para ingresar sin contraseña. Tu
            dispositivo hace la verificación; Pancis no recibe tu rostro ni tu
            huella.
          </p>
        </div>
      </div>
      {loading ? (
        <p role="status" className="text-muted-foreground text-sm">
          Cargando llaves…
        </p>
      ) : keys.length > 0 ? (
        <ul className="divide-border divide-y">
          {keys.map((key) => (
            <li
              key={key.id}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <div>
                <p className="text-sm font-medium">
                  {key.friendly_name || "Llave de acceso"}
                </p>
                <p className="text-muted-foreground text-xs">
                  Creada el{" "}
                  {new Date(key.created_at).toLocaleDateString("es-CR")}
                </p>
              </div>
              {confirmDelete === key.id ? (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm">¿Eliminar esta llave?</span>
                  <Button
                    variant="outline"
                    disabled={busy}
                    onClick={() => setConfirmDelete(null)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={busy}
                    onClick={() => update(key.id)}
                  >
                    Eliminar
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  disabled={busy}
                  onClick={() => setConfirmDelete(key.id)}
                  aria-label={`Eliminar ${key.friendly_name || "llave de acceso"}`}
                >
                  <Trash2 aria-hidden="true" />
                  Eliminar
                </Button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        !error && (
          <p className="text-muted-foreground text-sm">
            Todavía no tienes llaves de acceso registradas.
          </p>
        )
      )}
      {supported ? (
        <ActionButton
          family="add"
          loading={busy}
          disabled={busy || loading}
          aria-busy={busy}
          onClick={() => update()}
        >
          {"Agregar llave de acceso"}
        </ActionButton>
      ) : (
        <p className="text-muted-foreground text-sm">
          Para crear una llave, usa un navegador compatible desde una conexión
          segura (HTTPS).
        </p>
      )}
      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm">
          {notice}
        </p>
      )}
    </div>
  );
}
