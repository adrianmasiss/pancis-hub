import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "8mb",
    },
    // Beta feature de Next 16: la cache persistente de Turbopack en dev
    // se corrompio repetidas veces (referencias a modulos/objetos viejos
    // tras cambios de dependencias o archivos compartidos como i18n),
    // causando errores fantasma que no reflejaban el codigo real. Se
    // desactiva para estabilidad; solo afecta velocidad de recompilado
    // en desarrollo, no el build de produccion.
    turbopackFileSystemCacheForDev: false,
  },
};

export default nextConfig;
