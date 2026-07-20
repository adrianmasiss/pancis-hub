"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { messages } from "@/i18n/es-419";

/**
 * Registra el service worker (solo en produccion) y notifica los
 * cambios de conexion.
 */
export function PwaRuntime() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Sin SW la app sigue funcionando online; no interrumpimos.
      });
    }

    const onOffline = () => toast.warning(messages.pwa.wentOffline);
    const onOnline = () => toast.success(messages.pwa.backOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);
    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
    };
  }, []);

  return null;
}
