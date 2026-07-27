import type { MetadataRoute } from "next";
import { messages } from "@/i18n/es-419";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: messages.app.name,
    short_name: "Pancis",
    description: messages.app.description,
    lang: "es-419",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // Paleta "Grafito": la pantalla de arranque abre en el modo que define la
    // identidad, no en el claro.
    background_color: "#16181c",
    theme_color: "#16181c",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-192-maskable.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
