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
    if ("serviceWorker" in navigator) {
      if (process.env.NODE_ENV === "production") {
        navigator.serviceWorker.register("/sw.js").catch(() => {
          // Sin SW la app sigue funcionando online; no interrumpimos.
        });
      } else {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((registration) => {
            registration.unregister();
          });
        });
        if ("caches" in window) {
          caches.keys().then((keys) => {
            keys
              .filter((key) => key.startsWith("pancis-hub-"))
              .forEach((key) => caches.delete(key));
          });
        }
      }
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
