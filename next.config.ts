import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Solo desarrollo. Next bloquea sus recursos de dev pedidos desde un host
  // distinto a localhost; con el bloqueo activo el router no puede pedir el
  // RSC de la ruta siguiente y cae a navegacion dura, lo que anula cualquier
  // view transition. Se permite el loopback por IP para poder verificar la
  // animacion cuando :3000 en "localhost" lo ocupa otro proyecto.
  allowedDevOrigins: ["127.0.0.1", "192.168.50.107"],
  experimental: {
    // Integracion de Next con <ViewTransition> de React: sin esto el
    // componente renderiza, pero la navegacion entre /login y /registro no
    // dispara la transicion y el panel de acento salta de lado sin animar.
    viewTransition: true,
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
