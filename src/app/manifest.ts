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
    // Handoff v2: el diseno es oscuro, la pantalla de arranque tambien.
    background_color: "#211f1e",
    theme_color: "#211f1e",
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
